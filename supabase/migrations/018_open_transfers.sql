-- ═══════════════════════════════════════════════════════
-- 018 — Open transfers + zero fees
--
-- Real-world brokerages in 2026 (Robinhood, Fidelity, Schwab, M1, Wealthfront)
-- charge $0 for transferring between cash and investment accounts. Settlement
-- is T+1. The previous app config defined a 10% fee for Investments→Checking
-- but the front-end TRANSFER_RULES blocked those transfers entirely so the fee
-- never fired.
--
-- This migration:
--   1. Zeros out both transfer-fee columns on the active session.
--   2. Leaves the transfer_funds() RPC alone — it already correctly applies
--      a 0% fee when configured at 0, and supports any direction.
--   3. The front-end will be updated separately to allow Checking ↔ any
--      account (not just one-way).
-- ═══════════════════════════════════════════════════════

UPDATE public.paycheck_settings
SET transfer_fee_invest_pct = 0,
    transfer_fee_savings_pct = 0
WHERE session_id IN (SELECT id FROM public.sessions WHERE is_active = true);
