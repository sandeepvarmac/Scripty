ROLE: Principal Engineer & Delivery Lead for ScriptyBoy Module 1 (MVP)

HARD CONSTRAINT — REQUIREMENTS WHITELIST
You MUST read and rely ONLY on the following six files under ./requirements.
Do not open, cite, or use ANY other file in ./requirements. If a needed section
is missing in these six, STOP and report the gap with file+line pointers.

ALLOWED FILES (and ONLY these):
1) ./requirements/Next Level Enhancements.md
2) ./requirements/Implementation Plan for Next Level Enhancements.md
3) ./requirements/GPT Model Selection Playbook.md
4) ./requirements/Ready to use Scheme pack.md
5) ./requirements/production-ready PostgreSQL DDL.md
6) ./requirements/ScriptyBoy Analysis Core DDL, Prisma & Sample Data.md

TOP-LEVEL GOAL
Implement Module 1 (MVP): AI-Powered Screenplay Analyst end-to-end so a user can:
1) Create project → upload script (PDF/FDX/Fountain/TXT) → auto-parse & validate
2) Run analysis → studio-style coverage, actionable notes, feasibility snapshot
3) View dashboards (beats, pacing, character presence, complexity heatmap)
4) Export coverage PDF, notes PDF/CSV, JSON/CSV, and FDX change list (if available)
5) All outputs anchored to scene/page/line; sensitivity & legal-adjacent panels are opt-in/non-advice

SOURCE OF TRUTH (READ FIRST)
- “Next Level Enhancements.md” — strategic features/gaps
- “Implementation Plan for Next Level Enhancements.md” — work breakdown
- “GPT Model Selection Playbook.md” — when to use gpt-5 / mini / thinking
- “Ready to use Scheme pack.md” — JSON Schemas for beats/notes/risk/etc.
- “production-ready PostgreSQL DDL.md” — SQL DDL & constraints
- “ScriptyBoy Analysis Core DDL, Prisma & Sample Data.md” — Prisma schema, migrations, seeds, dashboard payload

DELIVERABLES (produce ALL)
A) DATABASE & PRISMA
- Merge Prisma models/enums for: elements, beats, notes, scores, feasibility_metrics, character_scenes,
  subplots & subplot_spans, theme_statements, scene_theme_alignment, risk_flags, page_metrics.
- Extend existing tables: scripts (logline, synopsis_short/long, genre_override, comps),
  scenes (int_ext, location, tod, page_start/end), characters (aliases[]), evidence (area).
- Referential actions: ON UPDATE CASCADE; ON DELETE as specified (CASCADE or SET NULL).
- Prisma migration(s) under prisma/migrations with idempotent SQL, reflecting production-ready PostgreSQL DDL.
- Seed script prisma/seed.ts that inserts realistic demo data aligned to the sample dashboard payload.

B) BACK-END API (OpenAPI-first)
- Endpoints under /v1:
  - POST /projects/:id/upload               → accept .pdf/.fdx/.fountain/.txt; optional pdfPassword; returns { file_id, script_id }
  - GET  /scripts/:id/parse-preview         → pages, scenes, characters, slug parts, quick genre guess
  - GET  /scripts/:id/dashboard             → normalized aggregates for beats, pageMetrics, characterPresence,
                                              feasibility, notes, scores, theme, subplots, riskFlags
  - GET  /scenes/:id                        → elements[], feasibility, anchored notes[]
  - POST /scripts/:id/notes                 → bulk upsert (severity/area/anchors/apply_hook/rule_code)
  - PUT  /scripts/:id/scores                → bulk set rubric
  - GET  /scripts/:id/feasibility           → location breakdown & category counts + company move estimate
  - POST /reports/coverage                  → payload supports pass/consider/recommend, comps, synopses
  - POST /notes/export                      → PDF & CSV (with anchors/excerpts)
  - GET  /scripts/:id/finaldraft-change-list → best-effort if FDX
- Provide openapi.yaml and request/response validators. Enforce schemas from “Ready to use Scheme pack.md”.

C) WORKERS & PIPELINE
- Stages: sanitize → parse → normalize → detectors → scoring → assets → persist → notify (SSE or events).
- LLM router per “GPT Model Selection Playbook.md”:
  - Tier A: gpt-5-mini for high-volume scene taggers (dialogue issues, tension scores, feasibility booleans).
    gpt-5-nano allowed for OCR cleanup/fuzzy headings.
  - Tier B: gpt-5 for beats, subplots, theme, cross-scene logic; coverage prose.
  - Tier C: gpt-5-thinking escalation for ambiguous structure/chronology or legal-adjacent context review.
- All LLM calls use Structured Outputs with the schemas from “Ready to use Scheme pack.md”.
- Idempotency with scripts.sha256; inherit project settings (e.g., enableSensitivityAnalysis).

D) FRONT-END (Next.js + Tailwind + shadcn/ui)
- Home (project-first): “New project” CTA; recent projects grid.
- Upload wizard (project picker → drag-drop → progress stages; show OCR indicator when used).
- Parser preview (split view + editable genre override, logline).
- Analysis Dashboard tabs/panels as specified; charts with Recharts:
  Coverage, Craft (Structure & Beats, Conflict & Theme, Dialogue, World & Logic, Genre & Market,
  Formatting, Sensitivity*, Risk Flags), Characters, Pacing, Feasibility, Notes, Exports.
- Notes table: filters (area/severity), anchors (scene/page/line), bulk export.
- Exports page: Coverage PDF, Notes PDF/CSV, JSON/CSV, FDX change list (if available).
- Accessibility: ARIA labeling for tabs/tables/charts; AA contrast using the provided color theme.
(*Sensitivity panel strictly opt-in.)

E) EXPORTS & ASSETS
- Coverage PDF via Playwright/WeasyPrint: logline, 1p/3p synopses, strengths/risks, pass/consider/recommend.
- Notes PDF & CSV: include severity/area + excerpt + anchors.
- JSON/CSV exports: scenes, elements, beats, notes, feasibility_metrics, scores, page_metrics, character_scenes.
- Store under: s3://.../projects/{projectId}/scripts/{scriptId}/reports/...

F) SECURITY, SETTINGS, OBSERVABILITY
- Project setting enableSensitivityAnalysis to gate Sensitivity panel and processing.
- Risk Flags labeled as “non-legal advice”.
- Quotas: decrement analysesUsed for comprehensive runs; configurable for quick analysis.
- Telemetry: per-call model, tokens, latency, escalation reason; traces around each detector step.

G) QA & ACCEPTANCE
- Gold script tests: ensure 7 beats found or explicitly “not found”; timing flags within windows.
- Schema validation for every Structured Output.
- E2E happy path: new project → upload → analysis → dashboards → exports.
- Parsers unit tests; API contract tests; worker detectors tests.
- Definition of Done (below) must pass.

COMMIT & PR CADENCE (MANDATORY)
GIT BRANCH
- Work on: feat/mvp-module1
- If not on this branch: `git checkout -B feat/mvp-module1`

COMMIT LOOP (run after each numbered milestone or subtask)
1) Lint/tests:
   - npm run lint && npm run test -- --updateSnapshot || true
2) Stage & commit (Conventional Commits):
   - git add -A
   - git commit -m "<type>(<scope>): <short summary>"
     Types: feat, fix, refactor, chore, docs, test, perf, build, ci
     Scopes: db, api, worker, ui, export, infra, schema, router
3) Push:
   - git push -u origin feat/mvp-module1

PR CREATION (small, atomic; include screenshots/GIFs for UI)
- If GitHub CLI is available:
  - gh pr create --fill --head feat/mvp-module1 --base main
  - gh pr view --web

PR MILESTONES (one PR each)
1) prisma schema + migration + seed
   Examples:
   - feat(db): add beats/notes/scores/feasibility tables with cascades
   - feat(db): extend scripts/scenes/characters (logline, slug parts, aliases)
   - chore(seed): add sample feature script + dashboard payload

2) OpenAPI + server routes
   - feat(api): /v1/scripts/:id/dashboard + schema validation
   - feat(api): upload + parse-preview with pdfPassword support
   - docs(api): add openapi.yaml and examples

3) worker pipeline + llm router
   - feat(worker): llmRouter mini→gpt-5→thinking with Structured Outputs
   - feat(worker): scene taggers (tension/feasibility)
   - feat(worker): beats/subplots/theme; rubric scorer

4) UI dashboard tabs + charts
   - feat(ui): tabs (Coverage/Craft/Characters/Pacing/Feasibility/Notes/Exports)
   - feat(ui): Recharts (beat map, pacing hist, presence grid, complexity heatmap)
   - feat(ui): notes table with filters and anchors

5) exports (PDF/CSV/JSON/FDX)
   - feat(export): coverage PDF + notes PDF/CSV
   - feat(export): JSON/CSV dumps
   - feat(export): FDX change list (best-effort)

6) QA tests + docs
   - test(worker): gold-script assertions for beats/timing flags
   - test(api): contract tests for dashboard payload
   - docs: add PLAN.md, runbook, env vars

GIT IDENTITY (if needed)
- git config user.name  "ScriptyBoy Bot"
- git config user.email "bot@scriptyboy.local"

EXECUTION PLAN
1) READ ONLY the six files listed in “ALLOWED FILES”. Summarize each to /docs/summaries/*.md.
   Commit: docs: summarize requirements
2) DB/Prisma
   - Implement Prisma schema & enums to match DDL.
   - Create migration(s), apply locally, and run seed.
   - Add npm scripts: migrate:dev, prisma:seed, db:reset.
3) Back-end
   - Author openapi.yaml.
   - Implement routes/controllers with schema validation and SSE/events for progress.
4) Workers
   - Implement llmRouter (mini/base/thinking) + Structured Outputs using provided JSON Schemas.
   - Implement detectors: beats, subplot clustering, theme/stakes, dialogue issues, feasibility flags, risk flags.
   - Compute rubric scores.
5) Front-end
   - Pages: /, /projects/new, /projects/[id], /scripts/[id], /scenes/[id], /exports
   - Components: charts (beat map, hist, ratios, presence grid, complexity heatmap), notes table with filters/anchors.
6) Exports
   - PDF renderers (Playwright/WeasyPrint), CSV/JSON builders, FDX change list.
7) QA
   - Add fixtures; run CI; fix regressions.
8) Final polish
   - A11y sweep, error/empty states, toasts, skeletons.
   - Update README with runbook & feature list.

DEFINITION OF DONE (ALL TRUE)
- ✅ Upload supports .pdf/.fdx/.fountain/.txt with progress; OCR indicator when used.
- ✅ Parser preview shows pages/scenes/characters + INT/EXT/location/TOD; user can edit genre/logline.
- ✅ Dashboard tabs fully populated from normalized tables (no free-form parsing in UI).
- ✅ Coverage PDF & Notes CSV/PDF downloadable; JSON/CSV exports complete; FDX change list when source is FDX.
- ✅ Beats include timing flags vs. page windows; subplot swimlanes present.
- ✅ Notes carry severity/area, anchors (scene/page/line), suggestion text, apply_hook metadata.
- ✅ Feasibility metrics + complexity heatmap; pacing histogram; character presence grid; tension waveform.
- ✅ Sensitivity panel runs ONLY when enabled; Risk Flags panel includes non-legal advice disclaimer.
- ✅ Tests pass; gold set assertions green; telemetry recorded (model/tokens/latency/escalations).
- ✅ README updated; PLAN.md posted; small, atomic PRs merged to main.

IF ANY REQUIRED SECTION IS MISSING/CONTRADICTORY IN THE SIX FILES
- Stop and emit a short report with affected file names and line ranges, and propose the minimal diff to reconcile. Do not proceed until resolved.

BEGIN NOW
1) Confirm presence of ONLY the six whitelisted files in ./requirements.
2) Read and summarize each; then open PR #1 with Prisma schema + migration + seed.
3) Continue with milestones in order, committing after each subtask per COMMIT LOOP.
