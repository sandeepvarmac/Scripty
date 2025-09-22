// Parser service for screenplay file formats
// Handles .fdx (Final Draft), .fountain, and .pdf files

// Import individual parser implementations
import { parseFdxFile } from './fdx'
import { parseFountainFile } from './fountain'
import { parseEnhancedFountainFile } from './fountain-enhanced'
import { parsePdfFile } from './pdf'

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
        return await parsePdfFile(file, filename)
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