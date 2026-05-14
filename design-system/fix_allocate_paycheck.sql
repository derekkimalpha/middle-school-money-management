CREATE OR REPLACE FUNCTION public.allocate_paycheck(
  p_paycheck_id uuid,
  p_checking numeric DEFAULT 0,
  p_savings numeric DEFAULT 0,
  p_sp500 numeric DEFAULT 0,
  p_nasdaq numeric DEFAULT 0,
  p_bonus numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_pc record;
  v_total numeric;
  v_acct_id uuid;
  v_new_bal numeric;
  v_desc text;
BEGIN
  SELECT * INTO v_pc FROM weekly_paychecks WHERE id = p_paycheck_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Paycheck not found');
  END IF;

  IF v_pc.status NOT IN ('draft', 'verified', 'submitted') THEN
    RETURN jsonb_build_object('error', 'Paycheck already allocated', 'status', v_pc.status);
  END IF;

  v_total := COALESCE(p_checking, 0) + COALESCE(p_savings, 0) + COALESCE(p_sp500, 0) + COALESCE(p_nasdaq, 0) + COALESCE(p_bonus, 0);

  IF abs(v_total - COALESCE(v_pc.total_earnings, 0)) > 0.01 THEN
    RETURN jsonb_build_object('error', 'Allocation does not match total earnings', 'alloc', v_total, 'expected', v_pc.total_earnings);
  END IF;

  v_desc := 'Paycheck deposit - ' || COALESCE(v_pc.week_label, 'paycheck');

  IF p_checking > 0 THEN
    SELECT id, balance INTO v_acct_id, v_new_bal FROM accounts WHERE student_id = v_pc.student_id AND account_type = 'checking';
    v_new_bal := v_new_bal + p_checking;
    UPDATE accounts SET balance = v_new_bal, updated_at = now() WHERE id = v_acct_id;
    INSERT INTO transactions (account_id, student_id, amount, balance_after, description, category)
    VALUES (v_acct_id, v_pc.student_id, p_checking, v_new_bal, v_desc, 'paycheck_allocation');
  END IF;

  IF p_savings > 0 THEN
    SELECT id, balance INTO v_acct_id, v_new_bal FROM accounts WHERE student_id = v_pc.student_id AND account_type = 'savings';
    v_new_bal := v_new_bal + p_savings;
    UPDATE accounts SET balance = v_new_bal, updated_at = now() WHERE id = v_acct_id;
    INSERT INTO transactions (account_id, student_id, amount, balance_after, description, category)
    VALUES (v_acct_id, v_pc.student_id, p_savings, v_new_bal, v_desc, 'paycheck_allocation');
  END IF;

  IF p_sp500 > 0 THEN
    SELECT id, balance INTO v_acct_id, v_new_bal FROM accounts WHERE student_id = v_pc.student_id AND account_type = 'sp500';
    v_new_bal := v_new_bal + p_sp500;
    UPDATE accounts SET balance = v_new_bal, updated_at = now() WHERE id = v_acct_id;
    INSERT INTO transactions (account_id, student_id, amount, balance_after, description, category)
    VALUES (v_acct_id, v_pc.student_id, p_sp500, v_new_bal, v_desc, 'paycheck_allocation');
  END IF;

  IF p_nasdaq > 0 THEN
    SELECT id, balance INTO v_acct_id, v_new_bal FROM accounts WHERE student_id = v_pc.student_id AND account_type = 'nasdaq';
    v_new_bal := v_new_bal + p_nasdaq;
    UPDATE accounts SET balance = v_new_bal, updated_at = now() WHERE id = v_acct_id;
    INSERT INTO transactions (account_id, student_id, amount, balance_after, description, category)
    VALUES (v_acct_id, v_pc.student_id, p_nasdaq, v_new_bal, v_desc, 'paycheck_allocation');
  END IF;

  IF p_bonus > 0 THEN
    SELECT id, balance INTO v_acct_id, v_new_bal FROM accounts WHERE student_id = v_pc.student_id AND account_type = 'bonus';
    v_new_bal := v_new_bal + p_bonus;
    UPDATE accounts SET balance = v_new_bal, updated_at = now() WHERE id = v_acct_id;
    INSERT INTO transactions (account_id, student_id, amount, balance_after, description, category)
    VALUES (v_acct_id, v_pc.student_id, p_bonus, v_new_bal, v_desc, 'paycheck_allocation');
  END IF;

  UPDATE weekly_paychecks
  SET status = 'allocated',
      alloc_checking = p_checking,
      alloc_savings = p_savings,
      alloc_sp500 = p_sp500,
      alloc_nasdaq = p_nasdaq,
      alloc_bonus = p_bonus
  WHERE id = p_paycheck_id;

  RETURN jsonb_build_object('success', true, 'paycheck_id', p_paycheck_id, 'total', v_total);
END;
$func$;
