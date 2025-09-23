here’s a model-selection playbook mapped to your Module-1 build so you know exactly which GPT-5 variant to call and when, with params and fallbacks. I’m assuming you’ll orchestrate via the Responses (or Chat Completions) API with Structured Outputs, prompt caching, and Batch where noted. (All three are supported by GPT-5 family.) 
OpenAI

TL;DR (default choices)

Per-scene, high-volume classifiers & tags → gpt-5-mini

Cross-scene/story reasoning (beats, theme, logic) → gpt-5

Hard cases (ambiguous structure, legal-adjacent flags) → gpt-5-thinking (raise reasoning_effort)

Ultra-cheap bulk passes / prefilters → gpt-5-nano (optional) 
OpenAI
+1

1) Ingestion & Parsing (A)

Goal: deterministic structure with light LLM help only where heuristics/OCR fail.

Task	Call granularity	Model	Key params	Why / notes
FDX/Fountain → normalized JSON	None (no LLM)	—	—	Use native parsers; reserve LLM for PDF/TXT only.
PDF without text layer (OCR cleanup / line joining)	Page or scene	gpt-5-nano	response_format (structured JSON); low max_output_tokens	Cheap cleanup of OCR artifacts; deterministic schema. 
OpenAI

INT/EXT, LOC, TOD extraction (from headings)	Scene heading	gpt-5-nano ➜ fallback gpt-5-mini	response_format with enum validation	Mostly rules; LLM covers noisy headings. 
OpenAI

Logline (first draft) + genre guess	Script	gpt-5-mini	verbosity:"medium"; response_format	Fast, good-enough draft; user can override later. 
OpenAI

Synopsis (1-pager / 3-pager)	Script	gpt-5	verbosity:"high"; stream	Longer, coherent prose benefits from the larger model. 
OpenAI
2) Craft & Story Analysis (B)
Structure & Beats

Beat detection & timing flags (inciting → resolution): gpt-5, escalate to gpt-5-thinking when confidence low; set reasoning_effort:"medium"→"high" for tough drafts. Use Structured Outputs with a strict schema: { kind, page, confidence, timing_flag, rationale }. 
OpenAI
+1

Subplot mapping (swimlanes): gpt-5 over scene summaries (which you can pre-generate with gpt-5-mini). 
OpenAI

Character & Arc

Arc descriptors, goal/stakes/agency, antagonistic force: gpt-5 on the whole script (or per-act batches with prompt caching).

Dialogue attribution stability (aliases/pronouns): gpt-5-mini per character; escalate only for conflicts. 
OpenAI

Conflict, Stakes, Theme

Objective/Obstacle/Outcome tagging (scene table): gpt-5-mini scene-level; batch.

Theme claims + on-theme drift: gpt-5 (cross-scene reasoning).

Stakes escalation curve: compute numerically from tags; use gpt-5-mini to rate “stakes intensity” per scene. 
OpenAI

Pacing & Rhythm

Scene length outliers, dialogue/action ratio: analytic (no LLM).

Tension waveform: gpt-5-mini per scene to assign a 1–5 tension score; smooth across pages. 
OpenAI

Dialogue Quality

On-the-nose / exposition dump / repetition: gpt-5-mini per scene (cheap); escalate borderline to gpt-5.

Suggested alts (trim/subtext/buttons): gpt-5 with style anchors; cap max_output_tokens. 
OpenAI

World-Building & Logic

Continuity (time/place/props/tech) & setup↔payoff matrix: gpt-5 (needs global memory).

Chronology & geography sanity: gpt-5-thinking only when contradictions detected (expensive but reliable). 
OpenAI

Genre & Market

Convention checklist & tone consistency: gpt-5-mini per scene + roll-up.

Originality/freshness notes & non-copyright comps: gpt-5 to craft nuanced prose. 
OpenAI

Formatting & Readability

Slug/ALL-CAPS/parentheticals/camera dir: rules (no LLM) + gpt-5-nano for fuzzy cases.

Typos/name casing: rules; gpt-5-nano for ambiguous name unification.

Sensitivity & Representation (opt-in)

Inclusive-language flags / stereotype heuristics / Bechdel-type signals: gpt-5-mini batched; gate behind project setting. 
OpenAI

Risk & Legal-Adjacent (non-advice)

Real person / brand / lyrics / defamation cues / life-rights: Start with pattern match; escalate flagged snippets to gpt-5-thinking for context-aware judgement. Use Structured Outputs with explicit fields: {kind, page, span, snippet, confidence}. 
OpenAI

3) Production Feasibility Snapshot (C)

INT/EXT, DAY/NIGHT, unique sets, company moves: parsed slugs + analytics (no LLM).

Stunts, SFX/VFX, crowd, minors/animals, weapons/vehicles, special props: gpt-5-mini per scene tagger; escalate uncertain cases to gpt-5; compute complexity_score and heatmap from tags. 
OpenAI

4) Deliverables (D)

Coverage PDF (logline, comps, synopses, strengths/risks, Pass/Consider/Recommend): generate prose with gpt-5 (set verbosity:"high"); keep notes & metrics sourced from normalized tables. 
OpenAI

Notes deck: write short, prescriptive edits with gpt-5 only for items that require English fluency; otherwise dump detector output directly.

Exports (JSON/CSV): no LLM; the LLM only produced normalized rows upstream.

5) Rubric Scoring (E)

Final 8-category rubric: gpt-5 with Structured Outputs and per-category rationales. If any category has low evidence density (few notes) or model confidence dips, one targeted gpt-5-thinking pass over the relevant scenes only. 
OpenAI

6) Orchestration patterns (how to keep it fast & cheap)

Three-tier cascade

Tier A (cheap, parallel): gpt-5-nano / gpt-5-mini over scenes for tags (dialogue issues, tension 1–5, feasibility booleans).

Tier B (selective deepening): gpt-5 only for scripts/scenes with conflicts or cross-scene needs (beats, theme, logic).

Tier C (escalate on demand): gpt-5-thinking on small extracts (e.g., 2–4 scenes surrounding a contradiction or a potential legal flag). 
OpenAI
+1

Prompt caching & shared system prompts
Cache your long, unchanging instructions (style guide, schemas). This materially cuts cost/latency on repeat runs. 
OpenAI

Structured Outputs everywhere
Require strict JSON schemas for beats, notes, risk_flags, etc., so the UI never parses free-form text. (Supported by GPT-5 responses.) 
OpenAI

Batch API for overnight runs
Queue Comprehensive Analyses for many projects via Batch to lower cost and avoid rate-limit bursts (supported with GPT-5). 
OpenAI

7) Practical parameter presets (copy/paste)

Scene taggers (cheap pass)
model: "gpt-5-mini", reasoning_effort:"low", temperature:0.2, response_format:{type:"json_schema", schema:SceneTagsSchema} 
OpenAI

Beats & subplots (cross-scene)
model: "gpt-5", reasoning_effort:"medium", temperature:0.3, response_format:{...BeatSchema} 
OpenAI

Logic contradictions / legal-adjacent review
model: "gpt-5-thinking", reasoning_effort:"high", temperature:0.1, response_format:{...RiskSchema} 
OpenAI

Coverage prose (synopses + strengths/risks)
model: "gpt-5", verbosity:"high", temperature:0.6 
OpenAI

8) Where each model slots into your pipeline

Workers → Detectors: run mini/nano first; write normalized rows (elements, page_metrics, feasibility_metrics, etc.).

Workers → Aggregators: promote to gpt-5 for beats, theme, subplot, and rubric; update beats, theme_statements, scores.

Workers → Escalations: call gpt-5-thinking only on flagged spans to finalize risk_flags, tricky chronology, or contested beat placement.

Exports: render PDFs/CSVs from tables; only gpt-5 writes narrative prose sections.

Notes on availability & names

In API you’ll see gpt-5, gpt-5-mini, gpt-5-nano (general) and gpt-5-thinking variants for deeper reasoning; all work with Responses/Chat Completions, support Structured Outputs, parallel tool calling, prompt caching, and Batch. 
OpenAI
+1