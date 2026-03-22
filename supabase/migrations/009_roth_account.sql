-- 009: Add Roth IRA account type for MAP testing payouts
-- Locked account that earns interest but cannot be withdrawn until graduation

-- 1. Add 'roth' to the account_type enum
ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'roth';

-- 2. Create roth accounts for all existing students
INSERT INTO accounts (student_id, account_type, balance)
SELECT id, 'roth', 0
FROM profiles
WHERE role = 'student'
  AND id NOT IN (
    SELECT student_id FROM accounts WHERE account_type = 'roth'
  );

-- 3. Update the trigger function to also create roth account for new students
CREATE OR REPLACE FUNCTION create_student_accounts()
RETURNS trigger AS $$
BEGIN
  IF new.role = 'student' THEN
    INSERT INTO accounts (student_id, account_type, balance)
    VALUES
      (new.id, 'checking', 0),
      (new.id, 'savings', 0),
      (new.id, 'sp500', 0),
      (new.id, 'nasdaq', 0),
      (new.id, 'bonus', 0),
      (new.id, 'roth', 0);
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Clear emoji icons from fine_definitions
UPDATE fine_definitions SET icon = '' WHERE icon IS NOT NULL AND icon != '';

SELECT 'Migration 009 complete' as status;
