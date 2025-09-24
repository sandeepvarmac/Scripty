# ScriptyBoy — Phase 2 (Screenwriting Buddy) User Stories

**Scope:** Conversational writing companion powered by the latest Claude models. Persists a Show Bible, maintains continuity across episodes/seasons, performs voice‑preserving rewrites, runs what‑if “story surgery,” produces pitch materials, and supports collaboration and (optional) human‑reader marketplace. Designed to create clear upgrade value for Pro/Showrunner tiers.

**Model policy:** Buddy = Claude (router: Haiku → Sonnet → Opus on demand). Analyst (GPT) from Phase 1 remains available but Buddy is the default in chat. Prompt caching, long‑context streaming, and strict privacy.

**Iterative plan:** Sprints build from core chat + memory → show bible → rewrites → continuity → simulators → pitch → collaboration → marketplace → polish.

---

## Sprint 0 — Buddy Foundations

### FE‑P2‑01: Buddy chat shell

**As a** writer **I want** a focused chat canvas **so that** I can iterate quickly.

* **Description:** Split layout: chat center, Show Bible sidebar (collapsed by default), action bar (Rewrite, Summarize, Simulate).
* **Acceptance:**

  * Streaming responses, markdown + code‑style blocks for scene diffs.
  * Keyboard: ↑ to edit last prompt, Cmd+Enter to send.

### BE‑P2‑01: Claude integration & router

**As a** system **I want** Claude API integration **so that** Buddy can respond with low latency and controlled cost.

* **Description:** Model router (Haiku default; escalate to Sonnet when tasks tagged complex; Opus manual override). Prompt caching and per‑session token caps.
* **Acceptance:**

  * P95 first token < 1.5s (Haiku), < 3s (Sonnet) in staging.
  * Hard stop at 80% of monthly token budget per user; graceful warnings.

### BE‑P2‑02: Session memory & safety

**As a** system **I want** scoped conversation memory **so that** context persists safely.

* **Description:** Per‑project memory store (episodic, season, global); redaction of PII on ingest; jailbreak/abuse filters; privacy = do‑not‑train enforced.
* **Acceptance:**

  * Memory add/get APIs; redaction logs; moderation blocks disallowed requests; audit trail.

---

## Sprint 1 — Show Bible (V1) & Import

### FE‑P2‑10: Show Bible sidebar

**As a** show creator **I want** a living bible **so that** Buddy stays consistent.

* **Description:** Tabs: Characters, Locations, Timeline, Themes. Inline add/edit; quick link to scene evidence.
* **Acceptance:**

  * Create/edit/delete entries; diff history; search in ≤ 50ms locally.

### BE‑P2‑10: Bible builder & Phase‑1 import

**As a** system **I want** to bootstrap the bible **so that** I don’t start from scratch.

* **Description:** Import entities from Phase‑1 parse (characters/locations/timeline); auto‑summaries; relationship graph.
* **Acceptance:**

  * ≥ 95% of main characters auto‑extracted on standard FDX corpus.
  * Graph API returns neighbors (who talks to whom, where, when).

### FE‑P2‑11: Inline citations to evidence

**As a** writer **I want** citations for bible facts **so that** I trust the data.

* **Acceptance:**

  * Hover reveals scene & line offsets; click scrolls to script extract.

---

## Sprint 2 — Voice‑Preserving Rewrites (Characters & Scenes)

### BE‑P2‑20: Character voice profiles

**As a** system **I want** per‑character style models **so that** rewrites keep the same voice.

* **Description:** Build embeddings + few‑shot exemplars per character; store stylistic traits (cadence, formality, slang).
* **Acceptance:**

  * API returns 3 alt lines per request with style score ≥ 0.8 similarity vs baseline (cosine or classifier).

### FE‑P2‑20: “Suggest alt lines” quick action

**As a** writer **I want** alt dialogue **so that** I can explore options.

* **Acceptance:**

  * Select a line → panel shows 3 alts with tone tags; Accept inserts; Undo reverts.

### BE‑P2‑21: Scene‑level rewrite engine

**As a** system **I want** coherent scene rewrites **so that** I can improve beats without losing intent.

* **Description:** Guardrailed prompts: respect constraints (characters present, time/place, budget flags); output diff‑able scene text.
* **Acceptance:**

  * Structural invariants preserved 95% of time in test set; violations surfaced with warnings.

### FE‑P2‑21: Side‑by‑side diff (scene)

**As a** user **I want** a diff view **so that** I can evaluate quickly.

* **Acceptance:**

  * Inline additions/deletions; hotkeys \[A]ccept, \[R]eject, \[C]omment.

---

## Sprint 3 — Continuity & Arc Tracking

### BE‑P2‑30: Continuity watchdog

**As a** system **I want** to detect inconsistencies **so that** the story stays coherent.

* **Description:** Rules + LLM checks for ages, props, injuries, timing, costume, names; cross‑episode references; A/B/C plot separation.
* **Acceptance:**

  * Emits issues with evidence; precision ≥ 0.85 on regression suite; false positives flagged for learning.

### FE‑P2‑30: Continuity board

**As a** showrunner **I want** a kanban of continuity issues **so that** I can triage.

* **Acceptance:**

  * Columns: New, In Review, Fixed; drag to resolve; link to auto‑rewrite suggestions.

### BE‑P2‑31: Arc visualizer API

**As a** system **I want** character/plot arcs **so that** pacing can be managed.

* **Description:** Compute emotional valence/agency per scene; output arc points.
* **Acceptance:**

  * Arc data exposed as time‑series; FE chart consumes with tooltips.

---

## Sprint 4 — What‑If Simulator

### FE‑P2‑40: Simulator panel

**As a** creator **I want** sliders/toggles **so that** I can test variants.

* **Description:** Controls: Stakes ↑/↓, POV swap, reduce budget pressure, merge locations; constraints picker.
* **Acceptance:**

  * Running a simulation spawns scenario cards with predicted impacts on arcs, runtime, budget heatmap.

### BE‑P2‑40: Scenario engine

**As a** system **I want** constrained rewrites **so that** proposals are feasible.

* **Description:** Apply constraints to scenes; recalc production heuristics; compute delta vs baseline.
* **Acceptance:**

  * Returns ≤ 3 viable scenarios with diffs + score (Impact × Effort × Cost).

---

## Sprint 5 — Pitch Materials

### BE‑P2‑50: Pitch pack generator

**As a** writer **I want** loglines/synopses/query letters **so that** I can pitch quickly.

* **Description:** Templates with tone variants (gritty, quirky, prestige); pulls facts from bible; avoids spoilers on request.
* **Acceptance:**

  * Generates: 6 logline variants, 1‑page synopsis, 200‑word summary, query letter draft; export API.

### FE‑P2‑50: Pitch workspace

**As a** user **I want** edit‑and‑export tools **so that** I can polish.

* **Acceptance:**

  * Rich‑text editor with version history; export PDF/Docx; brandable cover.

---

## Sprint 6 — Collaboration & Teams

### BE‑P2‑60: Projects & roles

**As a** team **I want** roles **so that** collaboration is safe.

* **Description:** Roles: Owner, Writer, Reader; permissions on chat, bible, rewrites, exports.
* **Acceptance:**

  * Invitation flow; SSO option for Studio plan; audit entries on role changes.

### FE‑P2‑60: Real‑time presence & comments

**As a** team **I want** to comment and see who’s here **so that** we coordinate.

* **Acceptance:**

  * Presence avatars; inline comments on lines/scenes; @mention notifications; resolve threads.

### BE‑P2‑61: Versioning & branching

**As a** team **I want** branches **so that** we can explore directions.

* **Description:** Lightweight git‑like branches for scripts/bible; merge with conflict UI.
* **Acceptance:**

  * Create/merge/delete branches; conflict markers; history retains provenance.

---

## Sprint 7 — Human Coverage Marketplace (Optional)

### BE‑P2‑70: Vendor onboarding & escrow

**As a** platform **I want** readers onboarded **so that** users can buy human notes.

* **Description:** Reader profiles, NDAs, pricing; Stripe Connect escrow/split.
* **Acceptance:**

  * Order → escrow → delivery → release; refunds flow; tax forms captured.

### FE‑P2‑70: Buy coverage flow

**As a** writer **I want** to pick a reader **so that** I get tailored notes.

* **Acceptance:**

  * Filters (genre, price, turnaround); upload share controls; delivery inbox.

---

## Sprint 8 — Value Analytics & Upsell UX

### BE‑P2‑80: Value metrics

**As a** business **I want** proof of value **so that** upgrades feel obvious.

* **Description:** Track accepted rewrites, continuity fixes, cost‑pressure reduction, pitch pack exports.
* **Acceptance:**

  * Metrics API; cohort dashboard; per‑user “value bar.”

### FE‑P2‑80: Smart upsell

**As a** user **I want** relevant upgrade prompts **so that** I understand benefits.

* **Acceptance:**

  * Non‑intrusive nudges when hitting limits (Buddy chat, simulations, team seats) with clear ROI stats.

---

## Sprint 9 — Hardening & Scale

### BE‑P2‑90: Cost governance for Buddy

**As a** platform **I want** predictable spend **so that** gross margin holds.

* **Description:** Per‑feature token budgets; fallbacks to summaries; nightly cost reports.
* **Acceptance:**

  * No user exceeds monthly budget without consent; automated alerts at 70/90%.

### BE‑P2‑91: Reliability & latency SLOs

**As a** platform **I want** fast chats **so that** users stay engaged.

* **Acceptance:**

  * P95 round‑trip < 6s (Haiku) / < 12s (Sonnet); error budget tracked.

### FE‑P2‑90: Accessibility polish

**As a** user **I want** inclusive design **so that** the tool is usable by all.

* **Acceptance:**

  * Screen reader labels for all interactive elements; reduced‑motion mode; high‑contrast theme.

---

## Subscription Feature Mapping (Upgrade Path Clarity)

* **Free:** Buddy chat (50 turns/mo), Bible read‑only, 3 alt‑line requests/day, watermark on exports.
* **Solo (\$12/mo):** Unlimited Bible entries, 10 scene rewrites/mo, 1 simulation scenario/day, pitch pack basic.
* **Pro (\$29/mo):** Unlimited scene rewrites, continuity watchdog, 5 simulations/day, pitch pack pro, branches, value analytics.
* **Showrunner (\$59/mo):** Unlimited simulations, arc visualizer, team collaboration (5 seats), SSO option add‑on, marketplace discounts.
* **Studio (Custom):** SSO, seat management, higher SLAs, private model endpoints.

---

## Non‑Functional Requirements (Phase 2)

* **Privacy:** Data encrypted; do‑not‑train enforced; retention windows configurable per project.
* **Explainability:** All Buddy outputs cite bible facts or script spans where applicable.
* **Performance:** Chat streaming start < 3s (Sonnet) on median; all UI interactions at 60fps on modern laptops.
* **Observability:** Trace all Buddy calls with model, tokens, latency; cost per user per feature.

---

## Success Metrics (Phase 2)

* ≥ 50% of active users accept ≥ 2 Buddy rewrites per week.
* Continuity issues resolved per project ≥ 10 in first month of Series users.
* Pitch pack export rate ≥ 30% of Pro+ users monthly.
* Free→Pro conversion uplift ≥ +4pp vs Phase‑1‑only baseline.

---

## Out‑of‑Scope (Phase 2)

* Fully automated scheduling/budgeting for production (keep heuristics only).
* Casting/ROI prediction beyond directional guidance.
