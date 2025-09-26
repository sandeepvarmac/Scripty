// Enhanced PDF parser for screenplay files
// Implements a pragmatic PDF parsing pipeline:
// - Validates PDF & text layer
// - Supports password-protected PDFs (via pdf-parse options)
// - Fallback OCR stub (throws actionable error if truly image-only)
// - Classifies lines into screenplay elements
// - Emits a LINEAR stream of Scene items
// - Populates elementCounts + qualityIndicators for compliance gating
// - Adds slugInfo + sceneNumber on scene headings

import pdfParse from 'pdf-parse'
import { ParsedScript, Scene, ParserResult } from './index'

// ---------- Heuristics & Regex ----------
const SCENE_REGEX = /^\s*(?:INT|EXT|I\/E|INT\/EXT|EST)\b/i
const TRANSITION_REGEX = /^[A-Z0-9 \-\._]+ TO:\s*$/               // e.g., CUT TO:
const UPPER_REGEX = /^[A-Z0-9 @#\-\.\(\)\'"]+$/                   // all-caps-ish
const PARENTHETICAL_REGEX = /^\(.*\)$/
const CHARACTER_CANDIDATE = /^[A-Z][A-Z0-9 .']+$/                 // candidate cue (len-checked elsewhere)

const TRANSITION_KEYWORDS = new Set([
  'FADE OUT.',
  'FADE IN.',
  'FADE TO BLACK.',
  'CUT TO BLACK.',
  'CUT TO:',
  'SMASH CUT:',
  'SMASH CUT TO:',
  'DISSOLVE TO:',
  'WIPE TO:'
])

// ---------- Types ----------
interface PDFLine {
  text: string
  x: number
  y: number
  width: number
  height: number
  page: number
}

interface ScreenplayElement {
  type: 'scene_heading' | 'character' | 'dialogue' | 'parenthetical' | 'action' | 'transition' | 'page_break'
  content: string
  page: number
  lineNumber: number
  x?: number
  y?: number
}

export async function parseEnhancedPdfFile(
  file: Buffer,
  filename: string,
  opts?: { pdfPassword?: string }
): Promise<ParserResult> {
  try {
    // 1) Validate PDF
    if (!isPdfFormat(file)) {
      return { success: false, error: 'Invalid PDF file format' }
    }

    // 2) Attempt text extraction; handle password
    const hasTextLayer = await checkTextLayer(file)
    let textContent = ''
    let pageCount = 1

    if (hasTextLayer) {
      try {
        const pdfData = await (pdfParse as any)(file, opts?.pdfPassword ? { password: opts.pdfPassword } : undefined)
        textContent = pdfData.text || ''
        pageCount = pdfData.numpages || 1
      } catch (error: any) {
        if (error?.message?.toLowerCase()?.includes('password') || error?.message?.toLowerCase()?.includes('encrypted')) {
          return {
            success: false,
            error: 'PDF is password-protected. Please provide the correct password.',
            warnings: ['This PDF requires a password to be parsed']
          }
        }
        throw error
      }
    } else {
      // 3) OCR fallback (stubbed with actionable message for MVP)
      const ocrResult = await performOCR(file)
      textContent = ocrResult.text
      pageCount = ocrResult.pageCount
    }

    // 4) Parse text into pseudo-positioned lines
    const lines = parseTextIntoLines(textContent, pageCount)

    // 5) Remove repeated headers/footers
    const cleanedLines = removeHeadersFooters(lines)

    // 6) Classify lines into screenplay elements
    const elements = classifyScreenplayElements(cleanedLines)

    // 7) Convert to Scene stream (LINEAR); add slugInfo + sceneNumber on scene headings
    const scenes = convertElementsToScenes(elements)

    // 8) Title/Author extraction (best-effort)
    const { title, author } = extractTitlePageInfo(textContent)

    // 9) Character list (from character elements)
    const characters = extractCharacters(scenes)

    // 10) Metadata for compliance & insights
    const enhancedMetadata = extractEnhancedMetadata(elements, cleanedLines, hasTextLayer)
    const structuralAnalysis = analyzeStructure(scenes)
    const qualityIndicators = assessQuality(elements, cleanedLines, hasTextLayer)

    const result: ParsedScript = {
      title: title || extractInlineTitle(textContent),
      author,
      format: 'pdf',
      pageCount,
      scenes,
      characters,
      metadata: {
        parsedAt: new Date(),
        originalFilename: filename,
        fileSize: file.length,
        titlePageDetected: !!(title || author),
        bodyPages: pageCount - (title || author ? 1 : 0),
        renderingMethod: hasTextLayer ? 'pdf-text-extraction' : 'pdf-ocr',
        screenplayFormat: enhancedMetadata.screenplayFormat,
        elementCounts: enhancedMetadata.elementCounts,
        structuralAnalysis,
        qualityIndicators
      }
    }

    return {
      success: true,
      data: result,
      warnings: hasTextLayer ? [] : ['PDF appears scanned — OCR path used (lower reliability)']
    }
  } catch (error) {
    return {
      success: false,
      error: `Enhanced PDF parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ---------- Stage helpers ----------

function isPdfFormat(file: Buffer): boolean {
  const head = file.toString('latin1', 0, 8)
  return head.startsWith('%PDF-')
}

async function checkTextLayer(file: Buffer): Promise<boolean> {
  try {
    const data = await (pdfParse as any)(file)
    const text = data.text.trim()
    return text.length > 50 && text.split(/\s+/).length > 10
  } catch {
    return false
  }
}

async function performOCR(file: Buffer): Promise<{ text: string; pageCount: number }> {
  // MVP note: true OCR not implemented here to keep deps lean.
  // Strategy: try pdf-parse first; if still empty → actionable error.
  try {
    const data = await (pdfParse as any)(file)
    const raw = data.text || ''
    if (raw.trim().length > 10) {
      return { text: raw, pageCount: data.numpages || 1 }
    }
    throw new Error('PDF appears to be image-based and requires OCR. Convert to a text-based PDF or upload .fdx/.fountain.')
  } catch (e: any) {
    throw new Error(`OCR processing failed: ${e?.message || 'Unknown error'}`)
  }
}

function parseTextIntoLines(text: string, pageCount: number): PDFLine[] {
  const lines: PDFLine[] = []
  const pages = text.split(/=== PAGE BREAK ===|\f|\n\s*\n\s*\n/) // crude page separators

  pages.forEach((pageText, pageIndex) => {
    const pageLines = pageText.split('\n')
    pageLines.forEach((lineText, lineIndex) => {
      const cleanText = lineText.trim()
      if (!cleanText) return
      lines.push({
        text: cleanText,
        x: estimateXPosition(cleanText),
        y: lineIndex * 12,                 // approx line height
        width: cleanText.length * 6,       // approx char width
        height: 12,
        page: pageIndex + 1
      })
    })
  })

  // fallback: if split heuristic undercounted pages
  if (lines.length && pages.length < pageCount) {
    // we won't reshard; the current approach still gives usable features
  }

  return lines
}

function estimateXPosition(text: string): number {
  const leftMargin = 72 // 1 inch
  if (SCENE_REGEX.test(text) && text === text.toUpperCase()) return leftMargin
  if (UPPER_REGEX.test(text) && text.length <= 40) return leftMargin + 180 // ~3.5"
  if (PARENTHETICAL_REGEX.test(text)) return leftMargin + 150              // ~3.1"
  // dialogue & action fallbacks
  return leftMargin + 108
}

function removeHeadersFooters(lines: PDFLine[]): PDFLine[] {
  const byPage = new Map<number, PDFLine[]>()
  lines.forEach((l) => {
    if (!byPage.has(l.page)) byPage.set(l.page, [])
    byPage.get(l.page)!.push(l)
  })

  const headerCounts = new Map<string, number>()
  const footerCounts = new Map<string, number>()

  byPage.forEach((pls) => {
    pls.sort((a, b) => a.y - b.y)
    if (!pls.length) return
    const top = pls[0]
    const bottom = pls[pls.length - 1]
    if (top.text.length <= 50) headerCounts.set(top.text, (headerCounts.get(top.text) || 0) + 1)
    if (bottom.text.length <= 50) footerCounts.set(bottom.text, (footerCounts.get(bottom.text) || 0) + 1)
  })

  const pageThreshold = Math.max(2, Math.floor(byPage.size * 0.6))
  const headersToRemove = new Set<string>()
  const footersToRemove = new Set<string>()
  headerCounts.forEach((count, text) => { if (count >= pageThreshold) headersToRemove.add(text) })
  footerCounts.forEach((count, text) => { if (count >= pageThreshold) footersToRemove.add(text) })

  return lines.filter((l) => !headersToRemove.has(l.text) && !footersToRemove.has(l.text))
}

function classifyScreenplayElements(lines: PDFLine[]): ScreenplayElement[] {
  const elements: ScreenplayElement[] = []
  let pendingCharacter: string | null = null
  let currentPage = 1

  lines.forEach((line, idx) => {
    const text = line.text.trim()
    if (!text) return

    const upperText = text.toUpperCase()

    // synthetic page_break markers when page changes
    if (line.page !== currentPage) {
      elements.push({ type: 'page_break', content: '', page: currentPage, lineNumber: idx, x: 0, y: line.y })
      currentPage = line.page
    }

    // Scene heading: ALL CAPS + SCENE_REGEX
    if (SCENE_REGEX.test(text) && text === text.toUpperCase()) {
      elements.push({ type: 'scene_heading', content: text, page: line.page, lineNumber: idx, x: line.x, y: line.y })
      pendingCharacter = null
      return
    }

    // Transition: ALL CAPS, right-ish, ends with TO:
    if (UPPER_REGEX.test(text) && TRANSITION_REGEX.test(text) && line.x > 300) {
      elements.push({ type: 'transition', content: text, page: line.page, lineNumber: idx, x: line.x, y: line.y })
      pendingCharacter = null
      return
    }

    // Transition keywords without TO:
    if (UPPER_REGEX.test(text) && TRANSITION_KEYWORDS.has(upperText)) {
      elements.push({ type: 'transition', content: text, page: line.page, lineNumber: idx, x: line.x, y: line.y })
      pendingCharacter = null
      return
    }

    // Character cue: ALL CAPS, short, centered-ish
    if (CHARACTER_CANDIDATE.test(text) && text.length <= 40 && line.x > 200 && line.x < 350) {
      const cleanCharacter = text.replace(/\s*\((?:CONT'D|MORE|O\.S\.|V\.O\.)\)\s*$/i, '').trim()
      elements.push({ type: 'character', content: cleanCharacter, page: line.page, lineNumber: idx, x: line.x, y: line.y })
      pendingCharacter = cleanCharacter
      return
    }

    // Parenthetical: within parentheses, centered-ish
    if (PARENTHETICAL_REGEX.test(text) && line.x > 150 && line.x < 250) {
      elements.push({ type: 'parenthetical', content: text, page: line.page, lineNumber: idx, x: line.x, y: line.y })
      return
    }

    // Dialogue: moderately indented and preceded by character
    if (line.x > 100 && line.x < 300 && pendingCharacter) {
      elements.push({ type: 'dialogue', content: text, page: line.page, lineNumber: idx, x: line.x, y: line.y })
      return
    }

    // Default: action
    elements.push({ type: 'action', content: text, page: line.page, lineNumber: idx, x: line.x, y: line.y })
    pendingCharacter = null
  })

  return elements
}

function convertElementsToScenes(elements: ScreenplayElement[]): Scene[] {
  const scenes: Scene[] = []

  elements.forEach((el, index) => {
    if (el.type === 'page_break') return

    let mappedType: Scene['type']
    switch (el.type) {
      case 'scene_heading': mappedType = 'scene'; break
      case 'character': mappedType = 'character'; break
      case 'dialogue': mappedType = 'dialogue'; break
      case 'parenthetical': mappedType = 'parenthetical'; break
      case 'transition': mappedType = 'transition'; break
      case 'action':
      default: mappedType = 'action'; break
    }

    const scene: Scene = {
      id: `pdf-${index}`,
      type: mappedType,
      content: el.content,
      pageNumber: el.page,
      lineNumber: el.lineNumber
    }

    if (mappedType === 'dialogue') {
      scene.character = findPreviousCharacter(elements, index)
    }

    if (mappedType === 'scene') {
      scene.sceneNumber = extractSceneNumber(el.content)
      const slug = parseSceneSlug(el.content)
      if (Object.keys(slug).length) scene.slugInfo = slug
    }

    scenes.push(scene)
  })

  return scenes
}

function findPreviousCharacter(elements: ScreenplayElement[], currentIndex: number): string | undefined {
  for (let i = currentIndex - 1; i >= 0 && currentIndex - i <= 20; i--) {
    if (elements[i].type === 'character') {
      return elements[i].content
    }
    if (elements[i].type === 'scene_heading') break
  }
  return undefined
}

function extractTitlePageInfo(text: string): { title?: string; author?: string } {
  const lines = text.split('\n').slice(0, 30)
  let title: string | undefined
  let author: string | undefined

  lines.forEach((line) => {
    const clean = line.trim()
    if (!title && clean.length > 3 && clean.length < 100) {
      if (clean === clean.toUpperCase() && !SCENE_REGEX.test(clean) && !clean.includes('FADE') && clean.split(' ').length <= 8) {
        title = clean
      }
    }
    if (clean.toLowerCase().includes('written by') || clean.toLowerCase().startsWith('by ') || clean.toLowerCase().includes('author:')) {
      const m = clean.match(/(?:written\s+by|by\s+|author:\s*)(.+)/i)
      if (m) author = m[1].trim()
    }
  })

  return { title, author }
}

function extractInlineTitle(text: string): string | undefined {
  const lines = text.split('\n').slice(0, 10)
  for (const line of lines) {
    const clean = line.trim()
    if (clean.length > 3 && clean.length < 80 && clean === clean.toUpperCase() && !SCENE_REGEX.test(clean) && !clean.includes('FADE')) {
      return clean
    }
  }
  return undefined
}

function extractCharacters(scenes: Scene[]): string[] {
  const set = new Set<string>()
  scenes.forEach((s) => {
    if (s.type === 'character' && s.content) {
      const clean = s.content.replace(/\s*\((?:CONT'D|MORE|O\.S\.|V\.O\.)\)\s*$/i, '').trim()
      if (clean.length > 1) set.add(clean)
    }
  })
  return Array.from(set).sort()
}

// ---------- Metadata extraction for compliance ----------

function extractEnhancedMetadata(elements: ScreenplayElement[], lines: PDFLine[], hasTextLayer: boolean) {
  const elementCounts = {
    sceneHeadings: elements.filter((e) => e.type === 'scene_heading').length,
    actionBlocks: elements.filter((e) => e.type === 'action').length,
    characterCues: elements.filter((e) => e.type === 'character').length,
    dialogueLines: elements.filter((e) => e.type === 'dialogue').length,
    parentheticals: elements.filter((e) => e.type === 'parenthetical').length,
    transitions: elements.filter((e) => e.type === 'transition').length
  }

  const margins = analyzeMargins(lines)
  const fontAnalysis = analyzeFontAndSpacing(lines)

  return {
    screenplayFormat: {
      fontFamily: fontAnalysis.detectedFont,
      fontSize: fontAnalysis.averageFontSize,
      margins,
      pageLayout: {
        standardFormat: isStandardScreenplayFormat(margins, fontAnalysis),
        courierFont: fontAnalysis.likelyCourier,
        properSpacing: fontAnalysis.properSpacing
      }
    },
    elementCounts
  }
}

function analyzeStructure(scenes: Scene[]) {
  const headings = scenes.filter((s) => s.type === 'scene').length
  const dlg = scenes.filter((s) => s.type === 'dialogue').length
  const act = scenes.filter((s) => s.type === 'action').length

  const dialogueRatio = (dlg + act) > 0 ? dlg / (dlg + act) : 0
  const baseRuntime = Math.max(1, headings) / 50 // very rough proxy
  const estimatedRuntime = Math.round(baseRuntime * (dialogueRatio > 0.6 ? 1.2 : 1.0))

  return {
    estimatedRuntime,
    averageSceneLength: headings > 0 ? act / headings : act,
    dialogueToActionRatio: dialogueRatio
  }
}

function assessQuality(elements: ScreenplayElement[], lines: PDFLine[], hasTextLayer: boolean) {
  const hasSceneHeadings = elements.some((e) => e.type === 'scene_heading')
  const hasCharacters = elements.some((e) => e.type === 'character')
  const hasDialogue = elements.some((e) => e.type === 'dialogue')
  const hasAction = elements.some((e) => e.type === 'action')

  const margins = analyzeMargins(lines)
  const hasConsistentMargins = isConsistentMargins(margins)

  return {
    hasProperFormatting: hasSceneHeadings && hasCharacters && hasDialogue && hasAction,
    hasConsistentMargins,
    hasStandardElements: hasSceneHeadings && (hasCharacters || hasDialogue),
    ocrConfidence: hasTextLayer ? 1.0 : 0.7
  }
}

function analyzeMargins(lines: PDFLine[]) {
  if (!lines.length) return { left: 72, right: 72, top: 72, bottom: 72 }
  const lefts = lines.map((l) => l.x).filter((x) => x > 0)
  const pageWidth = 612
  const rights = lines.map((l) => l.x + l.width)
  return {
    left: Math.min(...lefts) || 72,
    right: pageWidth - Math.max(...rights) || 72,
    top: 72,
    bottom: 72
  }
}

function analyzeFontAndSpacing(lines: PDFLine[]) {
  const averageCharWidth = lines.length ? lines.reduce((s, l) => s + (l.width / Math.max(1, l.text.length)), 0) / lines.length : 6
  const likelyCourier = averageCharWidth >= 6 && averageCharWidth <= 8
  const averageFontSize = lines.length ? Math.round(lines.reduce((s, l) => s + l.height, 0) / lines.length) : 12
  return {
    detectedFont: likelyCourier ? 'Courier' : 'Unknown',
    averageFontSize,
    likelyCourier,
    properSpacing: averageFontSize >= 11 && averageFontSize <= 13
  }
}

function isStandardScreenplayFormat(margins: any, fontAnalysis: any): boolean {
  return (
    margins.left >= 100 && margins.left <= 120 &&
    margins.right >= 60 && margins.right <= 90 &&
    fontAnalysis.likelyCourier && fontAnalysis.properSpacing
  )
}

function isConsistentMargins(margins: any): boolean {
  return margins.left > 50 && margins.right > 30
}

// ---------- Slug & numbering helpers ----------

function extractSceneNumber(line: string): string | undefined {
  const m = line.match(/^(\d+[A-Z]?)\s+/) || line.match(/\s+(\d+[A-Z]?)$/)
  return m?.[1]
}

function parseSceneSlug(line: string): { intExt?: string; location?: string; tod?: string } {
  const normalized = line.replace(/[\u2013\u2014]/g, '-')
                         .replace(/^\d+[A-Z]?\s*/, '')
                         .trim()

  const match = normalized.match(/^(INT\.?|EXT\.?|INT\/EXT\.?|I\/E\.?)\s+(.+?)(?:\s*[-\u2013\u2014]\s*(.+))?$/i)
  if (match) {
    let intExt = match[1].replace('.', '').toUpperCase()
    if (intExt === 'I/E') intExt = 'INT/EXT'
    const location = match[2]?.trim()
    const tod = match[3]?.trim()?.toUpperCase()
    return { intExt, location, tod }
  }

  const simple = normalized.match(/^(INT\.?|EXT\.?|INT\/EXT\.?|I\/E\.?)\s+(.+)$/i)
  if (simple) {
    let intExt = simple[1].replace('.', '').toUpperCase()
    if (intExt === 'I/E') intExt = 'INT/EXT'
    const location = simple[2]?.trim()
    return { intExt, location }
  }

  return { location: normalized }
}
