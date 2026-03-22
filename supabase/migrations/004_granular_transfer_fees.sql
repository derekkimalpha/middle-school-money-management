-- Update transfer_funds to use granular fee columns and fix parameter names
create or replace function transfer_funds(
  p_student_id uuid,
  p_from_type account_type,
  p_to_type account_type,
  p_amount numeric
)
returns jsonb as $$
declare
  v_from_id uuid;
  v_to_id uuid;
  v_from_balance numeric;
  v_fee_pct numeric;
  v_fee numeric;
  v_net numeric;
  v_new_from numeric;
  v_new_to numeric;
begin
  -- Get accounts
  select id, balance into v_from_id, v_from_balance
    from accounts where student_id = p_student_id and account_type = p_from_type;
  select id into v_to_id
    from accounts where student_id = p_student_id and account_type = p_to_type;

  if v_from_id is null or v_to_id is null then
    return jsonb_build_object('error', 'Account not found');
  end if;

  if v_from_balance < p_amount then
    return jsonb_build_object('error', 'Insufficient funds');
  end if;

  -- Calculate fee based on transfer type (uses granular fee columns)
  v_fee_pct := case
    -- Investment (S&P 500, NASDAQ) → Checking: use transfer_fee_invest_pct
    when p_from_type in ('sp500', 'nasdaq') and p_to_type = 'checking' then
      coalesce((select transfer_fee_invest_pct from paycheck_settings ps
        join sessions s on ps.session_id = s.id where s.is_active = true limit 1), 10)
    -- Savings → Checking: use transfer_fee_savings_pct
    when p_from_type = 'savings' and p_to_type = 'checking' then
      coalesce((select transfer_fee_savings_pct from paycheck_settings ps
        join sessions s on ps.session_id = s.id where s.is_active = true limit 1), 0)
    else 0
  end;
  v_fee := p_amount * (v_fee_pct / 100);
  v_net := p_amount - v_fee;

  -- Update balances
  v_new_from := v_from_balance - p_amount;
  update accounts set balance = v_new_from, updated_at = now() where id = v_from_id;

  select balance + v_net into v_new_to from accounts where id = v_to_id;
  update accounts set balance = v_new_to, updated_at = now() where id = v_to_id;

  -- Record transactions
  insert into transactions (account_id, student_id, amount, balance_after, description, category)
    values (v_from_id, p_student_id, -p_amount, v_new_from, 'Transfer to ' || p_to_type, 'transfer');

  insert into transactions (account_id, student_id, amount, balance_after, description, category)
    values (v_to_id, p_student_id, v_net, v_new_to, 'Transfer from ' || p_from_type, 'transfer');

  if v_fee > 0 then
    insert into transactions (account_id, student_id, amount, balance_after, description, category)
      values (v_from_id, p_student_id, -v_fee, v_new_from, 'Transfer fee (' || v_fee_pct || '%)', 'fee');
  end if;

  return jsonb_build_object('success', true, 'net', v_net, 'fee', v_fee);
end;
$$ language plpgsql security definer;
