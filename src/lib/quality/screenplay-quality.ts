// Screenplay Quality Assessment System
// Implements 80% threshold system for AI analysis eligibility

import { ParsedScript, Scene } from '@/lib/parsers'

export interface QualityAssessment {
  overallScore: number
  passesThreshold: boolean
  threshold: number
  issues: QualityIssue[]
  strengths: string[]
  recommendations: string[]
}

export interface QualityIssue {
  category: 'structure' | 'characters' | 'dialogue' | 'formatting' | 'content'
  severity: 'critical' | 'major' | 'minor'
  issue: string
  impact: string
}

// Strict quality thresholds for meaningful AI analysis
const QUALITY_THRESHOLDS = {
  minimumScenes: 5,           // At least 5 scene headings
  minimumCharacters: 3,       // At least 3 speaking characters
  minimumDialogue: 20,        // At least 20 dialogue exchanges
  minimumPages: 3,            // At least 3 pages
  minimumWords: 500,          // At least 500 words
  dialogueRatio: 0.25,        // At least 25% dialogue vs action
  sceneStructureRatio: 0.6,   // 60% of content should be in proper scenes
  characterConsistency: 0.5   // 50% of characters should have multiple lines
}

const MINIMUM_QUALITY_SCORE = 0.8  // 80% threshold

export function assessScreenplayQuality(script: ParsedScript): QualityAssessment {
  const issues: QualityIssue[] = []
  const strengths: string[] = []
  const recommendations: string[] = []

  // Count different element types
  const sceneHeadings = script.scenes.filter(s => s.type === 'scene')
  const characters = script.characters || []
  const dialogueScenes = script.scenes.filter(s => s.type === 'dialogue')
  const actionScenes = script.scenes.filter(s => s.type === 'action')
  const totalWords = calculateTotalWords(script.scenes)

  // Calculate individual scores
  const scores = {
    structure: assessStructure(sceneHeadings, script.scenes, issues, strengths),
    characters: assessCharacters(characters, dialogueScenes, issues, strengths),
    dialogue: assessDialogue(dialogueScenes, script.scenes, issues, strengths),
    content: assessContent(script.pageCount, totalWords, issues, strengths),
    formatting: assessFormatting(script, issues, strengths)
  }

  // Calculate overall score (weighted average)
  const weights = {
    structure: 0.25,    // 25% - Must have proper scene structure
    characters: 0.25,   // 25% - Must have speaking characters
    dialogue: 0.20,     // 20% - Must have substantial dialogue
    content: 0.15,      // 15% - Must have sufficient content
    formatting: 0.15    // 15% - Must be properly formatted
  }

  const overallScore = Object.entries(scores).reduce(
    (sum, [category, score]) => sum + score * weights[category as keyof typeof weights],
    0
  )

  // Generate recommendations based on issues
  generateRecommendations(issues, recommendations, scores)

  return {
    overallScore,
    passesThreshold: overallScore >= MINIMUM_QUALITY_SCORE,
    threshold: MINIMUM_QUALITY_SCORE,
    issues,
    strengths,
    recommendations
  }
}

function assessStructure(
  sceneHeadings: Scene[],
  allScenes: Scene[],
  issues: QualityIssue[],
  strengths: string[]
): number {
  const sceneCount = sceneHeadings.length
  const sceneRatio = sceneCount / Math.max(allScenes.length, 1)

  if (sceneCount < QUALITY_THRESHOLDS.minimumScenes) {
    issues.push({
      category: 'structure',
      severity: 'critical',
      issue: `Only ${sceneCount} scene headings found`,
      impact: `Need at least ${QUALITY_THRESHOLDS.minimumScenes} scenes for meaningful story analysis`
    })
    return 0.0
  }

  if (sceneRatio < QUALITY_THRESHOLDS.sceneStructureRatio) {
    issues.push({
      category: 'structure',
      severity: 'major',
      issue: 'Low scene structure ratio',
      impact: 'Most content appears to be action blocks rather than proper scenes'
    })
    return 0.4
  }

  strengths.push(`Good scene structure with ${sceneCount} scene headings`)
  return sceneCount >= QUALITY_THRESHOLDS.minimumScenes * 2 ? 1.0 : 0.8
}

function assessCharacters(
  characters: string[],
  dialogueScenes: Scene[],
  issues: QualityIssue[],
  strengths: string[]
): number {
  const characterCount = characters.length
  const dialogueCount = dialogueScenes.length

  if (characterCount < QUALITY_THRESHOLDS.minimumCharacters) {
    issues.push({
      category: 'characters',
      severity: 'critical',
      issue: `Only ${characterCount} characters found`,
      impact: `Need at least ${QUALITY_THRESHOLDS.minimumCharacters} speaking characters for character analysis`
    })
    return 0.0
  }

  if (dialogueCount < QUALITY_THRESHOLDS.minimumDialogue) {
    issues.push({
      category: 'dialogue',
      severity: 'critical',
      issue: `Only ${dialogueCount} dialogue lines found`,
      impact: `Need at least ${QUALITY_THRESHOLDS.minimumDialogue} dialogue exchanges for character development analysis`
    })
    return 0.2
  }

  // Check character consistency (characters with multiple lines)
  const characterLineCount = new Map<string, number>()
  dialogueScenes.forEach(scene => {
    if (scene.character) {
      characterLineCount.set(scene.character, (characterLineCount.get(scene.character) || 0) + 1)
    }
  })

  const charactersWithMultipleLines = Array.from(characterLineCount.values()).filter(count => count > 1).length
  const consistencyRatio = charactersWithMultipleLines / Math.max(characterCount, 1)

  if (consistencyRatio < QUALITY_THRESHOLDS.characterConsistency) {
    issues.push({
      category: 'characters',
      severity: 'major',
      issue: 'Characters have inconsistent dialogue',
      impact: 'Most characters speak only once, limiting character development analysis'
    })
    return 0.6
  }

  strengths.push(`${characterCount} well-developed characters with consistent dialogue`)
  return 1.0
}

function assessDialogue(
  dialogueScenes: Scene[],
  allScenes: Scene[],
  issues: QualityIssue[],
  strengths: string[]
): number {
  const dialogueCount = dialogueScenes.length
  const totalScenes = allScenes.length
  const dialogueRatio = dialogueCount / Math.max(totalScenes, 1)

  if (dialogueRatio < QUALITY_THRESHOLDS.dialogueRatio) {
    issues.push({
      category: 'dialogue',
      severity: 'major',
      issue: `Low dialogue ratio (${Math.round(dialogueRatio * 100)}%)`,
      impact: 'Insufficient dialogue for character voice and relationship analysis'
    })
    return 0.3
  }

  strengths.push(`Good dialogue balance (${Math.round(dialogueRatio * 100)}% of content)`)
  return dialogueRatio >= 0.4 ? 1.0 : 0.8
}

function assessContent(
  pageCount: number,
  totalWords: number,
  issues: QualityIssue[],
  strengths: string[]
): number {
  if (pageCount < QUALITY_THRESHOLDS.minimumPages) {
    issues.push({
      category: 'content',
      severity: 'critical',
      issue: `Only ${pageCount} pages`,
      impact: `Need at least ${QUALITY_THRESHOLDS.minimumPages} pages for story structure analysis`
    })
    return 0.0
  }

  if (totalWords < QUALITY_THRESHOLDS.minimumWords) {
    issues.push({
      category: 'content',
      severity: 'major',
      issue: `Only ${totalWords} words`,
      impact: `Need at least ${QUALITY_THRESHOLDS.minimumWords} words for comprehensive analysis`
    })
    return 0.4
  }

  strengths.push(`Substantial content: ${pageCount} pages, ${totalWords} words`)
  return 1.0
}

function assessFormatting(
  script: ParsedScript,
  issues: QualityIssue[],
  strengths: string[]
): number {
  const hasScenes = script.scenes.some(s => s.type === 'scene')
  const hasCharacters = script.scenes.some(s => s.type === 'character')
  const hasDialogue = script.scenes.some(s => s.type === 'dialogue')
  const hasAction = script.scenes.some(s => s.type === 'action')

  let score = 0.0
  let elementCount = 0

  if (hasScenes) { score += 0.3; elementCount++ }
  if (hasCharacters) { score += 0.3; elementCount++ }
  if (hasDialogue) { score += 0.2; elementCount++ }
  if (hasAction) { score += 0.2; elementCount++ }

  if (elementCount < 3) {
    issues.push({
      category: 'formatting',
      severity: 'critical',
      issue: 'Missing essential screenplay elements',
      impact: 'Cannot identify proper screenplay structure'
    })
    return 0.0
  }

  if (score < 0.8) {
    issues.push({
      category: 'formatting',
      severity: 'major',
      issue: 'Incomplete screenplay formatting',
      impact: 'Some elements may not be properly recognized for analysis'
    })
  } else {
    strengths.push('Proper screenplay formatting detected')
  }

  return score
}

function calculateTotalWords(scenes: Scene[]): number {
  return scenes.reduce((total, scene) => {
    return total + (scene.content ? scene.content.split(/\s+/).length : 0)
  }, 0)
}

function generateRecommendations(
  issues: QualityIssue[],
  recommendations: string[],
  scores: Record<string, number>
) {
  if (scores.structure < 0.5) {
    recommendations.push('Add proper scene headings (INT./EXT. LOCATION - TIME)')
    recommendations.push('Structure your story in clear, distinct scenes')
  }

  if (scores.characters < 0.5) {
    recommendations.push('Add more speaking characters (at least 3)')
    recommendations.push('Give characters multiple dialogue exchanges')
  }

  if (scores.dialogue < 0.5) {
    recommendations.push('Increase dialogue content - aim for 25-40% of total content')
    recommendations.push('Ensure characters speak in distinct voices')
  }

  if (scores.content < 0.5) {
    recommendations.push('Expand content to at least 3 pages')
    recommendations.push('Add more detailed action and scene description')
  }

  if (scores.formatting < 0.5) {
    recommendations.push('Use standard screenplay formatting')
    recommendations.push('Separate scene headings, character names, dialogue, and action')
  }

  if (recommendations.length === 0) {
    recommendations.push('Your screenplay meets quality standards for AI analysis!')
  }
}

// Export for use in upload processing
export const SCREENPLAY_QUALITY_THRESHOLDS = QUALITY_THRESHOLDS
export const SCREENPLAY_MINIMUM_SCORE = MINIMUM_QUALITY_SCORE