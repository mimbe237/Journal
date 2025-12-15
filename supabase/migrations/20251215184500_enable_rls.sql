-- Enable Row Level Security (RLS) for public tables exposed via PostgREST
-- and add baseline policies. Adjust the USING/WITH CHECK predicates to fit
-- your business rules (owner_id, enterprise scoping, etc.).
-- Run this migration after reviewing the predicates.

-- === Enable RLS on all relevant tables ===
ALTER TABLE public.enterprise_accounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_invitations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.justificatifs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editions                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currencies               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_types            ENABLE ROW LEVEL SECURITY;

-- === Baseline policies ===
-- Replace auth.uid() = column with the appropriate ownership logic.
-- Add additional policies for write/update/delete operations as required.

-- Users table: allow a user to read/update their own row; admins full access
DROP POLICY IF EXISTS "read own row" ON public.users;
CREATE POLICY "read own row"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "update own row" ON public.users;
CREATE POLICY "update own row"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admins full access" ON public.users;
CREATE POLICY "admins full access"
  ON public.users
  USING ((auth.jwt() ->> 'role') = 'SUPER_ADMIN')
  WITH CHECK ((auth.jwt() ->> 'role') = 'SUPER_ADMIN');

-- Subscriptions table: owner or admin access. Adjust owner column name.
DROP POLICY IF EXISTS "read own subscriptions" ON public.subscriptions;
CREATE POLICY "read own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admins manage subscriptions" ON public.subscriptions;
CREATE POLICY "admins manage subscriptions"
  ON public.subscriptions
  USING ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT','FACTURATION'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT','FACTURATION'));

-- Editions table: readable by authenticated users, modifiable by admins.
DROP POLICY IF EXISTS "read editions" ON public.editions;
CREATE POLICY "read editions"
  ON public.editions
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admins manage editions" ON public.editions;
CREATE POLICY "admins manage editions"
  ON public.editions
  USING ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT'));

-- Promo codes: restrict to admins by default.
DROP POLICY IF EXISTS "admins manage promo codes" ON public.promo_codes;
CREATE POLICY "admins manage promo codes"
  ON public.promo_codes
  USING ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT','MARKETING'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT','MARKETING'));

-- Journal types: readable by authenticated users, managed by admins.
DROP POLICY IF EXISTS "read journal types" ON public.journal_types;
CREATE POLICY "read journal types"
  ON public.journal_types
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admins manage journal types" ON public.journal_types;
CREATE POLICY "admins manage journal types"
  ON public.journal_types
  USING ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT'));

-- Enterprise accounts: enterprise members or admins
DROP POLICY IF EXISTS "enterprise member read" ON public.enterprise_accounts;
CREATE POLICY "enterprise member read"
  ON public.enterprise_accounts
  FOR SELECT
  USING (auth.uid() = owner_id OR (auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT'));

DROP POLICY IF EXISTS "enterprise admin manage" ON public.enterprise_accounts;
CREATE POLICY "enterprise admin manage"
  ON public.enterprise_accounts
  USING ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT'));

-- Enterprise invitations: enterprise editors + admins.
DROP POLICY IF EXISTS "enterprise member read invitations" ON public.enterprise_invitations;
CREATE POLICY "enterprise member read invitations"
  ON public.enterprise_invitations
  FOR SELECT
  USING (auth.uid() = inviter_id OR (auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT'));

DROP POLICY IF EXISTS "enterprise admin manage invitations" ON public.enterprise_invitations;
CREATE POLICY "enterprise admin manage invitations"
  ON public.enterprise_invitations
  USING ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT'));

-- Reading sessions: allow readers to see their own sessions, admins manage
DROP POLICY IF EXISTS "read own reading sessions" ON public.reading_sessions;
CREATE POLICY "read own reading sessions"
  ON public.reading_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admins manage reading sessions" ON public.reading_sessions;
CREATE POLICY "admins manage reading sessions"
  ON public.reading_sessions
  USING ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT'));

-- System events: admins only by default
DROP POLICY IF EXISTS "admins manage system events" ON public.system_events;
CREATE POLICY "admins manage system events"
  ON public.system_events
  USING ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT'));

-- Payment transactions & justificatifs: owner read, admins manage
DROP POLICY IF EXISTS "read own payment transactions" ON public.payment_transactions;
CREATE POLICY "read own payment transactions"
  ON public.payment_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admins manage payment transactions" ON public.payment_transactions;
CREATE POLICY "admins manage payment transactions"
  ON public.payment_transactions
  USING ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT','FACTURATION'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT','FACTURATION'));

DROP POLICY IF EXISTS "read own justificatifs" ON public.justificatifs;
CREATE POLICY "read own justificatifs"
  ON public.justificatifs
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admins manage justificatifs" ON public.justificatifs;
CREATE POLICY "admins manage justificatifs"
  ON public.justificatifs
  USING ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT','FACTURATION'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT','FACTURATION'));

-- Manual subscriptions: owner and admins
DROP POLICY IF EXISTS "read own manual subscriptions" ON public.manual_subscriptions;
CREATE POLICY "read own manual subscriptions"
  ON public.manual_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admins manage manual subscriptions" ON public.manual_subscriptions;
CREATE POLICY "admins manage manual subscriptions"
  ON public.manual_subscriptions
  USING ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT','FACTURATION'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT','FACTURATION'));

-- Currencies: read by authenticated, manage by admins
DROP POLICY IF EXISTS "read currencies" ON public.currencies;
CREATE POLICY "read currencies"
  ON public.currencies
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admins manage currencies" ON public.currencies;
CREATE POLICY "admins manage currencies"
  ON public.currencies
  USING ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('SUPER_ADMIN','SUPPORT'));

-- Payment transactions, promo codes etc. are now protected.
-- Adjust, duplicate, or extend policies (INSERT/UPDATE/DELETE) to suit additional workflows.
