# Production-ready PostgreSQL DDL — Summary

- Provides transactional UP/DOWN migrations with idempotent enum creation and schema changes aligning to Module 1 requirements.
- UP migration: creates enums (beat_kind, timing_flag, note_severity, note_area, int_ext_enum, risk_kind, subplot_role, score_category); extends scripts/scenes/characters/evidence with coverage, slug, alias, and area columns.
- Adds new tables: elements, beats, notes, scores, feasibility_metrics, character_scenes, subplots, subplot_spans, theme_statements, scene_theme_alignment, risk_flags, page_metrics; includes indices, uniqueness, and timestamp trigger for notes.
- DOWN migration cleanly drops triggers, tables, columns, and enums in dependency order.
- Highlights referential actions (ON DELETE CASCADE / SET NULL) and index strategy to support dashboard queries.
