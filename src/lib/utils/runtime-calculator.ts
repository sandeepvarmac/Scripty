// Enhanced runtime calculation based on Time Guide and Run Time Basics
// Implements industry-standard timing estimates for different content types

export interface RuntimeEstimate {
  minutes: number
  formatted: string
  breakdown: {
    baseRuntime: number
    credits: number
    adjustment: number
    finalRuntime: number
  }
  confidence: 'high' | 'medium' | 'low'
}

export interface ScriptAnalysis {
  pageCount: number
  actionPercentage?: number
  dialoguePercentage?: number
  pacing?: 'fast' | 'medium' | 'slow'
  genre?: string[]
}

export function calculateFilmRuntime(analysis: ScriptAnalysis): RuntimeEstimate {
  const { pageCount, actionPercentage, dialoguePercentage, pacing, genre } = analysis

  // Baseline: 1 page ≈ 1 minute (industry standard)
  const baseRuntime = pageCount

  // Calculate content-based adjustments
  let adjustment = 0
  let confidence: 'high' | 'medium' | 'low' = 'medium'

  if (actionPercentage !== undefined && dialoguePercentage !== undefined) {
    // More sophisticated calculation when we have content analysis
    confidence = 'high'

    // Action-heavy content (action, chases, fights, visual gags) → slower than 1 min/page (1.2–2.0 min)
    if (actionPercentage > 60) {
      adjustment += pageCount * 0.2 // +20% for action-heavy
    } else if (actionPercentage > 80) {
      adjustment += pageCount * 0.5 // +50% for very action-heavy
    }

    // Rapid, quippy dialogue → faster (0.7–0.9 min/page)
    if (dialoguePercentage > 70) {
      adjustment -= pageCount * 0.1 // -10% for dialogue-heavy
    }
  } else {
    // Genre-based estimation when content analysis is unavailable
    confidence = 'low'

    if (genre?.some(g => ['Action', 'Adventure', 'Thriller'].includes(g))) {
      adjustment += pageCount * 0.1 // +10% for action genres
    } else if (genre?.some(g => ['Comedy', 'Drama'].includes(g))) {
      adjustment -= pageCount * 0.05 // -5% for dialogue-heavy genres
    }
  }

  // Pacing adjustments
  if (pacing === 'slow') {
    adjustment += pageCount * 0.15 // +15% for slow pacing
  } else if (pacing === 'fast') {
    adjustment -= pageCount * 0.1 // -10% for fast pacing
  }

  // Picture runtime (without credits)
  const pictureRuntime = Math.round(baseRuntime + adjustment)

  // Add typical credits time (3-5 minutes is common)
  const creditsTime = 4 // Average credits time

  const finalRuntime = pictureRuntime + creditsTime

  return {
    minutes: finalRuntime,
    formatted: formatRuntime(finalRuntime),
    breakdown: {
      baseRuntime,
      credits: creditsTime,
      adjustment: Math.round(adjustment),
      finalRuntime
    },
    confidence
  }
}

export function calculateReadingTime(pageCount: number): number {
  // Reading time is different from film runtime
  // Approximately 1.2 minutes per page for reading
  return Math.ceil(pageCount * 1.2)
}

export function analyzeScriptContent(scenes: any[]): { actionPercentage: number; dialoguePercentage: number } {
  if (!scenes || scenes.length === 0) {
    return { actionPercentage: 50, dialoguePercentage: 50 } // Default assumption
  }

  let actionCount = 0
  let dialogueCount = 0
  let otherCount = 0

  scenes.forEach(scene => {
    switch (scene.type?.toLowerCase()) {
      case 'action':
      case 'scene':
      case 'transition':
        actionCount++
        break
      case 'dialogue':
      case 'character':
      case 'parenthetical':
        dialogueCount++
        break
      default:
        otherCount++
    }
  })

  const total = actionCount + dialogueCount + otherCount
  if (total === 0) {
    return { actionPercentage: 50, dialoguePercentage: 50 }
  }

  const actionPercentage = Math.round((actionCount / total) * 100)
  const dialoguePercentage = Math.round((dialogueCount / total) * 100)

  return { actionPercentage, dialoguePercentage }
}

export function formatRuntime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}m`
}

export function getRuntimeDescription(minutes: number): string {
  if (minutes < 30) {
    return 'Short film'
  } else if (minutes < 60) {
    return 'Medium length'
  } else if (minutes < 90) {
    return 'Standard feature'
  } else if (minutes < 120) {
    return 'Long feature'
  } else {
    return 'Epic length'
  }
}

export function getActionDialogueRatio(actionPercentage: number, dialoguePercentage: number): string {
  return `${actionPercentage}/${dialoguePercentage}%`
}