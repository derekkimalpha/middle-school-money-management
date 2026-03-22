-- 007: Fines system + Co-guide support

-- 1. Fine definitions (guide-configurable fine types)
CREATE TABLE IF NOT EXISTS fine_definitions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  description text,
  icon text DEFAULT '⚠️',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW()
);

ALTER TABLE fine_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides can manage fine definitions"
  ON fine_definitions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Student fines (issued fines)
CREATE TABLE IF NOT EXISTS student_fines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  fine_definition_id uuid REFERENCES fine_definitions(id),
  amount numeric NOT NULL,
  reason text,
  issued_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT NOW()
);

ALTER TABLE student_fines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own fines"
  ON student_fines FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Guides can manage fines"
  ON student_fines FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Seed default fine types
INSERT INTO fine_definitions (title, amount, description, icon) VALUES
  ('Late to Class', 5, 'Arriving after the session starts', '⏰'),
  ('Disruption', 10, 'Disrupting the learning environment', '🔊'),
  ('Missing Assignment', 15, 'Not completing required work', '📝'),
  ('Phone Violation', 10, 'Using phone during session', '📱'),
  ('Dress Code', 5, 'Not following dress code guidelines', '👔');

-- 4. Function to issue a fine (deducts from checking)
CREATE OR REPLACE FUNCTION issue_fine(
  p_student_id uuid,
  p_fine_def_id uuid,
  p_amount numeric,
  p_reason text DEFAULT NULL,
  p_issued_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_checking_balance numeric;
  v_fine_id uuid;
BEGIN
  SELECT balance INTO v_checking_balance
  FROM accounts
  WHERE student_id = p_student_id AND account_type = 'checking';

  UPDATE accounts
  SET balance = balance - p_amount
  WHERE student_id = p_student_id AND account_type = 'checking';

  INSERT INTO student_fines (student_id, fine_definition_id, amount, reason, issued_by)
  VALUES (p_student_id, p_fine_def_id, p_amount, p_reason, p_issued_by)
  RETURNING id INTO v_fine_id;

  INSERT INTO transactions (student_id, account_type, amount, type, description)
  VALUES (p_student_id, 'checking', -p_amount, 'fine', COALESCE(p_reason, 'Fine issued'));

  RETURN jsonb_build_object(
    'fine_id', v_fine_id,
    'amount_deducted', p_amount,
    'new_checking_balance', v_checking_balance - p_amount
  );
END;
$$;

GRANT EXECUTE ON FUNCTION issue_fine TO authenticated;

-- 5. Co-guide support
CREATE TABLE IF NOT EXISTS guide_classrooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'guide' CHECK (role IN ('lead_guide', 'guide')),
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(guide_id)
);

ALTER TABLE guide_classrooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides can view classroom members"
  ON guide_classrooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Lead guides can manage classroom"
  ON guide_classrooms FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO guide_classrooms (guide_id, role)
SELECT id, 'lead_guide' FROM profiles WHERE email = 'derek.kim@alpha.school'
ON CONFLICT (guide_id) DO NOTHING;
