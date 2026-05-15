CREATE OR REPLACE FUNCTION public.reset_paycheck(p_paycheck_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_pc record;
  v_acct_id uuid;
  v_balance numeric;
  v_total_reversed numeric := 0;
  v_desc text;
BEGIN
  SELECT * INTO v_pc FROM weekly_paychecks WHERE id = p_paycheck_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Paycheck not found');
  END IF;

  IF v_pc.status = 'draft' THEN
    RETURN jsonb_build_object('error', 'Paycheck is already a draft');
  END IF;

  v_desc := 'Paycheck reset - ' || COALESCE(v_pc.week_label, 'paycheck');

  IF COALESCE(v_pc.alloc_checking, 0) > 0 THEN
    SELECT id, balance INTO v_acct_id, v_balance
    FROM accounts WHERE student_id = v_pc.student_id AND account_type = 'checking';
    IF v_balance < v_pc.alloc_checking THEN
      RETURN jsonb_build_object('error', 'Insufficient checking balance to reverse', 'have', v_balance, 'need', v_pc.alloc_checking);
    END IF;
    v_balance := v_balance - v_pc.alloc_checking;
    UPDATE accounts SET balance = v_balance, updated_at = now() WHERE id = v_acct_id;
    INSERT INTO transactions (account_id, student_id, amount, balance_after, description, category)
    VALUES (v_acct_id, v_pc.student_id, -v_pc.alloc_checking, v_balance, v_desc, 'paycheck_reversal');
    v_total_reversed := v_total_reversed + v_pc.alloc_checking;
  END IF;

  IF COALESCE(v_pc.alloc_savings, 0) > 0 THEN
    SELECT id, balance INTO v_acct_id, v_balance
    FROM accounts WHERE student_id = v_pc.student_id AND account_type = 'savings';
    IF v_balance < v_pc.alloc_savings THEN
      RETURN jsonb_build_object('error', 'Insufficient savings balance to reverse', 'have', v_balance, 'need', v_pc.alloc_savings);
    END IF;
    v_balance := v_balance - v_pc.alloc_savings;
    UPDATE accounts SET balance = v_balance, updated_at = now() WHERE id = v_acct_id;
    INSERT INTO transactions (account_id, student_id, amount, balance_after, description, category)
    VALUES (v_acct_id, v_pc.student_id, -v_pc.alloc_savings, v_balance, v_desc, 'paycheck_reversal');
    v_total_reversed := v_total_reversed + v_pc.alloc_savings;
  END IF;

  IF COALESCE(v_pc.alloc_sp500, 0) > 0 THEN
    SELECT id, balance INTO v_acct_id, v_balance FROM accounts WHERE student_id = v_pc.student_id AND account_type = 'sp500';
    IF v_balance < v_pc.alloc_sp500 THEN
      RETURN jsonb_build_object('error', 'Insufficient sp500 balance to reverse', 'have', v_balance, 'need', v_pc.alloc_sp500);
    END IF;
    v_balance := v_balance - v_pc.alloc_sp500;
    UPDATE accounts SET balance = v_balance, updated_at = now() WHERE id = v_acct_id;
    INSERT INTO transactions (account_id, student_id, amount, balance_after, description, category)
    VALUES (v_acct_id, v_pc.student_id, -v_pc.alloc_sp500, v_balance, v_desc, 'paycheck_reversal');
    v_total_reversed := v_total_reversed + v_pc.alloc_sp500;
  END IF;

  IF COALESCE(v_pc.alloc_nasdaq, 0) > 0 THEN
    SELECT id, balance INTO v_acct_id, v_balance FROM accounts WHERE student_id = v_pc.student_id AND account_type = 'nasdaq';
    IF v_balance < v_pc.alloc_nasdaq THEN
      RETURN jsonb_build_object('error', 'Insufficient nasdaq balance to reverse', 'have', v_balance, 'need', v_pc.alloc_nasdaq);
    END IF;
    v_balance := v_balance - v_pc.alloc_nasdaq;
    UPDATE accounts SET balance = v_balance, updated_at = now() WHERE id = v_acct_id;
    INSERT INTO transactions (account_id, student_id, amount, balance_after, description, category)
    VALUES (v_acct_id, v_pc.student_id, -v_pc.alloc_nasdaq, v_balance, v_desc, 'paycheck_reversal');
    v_total_reversed := v_total_reversed + v_pc.alloc_nasdaq;
  END IF;

  IF COALESCE(v_pc.alloc_bonus, 0) > 0 THEN
    SELECT id, balance INTO v_acct_id, v_balance FROM accounts WHERE student_id = v_pc.student_id AND account_type = 'bonus';
    IF v_balance < v_pc.alloc_bonus THEN
      RETURN jsonb_build_object('error', 'Insufficient bonus balance to reverse', 'have', v_balance, 'need', v_pc.alloc_bonus);
    END IF;
    v_balance := v_balance - v_pc.alloc_bonus;
    UPDATE accounts SET balance = v_balance, updated_at = now() WHERE id = v_acct_id;
    INSERT INTO transactions (account_id, student_id, amount, balance_after, description, category)
    VALUES (v_acct_id, v_pc.student_id, -v_pc.alloc_bonus, v_balance, v_desc, 'paycheck_reversal');
    v_total_reversed := v_total_reversed + v_pc.alloc_bonus;
  END IF;

  -- Reset to draft. Keep XP / mastery data so the kid can fix what was wrong
  -- instead of starting from a blank slate.
  UPDATE weekly_paychecks
  SET status = 'draft',
      alloc_checking = 0,
      alloc_savings = 0,
      alloc_sp500 = 0,
      alloc_nasdaq = 0,
      alloc_bonus = 0
  WHERE id = p_paycheck_id;

  RETURN jsonb_build_object(
    'success', true,
    'paycheck_id', p_paycheck_id,
    'reversed', v_total_reversed
  );
END;
$func$;

-- One-off: reset Jack Tierney's W3 paycheck
SELECT reset_paycheck(
  (SELECT wp.id FROM weekly_paychecks wp
   JOIN profiles p ON p.id = wp.student_id
   WHERE p.email = 'jack.tierney@alpha.school'
     AND wp.session_number = 5
     AND wp.week_number = 3)
)::text AS jack_w3_reset;
