/**
 * LLM Router with Tiered Model Selection
 * Implements gpt-5-mini → gpt-5 → gpt-5-thinking escalation strategy
 * Based on MVP requirements and GPT Model Selection Playbook
 */

import OpenAI from "openai";
import {
  BeatSchema,
  NoteSchema,
  RiskFlagSchema,
  ScoreSchema,
  BeatListSchema,
  NoteListSchema,
  RiskFlagListSchema,
  ScoreListSchema
} from "./schemas";

// Environment configuration
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  organization: process.env.OPENAI_ORG
});

// Model definitions
export const MODELS = {
  nano: "gpt-4o-mini", // Using available model as placeholder for gpt-5-nano
  mini: "gpt-4o-mini", // Using available model as placeholder for gpt-5-mini
  base: "gpt-4o",      // Using available model as placeholder for gpt-5
  thinking: "gpt-4o"   // Using available model as placeholder for gpt-5-thinking
} as const;

export type ModelKey = keyof typeof MODELS;

// Escalation thresholds
export const THRESHOLDS = {
  // Confidence thresholds for escalation
  escalateToBase: 0.65,
  escalateToThinking: 0.50,

  // Ambiguity signals
  beatDisagreementPages: 6,
  conflictingFlags: true
};

// Policy configuration
export type AnalysisPolicy = {
  sensitivityEnabled: boolean;
  alwaysThinkingForLegal?: boolean;
  enableBatchProcessing?: boolean;
  maxRetries?: number;
};

// Domain types
export type Beat = {
  kind: "INCITING" | "ACT1_BREAK" | "MIDPOINT" | "LOW_POINT" | "ACT2_BREAK" | "CLIMAX" | "RESOLUTION";
  page: number;
  confidence: number;
  timing_flag?: "EARLY" | "ON_TIME" | "LATE" | "UNKNOWN";
  rationale?: string;
};

export type Note = {
  severity: "HIGH" | "MEDIUM" | "LOW";
  area: "STRUCTURE" | "CHARACTER" | "DIALOGUE" | "PACING" | "THEME" | "GENRE" | "FORMATTING" | "LOGIC" | "REPRESENTATION" | "LEGAL";
  scene_id?: number;
  page?: number;
  line_ref?: number;
  excerpt?: string;
  suggestion?: string;
  apply_hook?: {
    op: "rewrite" | "trim" | "move" | "replace" | "insert";
    range: {
      sceneId: number;
      from?: number;
      to?: number;
    };
  };
  rule_code?: string;
};

export type RiskFlag = {
  kind: "REAL_PERSON" | "TRADEMARK" | "LYRICS" | "DEFAMATION_RISK" | "LIFE_RIGHTS";
  scene_id?: number;
  page?: number;
  start_line?: number;
  end_line?: number;
  snippet?: string;
  confidence: number;
  notes?: string;
};

export type Score = {
  category: "STRUCTURE" | "CHARACTER" | "DIALOGUE" | "PACING" | "THEME" | "GENRE_FIT" | "ORIGINALITY" | "FEASIBILITY";
  value: number;
  rationale?: string;
};

// Telemetry tracking
export type LLMCall = {
  model: ModelKey;
  tokens: number;
  latency: number;
  escalationReason?: string;
  confidence?: number;
  timestamp: Date;
};

export class LLMTelemetry {
  private calls: LLMCall[] = [];

  recordCall(call: LLMCall) {
    this.calls.push(call);
  }

  getStats() {
    const totalCalls = this.calls.length;
    const totalTokens = this.calls.reduce((sum, call) => sum + call.tokens, 0);
    const avgLatency = this.calls.reduce((sum, call) => sum + call.latency, 0) / totalCalls;

    const modelStats = this.calls.reduce((stats, call) => {
      stats[call.model] = (stats[call.model] || 0) + 1;
      return stats;
    }, {} as Record<ModelKey, number>);

    const escalations = this.calls.filter(call => call.escalationReason).length;

    return {
      totalCalls,
      totalTokens,
      avgLatency,
      modelStats,
      escalations,
      escalationRate: escalations / totalCalls
    };
  }
}

export const telemetry = new LLMTelemetry();

// Core helper: call with structured JSON Schema outputs
async function callStructured<T>({
  model,
  systemPrompt,
  userContent,
  schemaName,
  schema,
  maxOutputTokens = 1500,
  temperature,
  retries = 2
}: {
  model: ModelKey;
  systemPrompt: string;
  userContent: string | Array<{ scene_id: number; text: string }>;
  schemaName: string;
  schema: object;
  maxOutputTokens?: number;
  temperature?: number;
  retries?: number;
}): Promise<T> {
  const input = typeof userContent === "string"
    ? userContent
    : JSON.stringify(userContent);

  const modelTemperature = temperature ?? (model === "mini" || model === "nano" ? 0.2 : 0.3);

  let lastError: Error | null = null;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: MODELS[model],
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: schemaName,
            schema,
            strict: true
          }
        },
        max_tokens: maxOutputTokens,
        temperature: modelTemperature
      });

      const latency = Date.now() - startTime;
      const tokens = response.usage?.total_tokens || 0;

      // Record telemetry
      telemetry.recordCall({
        model,
        tokens,
        latency,
        timestamp: new Date()
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in response");
      }

      return JSON.parse(content) as T;
    } catch (error) {
      lastError = error as Error;
      console.warn(`LLM call attempt ${attempt + 1} failed:`, error);

      if (attempt === retries) {
        break;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  throw lastError || new Error("All LLM call attempts failed");
}

// Router functions implementing tiered escalation

/**
 * Route beat detection with escalation logic
 * Tier B (gpt-5) → Tier C (gpt-5-thinking) for ambiguous cases
 */
export async function routeBeats({
  sceneSummaries,
  pageCount,
  genre,
  policy
}: {
  sceneSummaries: Array<{ scene_id: number; page: number; summary: string }>;
  pageCount: number;
  genre?: string;
  policy: AnalysisPolicy;
}): Promise<Beat[]> {
  const systemPrompt = `You are a professional story analyst specializing in screenplay structure.

Identify the 7 key story beats with precise page numbers:
- INCITING: The catalyst that starts the story
- ACT1_BREAK: Commitment to the journey (around page 25)
- MIDPOINT: Major revelation or shift (around page 55)
- LOW_POINT: Darkest moment (around page 75)
- ACT2_BREAK: Final push decision (around page 90)
- CLIMAX: Final confrontation (around page 100-110)
- RESOLUTION: Story conclusion

For each beat, provide:
- Exact page number where it occurs
- Confidence score (0-1) based on how clearly defined it is
- Timing flag vs. expected windows
- Brief rationale for your choice

${genre ? `Consider genre conventions for ${genre}.` : ''}

Return JSON only, matching the exact schema.`;

  // First attempt with gpt-5 (cross-scene reasoning)
  let beats = await callStructured<Beat[]>({
    model: "base",
    systemPrompt,
    userContent: JSON.stringify({ pageCount, genre, sceneSummaries }),
    schemaName: "BeatList",
    schema: BeatListSchema
  });

  // Check for escalation conditions
  const avgConfidence = beats.reduce((sum, beat) => sum + (beat.confidence || 0), 0) / Math.max(beats.length, 1);

  const incitingPage = beats.find(b => b.kind === "INCITING")?.page || 0;
  const midpointPage = beats.find(b => b.kind === "MIDPOINT")?.page || pageCount / 2;
  const isAmbiguous = Math.abs(incitingPage - midpointPage) < THRESHOLDS.beatDisagreementPages;

  if (avgConfidence < THRESHOLDS.escalateToThinking || isAmbiguous) {
    // Escalate to gpt-5-thinking for deeper reasoning
    const escalationReason = avgConfidence < THRESHOLDS.escalateToThinking
      ? "low_confidence"
      : "ambiguous_structure";

    beats = await callStructured<Beat[]>({
      model: "thinking",
      systemPrompt: systemPrompt + `

ESCALATION: Previous analysis had ${escalationReason}.
Carefully reason through each beat choice step by step.
If uncertain between options, choose the single best page per beat.
Avoid duplicates and ensure logical progression.`,
      userContent: JSON.stringify({
        pageCount,
        genre,
        sceneSummaries,
        previousBeats: beats
      }),
      schemaName: "BeatList",
      schema: BeatListSchema
    });

    // Record escalation in telemetry
    telemetry.recordCall({
      model: "thinking",
      tokens: 0, // Will be updated by callStructured
      latency: 0, // Will be updated by callStructured
      escalationReason,
      confidence: avgConfidence,
      timestamp: new Date()
    });
  }

  return beats;
}

/**
 * Route note generation with cheap-first strategy
 * Tier A (gpt-5-mini) → Tier B (gpt-5) for borderline cases
 */
export async function routeNotes({
  flaggedSpans,
  policy
}: {
  flaggedSpans: Array<{
    scene_id: number;
    page: number;
    line_ref: number;
    excerpt: string;
    area: string;
    heuristicConfidence: number;
  }>;
  policy: AnalysisPolicy;
}): Promise<Note[]> {
  const systemPrompt = `You are a professional script analyst generating actionable craft notes.

Create prescriptive, specific suggestions for improving the screenplay.
Focus on:
- Clear, actionable advice
- Anchored locations (scene/page/line)
- Professional tone
- Constructive suggestions

For each note, provide severity based on impact:
- HIGH: Major structural or character issues
- MEDIUM: Notable craft improvements needed
- LOW: Minor polish suggestions

Return JSON only matching the schema.`;

  // Cheap pass: high-confidence items with gpt-5-mini
  const highConfidence = flaggedSpans.filter(span => span.heuristicConfidence >= THRESHOLDS.escalateToBase);

  const miniNotes = highConfidence.length > 0 ? await callStructured<Note[]>({
    model: "mini",
    systemPrompt,
    userContent: highConfidence,
    schemaName: "NoteList",
    schema: NoteListSchema,
    maxOutputTokens: 1200
  }) : [];

  // Escalate borderline items to gpt-5 for better analysis
  const borderline = flaggedSpans.filter(span => span.heuristicConfidence < THRESHOLDS.escalateToBase);

  const baseNotes = borderline.length > 0 ? await callStructured<Note[]>({
    model: "base",
    systemPrompt: systemPrompt + "\n\nThese are borderline cases requiring careful analysis.",
    userContent: borderline,
    schemaName: "NoteList",
    schema: NoteListSchema,
    maxOutputTokens: 1500
  }) : [];

  return [...miniNotes, ...baseNotes];
}

/**
 * Route risk flag detection with policy-aware escalation
 * Always escalates to gpt-5-thinking for legal-adjacent content
 */
export async function routeRiskFlags({
  candidates,
  policy
}: {
  candidates: Array<{ scene_id: number; page: number; snippet: string; context?: string }>;
  policy: AnalysisPolicy;
}): Promise<RiskFlag[]> {
  const systemPrompt = `You are a content analyst identifying potential legal-adjacent risks in screenplay content.

IMPORTANT DISCLAIMER: This analysis does not constitute legal advice. Consult qualified legal counsel for definitive guidance.

Detect these risk categories:
- REAL_PERSON: References to real, identifiable people
- TRADEMARK: Brand names, company names, products
- LYRICS: Song lyrics or musical content
- DEFAMATION_RISK: Potentially defamatory content
- LIFE_RIGHTS: Biographical elements requiring rights

For each risk, provide:
- Confidence score (0-1) based on how clearly it represents a risk
- Specific snippet and location
- Brief notes on why it's flagged

Return JSON only matching the schema.`;

  // Model selection based on policy
  const model: ModelKey = policy.alwaysThinkingForLegal ? "thinking" : "base";

  let flags = await callStructured<RiskFlag[]>({
    model,
    systemPrompt,
    userContent: candidates,
    schemaName: "RiskFlagList",
    schema: RiskFlagListSchema,
    maxOutputTokens: 1200
  });

  // Check for low confidence flags requiring escalation
  const hasLowConfidence = flags.some(flag => (flag.confidence || 0) < THRESHOLDS.escalateToThinking);

  if (hasLowConfidence && model !== "thinking") {
    // Re-evaluate low-confidence items with thinking model
    const lowConfidenceIndexes = flags
      .map((flag, index) => ({ flag, index }))
      .filter(({ flag }) => (flag.confidence || 0) < THRESHOLDS.escalateToThinking)
      .map(({ index }) => index);

    const lowConfidenceCandidates = lowConfidenceIndexes.map(i => candidates[i]).filter(Boolean);

    if (lowConfidenceCandidates.length > 0) {
      const revisedFlags = await callStructured<RiskFlag[]>({
        model: "thinking",
        systemPrompt: systemPrompt + "\n\nRe-evaluate these cases with careful reasoning about risk levels.",
        userContent: lowConfidenceCandidates,
        schemaName: "RiskFlagList",
        schema: RiskFlagListSchema,
        maxOutputTokens: 1200
      });

      // Replace low-confidence flags with revised analysis
      let revisedIndex = 0;
      flags = flags.map((flag, index) => {
        if (lowConfidenceIndexes.includes(index)) {
          return revisedFlags[revisedIndex++] || flag;
        }
        return flag;
      });

      telemetry.recordCall({
        model: "thinking",
        tokens: 0,
        latency: 0,
        escalationReason: "low_confidence_risk",
        timestamp: new Date()
      });
    }
  }

  return flags;
}

/**
 * Route rubric scoring with comprehensive analysis
 * Uses gpt-5 for cross-category reasoning, escalates on low evidence
 */
export async function routeRubricScoring({
  analysisData,
  policy
}: {
  analysisData: {
    beats: Beat[];
    notes: Note[];
    pageCount: number;
    genre?: string;
    synopsis?: string;
  };
  policy: AnalysisPolicy;
}): Promise<Score[]> {
  const systemPrompt = `You are a professional script evaluator providing comprehensive rubric scores.

Score each category from 0-10 with specific rationale:

STRUCTURE (0-10): Beat placement, pacing, three-act structure
CHARACTER (0-10): Development, goals, stakes, agency
DIALOGUE (0-10): Naturalism, subtext, voice differentiation
PACING (0-10): Scene rhythm, momentum, tension curves
THEME (0-10): Clarity, integration, thematic resonance
GENRE_FIT (0-10): Convention adherence, audience expectations
ORIGINALITY (0-10): Fresh elements, unique perspective
FEASIBILITY (0-10): Production complexity, budget considerations

Base scores on provided analysis data. Be specific in rationales.

Return JSON only matching the schema.`;

  const scores = await callStructured<Score[]>({
    model: "base",
    systemPrompt,
    userContent: JSON.stringify(analysisData),
    schemaName: "ScoreList",
    schema: ScoreListSchema,
    maxOutputTokens: 2000
  });

  // Check for categories with insufficient evidence (few notes in that area)
  const notesByArea = analysisData.notes.reduce((acc, note) => {
    acc[note.area] = (acc[note.area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const lowEvidenceCategories = scores.filter(score => {
    const relatedNotes = notesByArea[score.category] || 0;
    return relatedNotes < 2; // Arbitrary threshold
  });

  if (lowEvidenceCategories.length > 0) {
    // TODO: Implement targeted re-analysis for low-evidence categories
    // This would involve running additional detectors on relevant scenes
    console.warn(`Low evidence for categories: ${lowEvidenceCategories.map(s => s.category).join(", ")}`);
  }

  return scores;
}

/**
 * Generate coverage prose using gpt-5 for narrative sections
 * No structured output - returns formatted prose
 */
export async function routeCoverageProse({
  analyticsData,
  scriptTitle,
  recommendation
}: {
  analyticsData: {
    beats: Beat[];
    notes: Note[];
    scores: Score[];
    riskFlags: RiskFlag[];
  };
  scriptTitle: string;
  recommendation: "pass" | "consider" | "recommend";
}): Promise<string> {
  const systemPrompt = `You are a professional script coverage writer for a major studio.

Generate professional coverage prose with these sections:
1. LOGLINE: One compelling sentence capturing the story
2. SYNOPSIS (3-paragraph): Setup, conflict, resolution
3. STRENGTHS: 2-3 key positives with specific examples
4. CONCERNS: 2-3 areas needing attention with constructive notes
5. RECOMMENDATION: ${recommendation.toUpperCase()} with brief justification

Style: Professional, concise, constructive. Avoid revealing internal analysis tools.
Base content on provided analytics data.

Generate clean prose sections, not JSON.`;

  const response = await client.chat.completions.create({
    model: MODELS.base,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify({ scriptTitle, recommendation, ...analyticsData }) }
    ],
    max_tokens: 1500,
    temperature: 0.6
  });

  return response.choices[0]?.message?.content || "";
}

export { telemetry as llmTelemetry };