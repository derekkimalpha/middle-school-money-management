-- Add 'paid' status to cash_out_requests
ALTER TABLE cash_out_requests DROP CONSTRAINT IF EXISTS cash_out_requests_status_check;
ALTER TABLE cash_out_requests ADD CONSTRAINT cash_out_requests_status_check
  CHECK (status IN ('pending', 'approved', 'denied', 'paid'));

-- Add paid_at timestamp
ALTER TABLE cash_out_requests ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Function to mark a cash out as paid (guide handed the cash)
CREATE OR REPLACE FUNCTION mark_cash_out_paid(
  p_request_id UUID,
  p_guide_id UUID
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE cash_out_requests
  SET status = 'paid',
      paid_at = now(),
      resolved_by = p_guide_id,
      resolved_at = now()
  WHERE id = p_request_id AND status = 'approved';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Request not found or not in approved status');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION mark_cash_out_paid(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_cash_out_paid(UUID, UUID) TO anon;
