Got it. Below is a precise **gap analysis → change list** to take ScriptyBoy from your current state to the full **Module 1 (MVP)** spec. I’ve organized this by **Data**, **API**, **Workers/Pipeline**, **UI/UX**, **Deliverables/Exports**, **Security/Settings**, **QA**, and **Rollout**. Each item says *what to add or change* and *why*, so nothing is missed.

---

# 1) Data Model Changes (Postgres)

### 1.1 Normalize core analysis outputs (beyond your current `results: Json`)

Add purpose-built tables so charts/filters/export are fast and consistent (keep JSON as source-of-truth, but **materialize** what the UI needs).

**New tables**

* **`elements`** — fine-grained screenplay elements

  ```sql
  create table elements (
    id bigserial primary key,
    scene_id bigint references scenes(id) on delete cascade,
    type text check (type in ('SCENE_HEADING','ACTION','DIALOGUE','PARENTHETICAL','TRANSITION','SHOT')),
    char_name text,              -- for dialogue elements
    text text not null,
    order_index int not null
  );
  create index idx_elements_scene on elements(scene_id);
  ```

  *Why:* You need parentheticals, transitions, shots, and dialogue/action ratios.

* **`beats`** — explicit story beat locations + timing flags

  ```sql
  create table beats (
    id bigserial primary key,
    script_id bigint references scripts(id) on delete cascade,
    kind text check (kind in ('INCITING','ACT1_BREAK','MIDPOINT','LOW_POINT','ACT2_BREAK','CLIMAX','RESOLUTION')),
    page int,
    confidence numeric(4,2),
    timing_flag text check (timing_flag in ('EARLY','ON_TIME','LATE')),  -- vs. page windows
    rationale text
  );
  create index idx_beats_script on beats(script_id);
  ```

* **`notes`** — actionable craft notes (anchor to scene/lines + “Phase 2 apply” hook)

  ```sql
  create table notes (
    id bigserial primary key,
    script_id bigint references scripts(id) on delete cascade,
    severity text check (severity in ('HIGH','MEDIUM','LOW')),
    area text check (area in ('STRUCTURE','CHARACTER','DIALOGUE','PACING','THEME','GENRE','FORMATTING','LOGIC','REPRESENTATION','LEGAL')),
    scene_id bigint references scenes(id),
    page int, line_ref int,
    evidence_id bigint references evidence(id),
    suggestion text,          -- prescriptive fix
    apply_hook jsonb,         -- e.g. { "op":"rewrite", "range": {"sceneId": 12, "from": 3, "to": 7}}
    rule_code text             -- detector id for auditability
  );
  create index idx_notes_script_area on notes(script_id, area);
  ```

* **`scores`** — rubric scores + rationale per category

  ```sql
  create table scores (
    id bigserial primary key,
    script_id bigint references scripts(id) on delete cascade,
    category text check (category in ('STRUCTURE','CHARACTER','DIALOGUE','PACING','THEME','GENRE_FIT','ORIGINALITY','FEASIBILITY')),
    value numeric(3,1) not null,   -- 1–5 or 1–10
    rationale text
  );
  create unique index uq_scores_script_category on scores(script_id, category);
  ```

* **`feasibility_metrics`** — per-scene production signals and complexity scoring

  ```sql
  create table feasibility_metrics (
    id bigserial primary key,
    scene_id bigint references scenes(id) on delete cascade,
    int_ext text check (int_ext in ('INT','EXT','INT/EXT')),
    location text, tod text,                                 -- store slug parts
    has_stunts boolean, has_vfx boolean, has_sfx boolean,
    has_crowd boolean, has_minors boolean, has_animals boolean,
    has_weapons boolean, has_vehicles boolean, has_special_props boolean,
    complexity_score int default 0
  );
  create index idx_feas_scene on feasibility_metrics(scene_id);
  ```

* **`character_scenes`** — presence grid & dialogue stats per scene/character

  ```sql
  create table character_scenes (
    character_id bigint references characters(id) on delete cascade,
    scene_id bigint references scenes(id) on delete cascade,
    lines int default 0, words int default 0, on_page bool default true,
    primary key (character_id, scene_id)
  );
  ```

* **`subplots`** (optional but recommended) — subplot swimlanes

  ```sql
  create table subplots (
    id bigserial primary key,
    script_id bigint references scripts(id) on delete cascade,
    label text, description text
  );
  create table subplot_spans (
    subplot_id bigint references subplots(id) on delete cascade,
    scene_id bigint references scenes(id) on delete cascade,
    role text, -- 'INTRO','DEVELOP','CONVERGE','RESOLVE'
    primary key (subplot_id, scene_id)
  );
  ```

* **`theme_statements`** — inferred theme claims & alignment

  ```sql
  create table theme_statements (
    id bigserial primary key,
    script_id bigint references scripts(id) on delete cascade,
    statement text,
    confidence numeric(4,2)
  );
  create table scene_theme_alignment (
    scene_id bigint references scenes(id) on delete cascade,
    on_theme boolean, rationale text,
    primary key (scene_id)
  );
  ```

* **`risk_flags`** (you can reuse `evidence` but a typed table clarifies LEGAL)

  ```sql
  create table risk_flags (
    id bigserial primary key,
    script_id bigint references scripts(id) on delete cascade,
    scene_id bigint references scenes(id),
    kind text check (kind in ('REAL_PERSON','TRADEMARK','LYRICS','DEFAMATION_RISK','LIFE_RIGHTS')),
    page int, start_line int, end_line int,
    snippet text, confidence numeric(4,2)
  );
  ```

* **`page_metrics`** — basis for pacing histogram, tension waveform, complexity heatmap

  ```sql
  create table page_metrics (
    script_id bigint references scripts(id) on delete cascade,
    page int,
    scene_length_lines int,        -- length of scene crossing the page
    dialogue_lines int, action_lines int,
    tension_score int, complexity_score int,
    primary key (script_id, page)
  );
  ```

**Modify existing tables**

* `scripts` → add:
  `logline text`, `synopsis_short text`, `synopsis_long text`, `genre_override text`, `comps jsonb`
  *Why:* Coverage requires logline, 1p/3p synopses, comps, and user override for genre.
* `scenes` → add parsed slug parts:
  `int_ext text`, `location text`, `tod text`, `page_start int`, `page_end int`
  *Why:* Location breakdown, company moves, INT/EXT, DAY/NIGHT.
* `characters` → add `aliases text[]`
  *Why:* Dialogue attribution stability & alias tracking.
* `evidence` → add `area` and narrow `type` enum if you keep it as your main anchor store.
  *Why:* Filterable notes per craft area and legal.

**Enums to extend**

* `AnalysisType` → ensure `COVERAGE_REPORT`, `COMPREHENSIVE`, and/or `STRUCTURE_ANALYSIS`, `DIALOGUE_QUALITY`, `THEME_ANALYSIS` exist (you already have).
* `EvidenceType` → add `LEGAL_RISK`, `REPRESENTATION`, `SUBPLOT`, `BEAT`, `VFX_SFX_STUNT`, `CONTINUITY`.
* `ProcessingStatus` ✔ (you have).

**Indexes you’ll want**

* `scenes(script_id, pageNumber)`; `elements(scene_id, type)`; `notes(script_id, area, severity)`; `page_metrics(script_id, page)`; `feasibility_metrics(has_vfx, has_stunts, ...)` for dashboard filters.

**TXT support**

* Allow `.txt` in upload validations and parsing (see 3.1).

---

# 2) API Changes (OpenAPI-first)

### 2.1 Upload & parsing

* **`POST /v1/projects/{id}/upload`** (extend): accept `.txt`; handle password-protected PDFs (optional `pdfPassword`). Returns `file_id`, `script_id`.
* **`GET /v1/scripts/{id}/parse-preview`**: pages, scenes, characters, slug parts, quick genre guess.

### 2.2 Dashboard data (normalized)

* **`GET /v1/scripts/{id}/dashboard`** → now returns:

  * `beats[]`, `pageMetrics[]`, `characterPresence[]`, `feasibility[]`, `notes[]`, `scores[]`, `theme[]`, `subplots[]`, `riskFlags[]`.
* **`GET /v1/scenes/{id}`** → include `elements[]`, `feasibility`, and anchored `notes[]`.

### 2.3 Notes & rubric

* **`POST /v1/scripts/{id}/notes`** (bulk upsert) with normalized fields (severity/area/anchors/apply\_hook/rule\_code).
* **`PUT /v1/scripts/{id}/scores`** (bulk set rubric) with {category, value, rationale}.

### 2.4 Feasibility & exports

* **`GET /v1/scripts/{id}/feasibility`**: location breakdown, counts (VFX/SFX/stunts/crowd/minors/animals/vehicles/props), company move estimate.
* **`POST /v1/reports/coverage`** (unchanged conceptually, ensure payload accepts: `passConsiderRecommend`, `comps`, `synopses`).
* **`POST /v1/notes/export`** → PDF & CSV (ensure note anchors + excerpt).
* **`GET /v1/scripts/{id}/finaldraft-change-list`** (best-effort if FDX) — generate FDX-compatible change list where determinable.

### 2.5 Opt-in sensitivity

* **`PATCH /v1/projects/{id}/settings`**: `{ enableSensitivityAnalysis: boolean }`.

---

# 3) Workers & Pipeline Changes

### 3.1 Ingestion/Parsing

* Add **TXT** parser (simple Fountain-like heuristics or explicit TXT mode).
* PDF: add **password support**; **OCR** fallback (only when text layer missing).
* Extract **slug parts** to `scenes` (INT/EXT, location, TOD) and **elements** records.
* Compute **page ranges per scene** and **page\_metrics** (dialogue vs action counts per page).

### 3.2 Core NLP

* **Character coref/aliasing** → populate `characters.aliases[]`, stabilize dialogue attribution.
* **Beat detection** (hybrid): sequence-aware LLM summary per scene + rules for page windows → write `beats` with `timing_flag`.
* **Subplot clustering**: topic modeling + character co-occurrence → `subplots` + `subplot_spans`.
* **Theme/stakes**: infer `theme_statements`, and `scene_theme_alignment.on_theme`.
* **Pacing/tension**: compute `tension_score` (per scene/page) and store in `page_metrics`.
* **Feasibility** tagging: detect stunts/VFX/SFX/crowd/minors/animals/weapons/vehicles/special props → `feasibility_metrics`.
* **Risk/Legal-adjacent**: pattern and LLM-aided detection → `risk_flags` (note: present as non-legal advice).

### 3.3 Notes & Rubric

* Generate **`notes`** with severity/area, evidence anchors, **prescriptive suggestions**, and **apply\_hook** metadata (Phase 2).
* Calculate **rubric `scores`** with short evidence blurbs.

### 3.4 Idempotency & versioning

* Use `scripts.sha256` to **skip duplicate analyses**.
* On new upload: **inherit settings** (genre override, sensitivity) from project.
* Run pipeline in steps: sanitize → parse → normalize → detectors → scoring → assets → persist (transaction).

---

# 4) UI/UX Changes

### 4.1 Upload

* Enforce **Project-first** (you already do). Add: `.txt` type, **password-protected PDF** prompt.
* Stage labels already match; include **“OCR pass”** indicator when used.

### 4.2 Parser Preview

* Split view: script preview + **parse summary** (pages, scenes, characters, INT/EXT, locations, TOD).
* Editable **genre override** and **logline** before running full analysis.

### 4.3 Analysis Dashboard Tabs (ensure all)

* **Coverage**: logline, 1p/3p synopses, comps (non-copyright names only), strengths/risks, **Pass/Consider/Recommend** slider.
* **Craft** subpanels:

  * *Structure & Beats*: beat timeline (+ early/late flags), **subplot swimlanes**.
  * *Conflict & Theme*: **Objective/Obstacle/Outcome** per scene table, theme alignment meter, **stakes escalation** curve.
  * *Dialogue*: on-the-nose/exposition flags, voice distinctiveness, **inline alts** preview.
  * *World & Logic*: continuity (time/place/props/tech/jargon), **Setup↔Payoff** matrix, chronology/geography checks.
  * *Genre & Market*: convention coverage, tone dial, originality freshness, comps list.
  * *Formatting*: lint (slugline, ALL-CAPS intros, parentheticals, camera directions), **1p≈1min** heuristic, typos, name casing.
  * *Sensitivity* (opt-in): inclusive-language flags, stereotype heuristics, Bechdel-type signals.
  * *Risk Flags*: real-person, trademark/brand, lyrics/poetry, defamation cues, life-rights mentions (with disclaimers).
* **Characters**: presence heatmap (from `character_scenes`), relationship graph, arc card, dialogue attribution stability.
* **Pacing**: scene length histogram (outliers), dialogue/action ratio per act/sequence, **tension waveform** (from `page_metrics`).
* **Feasibility**: INT/EXT, DAY/NIGHT counts, unique locations, **VFX/SFX/stunts/crowd/minors/animals/vehicles/props** tallies, **complexity heatmap**.
* **Notes**: filter by severity/area, inline anchors (scroll to scene/line), **bulk export**, and **Phase 2 apply-ready** metadata.
* **Exports**: Coverage PDF, Notes PDF, CSV/JSON, FDX change list (if available).

### 4.4 Accessibility

* Ensure charts/tabs/tables have ARIA labelling and keyboard focus; maintain color contrast with the theme you adopted.

---

# 5) Deliverables & Exporters

* **Coverage PDF generator** (WeasyPrint/Playwright): include logline, comps, synopses, strengths/risks, **Pass/Consider/Recommend**.
* **Notes PDF** (prioritized High/Med/Low; include excerpt + anchor).
* **CSV/JSON** exports for: `scenes`, `elements`, `beats`, `notes`, `feasibility_metrics`, `scores`, `page_metrics`, `character_scenes`.
* **FDX change list** exporter (best-effort; when source is FDX and diffs are attributable).

---

# 6) Security / Settings / Plans

* **Project setting**: `enableSensitivityAnalysis` (default off) to gate that panel & processing.
* **Legal disclaimers**: label Risk Flags outputs as **non-legal advice**.
* **Quota**: decrement `analysesUsed` per full analysis run; free quick analysis configurable.

---

# 7) QA & Acceptance Criteria (sample)

* **Parsing**: FDX/Fountain/PDF/TXT all ingest; scenes have correct `int_ext/location/tod`; elements typed.
* **Beats**: each of the 7 beats present or explicitly “not found”; `timing_flag` set per page windows (e.g., inciting 10–15 in a 110p).
* **Subplots**: at least 1 subplot lane; intro/converge/resolve scenes marked.
* **Characters**: alias detection merges consistently; presence heatmap sums match scene counts.
* **Pacing**: histogram & tension waveform reflect `page_metrics`.
* **Feasibility**: flags per scene match scripted cues; complexity heatmap populated.
* **Dialogue**: on-the-nose/exposition flags include line anchors and at least one **alt** suggestion.
* **Formatting**: slugline/ALL-CAPS/parenthetical/camera direction issues listed with fixes.
* **Theme/Stakes**: theme statements present; stakes curve has no broken segments.
* **Sensitivity (opt-in)**: only runs/appears when enabled.
* **Risk Flags**: present with anchors and confidence.
* **Rubric**: 8 categories scored with short rationale.
* **Deliverables**: Coverage PDF & Notes CSV/PDF download, FDX change list endpoint resolves (when eligible).

---

# 8) Rollout & Migration Plan

1. **DB migrations**: add new tables/columns (as above). Backfill existing scripts with:

   * slug parts from stored content;
   * initial `page_metrics` (approx by splitting on pages);
   * provisional beats (if previously computed in JSON).
2. **Workers**: deploy new detectors in feature-flag mode.
3. **API**: version `/v1` responses to include normalized structures; maintain backward-compatible JSON for a deprecation window.
4. **UI**: ship tabs/subpanels incrementally (hide empty ones).
5. **QA**: run on a gold set of scripts; verify acceptance above.
6. **Docs**: update user-facing help (what each chart means; opt-in sensitivity; risk flags disclaimer).

---

## Quick checklist (copy/paste for Jira)

* [ ] Add tables: `elements`, `beats`, `notes`, `scores`, `feasibility_metrics`, `character_scenes`, `subplots` + `subplot_spans`, `theme_statements` + `scene_theme_alignment`, `risk_flags`, `page_metrics`.
* [ ] Extend `scripts`, `scenes`, `characters` columns; widen `EvidenceType`.
* [ ] Upload: allow `.txt`; support PDF password; surface OCR runs.
* [ ] Pipeline: slug parse, elements, page metrics, beat timing flags, subplot clustering, theme/stakes, feasibility tags, risk flags, notes with apply hooks, rubric scores.
* [ ] Dashboard: all panels + charts enumerated above; sensitivity gated.
* [ ] Exports: coverage PDF, notes PDF/CSV, JSON/CSV for all datasets, FDX change list.
* [ ] Security/compliance text; plan quota enforcement.
* [ ] QA suite & gold scripts; telemetry for false-positive appeals.

If you want, I can generate **DDL migration files**, **OpenAPI schema diffs**, and a **sample JSON payload** for `/v1/scripts/{id}/dashboard` reflecting the new normalized shape.
