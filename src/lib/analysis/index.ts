// Analysis Engine
// Provides AI-powered screenplay analysis with professional feedback

import { prisma } from '@/lib/prisma'
import type { Scene, Script, Character, Evidence } from '@prisma/client'
import { analyzeScriptWithAI, type AIAnalysisOptions, type AIAnalysisResult } from './ai-analysis'

export interface AnalysisOptions {
  scriptId: string
  userId: string
  analysisTypes?: AnalysisType[]
}

export type AnalysisType =
  | 'QUICK_OVERVIEW'
  | 'COMPREHENSIVE'
  | 'STORY_STRUCTURE'
  | 'CHARACTER_DEVELOPMENT'
  | 'DIALOGUE_QUALITY'
  | 'PACING_FLOW'
  | 'THEME_ANALYSIS'

export interface AnalysisResult {
  id: string
  type: AnalysisType
  status: 'COMPLETED' | 'FAILED'
  summary: string
  insights: AnalysisInsight[]
  recommendations: string[]
  strengths: string[]
  genre: string
  industryComparison: string
  overallScore: number
  completedAt: Date
}

export interface AnalysisInsight {
  category: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  message: string
  evidence?: string
  lineNumber?: number
  pageNumber?: number
  suggestions: string[]
}

type SceneWithEvidence = Scene & { evidences: Evidence[] }
type ScriptWithData = Script & {
  scenes: SceneWithEvidence[]
  characters: Character[]
}

// Main analysis function - now powered by AI
export async function analyzeScript(options: AnalysisOptions): Promise<AnalysisResult[]> {
  // Use AI-powered analysis
  const aiResults = await analyzeScriptWithAI({
    scriptId: options.scriptId,
    userId: options.userId,
    analysisTypes: options.analysisTypes
  })

  // Convert AI results to legacy format for compatibility
  return aiResults.map(result => ({
    id: result.id,
    type: result.type,
    status: result.status,
    summary: result.summary,
    insights: result.insights.map(insight => ({
      category: insight.category,
      severity: insight.severity,
      message: insight.message,
      evidence: insight.evidence,
      lineNumber: insight.lineNumber,
      pageNumber: insight.pageNumber,
      suggestions: insight.suggestions
    })),
    recommendations: result.recommendations,
    strengths: result.strengths,
    genre: result.genre,
    industryComparison: result.industryComparison,
    overallScore: result.overallScore,
    completedAt: result.completedAt
  }))
}


// Get analysis history for a script
export async function getAnalysisHistory(scriptId: string, userId: string) {
  return await prisma.analysis.findMany({
    where: {
      script: {
        id: scriptId,
        userId
      }
    },
    orderBy: { startedAt: 'desc' }
  })
}

// Get specific analysis result
export async function getAnalysisResult(analysisId: string, userId: string) {
  return await prisma.analysis.findFirst({
    where: {
      id: analysisId,
      script: {
        userId
      }
    }
  })
}