# Alpha SF Money — Handoff Doc

Last updated: May 3, 2026 (S5 rollout day)

## Project at a glance

A "My Money" classroom finance app for 8 middle school students at Alpha School SF. Built by Derek (derek.kim@alpha.school) for his class. Currently rolled out to kids for Session 5.

- **Live URL:** https://middle-school-money-management.vercel.app
- **Repo:** `/Users/dereksmac1/middle-school-money-management`
- **Stack:** Vite + React 18 + Tailwind + Framer Motion + lucide-react + Supabase (Postgres, RLS, pg_cron, pg_net, Edge Functions)
- **Hosting:** Vercel (auto-deploys on push to `main`)
- **DB project:** Supabase project `vtspcyfukezjswymyhzm` (derekhwankim@gmail.com)

## Class roster (8 kids)

All emails are `<firstname>.<lastname>@alpha.school` (Finley's is `finley.smith.1@alpha.school`).

| Name | Email | Status | S5 Starting Balance |
|------|-------|--------|---------------------|
| Aila Wong | aila.wong@alpha.school | Returning | $153 |
| Aniya Akhund | aniya.akhund@alpha.school | Joined S4 (no GeekSquad) | $698 |
| Aya Murray | aya.murray@alpha.school | New for S5 | $0 |
| Ben Tierney | ben.tierney@alpha.school | Returning | $222 |
| Ethan Wong | ethan.wong@alpha.school | Returning | $227 |
| Finley Smith (he/him) | finley.smith.1@alpha.school | Returning | $803 |
| Jack Tierney | jack.tierney@alpha.school | Returning | $215 |
| June Rockefeller | june.rockefeller@alpha.school | Returning | $193 |

**Login password for all:** `iloveschool`

All starting balances are in Savings (4% APY, paid daily). Other 3 accounts (Checking, S&P 500, NASDAQ) start at $0.

## How starting balances were calculated

For returning kids (everyone except Aniya and Aya):
```
S5 starting = (S3 ending Net Worth from Banking Overview) + S4 earnings − total cash paid out (excl MAP)
```

S3 ending Net Worth was pulled from each kid's S3 GeekSquad sheet → Banking Overview tab → "Current Net Worth" cell.

S4 earnings = Timeback XP-based earnings (computed via getActivityMetrics API) + MasteryTrack test payouts (counted from screenshots, real test-outs only — no placement tests).

Cash paid out came from the Cash Card Payment Request Google Sheet (excluding any MAP entries since MAP is locked-until-graduation in the Roth IRA bucket).

For Aniya: didn't fill a GeekSquad sheet, so we computed S3 + S4 earnings directly from Timeback (XP) + MasteryTrack (real test-outs only). Most of her tests were placements which were excluded.

For Aya: new for S5 → $0.

| Kid | S3 NetWorth | S4 (XP+mastery) | Cash paid | **S5 starting** |
|-----|-------------|-----------------|-----------|-----------------|
| Aila | $703 | $40 | $590 | $153 |
| Aniya | (S3+S4 = $699) | — | $1 | $698 |
| Ben | $701 | $109 | $588 | $222 |
| Ethan | $759 | $103 | $635 | $227 |
| Finley | $569 | $358 | $124 | $803 |
| Jack | $539 | $50 | $374 | $215 |
| June | $655 | $67 | $529 | $193 |
| Aya | — | — | — | $0 |

## Session 5 schedule

S5 runs **6 weeks: Apr 27 – Jun 7, 2026**.

| Week | Dates | Status |
|------|-------|--------|
| W1 | Apr 27 – May 3 | Already past — kids fill retroactively |
| W2 | May 4 – May 10 | Current week |
| W3 | May 11 – May 17 | Future |
| W4 | May 18 – May 24 | Future |
| W5 | May 25 – May 31 | Future |
| W6 | Jun 1 – Jun 7 | Future |

Each kid has 6 draft `weekly_paychecks` rows pre-generated (`session_number=5`, `week_number=1..6`, `week_label='S5 W1'..'S5 W6'`, `status='draft'`).

## Earning rules (kids should know)

- **Base pay:** $10 if you hit 600+ XP in the week (Mon–Fri)
- **Bonus XP dollars:** +$1 per 50 XP over 600
- **Epic Week bonus:** +$5 if all 5 weekdays were Epic (≥145 XP AND all subject rings filled)
- **Mastery test payouts:** $20 for 90–99%, $100 for 100%
- **Note:** Placement tests do NOT count toward mastery test earnings
- Weekend XP rolls into the prior Friday

## Database schema (key tables)

- `profiles` — kid info: `id`, `full_name`, `email`, `role`
- `al_profiles` — alternate profile table: `id`, `display_name`, `email`, `grade` (id matches `profiles.id`)
- `accounts` — 4 rows per kid: `id`, `student_id`, `account_type` ('checking'|'savings'|'sp500'|'nasdaq'), `balance`, `last_growth_date`
- `transactions` — `id`, `account_id`, `student_id`, `amount`, `balance_after`, `description`, `category` ('baseline'|'interest'|'market_return'|'cash_out'|'paycheck_allocation'|...), `created_at`
- `weekly_paychecks` — `id`, `student_id`, `session_id`, `week_label`, `session_number`, `week_number`, `status` ('draft'|'submitted'|'verified'|'allocated'), `xp_mon..xp_fri`, `epic_mon..epic_fri`, `base_pay`, `epic_bonus`, `xp_bonus`, `mastery_pay`, `job_pay`, `smart_goal`, `other_pay`, `total_earnings`
- `mastery_tests` — `id`, `paycheck_id`, `student_id`, `subject`, `grade`, `score`, `payout`
- `sessions` — `id`, `name`, `start_date`, `end_date`, `is_active`, `savings_interest_rate`, `sp500_return_*`, `nasdaq_return_*`. Active session: "Session 5 (Summer 2026)" Apr 27 – Jun 7
- `market_prices` — daily SPY/QQQ price data
- `paycheck_settings` — global rules (base_pay, mastery payouts, custom bonuses)

## What's been built (status)

### ✅ Working
- Student dashboard with debit-card-style Cash + Invest cards
- Sidebar with profile pill (Finbit-style)
- Net Worth chart (smooth curve, started at $0)
- EarningsBreakdown component (Wealthfront-style "Total gains" with collapsible breakdown)
- Paycheck editor (renders, all weeks accessible via pills)
- Auto-allocate trigger (paycheck status='allocated' → calls `allocate_paycheck` RPC)
- Daily market growth cron (Mon-Fri 21:15 UTC, Edge Function with SPY/QQQ data)
- 4% APY savings interest, daily compounding
- Bidirectional transfers, $0 fees
- Cash out flow
- S5 W1-W6 paychecks pre-generated for all kids

### ⚠️ Reverted/incomplete (needs work)
- **Paycheck simplification (NOT shipped):** Derek wanted to:
  - Remove BONUSES section (SMART Goal) entirely
  - Auto-allocate on submit (skip "submit for guide review" step → just deposit to Savings)
  - Status pill should show ✓ green "Submitted" once allocated
  - Hide "Past paychecks" behind a button
  - Refine Mastery Tests section design (cleaner card with amber star icon header)
  - Rename "Rings" → "Rings filled" everywhere
  
  Last attempt broke the page (agent removed `useState` for `customBonuses` but left references → runtime crash). Was reverted to commit `ff182e5`. **Current state has the OLD bonuses section + "Submit for Guide Review" + 4 statuses still.** New chat should redo carefully — don't remove state declarations, just hide UI.

### ⏳ Coming Soon (UI exists)
- Roth IRA card on dashboard ("MAP testing payouts will land here") — placeholder only
- MAP test integration not wired up

## Welcome emails (drafted, not yet sent)

Subject: **Our money app is ready 💰**
Signed: **— Derek**

Per-kid drafts exist in Gmail Drafts (created via Gmail MCP, but Gmail MCP can't update/delete — so old drafts may need manual cleanup).

Email content per kid should include:
- Personalized greeting
- Login URL: https://middle-school-money-management.vercel.app
- Login email + password (`iloveschool`)
- Their starting balance (in Savings)
- Brief explainer of what they can do (fill paychecks, transfer money, watch interest accrue)
- For all returning kids except Aniya: note that "your S4 earnings are included"
- For Aniya: note that her S4 paychecks (her first session here) are included
- For Aya: welcome message (new student, $0 starting)
- Subtitle: "design is in progress, feedback welcome — flag anything that looks wrong"

## Known issues / gotchas

- Paycheck page shows **"Submit for Guide Review"** still — meant to be auto-allocate. Reverted because last simplification attempt crashed.
- **Bonuses (SMART Goal) section still rendered** on paycheck page — meant to be removed.
- "Rings" label still says **"Rings"**, should say **"Rings filled"**.
- The dashboard redesign (Finbit aesthetic, debit cards, etc.) IS deployed and working.
- Vercel sometimes has deploy lag — kids may need to hard-refresh after a push.
- The `vite.config.js.timestamp-*.mjs` files clutter the repo. Already added to `.gitignore` but old ones may exist. Safe to delete.

## Procedure: when Derek wants app changes

1. Make code changes locally (or via agent)
2. Run `npx vite build --outDir dist-check --emptyOutDir` to verify
3. SQL changes: paste into Supabase SQL editor (https://supabase.com/dashboard/project/vtspcyfukezjswymyhzm/sql), run, verify
4. Frontend changes: `cd ~/middle-school-money-management && find .git -name '*.lock' -delete 2>/dev/null; git add -A && git commit -m "..." && git push` then wait for Vercel
5. Hard-refresh browser (Cmd+Shift+R) to see changes

## Files most relevant to S5 rollout

- `src/pages/student/StudentDashboard.jsx` — main dashboard
- `src/pages/student/StudentPaycheck.jsx` — paycheck editor (needs simplification)
- `src/pages/student/StudentTransfer.jsx`, `StudentCashOut.jsx`, `StudentLearn.jsx`, `StudentHistory.jsx`, `StudentLeaderboard.jsx`, `StudentPurchase.jsx`, `AccountDetail.jsx`, `InvestmentDetail.jsx`
- `src/components/student/PaycheckCard.jsx`, `UnfilledPaychecksList.jsx`, `EarningsBreakdown.jsx`, `HowXpWorks.jsx`, `NetWorthChart.jsx`, `SplitBalance.jsx`
- `src/components/shared/Layout.jsx` (sidebar), `Button.jsx`, `StatusBadge.jsx`
- `tailwind.config.js` — Alpha-blue palette, soft shadows, accent colors
- `sql/s5_rollout.sql` — the migration that set everything up

## Design system (current)

- **Background:** `bg-alpha-blue-50` (very light blue)
- **Cards:** `bg-white border border-alpha-blue-200 rounded-2xl shadow-soft`
- **Primary color:** alpha-blue-500 (#2D55F5)
- **Sidebar:** `bg-alpha-navy-900` (almost black) with white text, profile pill at top
- **Section headers:** small colored icon-square (w-9 h-9 rounded-xl) + title in semi-bold
- **Buttons:** rounded-full pills via shared `<Button>` component
- **Status badges:** via shared `<StatusBadge>` component
- **Typography:** clean sans-serif, NO handwritten font (Caveat was killed in audit)
- **Account cards:** debit-card-style with gradient backgrounds (blue Cash, purple Invest), big white numbers, small white-on-overlay labels

## Final state at handoff

- All 8 kids have correct S5 starting balances ✅
- App is live and renders ✅
- Dashboard redesign deployed ✅
- Paycheck page renders but has UNshipped simplification (bonuses still visible, still 2-step submit flow)
- Welcome emails drafted but not sent — Derek to send manually from Gmail Drafts
