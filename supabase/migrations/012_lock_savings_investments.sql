-- Lock savings and investment accounts: no transfers OUT
-- Only checking can transfer to savings/sp500/nasdaq
-- Savings, sp500, nasdaq, roth cannot transfer anywhere

CREATE OR REPLACE FUNCTION transfer_funds(
  p_student_id UUID,
  p_from_type TEXT,
  p_to_type TEXT,
  p_amount NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('error', 'Amount must be positive');
  END IF;

  -- Enforce transfer rules: only checking can transfer out
  IF p_from_type != 'checking' THEN
    RETURN jsonb_build_object('error', 'Only checking account can transfer out. Savings and investments are locked until graduation.');
  END IF;

  -- Enforce valid destinations from checking
  IF p_to_type NOT IN ('savings', 'sp500', 'nasdaq') THEN
    RETURN jsonb_build_object('error', 'Can only transfer to savings, S&P 500, or NASDAQ');
  END IF;

  -- Check sufficient balance
  IF (SELECT balance FROM accounts WHERE student_id = p_student_id AND account_type = p_from_type::account_type) < p_amount THEN
    RETURN jsonb_build_object('error', 'Insufficient balance');
  END IF;

  -- Deduct from source
  UPDATE accounts
  SET balance = balance - p_amount
  WHERE student_id = p_student_id AND account_type = p_from_type::account_type;

  -- Add to destination
  UPDATE accounts
  SET balance = balance + p_amount
  WHERE student_id = p_student_id AND account_type = p_to_type::account_type;

  -- If destination account doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO accounts (student_id, account_type, balance)
    VALUES (p_student_id, p_to_type::account_type, p_amount);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION transfer_funds TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_funds TO anon;
