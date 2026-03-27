-- Add setup_complete flag to profiles
-- New users will see a role selector on first login
-- Existing users are already set up

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS setup_complete boolean DEFAULT false;

-- Mark all existing users as setup complete
UPDATE profiles SET setup_complete = true WHERE setup_complete IS NULL OR setup_complete = false;

-- Update the handle_new_user trigger to set setup_complete = false for new signups
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, avatar_url, setup_complete)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'student',
    coalesce(new.raw_user_meta_data->>'avatar_url', null),
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete onboarding: set role and mark setup complete
-- If choosing guide, also create guide_classrooms entry
CREATE OR REPLACE FUNCTION complete_onboarding(
  p_user_id UUID,
  p_role TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate role
  IF p_role NOT IN ('student', 'guide') THEN
    RETURN jsonb_build_object('error', 'Invalid role. Must be student or guide.');
  END IF;

  -- Update profile role and mark setup complete
  UPDATE profiles
  SET role = p_role::user_role,
      setup_complete = true,
      updated_at = now()
  WHERE id = p_user_id;

  -- If guide, create guide_classrooms entry
  IF p_role = 'guide' THEN
    INSERT INTO guide_classrooms (guide_id, role)
    VALUES (p_user_id, 'guide')
    ON CONFLICT (guide_id) DO NOTHING;
  END IF;

  -- If student, ensure accounts exist (trigger may have already created them)
  IF p_role = 'student' THEN
    INSERT INTO accounts (student_id, account_type, balance)
    VALUES
      (p_user_id, 'checking', 0),
      (p_user_id, 'savings', 0),
      (p_user_id, 'sp500', 0),
      (p_user_id, 'nasdaq', 0),
      (p_user_id, 'bonus', 0),
      (p_user_id, 'roth', 0)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object('success', true, 'role', p_role);
END;
$$;

GRANT EXECUTE ON FUNCTION complete_onboarding TO authenticated;
GRANT EXECUTE ON FUNCTION complete_onboarding TO anon;

-- Function for guides to invite another guide by email
CREATE OR REPLACE FUNCTION invite_guide(
  p_email TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_id UUID;
  v_caller_role TEXT;
BEGIN
  -- Check caller is a guide
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  IF v_caller_role != 'guide' THEN
    RETURN jsonb_build_object('error', 'Only guides can invite other guides');
  END IF;

  -- Find the target user
  SELECT id INTO v_target_id FROM profiles WHERE email = p_email;
  IF v_target_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No user found with that email. They need to sign in first.');
  END IF;

  -- Update their role to guide
  UPDATE profiles SET role = 'guide', setup_complete = true, updated_at = now()
  WHERE id = v_target_id;

  -- Add to guide_classrooms
  INSERT INTO guide_classrooms (guide_id, role)
  VALUES (v_target_id, 'guide')
  ON CONFLICT (guide_id) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'name', (SELECT full_name FROM profiles WHERE id = v_target_id));
END;
$$;

GRANT EXECUTE ON FUNCTION invite_guide TO authenticated;
GRANT EXECUTE ON FUNCTION invite_guide TO anon;
