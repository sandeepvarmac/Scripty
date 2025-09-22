// Parser service for screenplay file formats
// Handles .fdx (Final Draft), .fountain, and .pdf files

// Import individual parser implementations
import { parseFdxFile } from './fdx'
import { parseFountainFile } from './fountain'
import { parseEnhancedFountainFile } from './fountain-enhanced'
import { parseEnhancedPdfFile } from './pdf-enhanced'

export interface ParsedScript {
  title?: string
  author?: string
  format: 'fdx' | 'fountain' | 'pdf'
  pageCount: number
  scenes: Scene[]
  characters: string[]
  metadata: {
    parsedAt: Date
    originalFilename: string
    fileSize: number
    titlePageDetected?: boolean
    bodyPages?: number
    renderingMethod?: string
    // Enhanced PDF-specific metadata based on Hollywood Screenplay Format
    screenplayFormat?: {
      fontFamily?: string
      fontSize?: number
      margins?: {
        left: number
        right: number
        top: number
        bottom: number
      }
      pageLayout?: {
        standardFormat: boolean
        courierFont: boolean
        properSpacing: boolean
      }
    }
    elementCounts?: {
      sceneHeadings: number
      actionBlocks: number
      characterCues: number
      dialogueLines: number
      parentheticals: number
      transitions: number
    }
    structuralAnalysis?: {
      estimatedRuntime?: number
      averageSceneLength?: number
      dialogueToActionRatio?: number
      characterDistribution?: Array<{ name: string, lineCount: number }>
    }
    qualityIndicators?: {
      hasProperFormatting: boolean
      hasConsistentMargins: boolean
      hasStandardElements: boolean
      ocrConfidence?: number
    }
  }
}

export interface Scene {
  id: string
  type: 'scene' | 'action' | 'dialogue' | 'character' | 'parenthetical' | 'transition'
  content: string
  pageNumber: number
  lineNumber: number
  character?: string // For dialogue
  sceneNumber?: string // For scene headers
}

export interface ParserResult {
  success: boolean
  data?: ParsedScript
  error?: string
  warnings?: string[]
}

// Main parser entry point
export async function parseScript(
  file: Buffer,
  filename: string,
  mimeType: string
): Promise<ParserResult> {
  try {
    const extension = filename.split('.').pop()?.toLowerCase()

    switch (extension) {
      case 'fdx':
        return await parseFdxFile(file, filename)
      case 'fountain':
        return await parseEnhancedFountainFile(file, filename)
      case 'pdf':
        return await parseEnhancedPdfFile(file, filename)
      default:
        return {
          success: false,
          error: `Unsupported file format: ${extension}`
        }
    }
  } catch (error) {
    return {
      success: false,
      error: `Parser error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}