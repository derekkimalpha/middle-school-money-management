-- ═══════════════════════════════════════════════════════
-- 015 — Fix login flow
--
-- Symptom: signing in succeeds (Supabase session is created) but the app
-- gets stuck on a loading spinner. Root cause: the row in public.profiles
-- that the app expects to load after signin doesn't exist for the user, AND
-- the client-side fallback that tries to create it is silently blocked by
-- RLS (no INSERT policy was ever defined on profiles).
--
-- This migration is idempotent — safe to re-run.
-- ═══════════════════════════════════════════════════════

-- ─── 1. Make sure setup_complete column exists ────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS setup_complete boolean DEFAULT false;

-- ─── 2. Add the missing INSERT policy on profiles ─────
-- Lets an authenticated user create their own profile row.
-- This is the safety net the client falls back to if the trigger doesn't fire.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─── 3. (Re)install handle_new_user trigger ───────────
-- Fires when a new auth.users row is created. Inserts a matching profile row.
-- Wrapped in EXCEPTION block so a trigger error never blocks signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url, setup_complete)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'student',
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't block signup if anything goes wrong here.
  RAISE WARNING 'handle_new_user failed for %: %', NEW.email, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 4. Backfill orphaned auth.users ──────────────────
-- Anyone who signed up before this fix was applied (and therefore has an
-- auth.users row but no profiles row) now gets a profile so they can log in.
INSERT INTO public.profiles (id, email, full_name, role, setup_complete)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  'student',
  false
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND u.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;
