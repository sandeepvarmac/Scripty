// Analysis Engine
// Provides comprehensive screenplay analysis with actionable feedback

import { prisma } from '@/lib/prisma'
import type { Scene, Script, Character, Evidence } from '@prisma/client'

export interface AnalysisOptions {
  scriptId: string
  userId: string
  analysisTypes?: AnalysisType[]
}

export type AnalysisType =
  | 'STRUCTURE'
  | 'PACING'
  | 'CHARACTER'
  | 'DIALOGUE'
  | 'FORMAT'
  | 'COMPREHENSIVE'

export interface AnalysisResult {
  id: string
  type: AnalysisType
  status: 'COMPLETED' | 'FAILED'
  summary: string
  insights: AnalysisInsight[]
  recommendations: string[]
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

// Main analysis function
export async function analyzeScript(options: AnalysisOptions): Promise<AnalysisResult[]> {
  const { scriptId, userId, analysisTypes = ['COMPREHENSIVE'] } = options

  // Get script with full data
  const script = await prisma.script.findFirst({
    where: { id: scriptId, userId },
    include: {
      scenes: {
        orderBy: { orderIndex: 'asc' },
        include: {
          evidences: true
        }
      },
      characters: {
        orderBy: { dialogueCount: 'desc' }
      }
    }
  })

  if (!script) {
    throw new Error('Script not found')
  }

  const results: AnalysisResult[] = []

  for (const type of analysisTypes) {
    try {
      // Create analysis record
      const analysis = await prisma.analyse.create({
        data: {
          scriptId,
          type,
          status: 'IN_PROGRESS',
          startedAt: new Date()
        }
      })

      let insights: AnalysisInsight[] = []
      let recommendations: string[] = []
      let summary = ''

      // Run specific analysis
      switch (type) {
        case 'STRUCTURE':
          ({ insights, recommendations, summary } = await analyzeStructure(script))
          break
        case 'PACING':
          ({ insights, recommendations, summary } = await analyzePacing(script))
          break
        case 'CHARACTER':
          ({ insights, recommendations, summary } = await analyzeCharacters(script))
          break
        case 'DIALOGUE':
          ({ insights, recommendations, summary } = await analyzeDialogue(script))
          break
        case 'FORMAT':
          ({ insights, recommendations, summary } = await analyzeFormat(script))
          break
        case 'COMPREHENSIVE':
          ({ insights, recommendations, summary } = await analyzeComprehensive(script))
          break
      }

      // Generate evidence from insights
      await generateEvidenceFromInsights(scriptId, insights)

      // Update analysis record
      const completedAnalysis = await prisma.analyse.update({
        where: { id: analysis.id },
        data: {
          status: 'COMPLETED',
          summary,
          completedAt: new Date(),
          insights: insights as any,
          recommendations
        }
      })

      results.push({
        id: completedAnalysis.id,
        type,
        status: 'COMPLETED',
        summary,
        insights,
        recommendations,
        completedAt: completedAnalysis.completedAt!
      })

    } catch (error) {
      console.error(`Analysis failed for type ${type}:`, error)

      results.push({
        id: 'failed',
        type,
        status: 'FAILED',
        summary: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        insights: [],
        recommendations: [],
        completedAt: new Date()
      })
    }
  }

  return results
}

// Structure Analysis
async function analyzeStructure(script: ScriptWithData) {
  const insights: AnalysisInsight[] = []
  const recommendations: string[] = []

  const scenes = script.scenes
  const totalScenes = scenes.length
  const pageCount = script.pageCount

  // Check scene distribution
  if (totalScenes < 15) {
    insights.push({
      category: 'Scene Count',
      severity: 'MEDIUM',
      message: `Script has only ${totalScenes} scenes, which may indicate underdeveloped story structure`,
      suggestions: [
        'Consider breaking longer scenes into shorter, more focused segments',
        'Add transitional scenes to improve flow',
        'Develop subplot scenes to enhance character development'
      ]
    })
  }

  // Check for proper three-act structure
  const act1End = Math.floor(totalScenes * 0.25)
  const act2End = Math.floor(totalScenes * 0.75)

  const sceneHeadings = scenes.filter(s => s.type === 'SCENE_HEADING')
  if (sceneHeadings.length < Math.floor(totalScenes * 0.3)) {
    insights.push({
      category: 'Scene Structure',
      severity: 'HIGH',
      message: 'Insufficient scene headings detected - may indicate formatting issues',
      suggestions: [
        'Ensure each new location/time has a proper scene heading',
        'Use standard formatting: INT./EXT. LOCATION - TIME',
        'Review screenplay formatting guidelines'
      ]
    })
  }

  // Page count analysis
  if (pageCount < 90) {
    recommendations.push('Consider expanding the script - feature screenplays typically run 90-120 pages')
  } else if (pageCount > 130) {
    recommendations.push('Consider tightening the script - may be too long for typical feature format')
  }

  const summary = `Structure analysis found ${insights.length} areas for improvement across ${totalScenes} scenes and ${pageCount} pages.`

  return { insights, recommendations, summary }
}

// Pacing Analysis
async function analyzePacing(script: ScriptWithData) {
  const insights: AnalysisInsight[] = []
  const recommendations: string[] = []

  const scenes = script.scenes
  const dialogueScenes = scenes.filter(s => s.type === 'DIALOGUE')
  const actionScenes = scenes.filter(s => s.type === 'ACTION')

  // Dialogue vs Action ratio
  const dialogueRatio = dialogueScenes.length / scenes.length
  if (dialogueRatio > 0.7) {
    insights.push({
      category: 'Dialogue Density',
      severity: 'MEDIUM',
      message: 'High dialogue-to-action ratio may slow pacing',
      suggestions: [
        'Add more action and visual storytelling',
        'Combine exposition with action sequences',
        'Use subtext to reduce direct dialogue'
      ]
    })
  }

  // Check for overly long action blocks
  const longActionScenes = actionScenes.filter(s => s.wordCount > 80)
  if (longActionScenes.length > 0) {
    longActionScenes.forEach(scene => {
      insights.push({
        category: 'Action Length',
        severity: 'LOW',
        message: 'Long action block may slow reading pace',
        lineNumber: scene.lineNumber,
        pageNumber: scene.pageNumber,
        evidence: scene.content.substring(0, 100) + '...',
        suggestions: [
          'Break into shorter, punchier paragraphs',
          'Use active voice and strong verbs',
          'Focus on essential visual information'
        ]
      })
    })
  }

  const summary = `Pacing analysis identified ${insights.length} potential pacing issues with ${Math.round(dialogueRatio * 100)}% dialogue density.`

  return { insights, recommendations, summary }
}

// Character Analysis
async function analyzeCharacters(script: ScriptWithData) {
  const insights: AnalysisInsight[] = []
  const recommendations: string[] = []

  const characters = script.characters
  const totalDialogue = characters.reduce((sum, c) => sum + c.dialogueCount, 0)

  // Check character distribution
  if (characters.length === 0) {
    insights.push({
      category: 'Character Count',
      severity: 'HIGH',
      message: 'No characters detected - may indicate parsing or formatting issues',
      suggestions: [
        'Ensure character names are properly formatted in ALL CAPS',
        'Check that dialogue follows standard screenplay format',
        'Review character introduction scenes'
      ]
    })
  } else if (characters.length > 15) {
    insights.push({
      category: 'Character Count',
      severity: 'MEDIUM',
      message: `Large cast of ${characters.length} characters may confuse readers`,
      suggestions: [
        'Consider combining minor characters',
        'Ensure each character serves a distinct purpose',
        'Develop main characters more deeply rather than adding new ones'
      ]
    })
  }

  // Check dialogue distribution
  if (characters.length > 0) {
    const mainCharacter = characters[0]
    const dialoguePercentage = (mainCharacter.dialogueCount / totalDialogue) * 100

    if (dialoguePercentage > 50) {
      insights.push({
        category: 'Dialogue Distribution',
        severity: 'MEDIUM',
        message: `${mainCharacter.name} dominates with ${Math.round(dialoguePercentage)}% of dialogue`,
        suggestions: [
          'Give other characters more voice and agency',
          'Ensure supporting characters have distinct perspectives',
          'Balance dialogue to serve the ensemble'
        ]
      })
    }

    // Check for characters with very little dialogue
    const minorCharacters = characters.filter(c => c.dialogueCount < 3)
    if (minorCharacters.length > 5) {
      recommendations.push(`Consider consolidating ${minorCharacters.length} minor characters with minimal dialogue`)
    }
  }

  const summary = `Character analysis evaluated ${characters.length} characters with ${totalDialogue} total dialogue exchanges.`

  return { insights, recommendations, summary }
}

// Dialogue Analysis
async function analyzeDialogue(script: ScriptWithData) {
  const insights: AnalysisInsight[] = []
  const recommendations: string[] = []

  const dialogueScenes = script.scenes.filter(s => s.type === 'DIALOGUE')

  // Check for overly long dialogue
  const longDialogue = dialogueScenes.filter(s => s.wordCount > 50)
  longDialogue.forEach(scene => {
    insights.push({
      category: 'Dialogue Length',
      severity: 'LOW',
      message: 'Long dialogue block may need breaking up',
      lineNumber: scene.lineNumber,
      pageNumber: scene.pageNumber,
      evidence: scene.content.substring(0, 100) + '...',
      suggestions: [
        'Break into shorter exchanges',
        'Add interruptions or reactions',
        'Use subtext and implication'
      ]
    })
  })

  // Check for exposition-heavy dialogue
  const expositionKeywords = ['remember when', 'as you know', 'let me explain', 'you see']
  const expositionDialogue = dialogueScenes.filter(s =>
    expositionKeywords.some(keyword => s.content.toLowerCase().includes(keyword))
  )

  expositionDialogue.forEach(scene => {
    insights.push({
      category: 'Exposition',
      severity: 'MEDIUM',
      message: 'Potential exposition-heavy dialogue detected',
      lineNumber: scene.lineNumber,
      pageNumber: scene.pageNumber,
      suggestions: [
        'Show information through action instead',
        'Use conflict to reveal backstory naturally',
        'Trust the audience to infer information'
      ]
    })
  })

  const summary = `Dialogue analysis reviewed ${dialogueScenes.length} dialogue blocks, finding ${insights.length} areas for improvement.`

  return { insights, recommendations, summary }
}

// Format Analysis
async function analyzeFormat(script: ScriptWithData) {
  const insights: AnalysisInsight[] = []
  const recommendations: string[] = []

  const scenes = script.scenes

  // Check scene heading format
  const sceneHeadings = scenes.filter(s => s.type === 'SCENE_HEADING')
  const malformedHeadings = sceneHeadings.filter(s =>
    !s.content.match(/^(INT\.|EXT\.).*-\s*(DAY|NIGHT|MORNING|AFTERNOON|EVENING)/i)
  )

  malformedHeadings.forEach(scene => {
    insights.push({
      category: 'Scene Heading Format',
      severity: 'MEDIUM',
      message: 'Scene heading may not follow standard format',
      lineNumber: scene.lineNumber,
      pageNumber: scene.pageNumber,
      evidence: scene.content,
      suggestions: [
        'Use format: INT./EXT. LOCATION - TIME',
        'Ensure proper spacing and punctuation',
        'Use standard time indicators (DAY, NIGHT, etc.)'
      ]
    })
  })

  // Check character name formatting
  const characterLines = scenes.filter(s => s.type === 'CHARACTER')
  const malformedCharacters = characterLines.filter(s =>
    s.content !== s.content.toUpperCase() || s.content.includes('.')
  )

  malformedCharacters.forEach(scene => {
    insights.push({
      category: 'Character Format',
      severity: 'LOW',
      message: 'Character name formatting issue',
      lineNumber: scene.lineNumber,
      pageNumber: scene.pageNumber,
      evidence: scene.content,
      suggestions: [
        'Use ALL CAPS for character names',
        'Avoid punctuation in character names',
        'Be consistent with character name spelling'
      ]
    })
  })

  const summary = `Format analysis found ${insights.length} formatting inconsistencies across scene headings and character names.`

  return { insights, recommendations, summary }
}

// Comprehensive Analysis
async function analyzeComprehensive(script: ScriptWithData) {
  const structureResult = await analyzeStructure(script)
  const pacingResult = await analyzePacing(script)
  const characterResult = await analyzeCharacters(script)
  const dialogueResult = await analyzeDialogue(script)
  const formatResult = await analyzeFormat(script)

  const insights = [
    ...structureResult.insights,
    ...pacingResult.insights,
    ...characterResult.insights,
    ...dialogueResult.insights,
    ...formatResult.insights
  ]

  const recommendations = [
    ...structureResult.recommendations,
    ...pacingResult.recommendations,
    ...characterResult.recommendations,
    ...dialogueResult.recommendations,
    ...formatResult.recommendations
  ]

  const highSeverityCount = insights.filter(i => i.severity === 'HIGH').length
  const mediumSeverityCount = insights.filter(i => i.severity === 'MEDIUM').length
  const lowSeverityCount = insights.filter(i => i.severity === 'LOW').length

  const summary = `Comprehensive analysis completed: ${highSeverityCount} high-priority, ${mediumSeverityCount} medium-priority, and ${lowSeverityCount} low-priority issues identified across structure, pacing, character development, dialogue, and formatting.`

  return { insights, recommendations, summary }
}

// Generate evidence from analysis insights
async function generateEvidenceFromInsights(scriptId: string, insights: AnalysisInsight[]) {
  const evidencePromises = insights.map(async (insight) => {
    // Find the scene this insight relates to
    if (insight.lineNumber) {
      const scene = await prisma.scene.findFirst({
        where: {
          scriptId,
          lineNumber: insight.lineNumber
        }
      })

      if (scene) {
        return prisma.evidence.create({
          data: {
            sceneId: scene.id,
            type: 'ANALYSIS_INSIGHT',
            content: insight.message,
            context: insight.evidence || insight.message,
            confidence: insight.severity === 'HIGH' ? 0.9 : insight.severity === 'MEDIUM' ? 0.7 : 0.5,
            tags: [insight.category.toLowerCase().replace(/\s+/g, '-'), insight.severity.toLowerCase()],
            startLine: insight.lineNumber,
            endLine: insight.lineNumber
          }
        })
      }
    }
  })

  // Filter out undefined promises and execute
  const validPromises = evidencePromises.filter(p => p)
  if (validPromises.length > 0) {
    await Promise.all(validPromises)
  }
}

// Get analysis history for a script
export async function getAnalysisHistory(scriptId: string, userId: string) {
  return await prisma.analyse.findMany({
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
  return await prisma.analyse.findFirst({
    where: {
      id: analysisId,
      script: {
        userId
      }
    }
  })
}