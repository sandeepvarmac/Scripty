// Enhanced Parser Multiplexer for screenplay file formats
// Implements detect → route → normalize → enrich pattern
// Supports FDX, Fountain, PDF, and TXT with content-based detection

import * as crypto from 'crypto'
import { parseFdxFile } from './fdx'
import { parseEnhancedFountainFile } from './fountain-enhanced'
import { parseEnhancedPdfFile } from './pdf-enhanced'

// ===================== Public Types =====================

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
    speaks?: boolean
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

// Legacy (back-compat with your existing pipeline)
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
      characterDistribution?: Array<{ name: string; lineCount: number }>
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
  slugInfo?: {
    intExt?: string
    location?: string
    tod?: string
  }
}

export interface ScriptFile {
  name: string
  mime: string
  bytes: Buffer
  pdfPassword?: string
}

// Parser interface (unused here, kept for completeness)
export interface ScriptParser {
  parse(input: Buffer | string, opts?: any): Promise<NormalizedScript>
}

export interface ParserResult {
  success: boolean
  data?: ParsedScript
  error?: string
  warnings?: string[]
}

export interface EnhancedParserResult {
  success: boolean
  data?: NormalizedScript
  error?: string
  warnings?: string[]
  confidence?: number
  // compliance gating
  blocked?: boolean
  compliance?: {
    score: number
    reasons: string[]
    metrics: {
      sceneHeadings: number
      characterCues: number
      dialogueLines: number
      actionBlocks: number
      transitions: number
      pages: number
      scenePerPage: number
      hasProperFormatting?: boolean
      hasStandardElements?: boolean
      hasConsistentMargins?: boolean
      ocrConfidence?: number
      format: ParsedScript['format']
    }
  }
}

// ===================== Multiplexer =====================

const MIN_COMPLIANCE = 0.8 // 80% threshold gate

class ParserMux {
  private parsers: Record<string, (file: Buffer, filename: string, opts?: any) => Promise<ParserResult>>

  constructor() {
    this.parsers = {
      FDX: parseFdxFile,
      FOUNTAIN: parseEnhancedFountainFile,
      PDF: parseEnhancedPdfFile,
      TXT: parseEnhancedFountainFile // TXT uses Fountain-like heuristics
    }
  }

  async parse(file: ScriptFile): Promise<EnhancedParserResult> {
    try {
      const kind = this.detectKind(file)
      const parser = this.parsers[kind]
      if (!parser) {
        return { success: false, error: `No parser available for format: ${kind}` }
      }

      const result = await parser(file.bytes, file.name, { pdfPassword: file.pdfPassword })
      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Parse failed', warnings: result.warnings }
      }

      // Compute compliance before heavy analysis; used to gate analysis.
      const compliance = this.computeFormattingCompliance(result.data)

      if (!compliance || typeof compliance.score !== 'number') {
        console.error('Invalid compliance result:', compliance)
        return { success: false, error: 'Failed to compute compliance score' }
      }

      // Normalize (cheap) so UI can still show parse preview even if blocked
      const normalized = await this.normalize(result.data, kind, file)
      const enriched = this.enrich(normalized)

      if (compliance.score < MIN_COMPLIANCE) {
        return {
          success: true,
          blocked: true,
          data: enriched,
          warnings: [
            ...(result.warnings || []),
            `Formatting compliance ${Math.round(compliance.score * 100)}% is below the required 80%.`,
            `Fix formatting issues and re-upload to get reliable AI analysis.`
          ],
          compliance,
          confidence: enriched.meta.confidence
        }
      }

      return {
        success: true,
        data: enriched,
        warnings: result.warnings,
        compliance,
        confidence: enriched.meta.confidence
      }
    } catch (error) {
      return { success: false, error: `Multiplexer error: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
  }

  private detectKind(file: ScriptFile): 'FDX' | 'FOUNTAIN' | 'PDF' | 'TXT' {
    const extension = file.name.split('.').pop()?.toLowerCase()
    const firstBytes = file.bytes.subarray(0, 256).toString('latin1')

    if (firstBytes.startsWith('%PDF-')) return 'PDF'
    if (firstBytes.includes('<?xml') && firstBytes.includes('<FinalDraft')) return 'FDX'
    if (extension === 'fdx') return 'FDX'
    if (extension === 'fountain' || this.hasFountainSyntax(firstBytes)) return 'FOUNTAIN'
    return 'TXT'
  }

  private hasFountainSyntax(text: string): boolean {
    return /^(?:INT\.?|EXT\.?|INT\/EXT\.?|I\/E\.?|EST\.?)\s+/m.test(text) // slugs
      || /^[A-Z][A-Z0-9 .'\-]{1,40}$\n[^\n]+/m.test(text) // CHARACTER + dialogue line
      || /^=+(?:\s|$)/m.test(text) // explicit section/page breaks (optional)
  }

  // ============= Formatting Compliance Scorer =============

  private computeFormattingCompliance(parsed: ParsedScript): EnhancedParserResult['compliance'] {
    const ec = parsed.metadata.elementCounts || this.deriveElementCounts(parsed)
    const qi = parsed.metadata.qualityIndicators || {
      hasProperFormatting: false,
      hasStandardElements: false,
      hasConsistentMargins: false
    }

    const pages = Math.max(1, parsed.pageCount || 1)
    const scenePerPage = ec.sceneHeadings / pages

    const w = {
      structure: 0.35,
      dialogue: 0.25,
      formatting: 0.20,
      layout: 0.10,
      extras: 0.10
    }

    // Structure score
    const hasScenes = ec.sceneHeadings > 0
    const densityScore = hasScenes ? clamp01(1 - Math.abs(scenePerPage - 1.0) / 1.0) : 0 // ideal ~1 scene/page
    const structureScore = hasScenes ? (0.5 + 0.5 * densityScore) : 0

    // Dialogue adjacency proxy
    const dialogueAdjacency = ec.characterCues > 0 ? clamp01(ec.dialogueLines / (ec.characterCues * 1.2)) : 0
    const dialoguePresence = ec.dialogueLines > 0 && ec.characterCues > 0 ? 1 : 0
    const dialogueScore = 0.6 * dialogueAdjacency + 0.4 * dialoguePresence

    // Formatting score
    const formattingFlags = [
      qi.hasProperFormatting ? 1 : 0,
      qi.hasStandardElements ? 1 : 0
    ].filter(Boolean)
    const formattingScore = formattingFlags.length ? avg(formattingFlags) : 0.6

    // Layout score
    const layoutScore =
      parsed.format === 'pdf'
        ? avg([
            qi.hasConsistentMargins ? 1 : 0,
            qi.ocrConfidence !== undefined ? clamp01(qi.ocrConfidence) : 0.9
          ])
        : 0.9

    // Extras: transitions + balance
    const transScore = clamp01(ec.transitions / Math.max(5, ec.sceneHeadings))
    const dlgActionBalance =
      (ec.dialogueLines + ec.actionBlocks) > 0
        ? clamp01(Math.min(ec.dialogueLines, ec.actionBlocks) / Math.max(ec.dialogueLines, ec.actionBlocks))
        : 0
    const extrasScore = 0.6 * transScore + 0.4 * dlgActionBalance

    let score =
      w.structure * structureScore +
      w.dialogue * dialogueScore +
      w.formatting * formattingScore +
      w.layout * layoutScore +
      w.extras * extrasScore

    score = clamp01(score)

    const reasons: string[] = []
    if (!hasScenes) reasons.push('No scene headings detected.')
    if (scenePerPage < 0.2 || scenePerPage > 3.0) reasons.push(`Unusual scene density (${scenePerPage.toFixed(2)} scenes/page).`)
    if (ec.characterCues === 0 || ec.dialogueLines === 0) reasons.push('Missing character cues or dialogue lines.')
    if (parsed.format === 'pdf' && qi.hasConsistentMargins === false) reasons.push('Margins/spacing appear inconsistent.')
    if (qi.hasProperFormatting === false) reasons.push('Script elements deviate from standard formatting.')
    if (qi.ocrConfidence !== undefined && qi.ocrConfidence < 0.8) reasons.push('Low OCR confidence; scanned PDF may be unreliable.')

    return {
      score,
      reasons,
      metrics: {
        sceneHeadings: ec.sceneHeadings,
        characterCues: ec.characterCues,
        dialogueLines: ec.dialogueLines,
        actionBlocks: ec.actionBlocks,
        transitions: ec.transitions,
        pages,
        scenePerPage,
        hasProperFormatting: qi.hasProperFormatting,
        hasStandardElements: qi.hasStandardElements,
        hasConsistentMargins: qi.hasConsistentMargins,
        ocrConfidence: qi.ocrConfidence,
        format: parsed.format
      }
    }
  }

  private deriveElementCounts(parsed: ParsedScript) {
    const counts = {
      sceneHeadings: 0,
      actionBlocks: 0,
      characterCues: 0,
      dialogueLines: 0,
      parentheticals: 0,
      transitions: 0
    }
    for (const s of parsed.scenes) {
      switch (s.type) {
        case 'scene': counts.sceneHeadings++; break
        case 'action': counts.actionBlocks++; break
        case 'character': counts.characterCues++; break
        case 'dialogue': counts.dialogueLines++; break
        case 'parenthetical': counts.parentheticals++; break
        case 'transition': counts.transitions++; break
      }
    }
    return counts
  }

  // ============= Normalization / Enrichment =============

  private async normalize(parsed: ParsedScript, kind: string, file: ScriptFile): Promise<NormalizedScript> {
    const sha256 = crypto.createHash('sha256').update(file.bytes).digest('hex')

    const scenes = foldIntoScenes(parsed.scenes)

    // Separate speaking vs non-speaking characters by analyzing scene elements
    const { speakingCharacters, nonSpeakingCharacters } = this.categorizeCharacters(scenes)

    const characters = speakingCharacters.map((name) => {
      const firstScene = scenes.find((sc) =>
        sc.elements.some((e) => e.kind === 'DIALOGUE' && (e as any).character === name)
      )
      return { name, aliases: [], firstSceneId: firstScene?.id, speaks: true }
    })

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
        usedOCR:
          parsed.metadata.renderingMethod === 'pdf-ocr' ||
          parsed.metadata.qualityIndicators?.ocrConfidence === 0.7,
        passwordProtected: !!file.pdfPassword,
        confidence: this.calculateOverallConfidence(parsed),
        custom: {
          legacy: parsed.metadata,
          nonSpeakingCharacters
        }
      }
    }
  }

  private calculateOverallConfidence(parsed: ParsedScript): number {
    if (parsed.metadata.qualityIndicators?.ocrConfidence !== undefined) {
      return parsed.metadata.qualityIndicators.ocrConfidence
    }
    let confidence = 0.8
    if (parsed.format === 'fdx') confidence = 0.95
    if (parsed.format === 'fountain') confidence = 0.9
    if (parsed.metadata.qualityIndicators?.hasProperFormatting) confidence += 0.05
    return Math.min(confidence, 1.0)
  }

  private enrich(normalized: NormalizedScript): NormalizedScript {
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

  private countIntExt(scenes: NormalizedScript['scenes']): Record<string, number> {
    const counts: Record<string, number> = { INT: 0, EXT: 0, 'INT/EXT': 0, unknown: 0 }
    scenes.forEach((scene) => {
      const intExt = scene.slug?.intExt
      if (intExt && counts[intExt] !== undefined) counts[intExt]++
      else counts.unknown++
    })
    return counts
  }

  private categorizeCharacters(scenes: NormalizedScript['scenes']): {
    speakingCharacters: string[]
    nonSpeakingCharacters: string[]
  } {
    const speakingSet = new Set<string>()
    const potentialNonSpeakingSet = new Set<string>()

    for (const scene of scenes) {
      const elements = scene.elements

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i]
        const nextElement = elements[i + 1]

        if (element.kind === 'DIALOGUE' && 'character' in element && element.character) {
          // This is a speaking character
          speakingSet.add(element.character)
          // Remove from potential non-speaking if it was there
          potentialNonSpeakingSet.delete(element.character)
        }

        // Check if this looks like a character cue but doesn't precede dialogue
        if ((element.kind === 'ACTION' || element.kind === 'PARENTHETICAL') &&
            this.looksLikeCharacterName(element.text)) {
          // Check if the next element is dialogue with the same character
          const isFollowedByDialogue = nextElement &&
            nextElement.kind === 'DIALOGUE' &&
            'character' in nextElement &&
            nextElement.character === element.text.trim().toUpperCase()

          if (!isFollowedByDialogue && !speakingSet.has(element.text.trim().toUpperCase())) {
            potentialNonSpeakingSet.add(element.text.trim().toUpperCase())
          }
        }
      }
    }

    return {
      speakingCharacters: Array.from(speakingSet).sort(),
      nonSpeakingCharacters: Array.from(potentialNonSpeakingSet).sort()
    }
  }

  private looksLikeCharacterName(text: string): boolean {
    const trimmed = text.trim().toUpperCase()

    // Basic heuristics for character names
    if (trimmed.length < 2 || trimmed.length > 50) return false

    // Should be mostly uppercase letters and spaces
    if (!/^[A-Z][A-Z\s'.-]*$/.test(trimmed)) return false

    // Exclude common action words and transitions
    const actionWords = ['FADE', 'CUT', 'DISSOLVE', 'WIPE', 'FREEZE', 'ZOOM', 'PAN', 'TILT', 'CLOSE', 'WIDE']
    const transitions = ['TO BLACK', 'TO WHITE', 'IN', 'OUT', 'UP', 'DOWN']

    if (actionWords.some(word => trimmed.includes(word)) ||
        transitions.some(trans => trimmed.includes(trans))) {
      return false
    }

    // Exclude obvious scene elements
    if (trimmed.startsWith('INT.') || trimmed.startsWith('EXT.') ||
        trimmed.includes('DAY') || trimmed.includes('NIGHT')) {
      return false
    }

    return true
  }
}

// ===================== Scene Folding Helpers =====================

function parseSceneSlug(line: string): { intExt?: 'INT' | 'EXT' | 'INT/EXT'; location?: string; tod?: string } {
  if (!line) return {}

  const normalized = line.replace(/[\u2013\u2014]/g, '-')
                         .replace(/^\d+[A-Z]?\s*/, '')
                         .trim()

  const match = normalized.match(/^(INT\.?|EXT\.?|INT\/EXT\.?|I\/E\.?|EST\.?)\s+(.+?)(?:\s*[-\u2013\u2014]\s*(.+))?$/i)
  if (match) {
    let intExt = match[1].replace('.', '').toUpperCase()
    if (intExt === 'I/E') intExt = 'INT/EXT'
    if (intExt === 'EST') intExt = 'EXT'
    const location = match[2]?.trim()
    const tod = match[3]?.trim()?.toUpperCase()
    return {
      intExt: intExt as 'INT' | 'EXT' | 'INT/EXT',
      location,
      tod
    }
  }

  const simple = normalized.match(/^(INT\.?|EXT\.?|INT\/EXT\.?|I\/E\.?|EST\.?)\s+(.+)$/i)
  if (simple) {
    let intExt = simple[1].replace('.', '').toUpperCase()
    if (intExt === 'I/E') intExt = 'INT/EXT'
    if (intExt === 'EST') intExt = 'EXT'
    const location = simple[2]?.trim()
    return {
      intExt: intExt as 'INT' | 'EXT' | 'INT/EXT',
      location
    }
  }

  return { location: normalized }
}

function foldIntoScenes(scenes: Scene[]): NormalizedScript['scenes'] {
  const result: NormalizedScript['scenes'] = []
  let currentScene: NormalizedScript['scenes'][0] | null = null
  let sceneNumber = 1

  for (const scene of scenes) {
    if (scene.type === 'scene') {
      // Start a new scene
      if (currentScene) {
        result.push(currentScene)
      }

      const slug = parseSceneSlug(scene.content)
      currentScene = {
        id: scene.id,
        number: sceneNumber++,
        pageStart: scene.pageNumber,
        pageEnd: scene.pageNumber,
        slug,
        elements: [
          {
            kind: 'SCENE_HEADING',
            text: scene.content,
            confidence: scene.confidence
          }
        ]
      }
    } else if (currentScene) {
      // Add element to current scene
      currentScene.pageEnd = Math.max(currentScene.pageEnd || 0, scene.pageNumber)

      let kind: 'ACTION' | 'DIALOGUE' | 'TRANSITION' | 'SHOT' | 'PARENTHETICAL'
      switch (scene.type) {
        case 'action':
          kind = 'ACTION'
          break
        case 'dialogue':
          kind = 'DIALOGUE'
          break
        case 'transition':
          kind = 'TRANSITION'
          break
        case 'parenthetical':
          kind = 'PARENTHETICAL'
          break
        default:
          kind = 'ACTION'
      }

      if (kind === 'DIALOGUE') {
        currentScene.elements.push({
          kind,
          character: scene.character,
          text: scene.content,
          confidence: scene.confidence
        })
      } else {
        currentScene.elements.push({
          kind,
          text: scene.content,
          confidence: scene.confidence
        })
      }
    }
  }

  // Add the last scene
  if (currentScene) {
    result.push(currentScene)
  }

  return result
}

// Utility functions
function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

// ===================== Public API =====================

const mux = new ParserMux()

/**
 * Enhanced parser with compliance gating
 */
export async function parseScript(
  buffer: Buffer,
  filename: string,
  mimeType?: string,
  options?: { pdfPassword?: string }
): Promise<EnhancedParserResult> {
  const file: ScriptFile = {
    name: filename,
    mime: mimeType || '',
    bytes: buffer,
    pdfPassword: options?.pdfPassword
  }

  return await mux.parse(file)
}



