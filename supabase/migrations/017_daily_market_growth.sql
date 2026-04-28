-- ═══════════════════════════════════════════════════════
-- 017 — Daily Market Pricing + Savings Interest
--
-- Switches the app from session-end batched returns to real-world
-- daily compounding:
--   - Savings: 4% APY, compounded daily (matches Wealthfront-style HYSAs)
--   - S&P 500: actual SPY daily % change
--   - NASDAQ-100: actual QQQ daily % change
--
-- The Edge Function `daily-market-update` (deployed separately) calls
-- this function once per US market close. pg_cron triggers it Mon–Fri.
-- ═══════════════════════════════════════════════════════

-- 1. market_prices: historical price tracking
CREATE TABLE IF NOT EXISTS public.market_prices (
  date date PRIMARY KEY,
  sp500_close numeric(10,2) NOT NULL,
  nasdaq_close numeric(10,2) NOT NULL,
  sp500_pct numeric(8,5),  -- daily % change (e.g. 0.00432 for +0.432%)
  nasdaq_pct numeric(8,5),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read market prices" ON public.market_prices;
CREATE POLICY "Anyone can read market prices" ON public.market_prices FOR SELECT USING (true);

-- 2. Set the live savings APY (annual, will be compounded daily)
UPDATE public.paycheck_settings SET savings_interest_rate = 4
WHERE session_id = (SELECT id FROM public.sessions WHERE name = 'Session 4 (Spring 2026)');

-- 3. Daily growth function — applies one day's worth of growth across all student accounts.
-- Idempotent for the same date (won't double-apply if called twice on the same day).
CREATE OR REPLACE FUNCTION public.apply_daily_growth(
  p_date date,
  p_sp500_close numeric,
  p_nasdaq_close numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev_sp numeric;
  v_prev_nas numeric;
  v_sp_pct numeric := 0;
  v_nas_pct numeric := 0;
  v_savings_apy numeric;
  v_daily_savings numeric;
  v_acct record;
  v_new_bal numeric;
  v_growth numeric;
  v_count int := 0;
BEGIN
  -- Skip if we already have a row for this date
  IF EXISTS (SELECT 1 FROM market_prices WHERE date = p_date) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'already applied');
  END IF;

  -- Get yesterday's prices to compute % change
  SELECT sp500_close, nasdaq_close INTO v_prev_sp, v_prev_nas
  FROM market_prices
  WHERE date < p_date
  ORDER BY date DESC LIMIT 1;

  IF v_prev_sp IS NOT NULL THEN
    v_sp_pct := (p_sp500_close - v_prev_sp) / v_prev_sp;
    v_nas_pct := (p_nasdaq_close - v_prev_nas) / v_prev_nas;
  END IF;

  -- Insert today's prices
  INSERT INTO market_prices (date, sp500_close, nasdaq_close, sp500_pct, nasdaq_pct)
  VALUES (p_date, p_sp500_close, p_nasdaq_close, v_sp_pct, v_nas_pct);

  -- Daily savings rate (APY → daily compound factor)
  SELECT COALESCE(savings_interest_rate, 0) INTO v_savings_apy
  FROM paycheck_settings
  WHERE session_id = (SELECT id FROM sessions WHERE is_active = true LIMIT 1)
  LIMIT 1;
  v_daily_savings := v_savings_apy / 100 / 365;

  -- Apply S&P returns
  FOR v_acct IN SELECT * FROM accounts WHERE account_type = 'sp500' AND balance > 0 LOOP
    v_growth := round(v_acct.balance * v_sp_pct, 2);
    v_new_bal := v_acct.balance + v_growth;
    UPDATE accounts SET balance = v_new_bal, updated_at = now() WHERE id = v_acct.id;
    IF v_growth <> 0 THEN
      INSERT INTO transactions (account_id, student_id, amount, balance_after, description, category)
      VALUES (v_acct.id, v_acct.student_id, v_growth, v_new_bal,
        'S&P 500 daily return (' || round(v_sp_pct * 100, 2) || '%)', 'market_return');
    END IF;
    v_count := v_count + 1;
  END LOOP;

  -- Apply NASDAQ returns
  FOR v_acct IN SELECT * FROM accounts WHERE account_type = 'nasdaq' AND balance > 0 LOOP
    v_growth := round(v_acct.balance * v_nas_pct, 2);
    v_new_bal := v_acct.balance + v_growth;
    UPDATE accounts SET balance = v_new_bal, updated_at = now() WHERE id = v_acct.id;
    IF v_growth <> 0 THEN
      INSERT INTO transactions (account_id, student_id, amount, balance_after, description, category)
      VALUES (v_acct.id, v_acct.student_id, v_growth, v_new_bal,
        'NASDAQ daily return (' || round(v_nas_pct * 100, 2) || '%)', 'market_return');
    END IF;
    v_count := v_count + 1;
  END LOOP;

  -- Apply savings interest (daily compound)
  FOR v_acct IN SELECT * FROM accounts WHERE account_type = 'savings' AND balance > 0 LOOP
    v_growth := round(v_acct.balance * v_daily_savings, 2);
    IF v_growth > 0 THEN
      v_new_bal := v_acct.balance + v_growth;
      UPDATE accounts SET balance = v_new_bal, updated_at = now() WHERE id = v_acct.id;
      INSERT INTO transactions (account_id, student_id, amount, balance_after, description, category)
      VALUES (v_acct.id, v_acct.student_id, v_growth, v_new_bal,
        'Savings interest (' || v_savings_apy || '% APY)', 'interest');
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'date', p_date,
    'sp500_pct', round(v_sp_pct * 100, 3),
    'nasdaq_pct', round(v_nas_pct * 100, 3),
    'savings_apy', v_savings_apy,
    'accounts_updated', v_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_daily_growth TO authenticated, service_role;
