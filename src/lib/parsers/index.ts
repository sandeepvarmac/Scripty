// Enhanced Parser Multiplexer for screenplay file formats
// Implements detect → route → normalize → enrich pattern
// Supports FDX, Fountain, PDF, and TXT with content-based detection

import crypto from 'crypto'
import { parseFdxFile } from './fdx'
import { parseEnhancedFountainFile } from './fountain-enhanced'
import { parseEnhancedPdfFile } from './pdf-enhanced'

// Enhanced Common IR (Intermediate Representation) - normalized format for all parsers
export type NormalizedScript = {
  format: 'FDX' | 'FOUNTAIN' | 'PDF' | 'TXT'
  title?: string
  author?: string
  pages?: number
  scenes: Array<{
    id: string
    number?: number
    pageStart?: number
    pageEnd?: number
    slug?: {
      intExt?: 'INT' | 'EXT' | 'INT/EXT'
      location?: string
      tod?: string
    }
    elements: Array<
      | { kind: 'SCENE_HEADING'; text: string; confidence?: number }
      | { kind: 'ACTION'; text: string; confidence?: number }
      | { kind: 'DIALOGUE'; character?: string; text: string; parenthetical?: string; confidence?: number }
      | { kind: 'TRANSITION'; text: string; confidence?: number }
      | { kind: 'SHOT'; text: string; confidence?: number }
      | { kind: 'PARENTHETICAL'; text: string; confidence?: number }
    >
  }>
  characters: Array<{
    name: string
    aliases?: string[]
    firstSceneId?: string
  }>
  meta: {
    bytes: number
    sha256: string
    revision?: string
    createdAt?: string
    parsedAt: Date
    originalFilename: string
    parsedVia: 'FDX' | 'FOUNTAIN' | 'PDF' | 'TXT'
    usedOCR: boolean
    passwordProtected: boolean
    confidence: number
    custom?: Record<string, unknown>
  }
}

// Legacy interface for backward compatibility
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
  character?: string
  sceneNumber?: string
  confidence?: number
  // Enhanced scene information
  slugInfo?: {
    intExt?: string
    location?: string
    tod?: string
  }
}

// Enhanced file input interface
export interface ScriptFile {
  name: string
  mime: string
  bytes: Buffer
  pdfPassword?: string
}

// Parser interface for specialized parsers
export interface ScriptParser {
  parse(input: Buffer | string, opts?: any): Promise<NormalizedScript>
}

export interface ParserResult {
  success: boolean
  data?: ParsedScript
  error?: string
  warnings?: string[]
}

// Enhanced result for new multiplexer
export interface EnhancedParserResult {
  success: boolean
  data?: NormalizedScript
  error?: string
  warnings?: string[]
  confidence?: number
}

// Enhanced Multiplexer Class - implements detect → route → normalize → enrich
class ParserMux {
  private parsers: Record<string, (file: Buffer, filename: string, opts?: any) => Promise<ParserResult>>

  constructor() {
    this.parsers = {
      'FDX': parseFdxFile,
      'FOUNTAIN': parseEnhancedFountainFile,
      'PDF': parseEnhancedPdfFile,
      'TXT': parseEnhancedFountainFile // TXT uses Fountain-like heuristics
    }
  }

  async parse(file: ScriptFile): Promise<EnhancedParserResult> {
    try {
      // Step 1: Detect format using MIME + bytes + extension
      const kind = this.detectKind(file)

      // Step 2: Route to specialized parser
      const parser = this.parsers[kind]
      if (!parser) {
        return {
          success: false,
          error: `No parser available for format: ${kind}`
        }
      }

      const parseOpts = {
        pdfPassword: file.pdfPassword
      }

      const result = await parser(file.bytes, file.name, parseOpts)
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Parse failed',
          warnings: result.warnings
        }
      }

      // Step 3: Convert legacy format to normalized IR
      const normalized = await this.normalize(result.data, kind, file)

      // Step 4: Enrich with additional metadata
      const enriched = this.enrich(normalized)

      return {
        success: true,
        data: enriched,
        warnings: result.warnings,
        confidence: enriched.meta.confidence
      }
    } catch (error) {
      return {
        success: false,
        error: `Multiplexer error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private detectKind(file: ScriptFile): 'FDX' | 'FOUNTAIN' | 'PDF' | 'TXT' {
    const extension = file.name.split('.').pop()?.toLowerCase()
    const firstBytes = file.bytes.subarray(0, 256).toString('latin1')

    // Content-based detection (more reliable than just extension)
    if (firstBytes.startsWith('%PDF-')) return 'PDF'
    if (firstBytes.includes('<?xml') && firstBytes.includes('<FinalDraft')) return 'FDX'
    if (extension === 'fountain' || this.hasFountainSyntax(firstBytes)) return 'FOUNTAIN'
    if (extension === 'fdx') return 'FDX'

    // Fallback to TXT for unknown formats
    return 'TXT'
  }

  private hasFountainSyntax(text: string): boolean {
    // Check for Fountain-specific syntax markers
    return /^(INT\.|EXT\.|FADE IN:|FADE OUT)/m.test(text) ||
           /^[A-Z][A-Z ]+:\s*$/m.test(text) || // Title page format
           /^\s*=/.test(text) // Scene numbers
  }

  private async normalize(parsed: ParsedScript, kind: string, file: ScriptFile): Promise<NormalizedScript> {
    const sha256 = crypto.createHash('sha256').update(file.bytes).digest('hex')

    // Convert legacy Scene format to normalized elements
    const scenes = parsed.scenes.map((scene, index) => ({
      id: scene.id,
      number: index + 1,
      pageStart: scene.pageNumber,
      pageEnd: scene.pageNumber,
      elements: [{
        kind: this.mapSceneType(scene.type),
        text: scene.content,
        character: scene.character,
        confidence: scene.confidence || 0.8
      }]
    }))

    // Extract character info
    const characters = parsed.characters.map(name => ({
      name,
      aliases: [],
      firstSceneId: scenes.find(s =>
        s.elements.some(e => e.character === name)
      )?.id
    }))

    return {
      format: kind as 'FDX' | 'FOUNTAIN' | 'PDF' | 'TXT',
      title: parsed.title,
      author: parsed.author,
      pages: parsed.pageCount,
      scenes,
      characters,
      meta: {
        bytes: file.bytes.length,
        sha256,
        parsedAt: new Date(),
        originalFilename: file.name,
        parsedVia: kind as 'FDX' | 'FOUNTAIN' | 'PDF' | 'TXT',
        usedOCR: parsed.metadata.qualityIndicators?.ocrConfidence !== undefined,
        passwordProtected: !!file.pdfPassword,
        confidence: this.calculateOverallConfidence(parsed),
        custom: {
          legacy: parsed.metadata
        }
      }
    }
  }

  private mapSceneType(type: string): 'SCENE_HEADING' | 'ACTION' | 'DIALOGUE' | 'TRANSITION' | 'SHOT' | 'PARENTHETICAL' {
    const mapping: Record<string, any> = {
      'scene': 'SCENE_HEADING',
      'action': 'ACTION',
      'dialogue': 'DIALOGUE',
      'transition': 'TRANSITION',
      'parenthetical': 'PARENTHETICAL'
    }
    return mapping[type] || 'ACTION'
  }

  private calculateOverallConfidence(parsed: ParsedScript): number {
    if (parsed.metadata.qualityIndicators?.ocrConfidence) {
      return parsed.metadata.qualityIndicators.ocrConfidence
    }

    // Base confidence on format and quality indicators
    let confidence = 0.8
    if (parsed.format === 'fdx') confidence = 0.95
    if (parsed.format === 'fountain') confidence = 0.9
    if (parsed.metadata.qualityIndicators?.hasProperFormatting) confidence += 0.05

    return Math.min(confidence, 1.0)
  }

  private enrich(normalized: NormalizedScript): NormalizedScript {
    // Add derived metadata
    const totalScenes = normalized.scenes.length
    const characters = normalized.characters.length
    const intExtCounts = this.countIntExt(normalized.scenes)

    normalized.meta.custom = {
      ...normalized.meta.custom,
      totalScenes,
      characters,
      ...intExtCounts
    }

    return normalized
  }

  private countIntExt(scenes: any[]): Record<string, number> {
    const counts = { INT: 0, EXT: 0, 'INT/EXT': 0, unknown: 0 }

    scenes.forEach(scene => {
      const intExt = scene.slug?.intExt
      if (intExt && intExt in counts) {
        counts[intExt]++
      } else {
        counts.unknown++
      }
    })

    return counts
  }
}

// Export singleton instance
const parserMux = new ParserMux()

// Enhanced parse function using new multiplexer
export async function parseScriptEnhanced(file: ScriptFile): Promise<EnhancedParserResult> {
  return parserMux.parse(file)
}

// Legacy parse function for backward compatibility
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
      case 'txt':
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