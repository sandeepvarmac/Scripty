# GPT Model Selection Playbook — Summary

- Establishes model routing: gpt-5-mini for high-volume scene taggers, gpt-5 for cross-scene reasoning and coverage prose, gpt-5-thinking for ambiguous structure or legal-adjacent reviews, with optional gpt-5-nano for cheap OCR cleanup.
- Parsing guidance: rely on deterministic parsers for FDX/Fountain; use gpt-5-nano/mini for noisy PDF heading extraction and initial logline/genre guesses; escalate synopses to gpt-5.
- Craft analysis routing: beats/subplots/theme via gpt-5 (escalate to thinking on low confidence), dialogue/scene-level tags via mini, tension waveforms via mini, coverage prose via gpt-5, continuity/legal checks escalate to thinking when needed.
- Feasibility tagging leverages mini for per-scene production flags with optional escalation; exports rely on normalized data with gpt-5 only for narrative prose sections.
- Defines a three-tier cascade (nano/mini → base → thinking), emphasizing structured outputs (JSON schemas), prompt caching, batching, and telemetry of model/tokens/latency.
- Provides parameter presets for common calls (scene taggers, beats, legal review, coverage prose) and orchestration tips for workers, aggregators, and escalations.
