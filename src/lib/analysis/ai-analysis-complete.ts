// AI-Powered Analysis Service
// Uses tiered OpenAI GPT models for intelligent screenplay analysis
// gpt-5-mini → gpt-5 → gpt-5-thinking escalation system

import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import type { Scene, Script, Character, Evidence } from '@prisma/client'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Tiered model configuration
export const AI_MODELS = {
  MINI: 'gpt-4o-mini', // Using gpt-4o-mini as gpt-5-mini equivalent
  STANDARD: 'gpt-4o',   // Using gpt-4o as gpt-5 equivalent
  THINKING: 'o1-preview' // Using o1-preview as gpt-5-thinking equivalent
} as const

export interface ModelOptions {
  model: keyof typeof AI_MODELS
  reasoning_effort?: 'low' | 'medium' | 'high'
  max_output_tokens?: number
  temperature?: number
}

export interface AIAnalysisOptions {
  scriptId: string
  userId: string
  analysisTypes?: AIAnalysisType[]
}

export type AIAnalysisType =
  | 'QUICK_OVERVIEW'
  | 'COMPREHENSIVE'
  | 'STORY_STRUCTURE'
  | 'CHARACTER_DEVELOPMENT'
  | 'DIALOGUE_QUALITY'
  | 'PACING_FLOW'
  | 'THEME_ANALYSIS'

export interface AIAnalysisResult {
  id: string
  type: AIAnalysisType
  status: 'COMPLETED' | 'FAILED'
  summary: string
  insights: AIInsight[]
  recommendations: string[]
  strengths: string[]
  genre: string
  industryComparison: string
  overallScore: number
  completedAt: Date
}

export interface AIInsight {
  category: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  message: string
  evidence?: string
  pageNumber?: number
  lineNumber?: number
  suggestions: string[]
  confidence: number
}

// Structured Output Schemas
export interface BeatDetectionSchema {
  kind: 'INCITING' | 'ACT1_BREAK' | 'MIDPOINT' | 'LOW_POINT' | 'ACT2_BREAK' | 'CLIMAX' | 'RESOLUTION'
  page: number
  confidence: number
  timing_flag: 'EARLY' | 'ON_TIME' | 'LATE' | 'UNKNOWN'
  rationale: string
}

export interface RiskFlagSchema {
  kind: 'REAL_PERSON' | 'TRADEMARK' | 'LYRICS' | 'DEFAMATION_RISK' | 'LIFE_RIGHTS'
  page: number
  start_line?: number
  end_line?: number
  snippet: string
  confidence: number
}

export interface CharacterArcSchema {
  name: string
  goal: string
  stakes: string
  agency: string
  antagonistic_force: string
  arc_descriptor: string
  confidence: number
}

export interface ThemeAnalysisSchema {
  statement: string
  confidence: number
  supporting_scenes: number[]
  contradicting_scenes: number[]
}

export interface TensionScoreSchema {
  scene_index: number
  tension_score: number // 1-5 scale
  rationale: string
  key_elements: string[]
}

type SceneWithEvidence = Scene & { evidences: Evidence[] }
type ScriptWithData = Script & {
  project?: {
    genre: string | null
    type: string
    targetAudience: string | null
    description: string | null
  } | null
  scenes: SceneWithEvidence[]
  characters: Character[]
}

// Utility function for tiered model calls with escalation
async function callWithTieredEscalation(
  prompt: string,
  options: ModelOptions,
  structuredOutputSchema?: any,
  confidenceThreshold: number = 0.7
): Promise<any> {
  let currentModel = options.model
  let attempt = 0
  const maxAttempts = 3

  while (attempt < maxAttempts) {
    try {
      const modelName = AI_MODELS[currentModel]

      const requestOptions: any = {
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.3,
      }

      // Add reasoning effort for o1 models
      if (currentModel === 'THINKING' && options.reasoning_effort) {
        requestOptions.reasoning_effort = options.reasoning_effort
      }

      // Add structured outputs if provided
      if (structuredOutputSchema && currentModel !== 'THINKING') {
        requestOptions.response_format = {
          type: 'json_schema',
          json_schema: {
            name: 'analysis_response',
            schema: structuredOutputSchema
          }
        }
      }

      if (options.max_output_tokens) {
        requestOptions.max_completion_tokens = options.max_output_tokens
      }

      const response = await openai.chat.completions.create(requestOptions)
      const content = response.choices[0]?.message?.content

      if (!content) {
        throw new Error('No response content')
      }

      let parsedResult
      try {
        parsedResult = JSON.parse(content)
      } catch {
        // For non-JSON responses, wrap in simple structure
        parsedResult = { content, confidence: 0.8 }
      }

      // Check confidence and escalate if needed
      if (parsedResult.confidence && parsedResult.confidence < confidenceThreshold) {
        if (currentModel === 'MINI') {
          currentModel = 'STANDARD'
          attempt++
          continue
        } else if (currentModel === 'STANDARD') {
          currentModel = 'THINKING'
          options.reasoning_effort = options.reasoning_effort === 'medium' ? 'high' : 'high'
          attempt++
          continue
        }
      }

      return parsedResult

    } catch (error) {
      console.error(`Model ${currentModel} failed:`, error)

      // Escalate on failure
      if (currentModel === 'MINI') {
        currentModel = 'STANDARD'
      } else if (currentModel === 'STANDARD') {
        currentModel = 'THINKING'
        options.reasoning_effort = 'high'
      } else {
        throw error
      }

      attempt++
    }
  }

  throw new Error('All model tiers failed')
}

// Beat Detection with GPT-5 escalation
export async function detectStoryBeats(script: ScriptWithData): Promise<BeatDetectionSchema[]> {
  const scriptContent = script.scenes.map((scene, index) =>
    `Page ${scene.pageNumber} Scene ${index + 1}:\n${scene.content}`
  ).join('\n\n')

  const prompt = `Analyze this screenplay and identify the 7 key story beats with precise page numbers and timing assessment.

SCREENPLAY:
${scriptContent}

Expected beats in a ${script.pageCount}-page script:
- INCITING: Pages 10-15
- ACT1_BREAK: Pages 20-30
- MIDPOINT: Pages 50-60
- LOW_POINT: Pages 75-85
- ACT2_BREAK: Pages 85-95
- CLIMAX: Pages 95-105
- RESOLUTION: Pages 105-110

Return JSON array with each beat containing:
- kind: exact beat type
- page: specific page number where beat occurs
- confidence: 0.0-1.0 confidence score
- timing_flag: EARLY/ON_TIME/LATE/UNKNOWN based on expected windows
- rationale: detailed explanation of why this is the beat`

  const schema = {
    type: 'object',
    properties: {
      beats: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            kind: { type: 'string', enum: ['INCITING', 'ACT1_BREAK', 'MIDPOINT', 'LOW_POINT', 'ACT2_BREAK', 'CLIMAX', 'RESOLUTION'] },
            page: { type: 'number' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            timing_flag: { type: 'string', enum: ['EARLY', 'ON_TIME', 'LATE', 'UNKNOWN'] },
            rationale: { type: 'string' }
          },
          required: ['kind', 'page', 'confidence', 'timing_flag', 'rationale']
        }
      }
    },
    required: ['beats']
  }

  const result = await callWithTieredEscalation(
    prompt,
    { model: 'STANDARD', reasoning_effort: 'medium' },
    schema,
    0.7
  )

  return result.beats || []
}

// Main AI analysis function
export async function analyzeScriptWithAI(options: AIAnalysisOptions): Promise<AIAnalysisResult[]> {
  const { scriptId, userId, analysisTypes = ['COMPREHENSIVE'] } = options

  // Get script with full data including project info
  const script = await prisma.script.findFirst({
    where: { id: scriptId, userId, deletedAt: null },
    include: {
      project: {
        select: {
          genre: true,
          type: true,
          targetAudience: true,
          description: true
        }
      },
      scenes: {
        where: { deletedAt: null },
        orderBy: { orderIndex: 'asc' },
        include: {
          evidences: {
            where: { deletedAt: null }
          }
        }
      },
      characters: {
        where: { deletedAt: null },
        orderBy: { dialogueCount: 'desc' }
      }
    }
  })

  if (!script) {
    throw new Error('Script not found')
  }

  const results: AIAnalysisResult[] = []

  // Execute comprehensive analysis
  try {
    // 1. Beat Detection & Timing Flags
    console.log('🎬 Analyzing story structure and beats...')
    const beats = await detectStoryBeats(script)
    await saveBeatsToDatabase(scriptId, beats)

    // 2. Tension Waveform Analysis
    console.log('📈 Generating tension waveform...')
    const tensionScores = await analyzeTensionWaveform(script)
    await saveTensionScoresToDatabase(scriptId, tensionScores)

    // 3. Character Arc Analysis
    console.log('👥 Analyzing character arcs...')
    const characterArcs = await analyzeCharacterArcs(script)
    await saveCharacterArcsToDatabase(scriptId, characterArcs)

    // 4. Theme Analysis
    console.log('🎭 Analyzing themes...')
    const themes = await analyzeThemes(script)
    await saveThemesToDatabase(scriptId, themes)

    // 5. Risk & Legal Analysis
    console.log('⚖️ Scanning for legal risks...')
    const riskFlags = await analyzeRiskFlags(script)
    await saveRiskFlagsToDatabase(scriptId, riskFlags)

    // 6. Dialogue Quality Analysis
    console.log('💬 Analyzing dialogue quality...')
    const dialogueIssues = await analyzeDialogueQuality(script)
    await saveDialogueIssuesToDatabase(scriptId, dialogueIssues)

    // Create comprehensive result
    const analysisResult: AIAnalysisResult = {
      id: scriptId,
      type: 'COMPREHENSIVE',
      status: 'COMPLETED',
      summary: `Comprehensive analysis completed for ${script.title || script.originalFilename}. Detected ${beats.length} story beats, analyzed ${script.characters.length} characters, and identified ${riskFlags.length} potential risks.`,
      insights: [],
      recommendations: await generateRecommendations(script, beats, themes),
      strengths: await identifyStrengths(script, beats),
      genre: await detectGenre(script),
      industryComparison: await generateIndustryComparison(script),
      overallScore: calculateOverallScore(beats, tensionScores, characterArcs),
      completedAt: new Date()
    }

    results.push(analysisResult)

  } catch (error) {
    console.error('Analysis failed:', error)
    throw error
  }

  return results
}

// Continue with additional analysis functions...
// This file can be extended with all the remaining analysis functions