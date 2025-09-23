/**
 * JSON Schemas for Structured Outputs with LLM Router
 * Based on MVP requirements and Ready-to-use Schema Pack
 */

export const BeatSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://scriptyboy.ai/schemas/beat.schema.json",
  title: "Beat",
  type: "object",
  properties: {
    kind: {
      type: "string",
      enum: ["INCITING","ACT1_BREAK","MIDPOINT","LOW_POINT","ACT2_BREAK","CLIMAX","RESOLUTION"]
    },
    page: { type: "integer", minimum: 1 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    timing_flag: { type: "string", enum: ["EARLY","ON_TIME","LATE","UNKNOWN"] },
    rationale: { type: "string" }
  },
  required: ["kind","page","confidence"],
  additionalProperties: false
} as const;

export const NoteSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://scriptyboy.ai/schemas/note.schema.json",
  title: "Note",
  type: "object",
  properties: {
    severity: { type: "string", enum: ["HIGH","MEDIUM","LOW"] },
    area: {
      type: "string",
      enum: ["STRUCTURE","CHARACTER","DIALOGUE","PACING","THEME","GENRE","FORMATTING","LOGIC","REPRESENTATION","LEGAL"]
    },
    scene_id: { type: "integer", minimum: 1 },
    page: { type: "integer", minimum: 1 },
    line_ref: { type: "integer", minimum: 1 },
    excerpt: { type: "string" },
    suggestion: { type: "string" },
    apply_hook: {
      type: "object",
      properties: {
        op: { type: "string", enum: ["rewrite","trim","move","replace","insert"] },
        range: {
          type: "object",
          properties: {
            sceneId: { type: "integer", minimum: 1 },
            from: { type: "integer", minimum: 0 },
            to: { type: "integer", minimum: 0 }
          },
          required: ["sceneId"],
          additionalProperties: false
        }
      },
      required: ["op"],
      additionalProperties: false
    },
    rule_code: { type: "string" }
  },
  required: ["severity","area"],
  additionalProperties: false
} as const;

export const RiskFlagSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://scriptyboy.ai/schemas/risk-flag.schema.json",
  title: "RiskFlag",
  type: "object",
  properties: {
    kind: {
      type: "string",
      enum: ["REAL_PERSON","TRADEMARK","LYRICS","DEFAMATION_RISK","LIFE_RIGHTS"]
    },
    scene_id: { type: "integer", minimum: 1 },
    page: { type: "integer", minimum: 1 },
    start_line: { type: "integer", minimum: 1 },
    end_line: { type: "integer", minimum: 1 },
    snippet: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    notes: { type: "string" }
  },
  required: ["kind","confidence"],
  additionalProperties: false
} as const;

export const ScoreSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://scriptyboy.ai/schemas/score.schema.json",
  title: "Score",
  type: "object",
  properties: {
    category: {
      type: "string",
      enum: ["STRUCTURE","CHARACTER","DIALOGUE","PACING","THEME","GENRE_FIT","ORIGINALITY","FEASIBILITY"]
    },
    value: { type: "number", minimum: 0, maximum: 10 },
    rationale: { type: "string" }
  },
  required: ["category","value"],
  additionalProperties: false
} as const;

export const FeasibilityMetricSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://scriptyboy.ai/schemas/feasibility-metric.schema.json",
  title: "FeasibilityMetric",
  type: "object",
  properties: {
    scene_id: { type: "integer", minimum: 1 },
    int_ext: { type: "string", enum: ["INT","EXT","INT/EXT"] },
    location: { type: "string" },
    tod: { type: "string" },
    has_stunts: { type: "boolean" },
    has_vfx: { type: "boolean" },
    has_sfx: { type: "boolean" },
    has_crowd: { type: "boolean" },
    has_minors: { type: "boolean" },
    has_animals: { type: "boolean" },
    has_weapons: { type: "boolean" },
    has_vehicles: { type: "boolean" },
    has_special_props: { type: "boolean" },
    complexity_score: { type: "integer", minimum: 0, maximum: 10 }
  },
  required: ["scene_id"],
  additionalProperties: false
} as const;

export const ThemeStatementSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://scriptyboy.ai/schemas/theme-statement.schema.json",
  title: "ThemeStatement",
  type: "object",
  properties: {
    statement: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 }
  },
  required: ["statement","confidence"],
  additionalProperties: false
} as const;

export const SubplotSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://scriptyboy.ai/schemas/subplot.schema.json",
  title: "Subplot",
  type: "object",
  properties: {
    label: { type: "string" },
    description: { type: "string" }
  },
  required: ["label"],
  additionalProperties: false
} as const;

export const PageMetricSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://scriptyboy.ai/schemas/page-metric.schema.json",
  title: "PageMetric",
  type: "object",
  properties: {
    page: { type: "integer", minimum: 1 },
    scene_length_lines: { type: "integer", minimum: 0 },
    dialogue_lines: { type: "integer", minimum: 0 },
    action_lines: { type: "integer", minimum: 0 },
    tension_score: { type: "integer", minimum: 0, maximum: 10 },
    complexity_score: { type: "integer", minimum: 0, maximum: 10 }
  },
  required: ["page"],
  additionalProperties: false
} as const;

// Array schemas for batch operations
export const BeatListSchema = {
  type: "array",
  items: BeatSchema
} as const;

export const NoteListSchema = {
  type: "array",
  items: NoteSchema
} as const;

export const RiskFlagListSchema = {
  type: "array",
  items: RiskFlagSchema
} as const;

export const ScoreListSchema = {
  type: "array",
  items: ScoreSchema
} as const;