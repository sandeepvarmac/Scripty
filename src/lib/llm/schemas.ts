/**
 * JSON Schemas for Structured Outputs with LLM Router
 * Based on MVP requirements and Ready-to-use Schema Pack
 */

export const BeatSchema = {
  title: "Beat",
  type: "object",
  properties: {
    kind: {
      type: "string",
      enum: ["OPENING_IMAGE","INCITING_INCIDENT","PLOT_POINT_1","MIDPOINT","PLOT_POINT_2","CLIMAX","RESOLUTION"]
    },
    page: { type: "integer", minimum: 1 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    timingFlag: { type: "string", enum: ["EARLY","ON_TIME","LATE","UNKNOWN"] },
    content: { type: "string" }
  },
  required: ["kind","page","confidence"],
  additionalProperties: false
} as const;

export const NoteSchema = {
  title: "Note",
  type: "object",
  properties: {
    severity: { type: "string", enum: ["HIGH","MEDIUM","LOW"] },
    area: {
      type: "string",
      enum: ["STRUCTURE","CHARACTER","DIALOGUE","PACING","THEME","GENRE","FORMATTING","LOGIC","REPRESENTATION","LEGAL"]
    },
    sceneId: { type: "integer", minimum: 1 },
    page: { type: "integer", minimum: 1 },
    lineRef: { type: "integer", minimum: 1 },
    excerpt: { type: "string" },
    suggestion: { type: "string" },
    applyHook: {
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
    ruleCode: { type: "string" }
  },
  required: ["severity","area"],
  additionalProperties: false
} as const;

export const RiskFlagSchema = {
  title: "RiskFlag",
  type: "object",
  properties: {
    category: {
      type: "string",
      enum: ["CONTENT_WARNING","LEGAL_CONCERN","CULTURAL_SENSITIVITY","TECHNICAL_COMPLEXITY","BUDGET_RISK","MARKET_RISK"]
    },
    severity: { type: "string", enum: ["HIGH","MEDIUM","LOW"] },
    description: { type: "string" },
    mitigation: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 }
  },
  required: ["category","severity","description","confidence"],
  additionalProperties: false
} as const;

export const ScoreSchema = {
  title: "Score",
  type: "object",
  properties: {
    category: {
      type: "string",
      enum: ["STRUCTURE","CHARACTER","DIALOGUE","PACING","THEME","GENRE","OVERALL"]
    },
    value: { type: "number", minimum: 0, maximum: 10 },
    reasoning: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 }
  },
  required: ["category","value","reasoning","confidence"],
  additionalProperties: false
} as const;

export const FeasibilityMetricSchema = {
  title: "FeasibilityMetric",
  type: "object",
  properties: {
    category: {
      type: "string",
      enum: ["LOCATION_COMPLEXITY","CAST_SIZE","SPECIAL_EFFECTS","STUNTS_ACTION","WARDROBE_MAKEUP","EQUIPMENT_NEEDS","POST_PRODUCTION"]
    },
    value: { type: "number", minimum: 0, maximum: 10 },
    reasoning: { type: "string" },
    budgetImpact: { type: "string", enum: ["HIGH","MEDIUM","LOW"] },
    complexity: { type: "string", enum: ["HIGH","MEDIUM","LOW"] }
  },
  required: ["category","value","reasoning","budgetImpact","complexity"],
  additionalProperties: false
} as const;

export const ThemeStatementSchema = {
  title: "ThemeStatement",
  type: "object",
  properties: {
    statement: { type: "string" },
    evidence: { type: "string" },
    strength: { type: "string", enum: ["STRONG","MODERATE","WEAK"] },
    thematicElements: { type: "array", items: { type: "string" } }
  },
  required: ["statement","evidence","strength","thematicElements"],
  additionalProperties: false
} as const;

export const SubplotSchema = {
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
  title: "PageMetric",
  type: "object",
  properties: {
    page: { type: "integer", minimum: 1 },
    sceneLengthLines: { type: "integer", minimum: 0 },
    dialogueLines: { type: "integer", minimum: 0 },
    actionLines: { type: "integer", minimum: 0 },
    tensionScore: { type: "number", minimum: 0, maximum: 10 },
    complexityScore: { type: "number", minimum: 0, maximum: 10 }
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