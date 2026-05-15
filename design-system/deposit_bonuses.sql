DO $$
DECLARE
  v_acct_id uuid;
  v_student_id uuid;
  v_balance numeric;
  v_total numeric := 0;
  v_count int := 0;
  v_bonus record;
BEGIN
  FOR v_bonus IN
    SELECT * FROM (VALUES
      ('june.rockefeller@alpha.school',  10::numeric, 'Winning Entrepreneurship Launch'),
      ('aya.murray@alpha.school',        10::numeric, 'Winning Entrepreneurship Launch'),
      ('jack.tierney@alpha.school',      50::numeric, 'Epic Day Challenge'),
      ('ethan.wong@alpha.school',        25::numeric, 'Trivia Tuesday'),
      ('finley.smith.1@alpha.school',    25::numeric, 'Trivia Tuesday'),
      ('jack.tierney@alpha.school',      25::numeric, 'Trivia Tuesday'),
      ('ben.tierney@alpha.school',       25::numeric, 'Trivia Tuesday'),
      ('jack.tierney@alpha.school',      25::numeric, 'S3 XP Champion'),
      ('aila.wong@alpha.school',         25::numeric, 'S3 Epic Day Champion')
    ) AS t(email, amount, reason)
  LOOP
    SELECT p.id INTO v_student_id FROM profiles p WHERE p.email = v_bonus.email;
    IF v_student_id IS NULL THEN
      RAISE NOTICE 'Skipping: no profile for %', v_bonus.email;
      CONTINUE;
    END IF;

    SELECT id, balance INTO v_acct_id, v_balance
    FROM accounts WHERE student_id = v_student_id AND account_type = 'checking';

    IF v_acct_id IS NULL THEN
      RAISE NOTICE 'Skipping: no checking for %', v_bonus.email;
      CONTINUE;
    END IF;

    v_balance := v_balance + v_bonus.amount;
    UPDATE accounts SET balance = v_balance, updated_at = now() WHERE id = v_acct_id;

    INSERT INTO transactions (account_id, student_id, amount, balance_after, description, category)
    VALUES (v_acct_id, v_student_id, v_bonus.amount, v_balance,
            'Bonus - ' || v_bonus.reason, 'bonus');

    v_total := v_total + v_bonus.amount;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Deposited $% in % bonuses', v_total, v_count;
END $$;
