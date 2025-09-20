// AI-Powered Analysis Service
// Uses OpenAI GPT models for intelligent screenplay analysis

import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import type { Scene, Script, Character, Evidence } from '@prisma/client'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

type SceneWithEvidence = Scene & { evidences: Evidence[] }
type ScriptWithData = Script & {
  scenes: SceneWithEvidence[]
  characters: Character[]
}

// Main AI analysis function
export async function analyzeScriptWithAI(options: AIAnalysisOptions): Promise<AIAnalysisResult[]> {
  const { scriptId, userId, analysisTypes = ['COMPREHENSIVE'] } = options

  // Get script with full data
  const script = await prisma.script.findFirst({
    where: { id: scriptId, userId, deletedAt: null },
    include: {
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

  for (const type of analysisTypes) {
    try {
      // Create analysis record
      const analysis = await prisma.analysis.create({
        data: {
          scriptId,
          type,
          status: 'IN_PROGRESS',
          startedAt: new Date()
        }
      })

      let insights: AIInsight[] = []
      let recommendations: string[] = []
      let strengths: string[] = []
      let genre = ''
      let industryComparison = ''
      let summary = ''
      let overallScore = 0

      // Run AI-powered analysis based on type
      switch (type) {
        case 'QUICK_OVERVIEW':
          ({ insights, recommendations, strengths, genre, industryComparison, summary, overallScore } = await runQuickOverview(script))
          break
        case 'COMPREHENSIVE':
          ({ insights, recommendations, strengths, genre, industryComparison, summary, overallScore } = await runComprehensiveAnalysis(script))
          break
        case 'STORY_STRUCTURE':
          ({ insights, recommendations, summary, overallScore } = await analyzeStoryStructure(script))
          break
        case 'CHARACTER_DEVELOPMENT':
          ({ insights, recommendations, summary, overallScore } = await analyzeCharacterDevelopment(script))
          break
        case 'DIALOGUE_QUALITY':
          ({ insights, recommendations, summary, overallScore } = await analyzeDialogueQuality(script))
          break
        case 'PACING_FLOW':
          ({ insights, recommendations, summary, overallScore } = await analyzePacingFlow(script))
          break
        case 'THEME_ANALYSIS':
          ({ insights, recommendations, summary, overallScore } = await analyzeThemes(script))
          break
      }

      // Generate evidence from AI insights
      await generateEvidenceFromAIInsights(scriptId, insights)

      // Update analysis record
      const completedAnalysis = await prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          status: 'COMPLETED',
          summary,
          completedAt: new Date(),
          insights: insights as any,
          recommendations,
          strengths,
          genre,
          industryComparison,
          score: overallScore
        }
      })

      results.push({
        id: completedAnalysis.id,
        type,
        status: 'COMPLETED',
        summary,
        insights,
        recommendations,
        strengths,
        genre,
        industryComparison,
        overallScore,
        completedAt: completedAnalysis.completedAt!
      })

    } catch (error) {
      console.error(`AI Analysis failed for type ${type}:`, error)

      results.push({
        id: 'failed',
        type,
        status: 'FAILED',
        summary: `AI Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        insights: [],
        recommendations: [],
        strengths: [],
        genre: 'Unknown',
        industryComparison: '',
        overallScore: 0,
        completedAt: new Date()
      })
    }
  }

  return results
}

// Quick Overview Analysis - Fast high-level insights
async function runQuickOverview(script: ScriptWithData) {
  const scriptText = formatScriptForAnalysis(script)

  const prompt = `As a professional screenplay analyst, provide a QUICK OVERVIEW analysis of this screenplay. Focus on immediate, high-level insights that can be determined quickly.

SCREENPLAY:
${scriptText}

Provide analysis in this JSON format:
{
  "genre": "Primary genre (e.g., Drama, Comedy, Thriller, Horror, Action, Romance, Sci-Fi, Fantasy, etc.)",
  "overallScore": number (1-10),
  "summary": "Brief 2-3 sentence overall assessment",
  "insights": [
    {
      "category": "Story Structure|Character Development|Dialogue|Pacing|Theme",
      "severity": "LOW|MEDIUM|HIGH",
      "message": "One key insight per category - most important issue only",
      "suggestions": ["1-2 actionable suggestions"],
      "confidence": number (0.1-1.0)
    }
  ],
  "recommendations": ["Top 3 most important recommendations"],
  "strengths": ["Top 3 elements working well"],
  "industryComparison": "Brief comparison to genre standards and professional expectations."
}

IMPORTANT: Keep this analysis quick and high-level. Limit to 1-2 insights per major category. Focus on the most obvious strengths and issues that would be apparent to any professional reader.`

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 1200 // Smaller token limit for quick analysis
  })

  try {
    const analysisData = JSON.parse(response.choices[0].message.content || '{}')
    return {
      insights: analysisData.insights || [],
      recommendations: analysisData.recommendations || [],
      strengths: analysisData.strengths || [],
      genre: analysisData.genre || 'Unknown',
      industryComparison: analysisData.industryComparison || '',
      summary: analysisData.summary || 'Quick overview completed',
      overallScore: analysisData.overallScore || 5
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    return {
      insights: [],
      recommendations: ['Quick overview response could not be parsed'],
      strengths: [],
      genre: 'Unknown',
      industryComparison: '',
      summary: 'Quick overview completed with parsing errors',
      overallScore: 5
    }
  }
}

// Comprehensive AI Analysis
async function runComprehensiveAnalysis(script: ScriptWithData) {
  const scriptText = formatScriptForAnalysis(script)

  const prompt = `As a professional screenplay analyst, provide a comprehensive analysis of this screenplay.

SCREENPLAY:
${scriptText}

Provide analysis in this JSON format:
{
  "genre": "Primary genre (e.g., Drama, Comedy, Thriller, Horror, Action, Romance, Sci-Fi, Fantasy, etc.)",
  "overallScore": number (1-10),
  "summary": "Brief overall assessment",
  "insights": [
    {
      "category": "Story Structure|Character Development|Dialogue|Pacing|Theme",
      "severity": "LOW|MEDIUM|HIGH",
      "message": "Specific insight about problems/issues",
      "suggestions": ["actionable suggestion 1", "actionable suggestion 2"],
      "confidence": number (0.1-1.0)
    }
  ],
  "recommendations": ["top 3-5 overall recommendations for improvement"],
  "strengths": ["top 3-5 elements that are working well in the screenplay"],
  "industryComparison": "How this screenplay compares to professional standards and successful examples in its genre. Include specific genre conventions and expectations."
}

Focus on professional screenplay elements: three-act structure, character arcs, dialogue authenticity, pacing, visual storytelling, and commercial viability within the identified genre.`

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 2000
  })

  try {
    const analysisData = JSON.parse(response.choices[0].message.content || '{}')
    return {
      insights: analysisData.insights || [],
      recommendations: analysisData.recommendations || [],
      strengths: analysisData.strengths || [],
      genre: analysisData.genre || 'Unknown',
      industryComparison: analysisData.industryComparison || '',
      summary: analysisData.summary || 'Analysis completed',
      overallScore: analysisData.overallScore || 5
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    return {
      insights: [],
      recommendations: ['AI analysis response could not be parsed'],
      strengths: [],
      genre: 'Unknown',
      industryComparison: '',
      summary: 'Analysis completed with parsing errors',
      overallScore: 5
    }
  }
}

// Story Structure Analysis
async function analyzeStoryStructure(script: ScriptWithData) {
  const scriptText = formatScriptForAnalysis(script)

  const prompt = `Analyze the story structure of this screenplay focusing on:
- Three-act structure and pacing
- Plot points and turning moments
- Character motivation and stakes
- Story progression and momentum

SCREENPLAY:
${scriptText}

Provide analysis in JSON format with insights about structure strengths and weaknesses.`

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 1500
  })

  return parseAIResponse(response.choices[0].message.content, 'Story Structure')
}

// Character Development Analysis
async function analyzeCharacterDevelopment(script: ScriptWithData) {
  const scriptText = formatScriptForAnalysis(script)

  const prompt = `Analyze the character development in this screenplay:
- Character arcs and growth
- Dialogue authenticity and voice
- Character motivations and conflicts
- Relationship dynamics

SCREENPLAY:
${scriptText}

Provide analysis in JSON format focusing on character strengths and development opportunities.`

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 1500
  })

  return parseAIResponse(response.choices[0].message.content, 'Character Development')
}

// Dialogue Quality Analysis
async function analyzeDialogueQuality(script: ScriptWithData) {
  const dialogueScenes = script.scenes.filter(s => s.type === 'DIALOGUE' || s.type === 'CHARACTER')
  const dialogueText = dialogueScenes.map(s => s.content).join('\n\n')

  const prompt = `Analyze the dialogue quality in this screenplay:
- Authenticity and voice
- Subtext and naturalism
- Character differentiation
- Exposition handling

DIALOGUE SAMPLES:
${dialogueText}

Provide analysis in JSON format focusing on dialogue strengths and improvement areas.`

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 1500
  })

  return parseAIResponse(response.choices[0].message.content, 'Dialogue Quality')
}

// Pacing and Flow Analysis
async function analyzePacingFlow(script: ScriptWithData) {
  const scriptText = formatScriptForAnalysis(script)

  const prompt = `Analyze the pacing and flow of this screenplay:
- Scene transitions and rhythm
- Balance of action and dialogue
- Tension building and release
- Overall momentum

SCREENPLAY:
${scriptText}

Provide analysis in JSON format focusing on pacing strengths and areas for improvement.`

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 1500
  })

  return parseAIResponse(response.choices[0].message.content, 'Pacing and Flow')
}

// Theme Analysis
async function analyzeThemes(script: ScriptWithData) {
  const scriptText = formatScriptForAnalysis(script)

  const prompt = `Analyze the themes and deeper meaning in this screenplay:
- Central themes and messages
- Thematic consistency
- Symbolic elements
- Emotional resonance

SCREENPLAY:
${scriptText}

Provide analysis in JSON format focusing on thematic strengths and development opportunities.`

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 1500
  })

  return parseAIResponse(response.choices[0].message.content, 'Theme Analysis')
}

// Helper function to format script for AI analysis
function formatScriptForAnalysis(script: ScriptWithData): string {
  const maxScenes = 50 // Limit for token management
  const scenesToAnalyze = script.scenes.slice(0, maxScenes)

  let formattedScript = `TITLE: ${script.title || script.originalFilename}\n`
  formattedScript += `FORMAT: ${script.format}\n`
  formattedScript += `PAGES: ${script.pageCount}\n\n`

  scenesToAnalyze.forEach((scene, index) => {
    formattedScript += `[${scene.type}] ${scene.content}\n\n`
  })

  if (script.scenes.length > maxScenes) {
    formattedScript += `[... ${script.scenes.length - maxScenes} more scenes truncated for analysis]`
  }

  return formattedScript
}

// Helper function to parse AI responses
function parseAIResponse(content: string | null, defaultCategory: string) {
  try {
    if (!content) throw new Error('No response content')

    const analysisData = JSON.parse(content)
    return {
      insights: analysisData.insights || [],
      recommendations: analysisData.recommendations || [],
      strengths: analysisData.strengths || [],
      genre: analysisData.genre || 'Unknown',
      industryComparison: analysisData.industryComparison || '',
      summary: analysisData.summary || `${defaultCategory} analysis completed`,
      overallScore: analysisData.overallScore || 5
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    return {
      insights: [{
        category: defaultCategory,
        severity: 'MEDIUM' as const,
        message: 'AI analysis completed but response format was unexpected',
        suggestions: ['Review analysis manually'],
        confidence: 0.5
      }],
      recommendations: ['AI analysis response could not be parsed properly'],
      strengths: [],
      genre: 'Unknown',
      industryComparison: '',
      summary: `${defaultCategory} analysis completed with parsing issues`,
      overallScore: 5
    }
  }
}

// Generate evidence from AI insights
async function generateEvidenceFromAIInsights(scriptId: string, insights: AIInsight[]) {
  const evidencePromises = insights.map(async (insight) => {
    // Find the first scene for this script (simplified approach)
    const scene = await prisma.scene.findFirst({
      where: { scriptId },
      orderBy: { orderIndex: 'asc' }
    })

    if (scene) {
      return prisma.evidence.create({
        data: {
          sceneId: scene.id,
          type: 'AI_INSIGHT',
          content: insight.message,
          context: insight.evidence || insight.message,
          confidence: insight.confidence,
          tags: [insight.category.toLowerCase().replace(/\s+/g, '-'), insight.severity.toLowerCase()],
          startLine: insight.lineNumber || scene.lineNumber,
          endLine: insight.lineNumber || scene.lineNumber
        }
      })
    }
  })

  // Filter out undefined promises and execute
  const validPromises = evidencePromises.filter(p => p)
  if (validPromises.length > 0) {
    await Promise.all(validPromises)
  }
}