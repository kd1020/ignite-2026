-- ====================================================================
-- IGNITE 2026: SUPABASE POSTGRESQL COMPLETE DATABASE SCHEMA
-- Migration: 20260101000000_ignite_schema.sql
-- ====================================================================


-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE team_registration_status AS ENUM ('pending', 'approved',
'rejected', 'disqualified');
EXCEPTION WHEN duplicate_object THEN null; END $$;


DO $$ BEGIN
  CREATE TYPE zone_code AS ENUM ('A', 'B', 'C', 'D', 'E', 'F', 'G',
'H');
EXCEPTION WHEN duplicate_object THEN null; END $$;


DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('verified', 'unverified',
'disqualified', 'did_not_finish');
EXCEPTION WHEN duplicate_object THEN null; END $$;


DO $$ BEGIN
  CREATE TYPE match_result_status AS ENUM ('scheduled', 'completed',
'walkover', 'disputed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;


DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('super_admin', 'scorekeeper',
'referee');
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ====================================================================
-- 3. CORE TABLES
-- ====================================================================


-- A. ADMIN USERS (Synchronized with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role admin_role NOT NULL DEFAULT 'scorekeeper',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


-- B. EVENT SETTINGS (Global administrative configuration)
CREATE TABLE IF NOT EXISTS public.event_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


-- Seed Initial Default Settings
INSERT INTO public.event_settings (key, value, description) VALUES
('registration_status', '{"open": true, "max_teams": 64}', 'Controls whether new public squad registrations are accepted.'),
('leaderboard_visibility', '{"public_visible": true, "show_r2_swings": true, "frozen": false}', 'Controls public visibility and freezing of tournament standings.'),
('prize_pool', '{"display_text": "A PRIZE POOL WORTH THE FIGHT."}', 'Configurable prize pool messaging displayed across website.'),
('r1_scoring_config', '{"default_M": 10, "points_multiplier": 1000}', 'Parameters for Round 1 positional ranking formula: (M - k + 1) * 1000.'),
('round_stages', '{"round1_completed": false, "round2_started": false, "qualified_count": 0, "duels_per_team": 4}', 'Tracking status of tournament rounds.'),
('public_announcements', '{"active": true, "banner_text": "IGNITE 2026 REGISTRATION IS CURRENTLY LIVE. SECURE YOUR ROSTER."}', 'Global banner message displayed on header/marquee.')
ON CONFLICT (key) DO NOTHING;


-- C. TEAMS
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_number TEXT UNIQUE, -- e.g. 'IGN-001' (assigned by admin upon check-in)
  team_name TEXT NOT NULL UNIQUE,
  team_leader_name TEXT NOT NULL,
  team_leader_mobile TEXT NOT NULL,
  registration_status team_registration_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


CREATE INDEX IF NOT EXISTS idx_teams_status ON public.teams(registration_status);
CREATE INDEX IF NOT EXISTS idx_teams_team_number ON public.teams(team_number);


-- D. TEAM MEMBERS
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);


-- E. ROUND 1 SCORES (The Gauntlet)
CREATE TABLE IF NOT EXISTS public.round1_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  zone zone_code NOT NULL,
  finishing_position INTEGER CHECK (finishing_position IS NULL OR finishing_position > 0),
  verification_status verification_status NOT NULL DEFAULT 'verified',
  max_teams_m INTEGER NOT NULL DEFAULT 10 CHECK (max_teams_m > 0),
  awarded_points INTEGER NOT NULL DEFAULT 0,
  entered_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_team_zone UNIQUE (team_id, zone)
);


CREATE INDEX IF NOT EXISTS idx_r1_scores_team ON public.round1_scores(team_id);
CREATE INDEX IF NOT EXISTS idx_r1_scores_zone ON public.round1_scores(zone);


-- F. ROUND 2 FIXTURES (The Hit List - Preserved Official Schedule)
CREATE TABLE IF NOT EXISTS public.round2_fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_number INTEGER NOT NULL CHECK (slot_number >= 1),
  zone zone_code NOT NULL,
  team_a_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE
RESTRICT,
  team_b_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE
RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_different_teams CHECK (team_a_id <> team_b_id),
  CONSTRAINT uq_slot_team_a UNIQUE (slot_number, team_a_id),
  CONSTRAINT uq_slot_team_b UNIQUE (slot_number, team_b_id)
);


CREATE INDEX IF NOT EXISTS idx_r2_fixtures_slot ON
public.round2_fixtures(slot_number);


-- G. ROUND 2 MATCH RESULTS
CREATE TABLE IF NOT EXISTS public.round2_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id UUID NOT NULL UNIQUE REFERENCES public.round2_fixtures(id)
ON DELETE RESTRICT,
  result_status match_result_status NOT NULL DEFAULT 'scheduled',
  winning_team_id UUID REFERENCES public.teams(id) ON DELETE RESTRICT,
  losing_team_id UUID REFERENCES public.teams(id) ON DELETE RESTRICT,
  score_delta_win INTEGER NOT NULL DEFAULT 30000,
  score_delta_loss INTEGER NOT NULL DEFAULT -30000,
  entered_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


-- H. AUDIT LOGS (Immutable administrative trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  previous_values JSONB,
  new_values JSONB,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON
public.audit_logs(entity_name, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON
public.audit_logs(created_at DESC);


-- ====================================================================
-- 4. BUSINESS LOGIC & CALCULATION TRIGGERS
-- ====================================================================


-- Function: Compute Round 1 Points (Supports Direct Score Entry and Positional Fallback)
CREATE OR REPLACE FUNCTION public.fn_calculate_round1_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status = 'verified' THEN
    -- If awarded_points is directly specified, preserve it
    IF NEW.awarded_points IS NOT NULL AND NEW.awarded_points > 0 THEN
      NULL; -- Keep direct score as entered
    ELSIF NEW.finishing_position IS NOT NULL AND NEW.finishing_position <= NEW.max_teams_m THEN
      NEW.awarded_points := (NEW.max_teams_m - NEW.finishing_position + 1) * 1000;
    ELSE
      NEW.awarded_points := COALESCE(NEW.awarded_points, 0);
    END IF;
  ELSE
    -- Zero points condition for unverified, DNF, or disqualified
    NEW.awarded_points := 0;
  END IF;

  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


DROP TRIGGER IF EXISTS trg_calculate_round1_points ON
public.round1_scores;
CREATE TRIGGER trg_calculate_round1_points
BEFORE INSERT OR UPDATE ON public.round1_scores
FOR EACH ROW EXECUTE FUNCTION public.fn_calculate_round1_points();


-- Function: Validate Round 2 Match Participants and Assign Loser Automatically
CREATE OR REPLACE FUNCTION public.fn_validate_round2_match()
RETURNS TRIGGER AS $$
DECLARE
  v_team_a UUID;
  v_team_b UUID;
BEGIN
  SELECT team_a_id, team_b_id INTO v_team_a, v_team_b
  FROM public.round2_fixtures
  WHERE id = NEW.fixture_id;


  IF NEW.winning_team_id IS NOT NULL THEN
    IF NEW.winning_team_id <> v_team_a AND NEW.winning_team_id <>
v_team_b THEN
      RAISE EXCEPTION 'Winning team must be one of the participating fixture squads (% or %).', v_team_a, v_team_b;
    END IF;


    -- Automatically set losing team
    IF NEW.winning_team_id = v_team_a THEN
      NEW.losing_team_id := v_team_b;
    ELSE
      NEW.losing_team_id := v_team_a;
    END IF;


    NEW.result_status := 'completed';
  ELSE
    NEW.losing_team_id := NULL;
  END IF;


  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


DROP TRIGGER IF EXISTS trg_validate_round2_match ON
public.round2_matches;
CREATE TRIGGER trg_validate_round2_match
BEFORE INSERT OR UPDATE ON public.round2_matches
FOR EACH ROW EXECUTE FUNCTION public.fn_validate_round2_match();


-- ====================================================================
-- 5. SECURE PUBLIC VIEWS (Data Masking)
-- ====================================================================


-- Public Leaderboard View: Calculates aggregated totals while completely excluding phone numbers
CREATE OR REPLACE VIEW public.public_leaderboard
WITH (security_invoker = true) AS
WITH r1_totals AS (
  SELECT
    team_id,
    COALESCE(SUM(awarded_points), 0)::INTEGER AS r1_total
  FROM public.round1_scores
  GROUP BY team_id
),
r2_totals AS (
  SELECT
    t.id AS team_id,
    COALESCE(SUM(
      CASE
WHEN m.winning_team_id = t.id THEN m.score_delta_win
WHEN m.losing_team_id = t.id THEN m.score_delta_loss
ELSE 0
      END
    ), 0)::INTEGER AS r2_delta
  FROM public.teams t
  LEFT JOIN public.round2_matches m
    ON m.winning_team_id = t.id OR m.losing_team_id = t.id
  WHERE m.result_status = 'completed' OR m.id IS NULL
  GROUP BY t.id
)
SELECT
  t.id AS team_id,
  t.team_number,
  t.team_name,
  t.registration_status,
  COALESCE(r1.r1_total, 0) AS round1_score,
  COALESCE(r2.r2_delta, 0) AS round2_delta,
  (COALESCE(r1.r1_total, 0) + COALESCE(r2.r2_delta, 0)) AS
combined_score,
  DENSE_RANK() OVER (
    ORDER BY (COALESCE(r1.r1_total, 0) + COALESCE(r2.r2_delta, 0)) DESC,
     COALESCE(r1.r1_total, 0) DESC,
     t.team_name ASC
  ) AS rank
FROM public.teams t
LEFT JOIN r1_totals r1 ON r1.team_id = t.id
LEFT JOIN r2_totals r2 ON r2.team_id = t.id
WHERE t.registration_status = 'approved';


-- Public Teams View (No mobile numbers or operational notes)
CREATE OR REPLACE VIEW public.public_teams
WITH (security_invoker = true) AS
SELECT
  t.id,
  t.team_number,
  t.team_name,
  t.registration_status,
  t.created_at,
  COUNT(m.id) AS member_count
FROM public.teams t
LEFT JOIN public.team_members m ON m.team_id = t.id
WHERE t.registration_status = 'approved'
GROUP BY t.id, t.team_number, t.team_name, t.registration_status,
t.created_at;


-- Public Fixtures View
CREATE OR REPLACE VIEW public.public_fixtures
WITH (security_invoker = true) AS
SELECT
  f.id AS fixture_id,
  f.slot_number,
  f.zone,
  ta.team_name AS team_a_name,
  ta.team_number AS team_a_number,
  tb.team_name AS team_b_name,
  tb.team_number AS team_b_number,
  COALESCE(m.result_status, 'scheduled') AS result_status,
  tw.team_name AS winning_team_name,
  m.updated_at AS completed_at
FROM public.round2_fixtures f
JOIN public.teams ta ON ta.id = f.team_a_id
JOIN public.teams tb ON tb.id = f.team_b_id
LEFT JOIN public.round2_matches m ON m.fixture_id = f.id
LEFT JOIN public.teams tw ON tw.id = m.winning_team_id;


-- ====================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================


ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round1_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round2_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round2_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;


CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE id = auth.uid()
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- POLICIES: admin_users
DROP POLICY IF EXISTS "Admins can view admin accounts" ON
public.admin_users;
CREATE POLICY "Admins can view admin accounts"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (public.is_admin());


DROP POLICY IF EXISTS "Super admins can manage admin accounts" ON
public.admin_users;
CREATE POLICY "Super admins can manage admin accounts"
  ON public.admin_users FOR ALL
  TO authenticated
  USING (public.is_super_admin());


-- POLICIES: event_settings
DROP POLICY IF EXISTS "Public read-only settings" ON
public.event_settings;
CREATE POLICY "Public read-only settings"
  ON public.event_settings FOR SELECT
  TO anon, authenticated
  USING (true);


DROP POLICY IF EXISTS "Admins can update event settings" ON
public.event_settings;
DROP POLICY IF EXISTS "Admins can manage event settings" ON
public.event_settings;
CREATE POLICY "Admins can manage event settings"
  ON public.event_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- POLICIES: teams
DROP POLICY IF EXISTS "Public can submit registration" ON public.teams;
CREATE POLICY "Public can submit registration"
  ON public.teams FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    registration_status = 'pending'
    AND team_number IS NULL
    AND length(trim(team_name)) >= 3
    AND length(trim(team_leader_name)) >= 2
    AND length(trim(team_leader_mobile)) >= 10
  );

DROP POLICY IF EXISTS "Public can view approved teams" ON public.teams;
CREATE POLICY "Public can view approved teams"
  ON public.teams FOR SELECT
  TO anon, authenticated
  USING (
    registration_status = 'approved'
    OR (registration_status = 'pending' AND team_number IS NULL)
  );

DROP POLICY IF EXISTS "Admins have full access to teams" ON public.teams;
CREATE POLICY "Admins have full access to teams"
  ON public.teams FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- POLICIES: team_members
DROP POLICY IF EXISTS "Public can insert members during registration" ON public.team_members;
CREATE POLICY "Public can insert members during registration"
  ON public.team_members FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(member_name)) >= 2
  );

DROP POLICY IF EXISTS "Public can view members of approved teams" ON public.team_members;
CREATE POLICY "Public can view members of approved teams"
  ON public.team_members FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_members.team_id
        AND teams.registration_status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Admins have full access to team members" ON public.team_members;
CREATE POLICY "Admins have full access to team members"
  ON public.team_members FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- POLICIES: round1_scores
DROP POLICY IF EXISTS "Public can view round 1 scores" ON
public.round1_scores;
CREATE POLICY "Public can view round 1 scores"
  ON public.round1_scores FOR SELECT
  TO anon, authenticated
  USING (true);


DROP POLICY IF EXISTS "Admins can insert and update round 1 scores" ON
public.round1_scores;
CREATE POLICY "Admins can insert and update round 1 scores"
  ON public.round1_scores FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- POLICIES: round2_fixtures
DROP POLICY IF EXISTS "Public can view fixtures" ON
public.round2_fixtures;
CREATE POLICY "Public can view fixtures"
  ON public.round2_fixtures FOR SELECT
  TO anon, authenticated
  USING (true);


DROP POLICY IF EXISTS "Admins can manage fixtures" ON
public.round2_fixtures;
CREATE POLICY "Admins can manage fixtures"
  ON public.round2_fixtures FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- POLICIES: round2_matches
DROP POLICY IF EXISTS "Public can view match results" ON
public.round2_matches;
CREATE POLICY "Public can view match results"
  ON public.round2_matches FOR SELECT
  TO anon, authenticated
  USING (true);


DROP POLICY IF EXISTS "Admins can manage match results" ON
public.round2_matches;
CREATE POLICY "Admins can manage match results"
  ON public.round2_matches FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- POLICIES: audit_logs (Strict Append-Only Trail: No delete or update exists)
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());


DROP POLICY IF EXISTS "System and admins can append audit logs" ON
public.audit_logs;
CREATE POLICY "System and admins can append audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());


-- ====================================================================
-- 7. SECURE AUDIT LOGGING STORED PROCEDURES
-- ====================================================================


CREATE OR REPLACE FUNCTION public.fn_correct_round1_score(
  p_score_id UUID,
  p_new_position INTEGER,
  p_new_status verification_status,
  p_reason TEXT,
  p_new_score INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_old_record RECORD;
  v_admin_id UUID := auth.uid();
  v_updated_score RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only authenticated IGNITE admins can correct scores.';
  END IF;

  IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'A comprehensive reason (minimum 5 characters) is mandatory for score corrections.';
  END IF;

  SELECT * INTO v_old_record FROM public.round1_scores WHERE id = p_score_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Round 1 score record % not found.', p_score_id;
  END IF;

  UPDATE public.round1_scores
  SET
    finishing_position = p_new_position,
    awarded_points = COALESCE(p_new_score, awarded_points),
    verification_status = p_new_status,
    entered_by = v_admin_id,
    notes = COALESCE(notes, '') || ' [Corrected: ' || p_reason || ']'
  WHERE id = p_score_id
  RETURNING * INTO v_updated_score;


  -- Insert immutable audit record
  INSERT INTO public.audit_logs (
    admin_id, action, entity_name, entity_id, previous_values,
new_values, reason
  ) VALUES (
    v_admin_id,
    'SCORE_CORRECTION_R1',
    'round1_scores',
    p_score_id::TEXT,
    row_to_json(v_old_record)::JSONB,
    row_to_json(v_updated_score)::JSONB,
    p_reason
  );


  RETURN jsonb_build_object(
    'success', true,
    'score_id', p_score_id,
    'awarded_points', v_updated_score.awarded_points
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Secure Procedure: Record Round 2 Match Result with Audit Trail
CREATE OR REPLACE FUNCTION public.fn_record_round2_result(
  p_fixture_id UUID,
  p_winning_team_id UUID,
  p_result_status match_result_status,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_old_record RECORD;
  v_admin_id UUID := auth.uid();
  v_updated_match RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only authenticated IGNITE admins can record match outcomes.';
  END IF;


  SELECT * INTO v_old_record FROM public.round2_matches WHERE fixture_id
= p_fixture_id;


  INSERT INTO public.round2_matches (
    fixture_id,
    result_status,
    winning_team_id,
    entered_by,
    notes
  ) VALUES (
    p_fixture_id,
    p_result_status,
    p_winning_team_id,
    v_admin_id,
    p_reason
  )
  ON CONFLICT (fixture_id) DO UPDATE
  SET
    result_status = EXCLUDED.result_status,
    winning_team_id = EXCLUDED.winning_team_id,
    entered_by = EXCLUDED.entered_by,
    notes = EXCLUDED.notes,
    updated_at = timezone('utc'::text, now())
  RETURNING * INTO v_updated_match;


  -- Append audit log
  INSERT INTO public.audit_logs (
    admin_id, action, entity_name, entity_id, previous_values,
new_values, reason
  ) VALUES (
    v_admin_id,
    'MATCH_RESULT_RECORDED_R2',
    'round2_matches',
    v_updated_match.id::TEXT,
    CASE WHEN v_old_record.id IS NOT NULL THEN
row_to_json(v_old_record)::JSONB ELSE NULL END,
    row_to_json(v_updated_match)::JSONB,
    COALESCE(p_reason, 'Match result confirmed by organizer.')
  );


  RETURN jsonb_build_object(
    'success', true,
    'match_id', v_updated_match.id,
    'winning_team_id', v_updated_match.winning_team_id,
    'losing_team_id', v_updated_match.losing_team_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 8. PERMISSIONS & DATA MASKING GRANTS
-- ====================================================================

-- Data Masking: Revoke table-level SELECT on teams from anon to prevent scraping phone numbers/notes
REVOKE SELECT ON public.teams FROM anon;

-- Grant column-level SELECT on non-sensitive columns only to anon
GRANT SELECT (id, team_number, team_name, registration_status, created_at, updated_at) ON public.teams TO anon;

-- Authenticated users (including admins) have full table SELECT
GRANT SELECT ON public.teams TO authenticated;

-- Grants on views for public and admin access
GRANT SELECT ON public.public_leaderboard TO anon, authenticated;
GRANT SELECT ON public.public_teams TO anon, authenticated;
GRANT SELECT ON public.public_fixtures TO anon, authenticated;

-- Grants on underlying view dependencies
GRANT SELECT ON public.team_members TO anon, authenticated;
GRANT SELECT ON public.round1_scores TO anon, authenticated;
GRANT SELECT ON public.round2_fixtures TO anon, authenticated;
GRANT SELECT ON public.round2_matches TO anon, authenticated;
GRANT SELECT ON public.event_settings TO anon, authenticated;

