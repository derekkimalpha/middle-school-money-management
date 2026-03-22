-- Add custom_bonuses JSONB column to paycheck_settings
ALTER TABLE paycheck_settings ADD COLUMN IF NOT EXISTS custom_bonuses jsonb DEFAULT '[{"id": "smart_goal", "name": "SMART Goal", "amount": 6, "type": "checkbox"}]'::jsonb;

-- Add custom_bonus_data JSONB column to weekly_paychecks (stores what student claimed)
ALTER TABLE weekly_paychecks ADD COLUMN IF NOT EXISTS custom_bonus_data jsonb DEFAULT '[]'::jsonb;

-- Seed existing paycheck_settings rows that have NULL custom_bonuses
UPDATE paycheck_settings
SET custom_bonuses = '[{"id": "smart_goal", "name": "SMART Goal", "amount": 6, "type": "checkbox"}]'::jsonb
WHERE custom_bonuses IS NULL;
