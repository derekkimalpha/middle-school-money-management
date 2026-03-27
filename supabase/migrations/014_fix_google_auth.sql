-- ═══════════════════════════════════════════════════════
-- FIX: Allow Google OAuth sign-in for manually-added students
--
-- Problem: add_student RPC created auth.users entries without
-- Google as a provider. Students can't sign in with Google because
-- Supabase creates a NEW auth.users entry (different UUID) and the
-- handle_new_user trigger fails to link to the existing profile.
--
-- Fix:
-- 1. handle_new_user detects existing profile by email and re-links
-- 2. add_student no longer creates auth.users entries
-- 3. Old orphaned auth.users entries get cleaned up
-- ═══════════════════════════════════════════════════════

-- ─── 1. Updated handle_new_user trigger ───────────────
-- When a user signs in with Google and a profile with the same email
-- already exists (from manual add), re-link all data to the new UUID.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_existing_id uuid;
  v_existing_name text;
  v_existing_role user_role;
  v_existing_setup boolean;
BEGIN
  -- Check if a profile with this email already exists (from manual add)
  SELECT id, full_name, role, setup_complete
  INTO v_existing_id, v_existing_name, v_existing_role, v_existing_setup
  FROM public.profiles
  WHERE email = NEW.email
  LIMIT 1;

  IF v_existing_id IS NOT NULL AND v_existing_id != NEW.id THEN
    -- Re-link all child tables from old UUID to new UUID
    UPDATE public.accounts SET student_id = NEW.id WHERE student_id = v_existing_id;
    UPDATE public.transactions SET student_id = NEW.id WHERE student_id = v_existing_id;
    UPDATE public.weekly_paychecks SET student_id = NEW.id WHERE student_id = v_existing_id;
    UPDATE public.purchase_requests SET student_id = NEW.id WHERE student_id = v_existing_id;
    UPDATE public.student_streaks SET student_id = NEW.id WHERE student_id = v_existing_id;
    UPDATE public.student_badges SET student_id = NEW.id WHERE student_id = v_existing_id;
    UPDATE public.student_fines SET student_id = NEW.id WHERE student_id = v_existing_id;
    UPDATE public.cash_out_requests SET student_id = NEW.id WHERE student_id = v_existing_id;
    UPDATE public.map_tests SET student_id = NEW.id WHERE student_id = v_existing_id;
    UPDATE public.growth_log SET student_id = NEW.id WHERE student_id = v_existing_id;

    -- Delete old profile (does NOT cascade to auth.users — only the reverse)
    DELETE FROM public.profiles WHERE id = v_existing_id;

    -- Create new profile with the Google auth UUID, preserving name/role/setup
    INSERT INTO public.profiles (id, email, full_name, role, avatar_url, setup_complete)
    VALUES (
      NEW.id,
      NEW.email,
      coalesce(NEW.raw_user_meta_data->>'full_name', v_existing_name, NEW.email),
      v_existing_role,
      coalesce(NEW.raw_user_meta_data->>'avatar_url', null),
      v_existing_setup
    );

    -- Clean up the orphaned old auth.users entry (the one without Google)
    DELETE FROM auth.users WHERE id = v_existing_id;
  ELSE
    -- No existing profile — fresh signup
    INSERT INTO public.profiles (id, email, full_name, role, avatar_url, setup_complete)
    VALUES (
      NEW.id,
      NEW.email,
      coalesce(NEW.raw_user_meta_data->>'full_name', NEW.email),
      'student',
      coalesce(NEW.raw_user_meta_data->>'avatar_url', null),
      false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 2. Replace add_student RPC ──────────────────────
-- No longer creates auth.users entries. Instead, creates a
-- placeholder profile that gets re-linked when the student
-- signs in with Google.
DROP FUNCTION IF EXISTS add_student(text, text);

CREATE OR REPLACE FUNCTION add_student(
  p_name TEXT,
  p_email TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_placeholder_id uuid;
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = p_email) THEN
    RAISE EXCEPTION 'A student with this email already exists';
  END IF;

  -- Check if auth.users entry already exists (e.g. they already signed in)
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION 'This user already has an account. They can sign in with Google.';
  END IF;

  -- Generate a placeholder UUID for the profile
  -- This will be replaced by the real auth UUID when they sign in
  v_placeholder_id := gen_random_uuid();

  -- Create placeholder auth.users entry (required for profile FK)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    aud,
    role
  ) VALUES (
    v_placeholder_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    '',
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', p_name),
    now(),
    now(),
    'authenticated',
    'authenticated'
  );

  -- Create identity record (required for Google auto-linking)
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    v_placeholder_id,
    p_email,
    'email',
    jsonb_build_object('sub', v_placeholder_id::text, 'email', p_email, 'email_verified', true),
    now(),
    now(),
    now()
  );

  -- Create the profile
  INSERT INTO public.profiles (id, email, full_name, role, setup_complete)
  VALUES (v_placeholder_id, p_email, p_name, 'student', true);

  -- Create student accounts
  INSERT INTO public.accounts (student_id, account_type, balance)
  VALUES
    (v_placeholder_id, 'checking', 0),
    (v_placeholder_id, 'savings', 0),
    (v_placeholder_id, 'sp500', 0),
    (v_placeholder_id, 'nasdaq', 0),
    (v_placeholder_id, 'bonus', 0),
    (v_placeholder_id, 'roth', 0);

  -- Create streak
  INSERT INTO public.student_streaks (student_id, current_streak, longest_streak, last_login_date)
  VALUES (v_placeholder_id, 0, 0, NULL)
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION add_student TO authenticated;
