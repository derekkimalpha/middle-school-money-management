-- Growth Log: tracks actual earnings from interest and market gains
CREATE TABLE IF NOT EXISTS growth_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  account_type account_type NOT NULL,
  growth_amount numeric NOT NULL DEFAULT 0,
  balance_before numeric NOT NULL DEFAULT 0,
  balance_after numeric NOT NULL DEFAULT 0,
  rate_used numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'interest',
  created_at timestamptz DEFAULT NOW(),
  growth_date date DEFAULT CURRENT_DATE
);

-- RLS
ALTER TABLE growth_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own growth logs"
  ON growth_log FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Authenticated users can insert growth logs"
  ON growth_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Updated apply_account_growth function with growth logging
CREATE OR REPLACE FUNCTION apply_account_growth(
  p_savings_apy numeric DEFAULT 4.5,
  p_sp500_daily numeric DEFAULT 0,
  p_nasdaq_daily numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  daily_savings_rate numeric;
  updated_savings integer := 0;
  updated_sp500 integer := 0;
  updated_nasdaq integer := 0;
  rec record;
BEGIN
  daily_savings_rate := p_savings_apy / 365 / 100;

  -- Apply savings interest
  FOR rec IN
    SELECT id, student_id, balance FROM accounts
    WHERE account_type = 'savings' AND balance > 0
    AND (last_growth_date IS NULL OR last_growth_date < CURRENT_DATE)
  LOOP
    UPDATE accounts SET
      balance = balance + (rec.balance * daily_savings_rate),
      last_growth_date = CURRENT_DATE
    WHERE id = rec.id;

    INSERT INTO growth_log (student_id, account_type, growth_amount, balance_before, balance_after, rate_used, source)
    VALUES (
      rec.student_id,
      'savings',
      rec.balance * daily_savings_rate,
      rec.balance,
      rec.balance + (rec.balance * daily_savings_rate),
      p_savings_apy,
      'interest'
    );

    updated_savings := updated_savings + 1;
  END LOOP;

  -- Apply S&P 500 daily return
  IF p_sp500_daily != 0 THEN
    FOR rec IN
      SELECT id, student_id, balance FROM accounts
      WHERE account_type = 'sp500' AND balance > 0
      AND (last_growth_date IS NULL OR last_growth_date < CURRENT_DATE)
    LOOP
      UPDATE accounts SET
        balance = balance + (rec.balance * p_sp500_daily / 100),
        last_growth_date = CURRENT_DATE
      WHERE id = rec.id;

      INSERT INTO growth_log (student_id, account_type, growth_amount, balance_before, balance_after, rate_used, source)
      VALUES (
        rec.student_id,
        'sp500',
        rec.balance * p_sp500_daily / 100,
        rec.balance,
        rec.balance + (rec.balance * p_sp500_daily / 100),
        p_sp500_daily,
        'market'
      );

      updated_sp500 := updated_sp500 + 1;
    END LOOP;
  END IF;

  -- Apply NASDAQ daily return
  IF p_nasdaq_daily != 0 THEN
    FOR rec IN
      SELECT id, student_id, balance FROM accounts
      WHERE account_type = 'nasdaq' AND balance > 0
      AND (last_growth_date IS NULL OR last_growth_date < CURRENT_DATE)
    LOOP
      UPDATE accounts SET
        balance = balance + (rec.balance * p_nasdaq_daily / 100),
        last_growth_date = CURRENT_DATE
      WHERE id = rec.id;

      INSERT INTO growth_log (student_id, account_type, growth_amount, balance_before, balance_after, rate_used, source)
      VALUES (
        rec.student_id,
        'nasdaq',
        rec.balance * p_nasdaq_daily / 100,
        rec.balance,
        rec.balance + (rec.balance * p_nasdaq_daily / 100),
        p_nasdaq_daily,
        'market'
      );

      updated_nasdaq := updated_nasdaq + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'savings_updated', updated_savings,
    'sp500_updated', updated_sp500,
    'nasdaq_updated', updated_nasdaq,
    'date', CURRENT_DATE
  );
END;
$$;
