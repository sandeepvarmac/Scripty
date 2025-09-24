# Next Level Enhancements — Summary

- Defines the full Module 1 (MVP) scope: upload → AI analysis → dashboards → exports, all with anchored evidence and optional sensitivity panels.
- Data layer must expand beyond JSON blobs: new tables for elements, beats, notes, scores, feasibility metrics, character_scenes, subplots/spans, theme statements/alignment, risk flags, page metrics; extend scripts/scenes/characters/evidence with coverage fields and slug metadata.
- API roadmap adds /v1 endpoints for upload, parse preview, normalized dashboards, scene detail, notes bulk upsert, score updates, feasibility snapshot, coverage and notes exports, and FDX change list; contracts must follow Ready-to-use schemas.
- Worker pipeline staged as sanitize → parse → normalize → detectors → scoring → assets → persist → notify, with GPT-5 model routing (mini/base/thinking) and structured outputs plus idempotency via script SHA.
- UI overhaul: project-first home, upload wizard with OCR signal, parser preview with editable metadata, multi-tab dashboards (Coverage, Craft, Characters, Pacing, Feasibility, Notes, Exports) using Recharts, accessible tabs, filters, anchors, and export controls.
- Deliverables include coverage PDF, notes PDF/CSV, JSON/CSV data dumps, and FDX change list. Risk/sensitivity outputs require opt-in toggles and disclaimers; quotas decrement on analysis runs.
- QA expectations cover parsing accuracy, beat timing flags, subplot swimlanes, presence grids, pacing charts, feasibility heatmaps, dialogue flags, formatting lint, theme/stakes tracking, gated sensitivity, rubric scores, and downloadable deliverables.
- Rollout steps: run DB migrations/backfill, deploy workers behind feature flags, version APIs, stage UI panels, execute gold-script QA, update docs/help. Includes Jira-style checklist of required work items.
