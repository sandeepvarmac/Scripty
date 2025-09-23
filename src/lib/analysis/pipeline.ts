/**
 * Analysis Pipeline with Structured Outputs
 * Orchestrates LLM router for comprehensive script analysis
 * Based on MVP requirements and tiered processing strategy
 */

import { PrismaClient } from "@prisma/client";
import {
  routeBeats,
  routeNotes,
  routeRiskFlags,
  routeRubricScoring,
  routeCoverageProse,
  type AnalysisPolicy,
  type Beat,
  type Note,
  type RiskFlag,
  type Score,
  llmTelemetry
} from "../llm/router";

const prisma = new PrismaClient();

// Pipeline stage definitions
export enum AnalysisStage {
  SANITIZE = "sanitize",
  PARSE = "parse",
  NORMALIZE = "normalize",
  DETECTORS = "detectors",
  SCORING = "scoring",
  ASSETS = "assets",
  PERSIST = "persist",
  NOTIFY = "notify"
}

// Analysis configuration
export type AnalysisConfig = {
  scriptId: string;
  analysisType: "quick" | "comprehensive" | "custom";
  policy: AnalysisPolicy;
  stages?: AnalysisStage[];
  webhookUrl?: string;
};

// Pipeline context
export type PipelineContext = {
  scriptId: string;
  script: any;
  scenes: any[];
  characters: any[];
  elements: any[];
  config: AnalysisConfig;
  results: {
    beats?: Beat[];
    notes?: Note[];
    riskFlags?: RiskFlag[];
    scores?: Score[];
    pageMetrics?: any[];
    feasibilityMetrics?: any[];
    coverage?: string;
  };
  telemetry: {
    startTime: Date;
    stageTime: Record<string, number>;
    errors: Array<{ stage: string; error: string; timestamp: Date }>;
  };
};

/**
 * Main Analysis Pipeline Orchestrator
 */
export class AnalysisPipeline {
  private context: PipelineContext;

  constructor(config: AnalysisConfig) {
    this.context = {
      scriptId: config.scriptId,
      script: null,
      scenes: [],
      characters: [],
      elements: [],
      config,
      results: {},
      telemetry: {
        startTime: new Date(),
        stageTime: {},
        errors: []
      }
    };
  }

  /**
   * Execute the full analysis pipeline
   */
  async execute(): Promise<PipelineContext> {
    const stages = this.context.config.stages || this.getDefaultStages();

    try {
      for (const stage of stages) {
        await this.executeStage(stage);
      }

      // Final persistence and notification
      await this.finalizeResults();

    } catch (error) {
      this.recordError("pipeline", error as Error);
      throw error;
    }

    return this.context;
  }

  /**
   * Execute individual pipeline stage
   */
  private async executeStage(stage: AnalysisStage): Promise<void> {
    const stageStart = Date.now();

    try {
      switch (stage) {
        case AnalysisStage.SANITIZE:
          await this.stageSanitize();
          break;
        case AnalysisStage.PARSE:
          await this.stageParse();
          break;
        case AnalysisStage.NORMALIZE:
          await this.stageNormalize();
          break;
        case AnalysisStage.DETECTORS:
          await this.stageDetectors();
          break;
        case AnalysisStage.SCORING:
          await this.stageScoring();
          break;
        case AnalysisStage.ASSETS:
          await this.stageAssets();
          break;
        case AnalysisStage.PERSIST:
          await this.stagePersist();
          break;
        case AnalysisStage.NOTIFY:
          await this.stageNotify();
          break;
        default:
          throw new Error(`Unknown stage: ${stage}`);
      }
    } catch (error) {
      this.recordError(stage, error as Error);
      throw error;
    } finally {
      this.context.telemetry.stageTime[stage] = Date.now() - stageStart;
    }
  }

  /**
   * Stage: Sanitize input data and validate script
   */
  private async stageSanitize(): Promise<void> {
    // Load script with validation
    const script = await prisma.script.findUnique({
      where: { id: this.context.scriptId },
      include: {
        scenes: {
          include: {
            elements: true
          }
        },
        characters: true
      }
    });

    if (!script) {
      throw new Error(`Script not found: ${this.context.scriptId}`);
    }

    if (script.status !== "COMPLETED") {
      throw new Error(`Script not ready for analysis: ${script.status}`);
    }

    this.context.script = script;
    this.context.scenes = script.scenes || [];
    this.context.characters = script.characters || [];
    this.context.elements = script.scenes?.flatMap(scene => scene.elements || []) || [];
  }

  /**
   * Stage: Parse and extract structured elements
   */
  private async stageParse(): Promise<void> {
    // This stage would typically handle file format conversion
    // For MVP, we assume elements are already parsed in the database

    if (this.context.elements.length === 0) {
      throw new Error("No parsed elements found for script");
    }

    console.log(`Parsed ${this.context.elements.length} elements from ${this.context.scenes.length} scenes`);
  }

  /**
   * Stage: Normalize data into analysis-ready format
   */
  private async stageNormalize(): Promise<void> {
    // Create scene summaries for LLM processing
    const sceneSummaries = this.context.scenes.map(scene => ({
      scene_id: parseInt(scene.id),
      page: scene.pageNumber || scene.pageStart || 1,
      summary: this.generateSceneSummary(scene)
    }));

    // Store normalized data in context
    this.context.results.pageMetrics = this.generatePageMetrics();

    console.log(`Normalized ${sceneSummaries.length} scenes for analysis`);
  }

  /**
   * Stage: Run AI detectors with tiered LLM routing
   */
  private async stageDetectors(): Promise<void> {
    const { script, scenes } = this.context;
    const sceneSummaries = scenes.map(scene => ({
      scene_id: parseInt(scene.id),
      page: scene.pageNumber || scene.pageStart || 1,
      summary: this.generateSceneSummary(scene)
    }));

    // 1. Beat Detection (Tier B → Tier C escalation)
    console.log("Detecting story beats...");
    this.context.results.beats = await routeBeats({
      sceneSummaries,
      pageCount: script.pageCount || 110,
      genre: script.genreOverride || script.genre,
      policy: this.context.config.policy
    });

    // 2. Note Generation (Tier A → Tier B escalation)
    console.log("Generating craft notes...");
    const flaggedSpans = this.generateFlaggedSpans();
    this.context.results.notes = await routeNotes({
      flaggedSpans,
      policy: this.context.config.policy
    });

    // 3. Risk Flag Detection (Policy-aware escalation)
    if (this.context.config.policy.sensitivityEnabled) {
      console.log("Detecting risk flags...");
      const riskCandidates = this.generateRiskCandidates();
      this.context.results.riskFlags = await routeRiskFlags({
        candidates: riskCandidates,
        policy: this.context.config.policy
      });
    }

    // 4. Production Feasibility (Tier A processing)
    console.log("Analyzing production feasibility...");
    this.context.results.feasibilityMetrics = await this.generateFeasibilityMetrics();
  }

  /**
   * Stage: Comprehensive scoring and evaluation
   */
  private async stageScoring(): Promise<void> {
    if (!this.context.results.beats || !this.context.results.notes) {
      throw new Error("Missing analysis data for scoring");
    }

    console.log("Computing rubric scores...");
    this.context.results.scores = await routeRubricScoring({
      analysisData: {
        beats: this.context.results.beats,
        notes: this.context.results.notes,
        pageCount: this.context.script.pageCount || 110,
        genre: this.context.script.genreOverride,
        synopsis: this.context.script.synopsisShort
      },
      policy: this.context.config.policy
    });
  }

  /**
   * Stage: Generate deliverable assets
   */
  private async stageAssets(): Promise<void> {
    if (this.context.config.analysisType === "comprehensive") {
      console.log("Generating coverage prose...");

      const recommendation = this.determineRecommendation();

      this.context.results.coverage = await routeCoverageProse({
        analyticsData: {
          beats: this.context.results.beats || [],
          notes: this.context.results.notes || [],
          scores: this.context.results.scores || [],
          riskFlags: this.context.results.riskFlags || []
        },
        scriptTitle: this.context.script.title || "Untitled",
        recommendation
      });
    }
  }

  /**
   * Stage: Persist results to database
   */
  private async stagePersist(): Promise<void> {
    const { scriptId, results } = this.context;

    await prisma.$transaction(async (tx) => {
      // 1. Store beats
      if (results.beats?.length) {
        await tx.beat.createMany({
          data: results.beats.map(beat => ({
            scriptId,
            kind: beat.kind,
            page: beat.page,
            confidence: beat.confidence,
            timingFlag: beat.timing_flag,
            rationale: beat.rationale
          })),
          skipDuplicates: true
        });
      }

      // 2. Store notes
      if (results.notes?.length) {
        await tx.note.createMany({
          data: results.notes.map(note => ({
            scriptId,
            severity: note.severity,
            area: note.area,
            sceneId: note.scene_id?.toString(),
            page: note.page,
            lineRef: note.line_ref,
            excerpt: note.excerpt,
            suggestion: note.suggestion,
            applyHook: note.apply_hook,
            ruleCode: note.rule_code
          })),
          skipDuplicates: true
        });
      }

      // 3. Store scores
      if (results.scores?.length) {
        for (const score of results.scores) {
          await tx.score.upsert({
            where: {
              scriptId_category: {
                scriptId,
                category: score.category
              }
            },
            update: {
              value: score.value,
              rationale: score.rationale
            },
            create: {
              scriptId,
              category: score.category,
              value: score.value,
              rationale: score.rationale
            }
          });
        }
      }

      // 4. Store risk flags
      if (results.riskFlags?.length) {
        await tx.riskFlag.createMany({
          data: results.riskFlags.map(flag => ({
            scriptId,
            sceneId: flag.scene_id?.toString(),
            kind: flag.kind,
            page: flag.page,
            startLine: flag.start_line,
            endLine: flag.end_line,
            snippet: flag.snippet,
            confidence: flag.confidence
          })),
          skipDuplicates: true
        });
      }

      // 5. Update script status
      await tx.script.update({
        where: { id: scriptId },
        data: {
          processedAt: new Date(),
          status: "COMPLETED"
        }
      });
    });

    console.log("Results persisted to database");
  }

  /**
   * Stage: Send notifications and webhooks
   */
  private async stageNotify(): Promise<void> {
    // TODO: Implement Server-Sent Events or webhook notifications
    if (this.context.config.webhookUrl) {
      console.log(`Would notify webhook: ${this.context.config.webhookUrl}`);
    }
  }

  /**
   * Helper: Get default stages based on analysis type
   */
  private getDefaultStages(): AnalysisStage[] {
    const { analysisType } = this.context.config;

    switch (analysisType) {
      case "quick":
        return [
          AnalysisStage.SANITIZE,
          AnalysisStage.NORMALIZE,
          AnalysisStage.DETECTORS,
          AnalysisStage.PERSIST
        ];

      case "comprehensive":
        return [
          AnalysisStage.SANITIZE,
          AnalysisStage.PARSE,
          AnalysisStage.NORMALIZE,
          AnalysisStage.DETECTORS,
          AnalysisStage.SCORING,
          AnalysisStage.ASSETS,
          AnalysisStage.PERSIST,
          AnalysisStage.NOTIFY
        ];

      case "custom":
        return [
          AnalysisStage.SANITIZE,
          AnalysisStage.NORMALIZE,
          AnalysisStage.DETECTORS,
          AnalysisStage.PERSIST
        ];

      default:
        throw new Error(`Unknown analysis type: ${analysisType}`);
    }
  }

  /**
   * Helper: Generate scene summary for LLM processing
   */
  private generateSceneSummary(scene: any): string {
    const elements = scene.elements || [];
    const heading = elements.find((e: any) => e.type === "SCENE_HEADING")?.text || "Scene";
    const actions = elements.filter((e: any) => e.type === "ACTION").map((e: any) => e.text).join(" ");
    const dialogues = elements.filter((e: any) => e.type === "DIALOGUE").length;

    return `${heading}. ${actions.substring(0, 200)}${actions.length > 200 ? "..." : ""} (${dialogues} dialogue blocks)`;
  }

  /**
   * Helper: Generate flagged spans for note detection
   */
  private generateFlaggedSpans() {
    // This would typically use heuristic detectors
    // For MVP, generate sample flagged spans
    return this.context.scenes.slice(0, 3).map(scene => ({
      scene_id: parseInt(scene.id),
      page: scene.pageNumber || 1,
      line_ref: 5,
      excerpt: "Sample excerpt needing attention",
      area: "DIALOGUE",
      heuristicConfidence: Math.random()
    }));
  }

  /**
   * Helper: Generate risk candidates for legal review
   */
  private generateRiskCandidates() {
    // This would typically use pattern matching
    // For MVP, generate sample candidates
    return this.context.scenes.slice(0, 2).map(scene => ({
      scene_id: parseInt(scene.id),
      page: scene.pageNumber || 1,
      snippet: "Sample potentially risky content",
      context: "Surrounding context for risk assessment"
    }));
  }

  /**
   * Helper: Generate page metrics (analytical, no LLM)
   */
  private generatePageMetrics() {
    return Array.from({ length: Math.min(10, this.context.script?.pageCount || 10) }, (_, i) => ({
      page: i + 1,
      scene_length_lines: Math.floor(Math.random() * 50) + 20,
      dialogue_lines: Math.floor(Math.random() * 30) + 5,
      action_lines: Math.floor(Math.random() * 40) + 10,
      tension_score: Math.floor(Math.random() * 8) + 1,
      complexity_score: Math.floor(Math.random() * 6) + 2
    }));
  }

  /**
   * Helper: Generate feasibility metrics using scene taggers
   */
  private async generateFeasibilityMetrics() {
    // This would use gpt-5-mini scene taggers
    // For MVP, generate sample data
    return this.context.scenes.map(scene => ({
      scene_id: parseInt(scene.id),
      int_ext: scene.intExt || "INT",
      location: scene.location || "UNKNOWN",
      tod: scene.tod || "DAY",
      has_stunts: Math.random() > 0.8,
      has_vfx: Math.random() > 0.7,
      has_sfx: Math.random() > 0.6,
      has_crowd: Math.random() > 0.9,
      has_minors: Math.random() > 0.95,
      has_animals: Math.random() > 0.9,
      has_weapons: Math.random() > 0.8,
      has_vehicles: Math.random() > 0.85,
      has_special_props: Math.random() > 0.7,
      complexity_score: Math.floor(Math.random() * 8) + 1
    }));
  }

  /**
   * Helper: Determine recommendation based on scores
   */
  private determineRecommendation(): "pass" | "consider" | "recommend" {
    const scores = this.context.results.scores || [];
    if (scores.length === 0) return "consider";

    const avgScore = scores.reduce((sum, score) => sum + score.value, 0) / scores.length;

    if (avgScore >= 8) return "recommend";
    if (avgScore >= 6) return "consider";
    return "pass";
  }

  /**
   * Helper: Record error in telemetry
   */
  private recordError(stage: string, error: Error): void {
    this.context.telemetry.errors.push({
      stage,
      error: error.message,
      timestamp: new Date()
    });
  }

  /**
   * Finalize results and generate summary
   */
  private async finalizeResults(): Promise<void> {
    const telemetryStats = llmTelemetry.getStats();
    const pipelineTime = Date.now() - this.context.telemetry.startTime.getTime();

    console.log("Analysis Pipeline Complete:");
    console.log(`  Total Time: ${pipelineTime}ms`);
    console.log(`  LLM Calls: ${telemetryStats.totalCalls}`);
    console.log(`  Total Tokens: ${telemetryStats.totalTokens}`);
    console.log(`  Escalations: ${telemetryStats.escalations}`);
    console.log(`  Beats Found: ${this.context.results.beats?.length || 0}`);
    console.log(`  Notes Generated: ${this.context.results.notes?.length || 0}`);
    console.log(`  Risk Flags: ${this.context.results.riskFlags?.length || 0}`);
    console.log(`  Scores: ${this.context.results.scores?.length || 0}`);
  }
}

/**
 * Factory function to create and execute analysis pipeline
 */
export async function runAnalysis(config: AnalysisConfig): Promise<PipelineContext> {
  const pipeline = new AnalysisPipeline(config);
  return await pipeline.execute();
}