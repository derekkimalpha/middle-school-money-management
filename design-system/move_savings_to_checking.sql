DO $$
DECLARE
  v_student record;
  v_checking_id uuid;
  v_savings_id uuid;
  v_savings_bal numeric;
  v_checking_bal numeric;
  v_new_checking numeric;
  v_total_moved numeric := 0;
  v_count int := 0;
BEGIN
  FOR v_student IN
    SELECT id, full_name FROM profiles WHERE role = 'student'
  LOOP
    SELECT id, balance INTO v_checking_id, v_checking_bal
    FROM accounts WHERE student_id = v_student.id AND account_type = 'checking';

    SELECT id, balance INTO v_savings_id, v_savings_bal
    FROM accounts WHERE student_id = v_student.id AND account_type = 'savings';

    IF v_savings_id IS NULL OR v_checking_id IS NULL OR v_savings_bal <= 0 THEN
      CONTINUE;
    END IF;

    v_new_checking := v_checking_bal + v_savings_bal;

    UPDATE accounts SET balance = 0, updated_at = now() WHERE id = v_savings_id;
    UPDATE accounts SET balance = v_new_checking, updated_at = now() WHERE id = v_checking_id;

    INSERT INTO transactions (account_id, student_id, amount, balance_after, description, category)
    VALUES
      (v_savings_id, v_student.id, -v_savings_bal, 0,
       'Balance moved to Checking (default account)', 'transfer'),
      (v_checking_id, v_student.id, v_savings_bal, v_new_checking,
       'Balance moved to Checking (default account)', 'transfer');

    v_total_moved := v_total_moved + v_savings_bal;
    v_count := v_count + 1;
    RAISE NOTICE 'Moved $% from % Savings -> Checking', v_savings_bal, v_student.full_name;
  END LOOP;

  RAISE NOTICE 'Moved $% across % students', v_total_moved, v_count;
END $$;
