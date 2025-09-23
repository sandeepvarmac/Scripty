here’s a turnkey package you can drop into your repo:

A Prisma schema (models + enums) mapped to the SQL we designed (with ON UPDATE CASCADE / ON DELETE referential actions).

A Prisma migration folder containing migration.sql.

A seed script (prisma/seed.ts) that inserts realistic data.

A sample dashboard payload JSON that matches the schemas you’re using on the UI.

Assumptions

Existing tables: users, projects, scripts, scenes, characters, evidence, analyses.

You’re on PostgreSQL; Prisma v5+.

You want Prisma to map to the SQL names we’ve been using (plural snake case), while your Prisma models use singular PascalCase.

1) prisma/schema.prisma (add/merge)
// ---------- Generators & datasource ----------
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---------- Enums (mapped to existing Postgres enums) ----------
enum BeatKind       @db.Enum("beat_kind")       { INCITING ACT1_BREAK MIDPOINT LOW_POINT ACT2_BREAK CLIMAX RESOLUTION }
enum TimingFlag     @db.Enum("timing_flag")     { EARLY ON_TIME LATE UNKNOWN }
enum NoteSeverity   @db.Enum("note_severity")   { HIGH MEDIUM LOW }
enum NoteArea       @db.Enum("note_area")       { STRUCTURE CHARACTER DIALOGUE PACING THEME GENRE FORMATTING LOGIC REPRESENTATION LEGAL }
enum IntExt         @db.Enum("int_ext_enum")    { INT EXT INT_EXT @map("INT/EXT") } // Prisma enum values can't contain '/', map it
enum RiskKind       @db.Enum("risk_kind")       { REAL_PERSON TRADEMARK LYRICS DEFAMATION_RISK LIFE_RIGHTS }
enum SubplotRole    @db.Enum("subplot_role")    { INTRO DEVELOP CONVERGE RESOLVE }
enum ScoreCategory  @db.Enum("score_category")  { STRUCTURE CHARACTER DIALOGUE PACING THEME GENRE_FIT ORIGINALITY FEASIBILITY }

// ---------- Existing models you already have (add fields via extend blocks if you split files) ----------
model Script {
  id              BigInt     @id @default(autoincrement()) @db.BigInt
  projectId       BigInt     @db.BigInt
  // ...your existing fields...
  logline         String?    @db.Text
  synopsis_short  String?    @db.Text
  synopsis_long   String?    @db.Text
  genre_override  String?
  comps           Json?

  scenes          Scene[]
  characters      Character[]
  beats           Beat[]
  notes           Note[]
  scores          Score[]
  pageMetrics     PageMetric[]
  themeStatements ThemeStatement[]
  riskFlags       RiskFlag[]
  subplots        Subplot[]

  @@map("scripts")
}

model Scene {
  id         BigInt     @id @default(autoincrement()) @db.BigInt
  scriptId   BigInt     @db.BigInt
  // ...your existing fields...
  int_ext    IntExt?
  location   String?
  tod        String?
  page_start Int?
  page_end   Int?

  elements   Element[]
  notes      Note[]
  feasibility FeasibilityMetric?
  characterLinks CharacterScene[]
  themeAlignment SceneThemeAlignment?
  riskFlags  RiskFlag[]

  @@map("scenes")
}

model Character {
  id        BigInt   @id @default(autoincrement()) @db.BigInt
  scriptId  BigInt   @db.BigInt
  // ...your existing fields...
  aliases   String[] @db.Text[]

  links     CharacterScene[]

  @@map("characters")
}

model Evidence {
  id        BigInt   @id @default(autoincrement()) @db.BigInt
  // ...your existing fields...
  area      NoteArea?

  notes     Note[]

  @@map("evidence")
}

// ---------- New models ----------
model Element {
  id          BigInt  @id @default(autoincrement()) @db.BigInt
  sceneId     BigInt  @db.BigInt
  type        String  // 'SCENE_HEADING' | 'ACTION' | 'DIALOGUE' | 'PARENTHETICAL' | 'TRANSITION' | 'SHOT'
  char_name   String?
  text        String
  order_index Int

  scene Scene @relation(fields: [sceneId], references: [id], onUpdate: Cascade, onDelete: Cascade)

  @@index([sceneId, type])
  @@map("elements")
}

model Beat {
  id          BigInt     @id @default(autoincrement()) @db.BigInt
  scriptId    BigInt     @db.BigInt
  kind        BeatKind
  page        Int?
  confidence  Decimal?   @db.Decimal(4, 2)
  timing_flag TimingFlag?
  rationale   String?

  script Script @relation(fields: [scriptId], references: [id], onUpdate: Cascade, onDelete: Cascade)

  @@index([scriptId])
  @@map("beats")
}

model Note {
  id          BigInt       @id @default(autoincrement()) @db.BigInt
  scriptId    BigInt       @db.BigInt
  severity    NoteSeverity
  area        NoteArea
  sceneId     BigInt?
  page        Int?
  line_ref    Int?
  evidenceId  BigInt?
  excerpt     String?
  suggestion  String?
  apply_hook  Json?
  rule_code   String?
  created_at  DateTime     @default(now()) @db.Timestamptz(6)
  updated_at  DateTime     @default(now()) @db.Timestamptz(6)

  script   Script   @relation(fields: [scriptId], references: [id], onUpdate: Cascade, onDelete: Cascade)
  scene    Scene?   @relation(fields: [sceneId], references: [id], onUpdate: Cascade, onDelete: SetNull)
  evidence Evidence?@relation(fields: [evidenceId], references: [id], onUpdate: Cascade, onDelete: SetNull)

  @@index([scriptId, area, severity])
  @@index([sceneId])
  @@map("notes")
}

model Score {
  id         BigInt        @id @default(autoincrement()) @db.BigInt
  scriptId   BigInt        @db.BigInt
  category   ScoreCategory
  value      Decimal       @db.Decimal(3, 1)
  rationale  String?

  script Script @relation(fields: [scriptId], references: [id], onUpdate: Cascade, onDelete: Cascade)

  @@unique([scriptId, category], name: "uq_scores_script_category")
  @@map("scores")
}

model FeasibilityMetric {
  id                BigInt  @id @default(autoincrement()) @db.BigInt
  sceneId           BigInt  @db.BigInt
  int_ext           IntExt?
  location          String?
  tod               String?
  has_stunts        Boolean?
  has_vfx           Boolean?
  has_sfx           Boolean?
  has_crowd         Boolean?
  has_minors        Boolean?
  has_animals       Boolean?
  has_weapons       Boolean?
  has_vehicles      Boolean?
  has_special_props Boolean?
  complexity_score  Int     @default(0)

  scene Scene @relation(fields: [sceneId], references: [id], onUpdate: Cascade, onDelete: Cascade)

  @@index([sceneId])
  @@map("feasibility_metrics")
}

model CharacterScene {
  characterId BigInt  @db.BigInt
  sceneId     BigInt  @db.BigInt
  lines       Int     @default(0)
  words       Int     @default(0)
  on_page     Boolean @default(true)

  character Character @relation(fields: [characterId], references: [id], onUpdate: Cascade, onDelete: Cascade)
  scene     Scene     @relation(fields: [sceneId], references: [id], onUpdate: Cascade, onDelete: Cascade)

  @@id([characterId, sceneId])
  @@index([sceneId])
  @@map("character_scenes")
}

model Subplot {
  id          BigInt   @id @default(autoincrement()) @db.BigInt
  scriptId    BigInt   @db.BigInt
  label       String
  description String?

  script Script @relation(fields: [scriptId], references: [id], onUpdate: Cascade, onDelete: Cascade)
  spans  SubplotSpan[]

  @@map("subplots")
}

model SubplotSpan {
  subplotId BigInt     @db.BigInt
  sceneId   BigInt     @db.BigInt
  role      SubplotRole

  subplot Subplot @relation(fields: [subplotId], references: [id], onUpdate: Cascade, onDelete: Cascade)
  scene   Scene   @relation(fields: [sceneId], references: [id], onUpdate: Cascade, onDelete: Cascade)

  @@id([subplotId, sceneId])
  @@map("subplot_spans")
}

model ThemeStatement {
  id         BigInt    @id @default(autoincrement()) @db.BigInt
  scriptId   BigInt    @db.BigInt
  statement  String
  confidence Decimal?  @db.Decimal(4, 2)

  script Script @relation(fields: [scriptId], references: [id], onUpdate: Cascade, onDelete: Cascade)

  @@map("theme_statements")
}

model SceneThemeAlignment {
  sceneId   BigInt   @id @db.BigInt
  on_theme  Boolean
  rationale String?

  scene Scene @relation(fields: [sceneId], references: [id], onUpdate: Cascade, onDelete: Cascade)

  @@map("scene_theme_alignment")
}

model RiskFlag {
  id          BigInt    @id @default(autoincrement()) @db.BigInt
  scriptId    BigInt    @db.BigInt
  sceneId     BigInt?
  kind        RiskKind
  page        Int?
  start_line  Int?
  end_line    Int?
  snippet     String?
  confidence  Decimal?  @db.Decimal(4, 2)

  script Script @relation(fields: [scriptId], references: [id], onUpdate: Cascade, onDelete: Cascade)
  scene  Scene?  @relation(fields: [sceneId], references: [id], onUpdate: Cascade, onDelete: SetNull)

  @@index([scriptId, kind])
  @@map("risk_flags")
}

model PageMetric {
  scriptId          BigInt  @db.BigInt
  page              Int
  scene_length_lines Int?
  dialogue_lines     Int?
  action_lines       Int?
  tension_score      Int?
  complexity_score   Int?

  script Script @relation(fields: [scriptId], references: [id], onUpdate: Cascade, onDelete: Cascade)

  @@id([scriptId, page])
  @@map("page_metrics")
}


If your current models already exist in the Prisma schema, just merge the new fields (e.g., Script.logline) and add the new models.

2) Prisma migration folder

Create a folder:
prisma/migrations/20250923_120000_add_mvp_analysis_objects/migration.sql

Paste this UP migration SQL (with ON UPDATE CASCADE):

BEGIN;

-- Enums (created if not present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'beat_kind') THEN
    CREATE TYPE beat_kind AS ENUM ('INCITING','ACT1_BREAK','MIDPOINT','LOW_POINT','ACT2_BREAK','CLIMAX','RESOLUTION');
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
    CREATE TYPE note_area AS ENUM ('STRUCTURE','CHARACTER','DIALOGUE','PACING','THEME','GENRE','FORMATTING','LOGIC','REPRESENTATION','LEGAL');
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
    CREATE TYPE score_category AS ENUM ('STRUCTURE','CHARACTER','DIALOGUE','PACING','THEME','GENRE_FIT','ORIGINALITY','FEASIBILITY');
  END IF;
END$$;

-- Existing table alterations
ALTER TABLE scripts
  ADD COLUMN IF NOT EXISTS logline TEXT,
  ADD COLUMN IF NOT EXISTS synopsis_short TEXT,
  ADD COLUMN IF NOT EXISTS synopsis_long TEXT,
  ADD COLUMN IF NOT EXISTS genre_override TEXT,
  ADD COLUMN IF NOT EXISTS comps JSONB;

ALTER TABLE scenes
  ADD COLUMN IF NOT EXISTS int_ext int_ext_enum,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS tod TEXT,
  ADD COLUMN IF NOT EXISTS page_start INTEGER,
  ADD COLUMN IF NOT EXISTS page_end INTEGER;

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS aliases TEXT[];

ALTER TABLE evidence
  ADD COLUMN IF NOT EXISTS area note_area;

-- New tables
CREATE TABLE IF NOT EXISTS elements (
  id BIGSERIAL PRIMARY KEY,
  scene_id BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('SCENE_HEADING','ACTION','DIALOGUE','PARENTHETICAL','TRANSITION','SHOT')),
  char_name TEXT,
  text TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT fk_elements_scene
    FOREIGN KEY (scene_id) REFERENCES scenes(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_elements_scene ON elements(scene_id);
CREATE INDEX IF NOT EXISTS idx_elements_scene_type ON elements(scene_id, type);

CREATE TABLE IF NOT EXISTS beats (
  id BIGSERIAL PRIMARY KEY,
  script_id BIGINT NOT NULL,
  kind beat_kind NOT NULL,
  page INTEGER,
  confidence NUMERIC(4,2),
  timing_flag timing_flag,
  rationale TEXT,
  CONSTRAINT fk_beats_script
    FOREIGN KEY (script_id) REFERENCES scripts(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_beats_script ON beats(script_id);

CREATE TABLE IF NOT EXISTS notes (
  id BIGSERIAL PRIMARY KEY,
  script_id BIGINT NOT NULL,
  severity note_severity NOT NULL,
  area note_area NOT NULL,
  scene_id BIGINT,
  page INTEGER, line_ref INTEGER,
  evidence_id BIGINT,
  excerpt TEXT, suggestion TEXT,
  apply_hook JSONB, rule_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_notes_script    FOREIGN KEY (script_id)  REFERENCES scripts(id)  ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_notes_scene     FOREIGN KEY (scene_id)   REFERENCES scenes(id)   ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_notes_evidence  FOREIGN KEY (evidence_id)REFERENCES evidence(id) ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_script_area ON notes(script_id, area, severity);
CREATE INDEX IF NOT EXISTS idx_notes_scene       ON notes(scene_id);

CREATE TABLE IF NOT EXISTS scores (
  id BIGSERIAL PRIMARY KEY,
  script_id BIGINT NOT NULL,
  category score_category NOT NULL,
  value NUMERIC(3,1) NOT NULL,
  rationale TEXT,
  CONSTRAINT fk_scores_script FOREIGN KEY (script_id) REFERENCES scripts(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_scores_script_category ON scores(script_id, category);

CREATE TABLE IF NOT EXISTS feasibility_metrics (
  id BIGSERIAL PRIMARY KEY,
  scene_id BIGINT NOT NULL,
  int_ext int_ext_enum,
  location TEXT, tod TEXT,
  has_stunts BOOLEAN, has_vfx BOOLEAN, has_sfx BOOLEAN,
  has_crowd BOOLEAN, has_minors BOOLEAN, has_animals BOOLEAN,
  has_weapons BOOLEAN, has_vehicles BOOLEAN, has_special_props BOOLEAN,
  complexity_score INTEGER DEFAULT 0,
  CONSTRAINT fk_feas_scene FOREIGN KEY (scene_id) REFERENCES scenes(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_feas_scene ON feasibility_metrics(scene_id);

CREATE TABLE IF NOT EXISTS character_scenes (
  character_id BIGINT NOT NULL,
  scene_id BIGINT NOT NULL,
  lines INTEGER DEFAULT 0,
  words INTEGER DEFAULT 0,
  on_page BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (character_id, scene_id),
  CONSTRAINT fk_char_scenes_character FOREIGN KEY (character_id) REFERENCES characters(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_char_scenes_scene     FOREIGN KEY (scene_id)     REFERENCES scenes(id)     ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_char_scenes_scene ON character_scenes(scene_id);

CREATE TABLE IF NOT EXISTS subplots (
  id BIGSERIAL PRIMARY KEY,
  script_id BIGINT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  CONSTRAINT fk_subplots_script FOREIGN KEY (script_id) REFERENCES scripts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subplot_spans (
  subplot_id BIGINT NOT NULL,
  scene_id BIGINT NOT NULL,
  role subplot_role NOT NULL,
  PRIMARY KEY (subplot_id, scene_id),
  CONSTRAINT fk_subplot_spans_subplot FOREIGN KEY (subplot_id) REFERENCES subplots(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_subplot_spans_scene   FOREIGN KEY (scene_id)   REFERENCES scenes(id)   ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS theme_statements (
  id BIGSERIAL PRIMARY KEY,
  script_id BIGINT NOT NULL,
  statement TEXT NOT NULL,
  confidence NUMERIC(4,2),
  CONSTRAINT fk_theme_script FOREIGN KEY (script_id) REFERENCES scripts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scene_theme_alignment (
  scene_id BIGINT PRIMARY KEY,
  on_theme BOOLEAN NOT NULL,
  rationale TEXT,
  CONSTRAINT fk_theme_alignment_scene FOREIGN KEY (scene_id) REFERENCES scenes(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS risk_flags (
  id BIGSERIAL PRIMARY KEY,
  script_id BIGINT NOT NULL,
  scene_id BIGINT,
  kind risk_kind NOT NULL,
  page INTEGER,
  start_line INTEGER, end_line INTEGER,
  snippet TEXT,
  confidence NUMERIC(4,2),
  CONSTRAINT fk_risk_script FOREIGN KEY (script_id) REFERENCES scripts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_risk_scene  FOREIGN KEY (scene_id)  REFERENCES scenes(id)  ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_risk_script_kind ON risk_flags(script_id, kind);

CREATE TABLE IF NOT EXISTS page_metrics (
  script_id BIGINT NOT NULL,
  page INTEGER NOT NULL,
  scene_length_lines INTEGER,
  dialogue_lines INTEGER,
  action_lines INTEGER,
  tension_score INTEGER,
  complexity_score INTEGER,
  PRIMARY KEY (script_id, page),
  CONSTRAINT fk_page_metrics_script FOREIGN KEY (script_id) REFERENCES scripts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Trigger to keep notes.updated_at fresh
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
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_notes_updated_at') THEN
    CREATE TRIGGER tr_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION set_notes_updated_at();
  END IF;
END$$;

COMMIT;


Run:
npx prisma generate
npx prisma migrate deploy (or migrate dev in local)

3) Seed script — prisma/seed.ts
import { PrismaClient, ScoreCategory, NoteArea, NoteSeverity, BeatKind, TimingFlag, RiskKind, SubplotRole } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1) Minimal existing records (project, script, scenes, characters)
  const project = await prisma.projects.create({
    data: {
      // If your Project model differs, adjust here or replace with prisma.$executeRaw
      // This snippet assumes you already have a Projects model; if not, skip and attach to Script directly.
      // name, userId, etc. -> tweak for your schema
      name: "Sample Feature — Project Alpha",
      userId: 1,
      type: "FEATURE_INDEPENDENT",
      description: "Seed project for dashboard demo"
    } as any
  }).catch(() => null);

  const script = await prisma.script.create({
    data: {
      projectId: (project as any)?.id ?? 1,
      title: "The Clockmaker",
      format: "FDX",
      pageCount: 110,
      totalScenes: 3,
      totalCharacters: 2,
      logline: "A meticulous clockmaker must pull one last heist to stop time running out on his daughter’s life.",
      synopsis_short: "When a reclusive artisan is coerced into a museum heist, he must outwit both his partners and an old nemesis...",
      synopsis_long: "Act I: ... Act II: ... Act III: ...",
      genre_override: "Thriller",
      comps: { titles: ["Sicario", "Heat (tone)"], note: "Non-copyright comps" }
    } as any
  });

  const [scene1, scene2, scene3] = await Promise.all([
    prisma.scene.create({ data: { scriptId: script.id, pageNumber: 1,  int_ext: "INT", location: "WORKSHOP", tod: "NIGHT", page_start: 1, page_end: 4, content: "INT. WORKSHOP - NIGHT ..."} as any }),
    prisma.scene.create({ data: { scriptId: script.id, pageNumber: 25, int_ext: "EXT", location: "MUSEUM ROOF", tod: "NIGHT", page_start: 25, page_end: 27, content: "EXT. ROOF - NIGHT ..."} as any }),
    prisma.scene.create({ data: { scriptId: script.id, pageNumber: 104,int_ext: "INT", location: "MUSEUM VAULT", tod: "NIGHT", page_start: 104, page_end: 110, content: "INT. VAULT - NIGHT ..."} as any })
  ]);

  const [maya, olin] = await Promise.all([
    prisma.character.create({ data: { scriptId: script.id, name: "MAYA", dialogueCount: 42, aliases: ["MAY"] } as any }),
    prisma.character.create({ data: { scriptId: script.id, name: "OLIN", dialogueCount: 31, aliases: [] } as any })
  ]);

  // 2) Elements
  await prisma.element.createMany({
    data: [
      { sceneId: scene1.id, type: "SCENE_HEADING", text: "INT. WORKSHOP - NIGHT", order_index: 0 },
      { sceneId: scene1.id, type: "ACTION", text: "Gears whir. OLIN files a tiny cog.", order_index: 1 },
      { sceneId: scene1.id, type: "DIALOGUE", char_name: "OLIN", text: "Time is a liar.", order_index: 2 },
      { sceneId: scene2.id, type: "SCENE_HEADING", text: "EXT. MUSEUM ROOF - NIGHT", order_index: 0 },
      { sceneId: scene3.id, type: "SCENE_HEADING", text: "INT. MUSEUM VAULT - NIGHT", order_index: 0 }
    ]
  });

  // 3) Character presence
  await prisma.characterScene.createMany({
    data: [
      { characterId: maya.id, sceneId: scene1.id, lines: 5,  words: 60 },
      { characterId: olin.id, sceneId: scene1.id, lines: 7,  words: 80 },
      { characterId: maya.id, sceneId: scene2.id, lines: 12, words: 140 },
      { characterId: olin.id, sceneId: scene3.id, lines: 10, words: 120 }
    ]
  });

  // 4) Feasibility per scene
  await prisma.feasibilityMetric.createMany({
    data: [
      { sceneId: scene1.id, int_ext: "INT", location: "WORKSHOP", tod: "NIGHT", has_special_props: true, complexity_score: 2 },
      { sceneId: scene2.id, int_ext: "EXT", location: "MUSEUM ROOF", tod: "NIGHT", has_stunts: true, has_vehicles: true, complexity_score: 6 },
      { sceneId: scene3.id, int_ext: "INT", location: "MUSEUM VAULT", tod: "NIGHT", has_vfx: true, has_sfx: true, complexity_score: 8 }
    ] as any
  });

  // 5) Beats
  await prisma.beat.createMany({
    data: [
      { scriptId: script.id, kind: "INCITING",    page: 12,  confidence: new PrismaClient.Prisma.Decimal(0.82), timing_flag: "ON_TIME" },
      { scriptId: script.id, kind: "ACT1_BREAK",  page: 25,  confidence: new PrismaClient.Prisma.Decimal(0.78), timing_flag: "ON_TIME" },
      { scriptId: script.id, kind: "MIDPOINT",    page: 55,  confidence: new PrismaClient.Prisma.Decimal(0.74), timing_flag: "ON_TIME" },
      { scriptId: script.id, kind: "LOW_POINT",   page: 75,  confidence: new PrismaClient.Prisma.Decimal(0.69), timing_flag: "ON_TIME" },
      { scriptId: script.id, kind: "ACT2_BREAK",  page: 90,  confidence: new PrismaClient.Prisma.Decimal(0.71), timing_flag: "ON_TIME" },
      { scriptId: script.id, kind: "CLIMAX",      page: 104, confidence: new PrismaClient.Prisma.Decimal(0.77), timing_flag: "ON_TIME" },
      { scriptId: script.id, kind: "RESOLUTION",  page: 110, confidence: new PrismaClient.Prisma.Decimal(0.76), timing_flag: "ON_TIME" }
    ] as any
  });

  // 6) Notes
  await prisma.note.createMany({
    data: [
      {
        scriptId: script.id,
        severity: "HIGH",
        area: "STRUCTURE",
        sceneId: scene2.id,
        page: 25,
        line_ref: 4,
        excerpt: "Team accepts the heist too quickly.",
        suggestion: "Add a refusal beat and consequence to raise stakes.",
        rule_code: "STRUCT_BEAT_EARLY"
      },
      {
        scriptId: script.id,
        severity: "MEDIUM",
        area: "DIALOGUE",
        sceneId: scene1.id,
        page: 2,
        line_ref: 12,
        excerpt: "On-the-nose line about 'time'.",
        suggestion: "Replace with a visual action that implies urgency.",
        rule_code: "DIALOGUE_ON_NOSE"
      }
    ]
  });

  // 7) Scores (rubric)
  await prisma.score.createMany({
    data: [
      { scriptId: script.id, category: "STRUCTURE",   value: new PrismaClient.Prisma.Decimal(7.5), rationale: "Beats land on-time." },
      { scriptId: script.id, category: "CHARACTER",   value: new PrismaClient.Prisma.Decimal(7.0), rationale: "Clear goals; antagonist pressure ok." },
      { scriptId: script.id, category: "DIALOGUE",    value: new PrismaClient.Prisma.Decimal(6.5), rationale: "Some on-the-nose lines." },
      { scriptId: script.id, category: "PACING",      value: new PrismaClient.Prisma.Decimal(7.2), rationale: "Minor flat spots in Act II." },
      { scriptId: script.id, category: "THEME",       value: new PrismaClient.Prisma.Decimal(7.0), rationale: "Consistent 'time/value' motif." },
      { scriptId: script.id, category: "GENRE_FIT",   value: new PrismaClient.Prisma.Decimal(7.8), rationale: "Tonal alignment with heist thrillers." },
      { scriptId: script.id, category: "ORIGINALITY", value: new PrismaClient.Prisma.Decimal(6.8), rationale: "Fresh prop mechanics." },
      { scriptId: script.id, category: "FEASIBILITY", value: new PrismaClient.Prisma.Decimal(6.9), rationale: "Vault/VFX increases costs." }
    ]
  });

  // 8) Page metrics (only a few pages for demo)
  await prisma.pageMetric.createMany({
    data: [
      { scriptId: script.id, page: 1,   scene_length_lines: 48, dialogue_lines: 10, action_lines: 38, tension_score: 2, complexity_score: 3 },
      { scriptId: script.id, page: 25,  scene_length_lines: 55, dialogue_lines: 28, action_lines: 27, tension_score: 5, complexity_score: 6 },
      { scriptId: script.id, page: 55,  scene_length_lines: 50, dialogue_lines: 18, action_lines: 32, tension_score: 6, complexity_score: 5 },
      { scriptId: script.id, page: 104, scene_length_lines: 60, dialogue_lines: 12, action_lines: 48, tension_score: 9, complexity_score: 8 }
    ]
  });

  // 9) Subplots + spans
  const subplot = await prisma.subplot.create({
    data: { scriptId: script.id, label: "Father–Daughter Trust", description: "Olin hides diagnosis; Maya seeks agency." }
  });
  await prisma.subplotSpan.createMany({
    data: [
      { subplotId: subplot.id, sceneId: scene1.id, role: "INTRO" },
      { subplotId: subplot.id, sceneId: scene2.id, role: "DEVELOP" },
      { subplotId: subplot.id, sceneId: scene3.id, role: "RESOLVE" }
    ]
  });

  // 10) Theme statements & alignment
  await prisma.themeStatement.create({
    data: { scriptId: script.id, statement: "Time is only valuable when it’s shared.", confidence: new PrismaClient.Prisma.Decimal(0.79) }
  });
  await prisma.sceneThemeAlignment.create({
    data: { sceneId: scene1.id, on_theme: true, rationale: "Workshop intro juxtaposes craft vs. life." }
  });

  // 11) Risk flags
  await prisma.riskFlag.create({
    data: {
      scriptId: script.id,
      sceneId: scene3.id,
      kind: "TRADEMARK",
      page: 104,
      start_line: 6,
      end_line: 8,
      snippet: "Brand-name security system referenced.",
      confidence: new PrismaClient.Prisma.Decimal(0.61)
    }
  });

  console.log("✅ Seed complete:", { scriptId: script.id });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });


Add a package script:
"prisma:seed": "ts-node --transpile-only prisma/seed.ts" (or compile with tsc and run with node)

4) Sample dashboard payload — sample/dashboard_payload.json

This conforms to the schemas we defined (beats, notes, risk_flags, etc.).

{
  "beats": [
    { "kind": "INCITING",   "page": 12,  "confidence": 0.82, "timing_flag": "ON_TIME", "rationale": "Catalyst: museum blackmail call." },
    { "kind": "ACT1_BREAK", "page": 25,  "confidence": 0.78, "timing_flag": "ON_TIME", "rationale": "Commitment: team forms." },
    { "kind": "MIDPOINT",   "page": 55,  "confidence": 0.74, "timing_flag": "ON_TIME", "rationale": "Vault layout revelation." },
    { "kind": "LOW_POINT",  "page": 75,  "confidence": 0.69, "timing_flag": "ON_TIME", "rationale": "Daughter endangered." },
    { "kind": "ACT2_BREAK", "page": 90,  "confidence": 0.71, "timing_flag": "ON_TIME", "rationale": "New plan with higher risk." },
    { "kind": "CLIMAX",     "page": 104, "confidence": 0.77, "timing_flag": "ON_TIME", "rationale": "Vault confrontation." },
    { "kind": "RESOLUTION", "page": 110, "confidence": 0.76, "timing_flag": "ON_TIME", "rationale": "Reconciliation." }
  ],
  "notes": [
    {
      "severity": "HIGH",
      "area": "STRUCTURE",
      "scene_id": 2,
      "page": 25,
      "line_ref": 4,
      "excerpt": "Team accepts the heist too quickly.",
      "suggestion": "Add a refusal beat and consequence to raise stakes.",
      "apply_hook": { "op": "insert", "range": { "sceneId": 2, "from": 3, "to": 4 } },
      "rule_code": "STRUCT_BEAT_EARLY"
    },
    {
      "severity": "MEDIUM",
      "area": "DIALOGUE",
      "scene_id": 1,
      "page": 2,
      "line_ref": 12,
      "excerpt": "On-the-nose line about 'time'.",
      "suggestion": "Replace with a visual action that implies urgency.",
      "apply_hook": { "op": "replace", "range": { "sceneId": 1, "from": 12, "to": 12 } },
      "rule_code": "DIALOGUE_ON_NOSE"
    }
  ],
  "risk_flags": [
    {
      "kind": "TRADEMARK",
      "scene_id": 3,
      "page": 104,
      "start_line": 6,
      "end_line": 8,
      "snippet": "Brand-name security system referenced.",
      "confidence": 0.61,
      "notes": "Consider genericizing or clearing."
    }
  ],
  "theme_statements": [
    { "statement": "Time is only valuable when it’s shared.", "confidence": 0.79 }
  ],
  "scene_theme_alignment": [
    { "scene_id": 1, "on_theme": true, "rationale": "Workshop intro juxtaposes craft vs. life." }
  ],
  "feasibility": [
    { "scene_id": 1, "int_ext": "INT", "location": "WORKSHOP", "tod": "NIGHT", "has_special_props": true, "complexity_score": 2 },
    { "scene_id": 2, "int_ext": "EXT", "location": "MUSEUM ROOF", "tod": "NIGHT", "has_stunts": true, "has_vehicles": true, "complexity_score": 6 },
    { "scene_id": 3, "int_ext": "INT", "location": "MUSEUM VAULT", "tod": "NIGHT", "has_vfx": true, "has_sfx": true, "complexity_score": 8 }
  ],
  "page_metrics": [
    { "page": 1,   "scene_length_lines": 48, "dialogue_lines": 10, "action_lines": 38, "tension_score": 2, "complexity_score": 3 },
    { "page": 25,  "scene_length_lines": 55, "dialogue_lines": 28, "action_lines": 27, "tension_score": 5, "complexity_score": 6 },
    { "page": 55,  "scene_length_lines": 50, "dialogue_lines": 18, "action_lines": 32, "tension_score": 6, "complexity_score": 5 },
    { "page": 104, "scene_length_lines": 60, "dialogue_lines": 12, "action_lines": 48, "tension_score": 9, "complexity_score": 8 }
  ],
  "character_scenes": [
    { "character_id": 1, "scene_id": 1, "lines": 5, "words": 60,  "on_page": true },
    { "character_id": 2, "scene_id": 1, "lines": 7, "words": 80,  "on_page": true },
    { "character_id": 1, "scene_id": 2, "lines": 12,"words": 140, "on_page": true },
    { "character_id": 2, "scene_id": 3, "lines": 10,"words": 120, "on_page": true }
  ],
  "subplots": [
    { "label": "Father–Daughter Trust", "description": "Olin hides diagnosis; Maya seeks agency." }
  ],
  "subplot_spans": [
    { "subplot_id": 1, "scene_id": 1, "role": "INTRO" },
    { "subplot_id": 1, "scene_id": 2, "role": "DEVELOP" },
    { "subplot_id": 1, "scene_id": 3, "role": "RESOLVE" }
  ],
  "scores": [
    { "category": "STRUCTURE",   "value": 7.5, "rationale": "Beats land on-time." },
    { "category": "CHARACTER",   "value": 7.0, "rationale": "Clear goals; antagonist pressure ok." },
    { "category": "DIALOGUE",    "value": 6.5, "rationale": "Some on-the-nose lines." },
    { "category": "PACING",      "value": 7.2, "rationale": "Minor flat spots in Act II." },
    { "category": "THEME",       "value": 7.0, "rationale": "Consistent 'time/value' motif." },
    { "category": "GENRE_FIT",   "value": 7.8, "rationale": "Tonal alignment with heist thrillers." },
    { "category": "ORIGINALITY", "value": 6.8, "rationale": "Fresh prop mechanics." },
    { "category": "FEASIBILITY", "value": 6.9, "rationale": "Vault/VFX increases costs." }
  ]
}

How to run

Apply migration

npx prisma generate
npx prisma migrate deploy     # (or: npx prisma migrate dev)


Seed

npm run prisma:seed           # add the script in package.json


Load the dashboard payload in the UI

Point your front-end mock fetch to sample/dashboard_payload.json, or serve it from a dev endpoint until your API is wired.