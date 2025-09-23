here are production-ready PostgreSQL DDL migrations for everything we outlined. I’m giving you:

A single forward (UP) migration you can run as-is.

A rollback (DOWN) migration that drops what we add here (run only if you really need to undo).

Notes

Replace table names if your existing schema uses different names (e.g., evidences vs evidence). I’ve used: users, projects, scripts, scenes, characters, evidence, analyses.

New objects are namespaced via explicit enum types so the UI can rely on stable values.

Everything is wrapped in transactions and guarded with IF NOT EXISTS checks (via DO $$ blocks for enums).

✅ Forward migration — UP
BEGIN;

----------------------------------------------------------------------
-- 0) ENUM TYPES (idempotent creation)
----------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'beat_kind') THEN
    CREATE TYPE beat_kind AS ENUM (
      'INCITING','ACT1_BREAK','MIDPOINT','LOW_POINT','ACT2_BREAK','CLIMAX','RESOLUTION'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'timing_flag') THEN
    CREATE TYPE timing_flag AS ENUM ('EARLY','ON_TIME','LATE','UNKNOWN');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'note_severity') THEN
    CREATE TYPE note_severity AS ENUM ('HIGH','MEDIUM','LOW');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'note_area') THEN
    CREATE TYPE note_area AS ENUM (
      'STRUCTURE','CHARACTER','DIALOGUE','PACING','THEME','GENRE','FORMATTING','LOGIC','REPRESENTATION','LEGAL'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'int_ext_enum') THEN
    CREATE TYPE int_ext_enum AS ENUM ('INT','EXT','INT/EXT');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'risk_kind') THEN
    CREATE TYPE risk_kind AS ENUM ('REAL_PERSON','TRADEMARK','LYRICS','DEFAMATION_RISK','LIFE_RIGHTS');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subplot_role') THEN
    CREATE TYPE subplot_role AS ENUM ('INTRO','DEVELOP','CONVERGE','RESOLVE');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'score_category') THEN
    CREATE TYPE score_category AS ENUM (
      'STRUCTURE','CHARACTER','DIALOGUE','PACING','THEME','GENRE_FIT','ORIGINALITY','FEASIBILITY'
    );
  END IF;
END$$;

----------------------------------------------------------------------
-- 1) ALTER EXISTING TABLES
----------------------------------------------------------------------

-- 1.1 scripts: coverage fields & comps
ALTER TABLE scripts
  ADD COLUMN IF NOT EXISTS logline           TEXT,
  ADD COLUMN IF NOT EXISTS synopsis_short    TEXT,
  ADD COLUMN IF NOT EXISTS synopsis_long     TEXT,
  ADD COLUMN IF NOT EXISTS genre_override    TEXT,
  ADD COLUMN IF NOT EXISTS comps             JSONB;

-- 1.2 scenes: parsed slug parts & page ranges
ALTER TABLE scenes
  ADD COLUMN IF NOT EXISTS int_ext     int_ext_enum,
  ADD COLUMN IF NOT EXISTS location    TEXT,
  ADD COLUMN IF NOT EXISTS tod         TEXT,
  ADD COLUMN IF NOT EXISTS page_start  INTEGER,
  ADD COLUMN IF NOT EXISTS page_end    INTEGER;

-- 1.3 characters: alias list
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS aliases TEXT[];

-- 1.4 evidence: area (for filterability)
ALTER TABLE evidence
  ADD COLUMN IF NOT EXISTS area note_area;

----------------------------------------------------------------------
-- 2) NEW TABLES
----------------------------------------------------------------------

-- 2.1 elements — fine-grained screenplay elements
CREATE TABLE IF NOT EXISTS elements (
  id           BIGSERIAL PRIMARY KEY,
  scene_id     BIGINT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('SCENE_HEADING','ACTION','DIALOGUE','PARENTHETICAL','TRANSITION','SHOT')),
  char_name    TEXT,
  text         TEXT NOT NULL,
  order_index  INTEGER NOT NULL DEFAULT 0
);

-- 2.2 beats — explicit beat locations & timing
CREATE TABLE IF NOT EXISTS beats (
  id          BIGSERIAL PRIMARY KEY,
  script_id   BIGINT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  kind        beat_kind NOT NULL,
  page        INTEGER,
  confidence  NUMERIC(4,2),
  timing_flag timing_flag,
  rationale   TEXT
);

-- 2.3 notes — actionable craft notes (anchors + apply hooks)
CREATE TABLE IF NOT EXISTS notes (
  id           BIGSERIAL PRIMARY KEY,
  script_id    BIGINT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  severity     note_severity NOT NULL,
  area         note_area     NOT NULL,
  scene_id     BIGINT REFERENCES scenes(id) ON DELETE SET NULL,
  page         INTEGER,
  line_ref     INTEGER,
  evidence_id  BIGINT REFERENCES evidence(id) ON DELETE SET NULL,
  excerpt      TEXT,
  suggestion   TEXT,
  apply_hook   JSONB,
  rule_code    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 scores — rubric per category
CREATE TABLE IF NOT EXISTS scores (
  id         BIGSERIAL PRIMARY KEY,
  script_id  BIGINT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  category   score_category NOT NULL,
  value      NUMERIC(3,1)   NOT NULL,
  rationale  TEXT
);
-- unique per script/category
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'uq_scores_script_category'
  ) THEN
    CREATE UNIQUE INDEX uq_scores_script_category
      ON scores(script_id, category);
  END IF;
END$$;

-- 2.5 feasibility_metrics — production flags per scene
CREATE TABLE IF NOT EXISTS feasibility_metrics (
  id                 BIGSERIAL PRIMARY KEY,
  scene_id           BIGINT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  int_ext            int_ext_enum,
  location           TEXT,
  tod                TEXT,
  has_stunts         BOOLEAN,
  has_vfx            BOOLEAN,
  has_sfx            BOOLEAN,
  has_crowd          BOOLEAN,
  has_minors         BOOLEAN,
  has_animals        BOOLEAN,
  has_weapons        BOOLEAN,
  has_vehicles       BOOLEAN,
  has_special_props  BOOLEAN,
  complexity_score   INTEGER DEFAULT 0
);

-- 2.6 character_scenes — presence & dialogue stats
CREATE TABLE IF NOT EXISTS character_scenes (
  character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  scene_id     BIGINT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  lines        INTEGER DEFAULT 0,
  words        INTEGER DEFAULT 0,
  on_page      BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (character_id, scene_id)
);

-- 2.7 subplots & subplot_spans — subplot swimlanes
CREATE TABLE IF NOT EXISTS subplots (
  id          BIGSERIAL PRIMARY KEY,
  script_id   BIGINT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  label       TEXT    NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS subplot_spans (
  subplot_id  BIGINT NOT NULL REFERENCES subplots(id) ON DELETE CASCADE,
  scene_id    BIGINT NOT NULL REFERENCES scenes(id)   ON DELETE CASCADE,
  role        subplot_role NOT NULL,
  PRIMARY KEY (subplot_id, scene_id)
);

-- 2.8 theme statements & per-scene alignment
CREATE TABLE IF NOT EXISTS theme_statements (
  id         BIGSERIAL PRIMARY KEY,
  script_id  BIGINT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  statement  TEXT    NOT NULL,
  confidence NUMERIC(4,2)
);

CREATE TABLE IF NOT EXISTS scene_theme_alignment (
  scene_id   BIGINT PRIMARY KEY REFERENCES scenes(id) ON DELETE CASCADE,
  on_theme   BOOLEAN NOT NULL,
  rationale  TEXT
);

-- 2.9 risk_flags — legal-adjacent (non-advice) flags
CREATE TABLE IF NOT EXISTS risk_flags (
  id          BIGSERIAL PRIMARY KEY,
  script_id   BIGINT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  scene_id    BIGINT REFERENCES scenes(id) ON DELETE SET NULL,
  kind        risk_kind NOT NULL,
  page        INTEGER,
  start_line  INTEGER,
  end_line    INTEGER,
  snippet     TEXT,
  confidence  NUMERIC(4,2)
);

-- 2.10 page_metrics — basis for pacing/tension/complexity heatmaps
CREATE TABLE IF NOT EXISTS page_metrics (
  script_id          BIGINT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  page               INTEGER NOT NULL,
  scene_length_lines INTEGER,
  dialogue_lines     INTEGER,
  action_lines       INTEGER,
  tension_score      INTEGER,
  complexity_score   INTEGER,
  PRIMARY KEY (script_id, page)
);

----------------------------------------------------------------------
-- 3) INDEXES (if not already created above)
----------------------------------------------------------------------

-- elements
CREATE INDEX IF NOT EXISTS idx_elements_scene       ON elements(scene_id);
CREATE INDEX IF NOT EXISTS idx_elements_scene_type  ON elements(scene_id, type);

-- beats
CREATE INDEX IF NOT EXISTS idx_beats_script         ON beats(script_id);

-- notes
CREATE INDEX IF NOT EXISTS idx_notes_script_area    ON notes(script_id, area, severity);
CREATE INDEX IF NOT EXISTS idx_notes_scene          ON notes(scene_id);

-- feasibility
CREATE INDEX IF NOT EXISTS idx_feas_scene           ON feasibility_metrics(scene_id);

-- character_scenes (PK already covers both)
CREATE INDEX IF NOT EXISTS idx_char_scenes_scene    ON character_scenes(scene_id);

-- risk_flags
CREATE INDEX IF NOT EXISTS idx_risk_script_kind     ON risk_flags(script_id, kind);

-- page_metrics (PK already covers script_id, page)
-- scores unique created via DO $$ above

----------------------------------------------------------------------
-- 4) TRIGGERS (optional): keep notes.updated_at fresh
----------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_notes_updated_at') THEN
    CREATE OR REPLACE FUNCTION set_notes_updated_at()
    RETURNS TRIGGER AS $fn$
    BEGIN
      NEW.updated_at := NOW();
      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_notes_updated_at'
  ) THEN
    CREATE TRIGGER tr_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION set_notes_updated_at();
  END IF;
END$$;

COMMIT;

⬅️ Rollback — DOWN

Only run if you must revert this migration. Drops all new tables, columns, indexes, and types created above (in safe order).

BEGIN;

-- 1) DROP TRIGGER/FUNCTION
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_notes_updated_at') THEN
    DROP TRIGGER tr_notes_updated_at ON notes;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_notes_updated_at') THEN
    DROP FUNCTION set_notes_updated_at();
  END IF;
END$$;

-- 2) DROP NEW TABLES (respect FK order)
DROP TABLE IF EXISTS page_metrics;
DROP TABLE IF EXISTS risk_flags;
DROP TABLE IF EXISTS scene_theme_alignment;
DROP TABLE IF EXISTS theme_statements;
DROP TABLE IF EXISTS subplot_spans;
DROP TABLE IF EXISTS subplots;
DROP TABLE IF EXISTS character_scenes;
DROP TABLE IF EXISTS feasibility_metrics;
DROP TABLE IF EXISTS scores;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS beats;
DROP TABLE IF EXISTS elements;

-- 3) ALTER EXISTING TABLES: DROP NEW COLUMNS
ALTER TABLE evidence
  DROP COLUMN IF EXISTS area;

ALTER TABLE characters
  DROP COLUMN IF EXISTS aliases;

ALTER TABLE scenes
  DROP COLUMN IF EXISTS int_ext,
  DROP COLUMN IF EXISTS location,
  DROP COLUMN IF EXISTS tod,
  DROP COLUMN IF EXISTS page_start,
  DROP COLUMN IF EXISTS page_end;

ALTER TABLE scripts
  DROP COLUMN IF EXISTS logline,
  DROP COLUMN IF EXISTS synopsis_short,
  DROP COLUMN IF EXISTS synopsis_long,
  DROP COLUMN IF EXISTS genre_override,
  DROP COLUMN IF EXISTS comps;

-- 4) DROP ENUM TYPES (after columns/tables no longer depend on them)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname='score_category') THEN
    DROP TYPE score_category;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname='subplot_role') THEN
    DROP TYPE subplot_role;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname='risk_kind') THEN
    DROP TYPE risk_kind;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname='int_ext_enum') THEN
    DROP TYPE int_ext_enum;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname='note_area') THEN
    DROP TYPE note_area;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname='note_severity') THEN
    DROP TYPE note_severity;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname='timing_flag') THEN
    DROP TYPE timing_flag;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname='beat_kind') THEN
    DROP TYPE beat_kind;
  END IF;
END$$;

COMMIT;
