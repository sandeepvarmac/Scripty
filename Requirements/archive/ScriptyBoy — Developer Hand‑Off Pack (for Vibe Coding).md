# ScriptyBoy — Developer Hand‑Off Pack (for Vibe Coding)

This package gives you everything you need to start building ScriptyBoy with a vibe‑coding workflow (Cursor/Bolt/Windsurf/etc.). It turns the Phase‑1/Phase‑2 stories into concrete APIs, schemas, prompts, and guardrails.

---

## 0) Repo Blueprint (Monorepo)

```
/ (pnpm workspaces)
  apps/
    web/            # Next.js 14, Tailwind, shadcn/ui
    api/            # Fastify + tRPC (or REST via Fastify + OpenAPI)
    workers/        # Queue workers (BullMQ on Redis) for parsing & analysis
  packages/
    core/           # Domain types, zod schemas
    prompts/        # Promptbook (Analyst/Buddy) in versioned JSON
    telemetry/      # Logging + metrics client
    ui/             # Shared React components (cards, charts)
  infra/
    docker/         # Dockerfiles, docker-compose.dev.yml
    pulumi/         # IaC (AWS: S3, SQS, RDS, ElastiCache)

.env.example        # See Section 6
README.md           # Dev quickstart, scripts, conventions
CODEOWNERS          # Review routing
```

**Default stack**: Next.js + Tailwind + shadcn/ui; API = Fastify (TypeScript) with OpenAPI; Workers = Node + BullMQ. (Optional: Python microservice for OCR if needed.)

---

## 1) OpenAPI (Phase 1 Core)

**File:** `apps/api/openapi.yaml` (v3.1). Core excerpt below.

```yaml
openapi: 3.1.0
info:
  title: ScriptyBoy API
  version: 0.1.0
servers:
  - url: https://api.scriptyboy.com/v1
paths:
  /uploads:
    post:
      summary: Upload screenplay (FDX/Fountain/PDF)
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file: { type: string, format: binary }
                projectId: { type: string }
                privacyDoNotTrain: { type: boolean, default: true }
      responses:
        '201': { description: Created, content: { application/json: { schema: { $ref: '#/components/schemas/Script' } } } }
  /analyses:
    post:
      summary: Start analysis for a script version
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [scriptVersionId]
              properties:
                scriptVersionId: { type: string }
                priority: { type: string, enum: [normal, high], default: normal }
      responses:
        '202': { description: Queued, content: { application/json: { schema: { $ref: '#/components/schemas/Analysis' } } } }
  /analyses/{analysisId}:
    get:
      summary: Get analysis status & results
      parameters:
        - in: path
          name: analysisId
          required: true
          schema: { type: string }
      responses:
        '200': { description: OK, content: { application/json: { schema: { $ref: '#/components/schemas/Analysis' } } } }
  /notes/{noteId}/apply:
    post:
      summary: Accept a rewrite card and create a new script version
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                strategy: { type: string, enum: [exact, smart_merge], default: exact }
      responses:
        '201': { description: New script version created, content: { application/json: { schema: { $ref: '#/components/schemas/ScriptVersion' } } } }
  /exports:
    get:
      summary: Export report/notes
      parameters:
        - in: query
          name: scriptVersionId
          schema: { type: string }
        - in: query
          name: format
          schema: { type: string, enum: [pdf, fdx, csv] }
      responses:
        '200': { description: Stream file }
components:
  schemas:
    Script:
      type: object
      properties: { id: {type: string}, projectId: {type: string}, createdAt: {type: string, format: date-time} }
    ScriptVersion:
      type: object
      properties:
        id: { type: string }
        scriptId: { type: string }
        pages: { type: integer }
        format: { type: string, enum: [fdx, fountain, pdf] }
        sceneCount: { type: integer }
        createdAt: { type: string, format: date-time }
    Analysis:
      type: object
      properties:
        id: { type: string }
        scriptVersionId: { type: string }
        status: { type: string, enum: [queued, running, completed, failed] }
        sections:
          type: array
          items: { $ref: '#/components/schemas/AnalysisSection' }
    AnalysisSection:
      type: object
      properties:
        kind: { type: string, enum: [loglines, synopsis, beats, diagnostics, rewrite_cards, production_heatmap] }
        payload: { type: object }
```

---

## 2) Data Schemas (SQL DDL)

**File:** `infra/sql/001_core.sql` (excerpt).

```sql
CREATE TABLE orgs (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE users (
  id uuid PRIMARY KEY,
  org_id uuid REFERENCES orgs(id),
  email_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE projects (
  id uuid PRIMARY KEY,
  org_id uuid REFERENCES orgs(id),
  title text NOT NULL,
  privacy_do_not_train boolean NOT NULL DEFAULT true,
  retention_days int NOT NULL DEFAULT 90,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE scripts (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE script_versions (
  id uuid PRIMARY KEY,
  script_id uuid REFERENCES scripts(id),
  format text CHECK (format IN ('fdx','fountain','pdf')),
  pages int,
  scene_count int,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE scenes (
  id uuid PRIMARY KEY,
  script_version_id uuid REFERENCES script_versions(id),
  index_zero int,
  heading text,
  start_offset int,
  end_offset int
);
CREATE TABLE notes (
  id uuid PRIMARY KEY,
  analysis_id uuid,
  scene_id uuid,
  type text,          -- pacing, dialogue, agency, payoff, continuity
  severity int CHECK (severity BETWEEN 1 AND 5),
  evidence jsonb,     -- {spans:[{start,end}], text:"..."}
  suggestion jsonb,   -- seeds for rewrite cards
  created_at timestamptz DEFAULT now()
);
CREATE TABLE rewrite_cards (
  id uuid PRIMARY KEY,
  note_id uuid REFERENCES notes(id),
  diff text,          -- unified diff
  ripple_risk text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE analyses (
  id uuid PRIMARY KEY,
  script_version_id uuid REFERENCES script_versions(id),
  status text,
  sections jsonb,
  created_at timestamptz DEFAULT now()
);
```

---

## 3) Promptbook (packages/prompts)

**File:** `packages/prompts/analyst.json`

```json
{
  "system": "You are ScriptyBoy Analyst. You deliver film/TV coverage and line-anchored craft notes. Never invent plot. Cite exact scene+line spans. Output JSON only.",
  "guidelines": [
    "Respect WGA: AI-assisted, writer-owned; do not claim authorship.",
    "Be specific. Prefer evidence over opinion.",
    "Offer 1–3 concrete rewrite patterns per issue."
  ],
  "outputs": {
    "coverage": {"loglines": 3, "synopsis_words": 350, "beats_words": 700},
    "diagnostics": ["pacing","dialogue","agency","clarity","setup_payoff"],
    "rewrite_card_schema": {
      "type": "object",
      "required": ["note_id","root_cause","patterns","diff"],
      "properties": {
        "note_id": {"type":"string"},
        "root_cause": {"type":"string"},
        "patterns": {"type":"array","items":{"type":"string"}},
        "diff": {"type":"string","description":"unified diff with @@ line anchors"}
      }
    }
  }
}
```

**File:** `packages/prompts/rewrite_card.txt`

```
SYSTEM: Produce a FIX-IT card for the given issue. Preserve character voices. Keep intent; adjust execution. Output exactly one JSON object matching rewrite_card_schema. Diff must be unified format anchored to scene and line numbers.
```

**File:** `packages/prompts/production_heuristics.txt`

```
Classify the scene for cost signals. Return JSON: {night:boolean, locations:int, company_move:boolean, crowd:boolean, vfx:boolean, animals:boolean, children:boolean, stunts:boolean, vehicles:boolean}.
```

**Buddy (Phase 2) promptbook** lives in `packages/prompts/buddy/*` with voice‑preserving rules and bible‑citation policy.

---

## 4) Model Router Policy

* **Analyst default:** `gpt-5-mini`. Escalate to `gpt-5` when (a) plot threads > 2, (b) confidence < 0.7, (c) cross‑scene inference required. Cache script context.
* **Buddy default:** `claude-3.7-sonnet` (Phase 2), with `haiku` for quick checks. Token budget per user/month with graceful downgrade.
* Backoff: 429/5xx → exponential retry with jitter (3 attempts). On persistent failure, fall back to summary‑only.
* Cost caps: soft at 70%, hard at 100% (see dashboard spec). Emit `model.invocation` telemetry for every call.

---

## 5) Vibe‑Coding Power Prompts

**Global project context (paste into your AI IDE at project start):**

```
You are coding ScriptyBoy, an AI screenplay analyst + writing buddy. Stack: Next.js + Tailwind + shadcn/ui; API Fastify (TS); BullMQ workers; Postgres; Redis; S3. Follow the OpenAPI in /apps/api/openapi.yaml and types in /packages/core. Use accessibility (WCAG AA) and keyboard shortcuts. For Analyst, call an SDK wrapper `@scriptyboy/llm` with router(modelHints). Never hard‑code API keys; read from env. Write clean, typed code with Zod validation and unit tests. Prefer functional components. When unsure, create an interface and a TODO with a typed stub.
```

**UI vibe brief:**

```
Minimal, editorial UI. Indigo→Teal gradient accents. Rounded-2xl. Cards with soft shadows. Report layout: left scene navigator, middle notes, right fix‑it drawer. Charts: Recharts. Shortcuts: Cmd-K palette; J/K scene nav.
```

---

## 6) .env Template

```
NODE_ENV=development
DATABASE_URL=postgres://user:pass@localhost:5432/scriptyboy
REDIS_URL=redis://localhost:6379
S3_BUCKET=scriptyboy-dev
S3_REGION=us-east-1
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=...
STRIPE_SECRET_KEY=sk_live_...
JWT_SECRET=change_me
NEXTAUTH_SECRET=change_me
HOSTNAME=http://localhost:3000
```

---

## 7) Quality Gates & Guardrails

* **Pre‑commit:** ESLint, Prettier, typecheck, unit tests (`vitest`), commitlint.
* **CI:** Build, test, e2e (`playwright`), Lighthouse CI; block merges on < 90 perf / < 95 a11y.
* **Security:** `npm audit` gate; dependency review; dotenv‑linter; secret scanner; OWASP headers.
* **Content/IP:** Do‑not‑train default ON; retention enforced; no raw content in telemetry.

---

## 8) Dev Scripts (pnpm)

```
pnpm i
pnpm -r build
pnpm dev              # web+api+workers via turbo
pnpm test             # unit tests
pnpm e2e              # playwright against local
pnpm db:migrate       # push SQL
pnpm seed             # load sample Fountain script
```

---

## 9) Sample Fountain (for local dev)

**File:** `seed/sample-short.fountain` (10pp). Includes 3 characters, 8 scenes (INT/EXT mix), 1 night scene, 1 VFX hint, 2 dangling setups for testing notes.

---

## 10) Definition of Done (Phase 1 slices)

* Upload → parse → analysis (coverage + diagnostics + rewrite cards) → export OK in local.
* Evidence linking: clicking a note highlights the exact lines.
* Production heatmap renders and filters rewrite cards.
* Cost telemetry shows in the Ops console for the last run.

---

## 11) Future (Phase 2 hooks)

* Reserve `/buddy/*` endpoints for chat, bible, continuity.
* Add `bible_*` tables (characters, locations, timeline) later; FE sidebar already scaffolded.
