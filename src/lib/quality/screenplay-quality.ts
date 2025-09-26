// Screenplay Quality Assessment System
// Implements 80% threshold system for AI analysis eligibility

import { NormalizedScript } from '@/lib/parsers'

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

export function assessScreenplayQuality(script: NormalizedScript): QualityAssessment {
  const issues: QualityIssue[] = []
  const strengths: string[] = []
  const recommendations: string[] = []

  // Count different element types from normalized format
  let sceneHeadingCount = 0
  let dialogueCount = 0
  let actionCount = 0
  let totalWords = 0
  const speakingCharacters = new Set<string>()

  // Flatten all elements from all scenes
  for (const scene of script.scenes) {
    for (const element of scene.elements) {
      const words = element.text ? element.text.split(/\s+/).length : 0
      totalWords += words

      switch (element.kind) {
        case 'SCENE_HEADING':
          sceneHeadingCount++
          break
        case 'DIALOGUE':
          dialogueCount++
          if (element.character) {
            speakingCharacters.add(element.character)
          }
          break
        case 'ACTION':
          actionCount++
          break
      }
    }
  }

  const characters = Array.from(speakingCharacters)
  const pages = script.pages || 0

  // Calculate individual scores
  const scores = {
    structure: assessStructure(sceneHeadingCount, script.scenes.length, issues, strengths),
    characters: assessCharacters(characters.length, issues, strengths),
    dialogue: assessDialogue(dialogueCount, issues, strengths),
    content: assessContent(pages, totalWords, issues, strengths),
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
  sceneHeadingCount: number,
  totalScenes: number,
  issues: QualityIssue[],
  strengths: string[]
): number {
  const sceneCount = sceneHeadingCount

  if (sceneCount < QUALITY_THRESHOLDS.minimumScenes) {
    issues.push({
      category: 'structure',
      severity: 'critical',
      issue: `Only ${sceneCount} scene headings found`,
      impact: `Need at least ${QUALITY_THRESHOLDS.minimumScenes} scenes for meaningful story analysis`
    })
    return 0.0
  }

  strengths.push(`Good scene structure with ${sceneCount} scene headings`)
  return sceneCount >= QUALITY_THRESHOLDS.minimumScenes * 2 ? 1.0 : 0.8
}

function assessCharacters(
  characterCount: number,
  issues: QualityIssue[],
  strengths: string[]
): number {
  if (characterCount < QUALITY_THRESHOLDS.minimumCharacters) {
    issues.push({
      category: 'characters',
      severity: 'critical',
      issue: `Only ${characterCount} characters found`,
      impact: `Need at least ${QUALITY_THRESHOLDS.minimumCharacters} speaking characters for character analysis`
    })
    return 0.0
  }

  strengths.push(`Found ${characterCount} speaking characters`)
  return characterCount >= QUALITY_THRESHOLDS.minimumCharacters * 2 ? 1.0 : 0.8
}

function assessDialogue(
  dialogueCount: number,
  issues: QualityIssue[],
  strengths: string[]
): number {
  if (dialogueCount < QUALITY_THRESHOLDS.minimumDialogue) {
    issues.push({
      category: 'dialogue',
      severity: 'critical',
      issue: `Only ${dialogueCount} dialogue lines found`,
      impact: `Need at least ${QUALITY_THRESHOLDS.minimumDialogue} dialogue exchanges for character development analysis`
    })
    return 0.2
  }

  strengths.push(`Good dialogue volume with ${dialogueCount} dialogue lines`)
  return dialogueCount >= QUALITY_THRESHOLDS.minimumDialogue * 2 ? 1.0 : 0.8
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

  strengths.push(`Sufficient content with ${pageCount} pages and ${totalWords} words`)
  return 1.0
}

function assessFormatting(
  script: NormalizedScript,
  issues: QualityIssue[],
  strengths: string[]
): number {
  // For normalized scripts, we can assume basic formatting is correct
  // since they've been successfully parsed
  const hasTitle = !!script.title
  const hasScenes = script.scenes.length > 0
  const hasCharacters = script.characters.length > 0

  if (!hasTitle) {
    issues.push({
      category: 'formatting',
      severity: 'minor',
      issue: 'Missing title',
      impact: 'Title helps with script identification'
    })
  }

  if (hasScenes && hasCharacters) {
    strengths.push('Well-formatted screenplay structure')
    return hasTitle ? 1.0 : 0.9
  }

  return 0.7
}

function generateRecommendations(
  issues: QualityIssue[],
  recommendations: string[],
  scores: Record<string, number>
): void {
  const criticalIssues = issues.filter(i => i.severity === 'critical')
  const majorIssues = issues.filter(i => i.severity === 'major')

  if (criticalIssues.length > 0) {
    recommendations.push('Address critical structural issues before submitting for AI analysis')
  }

  if (majorIssues.length > 0) {
    recommendations.push('Consider improving major issues to enhance analysis quality')
  }

  if (scores.structure < 0.8) {
    recommendations.push('Add more scene headings to improve story structure')
  }

  if (scores.characters < 0.8) {
    recommendations.push('Develop more speaking characters for richer character analysis')
  }

  if (scores.dialogue < 0.8) {
    recommendations.push('Add more dialogue to improve character voice analysis')
  }

  if (scores.content < 0.8) {
    recommendations.push('Expand content length for more comprehensive analysis')
  }
}