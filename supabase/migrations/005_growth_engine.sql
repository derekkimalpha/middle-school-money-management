-- ============================================================
-- 005: Growth Engine — Real Market Performance + Savings Interest
-- ============================================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- 1. Add savings interest rate to settings (guide-editable)
ALTER TABLE paycheck_settings
ADD COLUMN IF NOT EXISTS savings_interest_rate numeric DEFAULT 4.5;

-- 2. Add growth tracking to accounts
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS last_growth_date date DEFAULT NULL;

-- 3. Remove all transfer fees
UPDATE paycheck_settings
SET transfer_fee_invest_pct = 0,
    transfer_fee_savings_pct = 0,
    transfer_fee_pct = 0;

-- 4. Update the transfer_funds function to have zero fees
CREATE OR REPLACE FUNCTION transfer_funds(
  p_student_id uuid,
  p_from_type account_type,
  p_to_type account_type,
  p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_from_balance numeric;
  v_to_balance numeric;
  v_net_amount numeric;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('error', 'Amount must be positive');
  END IF;

  -- Get source balance
  SELECT balance INTO v_from_balance
  FROM accounts
  WHERE student_id = p_student_id AND account_type = p_from_type;

  IF v_from_balance IS NULL THEN
    RETURN jsonb_build_object('error', 'Source account not found');
  END IF;

  IF v_from_balance < p_amount THEN
    RETURN jsonb_build_object('error', 'Insufficient balance');
  END IF;

  -- No fees — full amount transfers
  v_net_amount := p_amount;

  -- Update balances
  UPDATE accounts
  SET balance = balance - p_amount, updated_at = NOW()
  WHERE student_id = p_student_id AND account_type = p_from_type;

  UPDATE accounts
  SET balance = balance + v_net_amount, updated_at = NOW()
  WHERE student_id = p_student_id AND account_type = p_to_type;

  -- Record transactions
  INSERT INTO transactions (student_id, account_type, amount, type, description)
  VALUES
    (p_student_id, p_from_type, -p_amount, 'transfer', 'Transfer to ' || p_to_type),
    (p_student_id, p_to_type, v_net_amount, 'transfer', 'Transfer from ' || p_from_type);

  RETURN jsonb_build_object(
    'success', true,
    'amount', v_net_amount,
    'fee', 0
  );
END;
$$;

-- 5. Create the growth engine function
CREATE OR REPLACE FUNCTION apply_account_growth(
  p_savings_apy numeric DEFAULT 4.5,
  p_sp500_daily_pct numeric DEFAULT 0,
  p_nasdaq_daily_pct numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_savings_updated integer := 0;
  v_sp500_updated integer := 0;
  v_nasdaq_updated integer := 0;
  v_daily_rate numeric;
  v_days integer;
  rec RECORD;
BEGIN
  -- ── Savings: compound interest based on APY ──
  v_daily_rate := p_savings_apy / 100.0 / 365.0;

  FOR rec IN
    SELECT id, balance, last_growth_date
    FROM accounts
    WHERE account_type = 'savings'
      AND balance > 0
      AND (last_growth_date IS NULL OR last_growth_date < v_today)
  LOOP
    v_days := COALESCE(v_today - rec.last_growth_date, 1);
    IF v_days < 1 THEN v_days := 1; END IF;
    IF v_days > 30 THEN v_days := 30; END IF; -- cap catchup to 30 days

    UPDATE accounts
    SET balance = ROUND((balance * POWER(1 + v_daily_rate, v_days))::numeric, 2),
        last_growth_date = v_today,
        updated_at = NOW()
    WHERE id = rec.id;

    v_savings_updated := v_savings_updated + 1;
  END LOOP;

  -- ── S&P 500: apply daily market return ──
  IF p_sp500_daily_pct != 0 THEN
    UPDATE accounts
    SET balance = ROUND((balance * (1 + p_sp500_daily_pct / 100.0))::numeric, 2),
        last_growth_date = v_today,
        updated_at = NOW()
    WHERE account_type = 'sp500'
      AND balance > 0
      AND (last_growth_date IS NULL OR last_growth_date < v_today);

    GET DIAGNOSTICS v_sp500_updated = ROW_COUNT;
  END IF;

  -- ── NASDAQ: apply daily market return ──
  IF p_nasdaq_daily_pct != 0 THEN
    UPDATE accounts
    SET balance = ROUND((balance * (1 + p_nasdaq_daily_pct / 100.0))::numeric, 2),
        last_growth_date = v_today,
        updated_at = NOW()
    WHERE account_type = 'nasdaq'
      AND balance > 0
      AND (last_growth_date IS NULL OR last_growth_date < v_today);

    GET DIAGNOSTICS v_nasdaq_updated = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'date', v_today,
    'savings_updated', v_savings_updated,
    'sp500_updated', v_sp500_updated,
    'nasdaq_updated', v_nasdaq_updated,
    'rates', jsonb_build_object(
      'savings_apy', p_savings_apy,
      'sp500_daily', p_sp500_daily_pct,
      'nasdaq_daily', p_nasdaq_daily_pct
    )
  );
END;
$$;

-- 6. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION apply_account_growth TO authenticated;
