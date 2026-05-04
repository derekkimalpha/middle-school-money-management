-- ═══════════════════════════════════════════════════════════════════
-- S5 ROLLOUT: Initialize Session 5 for all students
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ───── Step 1: Add session/week columns to weekly_paychecks ─────
ALTER TABLE weekly_paychecks
  ADD COLUMN IF NOT EXISTS session_number INT,
  ADD COLUMN IF NOT EXISTS week_number INT;

-- ───── Step 2: Backfill S4 paychecks ─────
UPDATE weekly_paychecks SET session_number = 4, week_number = 1, status = 'allocated' WHERE week_label = 'Feb 23, 2026';
UPDATE weekly_paychecks SET session_number = 4, week_number = 2, status = 'allocated' WHERE week_label = 'Mar 2, 2026';
UPDATE weekly_paychecks SET session_number = 4, week_number = 3, status = 'allocated' WHERE week_label = 'Mar 9, 2026';
UPDATE weekly_paychecks SET session_number = 4, week_number = 4, status = 'allocated' WHERE week_label = 'Mar 16, 2026';
UPDATE weekly_paychecks SET session_number = 4, week_number = 5, status = 'allocated' WHERE week_label = 'Mar 23, 2026';
UPDATE weekly_paychecks SET session_number = 4, week_number = 6, status = 'allocated' WHERE week_label = 'Mar 30, 2026';
UPDATE weekly_paychecks SET session_number = 4, week_number = 7, status = 'allocated' WHERE week_label = 'Apr 6, 2026';
UPDATE weekly_paychecks SET session_number = 4, week_number = 8, status = 'allocated' WHERE week_label = 'Apr 13, 2026';

-- ───── Step 3: Sessions table cleanup + create S5 ─────
UPDATE sessions
SET is_active = false, end_date = '2026-04-17'
WHERE name = 'Session 4 (Spring 2026)';

DELETE FROM sessions WHERE name = 'Session 4' AND end_date IS NULL;

INSERT INTO sessions (name, start_date, end_date, is_active)
VALUES ('Session 5 (Summer 2026)', '2026-04-27', '2026-06-07', true)
ON CONFLICT DO NOTHING;

-- ───── Step 4: Delete all transactions for the 8 students ─────
DELETE FROM transactions
WHERE student_id IN (
  SELECT id FROM profiles
  WHERE full_name IN (
    'Aila Wong', 'Aniya Akhund', 'Ben Tierney', 'Ethan Wong',
    'Finley Smith', 'Jack Tierney', 'June Rockefeller', 'Aya Murray'
  )
);

-- ───── Step 5: Insert S5 starting balance transactions into Savings ─────
INSERT INTO transactions (account_id, student_id, amount, balance_after, description, category, created_at)
SELECT
  a.id,
  p.id,
  CASE p.full_name
    WHEN 'Aila Wong' THEN 153
    WHEN 'Aniya Akhund' THEN 698
    WHEN 'Ben Tierney' THEN 222
    WHEN 'Ethan Wong' THEN 227
    WHEN 'Finley Smith' THEN 803
    WHEN 'Jack Tierney' THEN 215
    WHEN 'June Rockefeller' THEN 193
  END,
  CASE p.full_name
    WHEN 'Aila Wong' THEN 153
    WHEN 'Aniya Akhund' THEN 698
    WHEN 'Ben Tierney' THEN 222
    WHEN 'Ethan Wong' THEN 227
    WHEN 'Finley Smith' THEN 803
    WHEN 'Jack Tierney' THEN 215
    WHEN 'June Rockefeller' THEN 193
  END,
  'S5 starting balance',
  'baseline',
  NOW()
FROM profiles p
JOIN accounts a ON p.id = a.student_id AND a.account_type = 'savings'
WHERE p.full_name IN (
  'Aila Wong', 'Aniya Akhund', 'Ben Tierney', 'Ethan Wong',
  'Finley Smith', 'Jack Tierney', 'June Rockefeller'
);
-- Aya excluded (zero balance, no need for txn)

-- ───── Step 6: Reset all account balances ─────
UPDATE accounts
SET balance = 0, updated_at = NOW()
WHERE student_id IN (
  SELECT id FROM profiles
  WHERE full_name IN (
    'Aila Wong', 'Aniya Akhund', 'Ben Tierney', 'Ethan Wong',
    'Finley Smith', 'Jack Tierney', 'June Rockefeller', 'Aya Murray'
  )
);

UPDATE accounts
SET balance = CASE p.full_name
    WHEN 'Aila Wong' THEN 153
    WHEN 'Aniya Akhund' THEN 698
    WHEN 'Ben Tierney' THEN 222
    WHEN 'Ethan Wong' THEN 227
    WHEN 'Finley Smith' THEN 803
    WHEN 'Jack Tierney' THEN 215
    WHEN 'June Rockefeller' THEN 193
    ELSE 0
  END,
  updated_at = NOW()
FROM profiles p
WHERE accounts.student_id = p.id
  AND accounts.account_type = 'savings'
  AND p.full_name IN (
    'Aila Wong', 'Aniya Akhund', 'Ben Tierney', 'Ethan Wong',
    'Finley Smith', 'Jack Tierney', 'June Rockefeller'
  );

-- ───── Step 7: Generate S5 W1-W6 draft paychecks ─────
INSERT INTO weekly_paychecks (
  student_id, session_id, week_label, session_number, week_number,
  status, xp_mon, xp_tue, xp_wed, xp_thu, xp_fri,
  epic_mon, epic_tue, epic_wed, epic_thu, epic_fri,
  base_pay, epic_bonus, xp_bonus, mastery_pay, job_pay, smart_goal, other_pay, total_earnings,
  created_at, updated_at
)
SELECT
  p.id,
  s.id,
  weeks.label,
  5,
  weeks.num,
  'draft',
  0, 0, 0, 0, 0,
  false, false, false, false, false,
  0, 0, 0, 0, 0, 0, 0, 0,
  NOW(),
  NOW()
FROM profiles p
CROSS JOIN (
  SELECT 'S5 W1' AS label, 1 AS num
  UNION ALL SELECT 'S5 W2', 2
  UNION ALL SELECT 'S5 W3', 3
  UNION ALL SELECT 'S5 W4', 4
  UNION ALL SELECT 'S5 W5', 5
  UNION ALL SELECT 'S5 W6', 6
) weeks
CROSS JOIN (SELECT id FROM sessions WHERE name = 'Session 5 (Summer 2026)' LIMIT 1) s
WHERE p.full_name IN (
  'Aila Wong', 'Aniya Akhund', 'Ben Tierney', 'Ethan Wong',
  'Finley Smith', 'Jack Tierney', 'June Rockefeller', 'Aya Murray'
)
ON CONFLICT DO NOTHING;

COMMIT;
