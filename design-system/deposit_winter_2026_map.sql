DO $$
DECLARE
  v_acct_id uuid;
  v_student_id uuid;
  v_balance numeric;
  v_total numeric := 0;
  v_test record;
BEGIN
  FOR v_test IN
    SELECT * FROM (VALUES
      ('aila.wong@alpha.school',      '7th', 'reading',  95, 250::numeric),
      ('aila.wong@alpha.school',      '7th', 'language', 98, 250::numeric),
      ('ben.tierney@alpha.school',    '8th', 'reading',  91, 250::numeric),
      ('jack.tierney@alpha.school',   '6th', 'reading',  92, 250::numeric),
      ('jack.tierney@alpha.school',   '6th', 'math',     95, 250::numeric),
      ('finley.smith.1@alpha.school', '6th', 'reading',  96, 250::numeric),
      ('finley.smith.1@alpha.school', '6th', 'math',     95, 250::numeric),
      ('finley.smith.1@alpha.school', '6th', 'language', 93, 250::numeric)
    ) AS t(email, grade_level, subject, percentile, payout)
  LOOP
    SELECT p.id INTO v_student_id FROM profiles p WHERE p.email = v_test.email;
    IF v_student_id IS NULL THEN
      RAISE NOTICE 'Skipping: no profile for %', v_test.email;
      CONTINUE;
    END IF;

    SELECT id, balance INTO v_acct_id, v_balance
    FROM accounts WHERE student_id = v_student_id AND account_type = 'roth';

    IF v_acct_id IS NULL THEN
      RAISE NOTICE 'Skipping: no roth account for %', v_test.email;
      CONTINUE;
    END IF;

    INSERT INTO map_tests (student_id, subject, percentile, grade_level, test_date, payout, is_first_time, locked, entered_by)
    VALUES (v_student_id, v_test.subject, v_test.percentile, v_test.grade_level,
            '2026-02-01'::date, v_test.payout, true, true, NULL);

    v_balance := v_balance + v_test.payout;
    UPDATE accounts SET balance = v_balance, updated_at = now() WHERE id = v_acct_id;

    INSERT INTO transactions (account_id, student_id, amount, balance_after, description, category)
    VALUES (v_acct_id, v_student_id, v_test.payout, v_balance,
            'MAP Winter 2026 - ' || initcap(v_test.subject) || ' (' || v_test.percentile || 'th)',
            'map_payout');

    v_total := v_total + v_test.payout;
  END LOOP;

  RAISE NOTICE 'Deposited $% across MAP Winter 2026 payouts', v_total;
END $$;
