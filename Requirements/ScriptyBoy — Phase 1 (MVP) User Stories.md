# ScriptyBoy — Phase 1 (MVP) User Stories

**Scope:** Upload screenplay → AI Analyst (ChatGPT family) generates an explainable, scene‑anchored coverage report with rewrite cards, production heatmap, exports, and subscription/billing. Privacy by default. Modern, accessible web UI.

**Guiding Principles**

* Analyst uses latest ChatGPT models (router: GPT‑5 mini → escalate to GPT‑5 on low confidence).
* Evidence‑first: every note ties to scene & line offsets.
* Ship iteratively with visible value each sprint.
* Affordability + margin: prompt caching, selective escalation, and cost telemetry.

---

## Sprint 0 — Foundations (Brand, Scaffolding, Auth, Plans)

### FE‑01: App shell & design system

**As a** visitor **I want** a fast, modern UI **so that** I trust uploading my work.

* **Description:** Next.js + Tailwind + shadcn/ui; layout (sidebar, main, right drawer), Inter/Geist typography, dark mode, WCAG AA.
* **Acceptance:**

  * Lighthouse perf ≥ 90, a11y ≥ 95.
  * Keyboard navigation (Tab/Shift+Tab), focus rings visible.
  * Responsive at 360–1440px.

### FE‑02: Branding

**As a** user **I want** clear branding **so that** the app feels professional.

* **Description:** Use “ScriptyBoy” name, favicon, provided SVG icon/wordmark; gradient accent (Indigo→Teal).
* **Acceptance:**

  * App shows favicon, logo in header, wordmark on marketing and auth screens.

### FE‑03: Auth & onboarding

**As a** writer **I want** sign‑in and onboarding **so that** I can start quickly.

* **Description:** Email/pass + OAuth (Google/Apple), magic‑link optional; onboarding wizard (privacy toggle default ON).
* **Acceptance:**

  * Sign‑up/in/out works; sessions persist; CSRF protection.
  * Onboarding stores preferences (privacy, retention window).

### BE‑01: Project skeleton & CI/CD

**As a** dev **I want** stable environments **so that** I can release safely.

* **Description:** Monorepo (web, api, workers), containerized; dev/stage/prod; CI (tests, lint), CD with blue/green.
* **Acceptance:**

  * Push to main → stage deploy; tag → prod deploy.
  * Error monitoring and tracing hooked up.

### BE‑02: Auth service & RBAC

**As a** platform **I want** secure auth **so that** data is protected.

* **Description:** JWT sessions, OAuth providers, role: user, admin; org/team ready.
* **Acceptance:**

  * JWT rotation, refresh; rate limits; audit log of auth events.

### BE‑03: Billing & plans (Solo/Pro/Showrunner)

**As a** business **I want** subscriptions **so that** usage is gated and monetizeable.

* **Description:** Stripe billing, metered usage per analysis; Free/Solo/Pro/Showrunner with monthly analysis quotas & overage.
* **Acceptance:**

  * Plan purchase/upgrade/downgrade/cancel works.
  * Quotas enforced; overage charges applied; proration correct.

---

## Sprint 1 — Upload & Parsing

### FE‑10: Upload flow

**As a** writer **I want** to upload FDX/Fountain/PDF **so that** I can analyze any script.

* **Description:** Drag‑and‑drop + resumable upload; progress bar; file validation; privacy toggle reminder.
* **Acceptance:**

  * Accepts .fdx, .fountain, .pdf (≤ 10MB MVP); shows page count & format.
  * Network drop → resumes; cancel supported.

### BE‑10: Parser service & scene graph

**As a** system **I want** to parse scripts into structured data **so that** analysis is accurate.

* **Description:** Convert FDX/Fountain/PDF→ scenes, beats (heuristics), characters, locations, timeline; line offsets.
* **Acceptance:**

  * ≥ 95% of scene headings recognized in FDX and Fountain test corpus.
  * PDF OCR fallback; confidence per block; store source offsets.

### BE‑11: Evidence store

**As a** system **I want** to index offsets **so that** notes can highlight exact lines.

* **Description:** Persist scene/line maps; search by character/location; versioned per upload.
* **Acceptance:**

  * Given a note id → API returns exact text span, scene id.

---

## Sprint 2 — Coverage Report (Auto‑generated)

### FE‑20: Report shell & navigation

**As a** user **I want** a clean report view **so that** I can skim or deep‑dive.

* **Description:** Left scene navigator; center report sections; right fix‑it drawer.
* **Acceptance:**

  * Sticky TOC; smooth scroll to sections; deep links.

### BE‑20: Analyst orchestration (ChatGPT)

**As a** system **I want** to generate coverage content **so that** users get instant value.

* **Description:** Router uses GPT‑5 mini; selective escalation to GPT‑5; prompt caching for script context.
* **Acceptance:**

  * Produces: logline options (3), 1‑page synopsis, 2‑page beat sheet, genre/subgenre tags.
  * P95 latency ≤ 45s for 110pp feature on cached re‑runs.

### FE‑21: Synopsis & beats rendering

**As a** user **I want** readable summaries **so that** I understand the story quickly.

* **Acceptance:**

  * Collapsible sections; copy buttons; “feedback” thumbs per section.

---

## Sprint 3 — Explainable Craft Notes & Rewrite Cards

### BE‑30: Craft diagnostics

**As a** system **I want** scene‑anchored diagnostics **so that** notes are actionable.

* **Description:** Pacing (scene length deltas), character goals/agency, dialogue distinctiveness (per‑character embeddings), dangling setups/payoffs, clarity/readability metrics.
* **Acceptance:**

  * Each diagnostic returns (type, severity, evidence spans, suggested rewrite prompt seeds).

### BE‑31: Rewrite card generator

**As a** system **I want** to produce fix‑it cards **so that** writers can accept/reject changes.

* **Description:** For each issue: root cause, 1–3 patterns, before/after diff candidate(s), ripple risk.
* **Acceptance:**

  * At least one diff suggestion per critical issue; JSON schema validated.

### FE‑30: Notes UI with highlights

**As a** writer **I want** to see highlights in context **so that** I trust the feedback.

* **Acceptance:**

  * Selecting a note highlights exact lines; tooltips show severity & rationale.

### FE‑31: Accept/Reject diffs

**As a** writer **I want** to apply suggestions **so that** I can iterate quickly.

* **Acceptance:**

  * Inline diff viewer; Accept→ creates a new script version; Undo available.

---

## Sprint 4 — Production‑Aware Heatmap (Budget Signals)

### BE‑40: Production heuristics

**As a** system **I want** to detect likely cost drivers **so that** writers can plan rewrites.

* **Description:** INT/EXT, locations, company moves, night shoots, crowd/VFX indicators; score per scene; heatmap.
* **Acceptance:**

  * Heuristic score 0–100; API returns top 10 costly scenes with reasons.

### FE‑40: Heatmap visualization

**As a** user **I want** a heatmap **so that** I can see budget pressure at a glance.

* **Acceptance:**

  * Chart per scene; clicking a bar filters related rewrite cards.

---

## Sprint 5 — Exports, Sharing, and Quotas

### BE‑50: Exporters (PDF, FDX comments, CSV)

**As a** user **I want** to export reports and notes **so that** I can share and edit offline.

* **Acceptance:**

  * PDF report branded; FDX with inline notes; CSV of notes with fields (scene, type, severity, span, suggestion).

### FE‑50: Share links & watermark

**As a** user **I want** secure share links **so that** I control access.

* **Acceptance:**

  * Links expire; viewer role; watermark on Free tier.

### BE‑51: Quota enforcement & overage

**As a** business **I want** fair usage **so that** margins stay healthy.

* **Acceptance:**

  * Analysis decrements quota; overage billed; usage dashboard per user.

---

## Sprint 6 — Privacy, Retention, and Cost Telemetry

### BE‑60: Privacy controls & retention

**As a** user **I want** “do not train” and auto‑deletion **so that** my IP is safe.

* **Acceptance:**

  * Training opt‑out default ON; retention window (30/90/custom); deletion purge job verified.

### BE‑61: Cost & token telemetry

**As a** business **I want** to see LLM costs **so that** pricing is sustainable.

* **Acceptance:**

  * Per‑step token counts, cached vs non‑cached, model selection; per‑user cost rollups.

### FE‑60: Settings & audit log

**As a** user **I want** to view data events **so that** I have transparency.

* **Acceptance:**

  * Audit entries for uploads, analyses, exports, deletions.

---

## Sprint 7 — Polish & Readiness

### FE‑70: Keyboard & power‑user features

**As a** returning user **I want** shortcuts **so that** I move faster.

* **Acceptance:**

  * Cmd‑K palette, J/K scene nav, slash‑to‑search characters/locations.

### BE‑70: Rate limits & abuse prevention

**As a** platform **I want** resilience **so that** service is stable.

* **Acceptance:**

  * Per‑IP and per‑user rate limits; circuit breaker on model escalations.

### BE‑71: Observability SLOs

**As a** business **I want** uptime and latency SLOs **so that** users trust us.

* **Acceptance:**

  * Error budget dashboard; alerting; runbooks.

---

## Non‑functional Requirements

* P95 analysis latency ≤ 60s for a 110pp feature (cached second pass ≤ 30s).
* Data encrypted in transit and at rest; secrets in KMS; least‑privilege IAM.
* A11y: Screen reader labels for all controls; color contrast AA.

---

## Out‑of‑Scope (Phase 1)

* Long‑running chat sessions (Buddy).
* Cross‑episode continuity.
* Human coverage marketplace.

---

## Success Metrics (Phase 1)

* Upload→first value < 2 minutes for 80% of users.
* ≥ 40% click “Accept” for at least one rewrite card on first script.
* Free→Paid conversion ≥ 6% in first 30 days.
