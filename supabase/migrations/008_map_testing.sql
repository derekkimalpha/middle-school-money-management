-- 008: MAP Testing System
-- Stores MAP test results and payout configuration for guides

-- 1. MAP payout settings (guide-configurable per session)
CREATE TABLE IF NOT EXISTS map_payout_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES sessions(id),
  grade_band text NOT NULL CHECK (grade_band IN ('4-5', '6-8')),
  percentile_tier text NOT NULL CHECK (percentile_tier IN ('99', '90-98')),
  subject_type text NOT NULL CHECK (subject_type IN ('standard', 'science')),
  payout numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

ALTER TABLE map_payout_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides can manage MAP payout settings"
  ON map_payout_settings FOR ALL
  TO authenticated
  USING (true);

-- 2. MAP test results
CREATE TABLE IF NOT EXISTS map_tests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES profiles(id) NOT NULL,
  subject text NOT NULL CHECK (subject IN ('math', 'reading', 'language', 'science')),
  percentile integer NOT NULL CHECK (percentile BETWEEN 1 AND 99),
  grade_level text NOT NULL,
  test_date date NOT NULL,
  rit_score integer,
  payout numeric NOT NULL DEFAULT 0,
  is_first_time boolean DEFAULT true,
  locked boolean DEFAULT true,
  notes text,
  entered_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT NOW()
);

ALTER TABLE map_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides can manage MAP tests"
  ON map_tests FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Students can view own MAP tests"
  ON map_tests FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- 3. Seed default payout settings for active session
DO $$
DECLARE
  v_session_id uuid;
BEGIN
  SELECT id INTO v_session_id FROM sessions WHERE is_active = true LIMIT 1;

  IF v_session_id IS NOT NULL THEN
    -- 6-8 grade, 99th percentile, standard subjects
    INSERT INTO map_payout_settings (session_id, grade_band, percentile_tier, subject_type, payout)
    VALUES (v_session_id, '6-8', '99', 'standard', 1000);

    -- 6-8 grade, 99th percentile, science
    INSERT INTO map_payout_settings (session_id, grade_band, percentile_tier, subject_type, payout)
    VALUES (v_session_id, '6-8', '99', 'science', 250);

    -- 6-8 grade, 90-98th percentile, standard subjects
    INSERT INTO map_payout_settings (session_id, grade_band, percentile_tier, subject_type, payout)
    VALUES (v_session_id, '6-8', '90-98', 'standard', 250);

    -- 6-8 grade, 90-98th percentile, science (no payout)
    INSERT INTO map_payout_settings (session_id, grade_band, percentile_tier, subject_type, payout)
    VALUES (v_session_id, '6-8', '90-98', 'science', 0);

    -- 4-5 grade, 99th percentile, standard subjects
    INSERT INTO map_payout_settings (session_id, grade_band, percentile_tier, subject_type, payout)
    VALUES (v_session_id, '4-5', '99', 'standard', 250);

    -- 4-5 grade, 99th percentile, science
    INSERT INTO map_payout_settings (session_id, grade_band, percentile_tier, subject_type, payout)
    VALUES (v_session_id, '4-5', '99', 'science', 100);

    -- 4-5 grade, 90-98th percentile, standard subjects
    INSERT INTO map_payout_settings (session_id, grade_band, percentile_tier, subject_type, payout)
    VALUES (v_session_id, '4-5', '90-98', 'standard', 100);

    -- 4-5 grade, 90-98th percentile, science (no payout)
    INSERT INTO map_payout_settings (session_id, grade_band, percentile_tier, subject_type, payout)
    VALUES (v_session_id, '4-5', '90-98', 'science', 0);
  END IF;
END $$;

SELECT 'Migration 008 complete' as status;
