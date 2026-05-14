CREATE OR REPLACE FUNCTION public.apply_roth_growth(p_pct numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_acct record;
  v_new_bal numeric;
  v_delta numeric;
  v_count int := 0;
  v_total numeric := 0;
  v_today date := current_date;
  v_already_ran boolean;
BEGIN
  -- No-op for null / negligible pct
  IF p_pct IS NULL OR abs(p_pct) < 0.001 THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'pct_negligible');
  END IF;

  FOR v_acct IN
    SELECT id, student_id, balance
    FROM accounts
    WHERE account_type = 'roth' AND balance > 0
  LOOP
    -- Skip if we already applied market_return to this roth account today
    SELECT EXISTS(
      SELECT 1 FROM transactions
      WHERE account_id = v_acct.id
        AND category = 'market_return'
        AND created_at::date = v_today
    ) INTO v_already_ran;

    IF v_already_ran THEN
      CONTINUE;
    END IF;

    v_delta := round(v_acct.balance * p_pct / 100 * 100) / 100;
    IF v_delta = 0 THEN
      CONTINUE;
    END IF;

    v_new_bal := v_acct.balance + v_delta;

    UPDATE accounts SET balance = v_new_bal, updated_at = now() WHERE id = v_acct.id;

    INSERT INTO transactions (account_id, student_id, amount, balance_after, description, category)
    VALUES (v_acct.id, v_acct.student_id, v_delta, v_new_bal,
            'Roth growth (S&P linked)', 'market_return');

    v_count := v_count + 1;
    v_total := v_total + v_delta;
  END LOOP;

  RETURN jsonb_build_object('updated', v_count, 'total_growth', v_total, 'pct', p_pct);
END;
$func$;
