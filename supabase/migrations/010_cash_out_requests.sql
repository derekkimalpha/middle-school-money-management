-- 010: Cash Out Requests
-- Students can request to cash out from their checking account.
-- Guide approves/denies the request.

CREATE TABLE IF NOT EXISTS cash_out_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  note TEXT,
  guide_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id)
);

-- Index for quick lookups
CREATE INDEX idx_cashout_student ON cash_out_requests(student_id);
CREATE INDEX idx_cashout_status ON cash_out_requests(status);

-- Disable RLS (consistent with other tables in this project)
ALTER TABLE cash_out_requests DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON cash_out_requests TO authenticated;
GRANT ALL ON cash_out_requests TO anon;

-- Function to request a cash out (deducts from checking immediately, creates pending request)
CREATE OR REPLACE FUNCTION request_cash_out(
  p_student_id UUID,
  p_amount NUMERIC,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance NUMERIC;
  v_request_id UUID;
BEGIN
  -- Get current checking balance
  SELECT balance INTO v_balance
  FROM accounts
  WHERE student_id = p_student_id AND account_type = 'checking'
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('error', 'Checking account not found');
  END IF;

  IF p_amount > v_balance THEN
    RETURN jsonb_build_object('error', 'Insufficient funds. You have $' || v_balance::TEXT);
  END IF;

  -- Deduct from checking
  UPDATE accounts
  SET balance = balance - p_amount
  WHERE student_id = p_student_id AND account_type = 'checking';

  -- Create the request
  INSERT INTO cash_out_requests (student_id, amount, note)
  VALUES (p_student_id, p_amount, p_note)
  RETURNING id INTO v_request_id;

  -- Log transaction
  INSERT INTO transactions (student_id, type, amount, from_account, description)
  VALUES (p_student_id, 'cash_out', p_amount, 'checking', 'Cash out request: $' || p_amount::TEXT);

  RETURN jsonb_build_object('success', true, 'request_id', v_request_id);
END;
$$;

-- Function for guide to deny (refunds to checking)
CREATE OR REPLACE FUNCTION deny_cash_out(
  p_request_id UUID,
  p_guide_id UUID,
  p_guide_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
BEGIN
  SELECT * INTO v_request FROM cash_out_requests WHERE id = p_request_id;

  IF v_request IS NULL THEN
    RETURN jsonb_build_object('error', 'Request not found');
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('error', 'Request already ' || v_request.status);
  END IF;

  -- Refund to checking
  UPDATE accounts
  SET balance = balance + v_request.amount
  WHERE student_id = v_request.student_id AND account_type = 'checking';

  -- Update request
  UPDATE cash_out_requests
  SET status = 'denied', guide_note = p_guide_note, resolved_at = now(), resolved_by = p_guide_id
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function for guide to approve
CREATE OR REPLACE FUNCTION approve_cash_out(
  p_request_id UUID,
  p_guide_id UUID,
  p_guide_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
BEGIN
  SELECT * INTO v_request FROM cash_out_requests WHERE id = p_request_id;

  IF v_request IS NULL THEN
    RETURN jsonb_build_object('error', 'Request not found');
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('error', 'Request already ' || v_request.status);
  END IF;

  -- Money already deducted — just mark approved
  UPDATE cash_out_requests
  SET status = 'approved', guide_note = p_guide_note, resolved_at = now(), resolved_by = p_guide_id
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION request_cash_out TO authenticated;
GRANT EXECUTE ON FUNCTION request_cash_out TO anon;
GRANT EXECUTE ON FUNCTION deny_cash_out TO authenticated;
GRANT EXECUTE ON FUNCTION deny_cash_out TO anon;
GRANT EXECUTE ON FUNCTION approve_cash_out TO authenticated;
GRANT EXECUTE ON FUNCTION approve_cash_out TO anon;
