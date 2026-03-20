-- ═══════════════════════════════════════════════════════
-- MY MONEY — Complete Supabase Schema
-- Alpha School Financial Literacy App
-- ═══════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── ENUM TYPES ─────────────────────────────────────
create type user_role as enum ('student', 'guide');
create type account_type as enum ('checking', 'savings', 'sp500', 'nasdaq', 'bonus');
create type purchase_status as enum ('pending', 'approved', 'rejected');
create type paycheck_status as enum ('draft', 'submitted', 'verified', 'allocated');

-- ─── PROFILES ───────────────────────────────────────
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role user_role not null default 'student',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can read all profiles"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Guides can update any profile"
  on profiles for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

-- ─── SESSIONS (Academic Terms) ──────────────────────
create table sessions (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  start_date date not null,
  end_date date,
  is_active boolean default true,
  savings_interest_rate numeric(5,2) default 0,
  sp500_return_rate numeric(5,2) default 0,
  nasdaq_return_rate numeric(5,2) default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

alter table sessions enable row level security;

create policy "Anyone can read sessions"
  on sessions for select using (true);

create policy "Guides can manage sessions"
  on sessions for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  ) with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

-- ─── PAYCHECK SETTINGS (Guide-configurable) ────────
create table paycheck_settings (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references sessions(id) on delete cascade,
  xp_threshold integer default 600,
  base_pay numeric(10,2) default 10.00,
  epic_week_bonus numeric(10,2) default 10.00,
  bonus_xp_rate numeric(10,2) default 1.00,
  bonus_xp_per integer default 50,
  mastery_pass_pay numeric(10,2) default 20.00,
  mastery_perfect_pay numeric(10,2) default 100.00,
  mastery_min_score integer default 90,
  transfer_fee_pct numeric(5,2) default 10.00,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(session_id)
);

alter table paycheck_settings enable row level security;

create policy "Anyone can read paycheck settings"
  on paycheck_settings for select using (true);

create policy "Guides can manage paycheck settings"
  on paycheck_settings for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  ) with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

-- ─── ACCOUNTS ───────────────────────────────────────
create table accounts (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  account_type account_type not null,
  balance numeric(12,2) default 0.00,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(student_id, account_type)
);

alter table accounts enable row level security;

create policy "Students see own accounts"
  on accounts for select using (
    auth.uid() = student_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

create policy "System can update accounts"
  on accounts for update using (
    auth.uid() = student_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

-- Auto-create 5 accounts when a student profile is created
create or replace function create_student_accounts()
returns trigger as $$
begin
  if new.role = 'student' then
    insert into accounts (student_id, account_type, balance)
    values
      (new.id, 'checking', 0),
      (new.id, 'savings', 0),
      (new.id, 'sp500', 0),
      (new.id, 'nasdaq', 0),
      (new.id, 'bonus', 0);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on profiles
  for each row execute function create_student_accounts();

-- ─── TRANSACTIONS ───────────────────────────────────
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  account_id uuid references accounts(id) on delete cascade not null,
  student_id uuid references profiles(id) not null,
  amount numeric(12,2) not null,
  balance_after numeric(12,2) not null,
  description text not null,
  category text, -- 'paycheck', 'transfer', 'purchase', 'interest', 'market_return', 'bonus', 'fee'
  reference_id uuid, -- links to paycheck, transfer, etc.
  created_at timestamptz default now()
);

alter table transactions enable row level security;

create policy "Students see own transactions"
  on transactions for select using (
    auth.uid() = student_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

create policy "System can insert transactions"
  on transactions for insert with check (
    auth.uid() = student_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

-- ─── JOBS (Guide-configurable) ──────────────────────
create table jobs (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references sessions(id) on delete cascade,
  title text not null,
  description text,
  icon text default '💼',
  weekly_pay numeric(10,2) not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table jobs enable row level security;

create policy "Anyone can read jobs"
  on jobs for select using (true);

create policy "Guides can manage jobs"
  on jobs for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  ) with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

-- ─── STUDENT JOBS (Assignment) ──────────────────────
create table student_jobs (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  job_id uuid references jobs(id) on delete cascade not null,
  assigned_at timestamptz default now(),
  is_active boolean default true,
  unique(student_id, job_id)
);

alter table student_jobs enable row level security;

create policy "Students see own job assignments"
  on student_jobs for select using (
    auth.uid() = student_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

create policy "Guides can manage job assignments"
  on student_jobs for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  ) with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

-- ─── WEEKLY PAYCHECKS ───────────────────────────────
create table weekly_paychecks (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  session_id uuid references sessions(id),
  week_label text not null, -- e.g. 'Mar 16, 2026'
  status paycheck_status default 'draft',

  -- XP data
  xp_mon integer default 0,
  xp_tue integer default 0,
  xp_wed integer default 0,
  xp_thu integer default 0,
  xp_fri integer default 0,
  epic_mon boolean default false,
  epic_tue boolean default false,
  epic_wed boolean default false,
  epic_thu boolean default false,
  epic_fri boolean default false,

  -- Earnings
  base_pay numeric(10,2) default 0,
  epic_bonus numeric(10,2) default 0,
  xp_bonus numeric(10,2) default 0,
  mastery_pay numeric(10,2) default 0,
  job_pay numeric(10,2) default 0,
  smart_goal numeric(10,2) default 0,
  other_pay numeric(10,2) default 0,
  total_earnings numeric(10,2) default 0,

  -- Job confirmation
  job_completed boolean default false,
  job_id uuid references jobs(id),

  -- Allocation
  alloc_checking numeric(10,2) default 0,
  alloc_savings numeric(10,2) default 0,
  alloc_sp500 numeric(10,2) default 0,
  alloc_nasdaq numeric(10,2) default 0,
  alloc_bonus numeric(10,2) default 0,

  -- Guide verification
  verified_by uuid references profiles(id),
  verified_amount numeric(10,2),
  verified_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table weekly_paychecks enable row level security;

create policy "Students see own paychecks"
  on weekly_paychecks for select using (
    auth.uid() = student_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

create policy "Students can manage own paychecks"
  on weekly_paychecks for insert with check (auth.uid() = student_id);

create policy "Students can update own draft paychecks"
  on weekly_paychecks for update using (
    (auth.uid() = student_id and status in ('draft', 'submitted'))
    or exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

-- ─── MASTERY TESTS (Multiple per paycheck) ──────────
create table mastery_tests (
  id uuid default uuid_generate_v4() primary key,
  paycheck_id uuid references weekly_paychecks(id) on delete cascade not null,
  student_id uuid references profiles(id) not null,
  subject text not null,
  grade text not null, -- 'K', '1st', '2nd', ... '12th'
  score integer not null check (score >= 0 and score <= 100),
  payout numeric(10,2) default 0,
  created_at timestamptz default now()
);

alter table mastery_tests enable row level security;

create policy "Students see own mastery tests"
  on mastery_tests for select using (
    auth.uid() = student_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

create policy "Students can insert own mastery tests"
  on mastery_tests for insert with check (auth.uid() = student_id);

create policy "Students can delete own mastery tests"
  on mastery_tests for delete using (auth.uid() = student_id);

-- ─── PURCHASE REQUESTS ──────────────────────────────
create table purchase_requests (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  item_name text not null,
  item_url text,
  price numeric(10,2) not null,
  status purchase_status default 'pending',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz default now()
);

alter table purchase_requests enable row level security;

create policy "Students see own purchases"
  on purchase_requests for select using (
    auth.uid() = student_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

create policy "Students can submit purchases"
  on purchase_requests for insert with check (auth.uid() = student_id);

create policy "Guides can update purchases"
  on purchase_requests for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

-- ─── BADGES ─────────────────────────────────────────
create table badge_definitions (
  id text primary key, -- 'first_pay', 'saver', etc.
  title text not null,
  description text not null,
  icon text not null,
  condition_type text not null, -- 'first_paycheck', 'savings_threshold', 'investment_opened', 'epic_week', 'mastery_perfect', 'streak'
  condition_value numeric default 0
);

create table student_badges (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  badge_id text references badge_definitions(id) not null,
  earned_at timestamptz default now(),
  unique(student_id, badge_id)
);

alter table badge_definitions enable row level security;
alter table student_badges enable row level security;

create policy "Anyone can read badge definitions"
  on badge_definitions for select using (true);

create policy "Students see own badges"
  on student_badges for select using (
    auth.uid() = student_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

create policy "System can grant badges"
  on student_badges for insert with check (
    auth.uid() = student_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

-- ─── STREAKS ────────────────────────────────────────
create table student_streaks (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null unique,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_paycheck_week text,
  updated_at timestamptz default now()
);

alter table student_streaks enable row level security;

create policy "Students see own streak"
  on student_streaks for select using (
    auth.uid() = student_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

create policy "System can update streaks"
  on student_streaks for all using (
    auth.uid() = student_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  ) with check (
    auth.uid() = student_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );

-- ═══════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════

-- ─── Transfer with fee logic ────────────────────────
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

  if v_from_balance < p_amount then
    return jsonb_build_object('error', 'Insufficient funds');
  end if;

  -- Calculate fee (investment → checking = 10%)
  v_fee_pct := case
    when p_from_type in ('sp500', 'nasdaq') and p_to_type = 'checking' then
      coalesce((select transfer_fee_pct from paycheck_settings ps
        join sessions s on ps.session_id = s.id where s.is_active = true limit 1), 10)
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
      values (v_from_id, p_student_id, -v_fee, v_new_from, 'Early withdrawal fee (' || v_fee_pct || '%)', 'fee');
  end if;

  return jsonb_build_object('success', true, 'net', v_net, 'fee', v_fee);
end;
$$ language plpgsql security definer;

-- ─── Allocate paycheck to accounts ──────────────────
create or replace function allocate_paycheck(
  p_paycheck_id uuid,
  p_checking numeric,
  p_savings numeric,
  p_sp500 numeric,
  p_nasdaq numeric,
  p_bonus numeric
)
returns jsonb as $$
declare
  v_paycheck record;
  v_total numeric;
  v_acct_id uuid;
  v_new_bal numeric;
begin
  select * into v_paycheck from weekly_paychecks where id = p_paycheck_id;
  if v_paycheck is null then return jsonb_build_object('error', 'Paycheck not found'); end if;
  if v_paycheck.status != 'verified' then return jsonb_build_object('error', 'Paycheck not verified'); end if;

  v_total := p_checking + p_savings + p_sp500 + p_nasdaq + p_bonus;
  if abs(v_total - v_paycheck.total_earnings) > 0.01 then
    return jsonb_build_object('error', 'Allocation does not match total');
  end if;

  -- Update each account
  foreach v_total in array array[
    array['checking', p_checking],
    array['savings', p_savings],
    array['sp500', p_sp500],
    array['nasdaq', p_nasdaq],
    array['bonus', p_bonus]
  ] loop
    -- This won't work with foreach on 2d arrays, let's do it explicitly
  end loop;

  -- Explicit allocation for each account type
  if p_checking > 0 then
    select id into v_acct_id from accounts where student_id = v_paycheck.student_id and account_type = 'checking';
    update accounts set balance = balance + p_checking, updated_at = now() where id = v_acct_id;
    select balance into v_new_bal from accounts where id = v_acct_id;
    insert into transactions (account_id, student_id, amount, balance_after, description, category, reference_id)
      values (v_acct_id, v_paycheck.student_id, p_checking, v_new_bal, 'Weekly paycheck', 'paycheck', p_paycheck_id);
  end if;

  if p_savings > 0 then
    select id into v_acct_id from accounts where student_id = v_paycheck.student_id and account_type = 'savings';
    update accounts set balance = balance + p_savings, updated_at = now() where id = v_acct_id;
    select balance into v_new_bal from accounts where id = v_acct_id;
    insert into transactions (account_id, student_id, amount, balance_after, description, category, reference_id)
      values (v_acct_id, v_paycheck.student_id, p_savings, v_new_bal, 'Weekly paycheck', 'paycheck', p_paycheck_id);
  end if;

  if p_sp500 > 0 then
    select id into v_acct_id from accounts where student_id = v_paycheck.student_id and account_type = 'sp500';
    update accounts set balance = balance + p_sp500, updated_at = now() where id = v_acct_id;
    select balance into v_new_bal from accounts where id = v_acct_id;
    insert into transactions (account_id, student_id, amount, balance_after, description, category, reference_id)
      values (v_acct_id, v_paycheck.student_id, p_sp500, v_new_bal, 'Weekly paycheck', 'paycheck', p_paycheck_id);
  end if;

  if p_nasdaq > 0 then
    select id into v_acct_id from accounts where student_id = v_paycheck.student_id and account_type = 'nasdaq';
    update accounts set balance = balance + p_nasdaq, updated_at = now() where id = v_acct_id;
    select balance into v_new_bal from accounts where id = v_acct_id;
    insert into transactions (account_id, student_id, amount, balance_after, description, category, reference_id)
      values (v_acct_id, v_paycheck.student_id, p_nasdaq, v_new_bal, 'Weekly paycheck', 'paycheck', p_paycheck_id);
  end if;

  if p_bonus > 0 then
    select id into v_acct_id from accounts where student_id = v_paycheck.student_id and account_type = 'bonus';
    update accounts set balance = balance + p_bonus, updated_at = now() where id = v_acct_id;
    select balance into v_new_bal from accounts where id = v_acct_id;
    insert into transactions (account_id, student_id, amount, balance_after, description, category, reference_id)
      values (v_acct_id, v_paycheck.student_id, p_bonus, v_new_bal, 'Weekly paycheck', 'paycheck', p_paycheck_id);
  end if;

  -- Update paycheck
  update weekly_paychecks set
    status = 'allocated',
    alloc_checking = p_checking, alloc_savings = p_savings,
    alloc_sp500 = p_sp500, alloc_nasdaq = p_nasdaq, alloc_bonus = p_bonus,
    updated_at = now()
  where id = p_paycheck_id;

  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;

-- ─── Apply session-end rates ────────────────────────
create or replace function apply_session_rates(p_session_id uuid)
returns jsonb as $$
declare
  v_session record;
  v_account record;
  v_interest numeric;
  v_new_bal numeric;
  v_count integer := 0;
begin
  select * into v_session from sessions where id = p_session_id;
  if v_session is null then return jsonb_build_object('error', 'Session not found'); end if;

  -- Apply savings interest
  if v_session.savings_interest_rate > 0 then
    for v_account in select * from accounts where account_type = 'savings' and balance > 0 loop
      v_interest := v_account.balance * (v_session.savings_interest_rate / 100);
      v_new_bal := v_account.balance + v_interest;
      update accounts set balance = v_new_bal, updated_at = now() where id = v_account.id;
      insert into transactions (account_id, student_id, amount, balance_after, description, category)
        values (v_account.id, v_account.student_id, v_interest, v_new_bal,
          'Savings interest (' || v_session.savings_interest_rate || '%)', 'interest');
      v_count := v_count + 1;
    end loop;
  end if;

  -- Apply S&P 500 return
  if v_session.sp500_return_rate != 0 then
    for v_account in select * from accounts where account_type = 'sp500' and balance > 0 loop
      v_interest := v_account.balance * (v_session.sp500_return_rate / 100);
      v_new_bal := v_account.balance + v_interest;
      update accounts set balance = v_new_bal, updated_at = now() where id = v_account.id;
      insert into transactions (account_id, student_id, amount, balance_after, description, category)
        values (v_account.id, v_account.student_id, v_interest, v_new_bal,
          'S&P 500 return (' || v_session.sp500_return_rate || '%)', 'market_return');
      v_count := v_count + 1;
    end loop;
  end if;

  -- Apply NASDAQ return
  if v_session.nasdaq_return_rate != 0 then
    for v_account in select * from accounts where account_type = 'nasdaq' and balance > 0 loop
      v_interest := v_account.balance * (v_session.nasdaq_return_rate / 100);
      v_new_bal := v_account.balance + v_interest;
      update accounts set balance = v_new_bal, updated_at = now() where id = v_account.id;
      insert into transactions (account_id, student_id, amount, balance_after, description, category)
        values (v_account.id, v_account.student_id, v_interest, v_new_bal,
          'NASDAQ return (' || v_session.nasdaq_return_rate || '%)', 'market_return');
      v_count := v_count + 1;
    end loop;
  end if;

  -- End session
  update sessions set is_active = false, end_date = current_date where id = p_session_id;

  return jsonb_build_object('success', true, 'accounts_updated', v_count);
end;
$$ language plpgsql security definer;

-- ═══════════════════════════════════════════════════════
-- SEED DATA — Default badges
-- ═══════════════════════════════════════════════════════
insert into badge_definitions (id, title, description, icon, condition_type, condition_value) values
  ('first_pay', 'First Paycheck', 'Got your first paycheck', '💰', 'first_paycheck', 1),
  ('saver_100', 'Savings Star', '$100+ in savings', '⭐', 'savings_threshold', 100),
  ('investor', 'Baby Investor', 'Opened an investment account', '📊', 'investment_opened', 1),
  ('epic_week', 'EPIC WEEK', '5/5 epic days in one week', '🔥', 'epic_week', 1),
  ('mastery_perfect', 'Mastery Pro', '100% on a mastery test', '🎯', 'mastery_perfect', 1),
  ('streak_5', 'On Fire', '5-week paycheck streak', '🔥', 'streak', 5),
  ('saver_500', 'Money Mountain', '$500+ in savings', '🏔️', 'savings_threshold', 500),
  ('big_spender', 'Smart Spender', 'First approved purchase', '🛍️', 'first_purchase', 1),
  ('diversified', 'Diversified', 'Money in all 5 accounts', '🌈', 'all_accounts', 1),
  ('streak_10', 'Unstoppable', '10-week paycheck streak', '⚡', 'streak', 10)
on conflict (id) do nothing;

-- ─── Auto-create streak row for new students ────────
create or replace function create_student_streak()
returns trigger as $$
begin
  if new.role = 'student' then
    insert into student_streaks (student_id, current_streak, longest_streak)
    values (new.id, 0, 0);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_student_profile_created
  after insert on profiles
  for each row execute function create_student_streak();

-- ─── Handle new user from auth ──────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'student',
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
