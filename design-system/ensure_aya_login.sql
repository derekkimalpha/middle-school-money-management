-- Ensure aya.murray@alpha.school can log in with password 'iloveschool'.
-- Idempotent: safe to re-run. Logs what it did via RAISE NOTICE.
--
-- If the auth.users row exists, it just (re)sets the password.
-- If not, it creates a fresh auth.users row reusing her existing profile UUID
-- so all of her existing data (accounts, transactions, bonus, etc.) stays linked.

DO $$
DECLARE
  v_email text := 'aya.murray@alpha.school';
  v_password text := 'iloveschool';
  v_profile_id uuid;
  v_auth_id uuid;
BEGIN
  SELECT id INTO v_profile_id FROM public.profiles WHERE email = v_email;
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'No profile found for % — create it first', v_email;
  END IF;

  SELECT id INTO v_auth_id FROM auth.users WHERE email = v_email;

  IF v_auth_id IS NOT NULL THEN
    UPDATE auth.users
    SET encrypted_password = crypt(v_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_auth_id;

    -- If profile + auth ids ever drifted, realign by using auth.users.id everywhere.
    IF v_auth_id <> v_profile_id THEN
      RAISE NOTICE 'Profile id (%) differs from auth id (%); realigning profile id.', v_profile_id, v_auth_id;
      UPDATE public.profiles SET id = v_auth_id WHERE id = v_profile_id;
      -- (FK relationships use the profile id transitively, so the cascade
      -- through accounts / transactions etc. depends on schema. If not cascaded,
      -- the next block does it manually.)
      UPDATE public.accounts SET student_id = v_auth_id WHERE student_id = v_profile_id;
      UPDATE public.transactions SET student_id = v_auth_id WHERE student_id = v_profile_id;
      UPDATE public.weekly_paychecks SET student_id = v_auth_id WHERE student_id = v_profile_id;
    END IF;

    RAISE NOTICE 'Auth user exists for %. Password reset.', v_email;
  ELSE
    -- Create auth.users + auth.identities sharing the profile id so nothing relinks.
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      aud, role, is_super_admin
    )
    VALUES (
      v_profile_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', (SELECT full_name FROM public.profiles WHERE id = v_profile_id)),
      'authenticated', 'authenticated', false
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(),
      v_profile_id,
      jsonb_build_object('sub', v_profile_id::text, 'email', v_email, 'email_verified', true),
      'email',
      v_profile_id::text,
      NULL, now(), now()
    );

    RAISE NOTICE 'Created auth user for % with id %', v_email, v_profile_id;
  END IF;
END $$;
