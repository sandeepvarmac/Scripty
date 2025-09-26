// Enhanced Fountain format parser with accurate page counting
// Emits a LINEAR stream of elements (scene markers + elements) with page numbers
// Includes elementCounts + qualityIndicators for compliance gating

import { ParsedScript, Scene, ParserResult } from './index'

interface RenderedElement {
  type: 'scene_heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'page_break'
  content: string
  lines: string[]
  character?: string
}

interface TitlePageMetadata {
  title?: string
  author?: string
  contact?: string
  draft?: string
  date?: string
  [key: string]: string | undefined
}

export async function parseEnhancedFountainFile(file: Buffer, filename: string): Promise<ParserResult> {
  try {
    const content = file.toString('utf-8')
    const lines = content.split(/\r?\n/)

    // 1) Title page detection
    const { titlePage, bodyStartIndex } = detectTitlePage(lines)

    // 2) Parse Fountain elements
    const elements = parseFountainElements(lines.slice(bodyStartIndex))

    // 3) Render to screenplay layout (wrap widths)
    const renderedElements = renderToScreenplayLayout(elements)

    // 4) Paginate to estimate page numbers
    const { pages, totalPages } = paginateElements(renderedElements)

    // 5) Convert to a LINEAR stream (scene markers + elements) with page mapping
    const scenes = convertToScenesLinear(renderedElements, pages)
    const characters = extractCharacters(renderedElements)

    // ✅ Element counts for compliance
    const elementCounts = {
      sceneHeadings: renderedElements.filter(e => e.type === 'scene_heading').length,
      actionBlocks: renderedElements.filter(e => e.type === 'action').length,
      characterCues: renderedElements.filter(e => e.type === 'character').length,
      dialogueLines: renderedElements.filter(e => e.type === 'dialogue').length,
      parentheticals: renderedElements.filter(e => e.type === 'parenthetical').length,
      transitions: renderedElements.filter(e => e.type === 'transition').length
    }

    // ✅ Formatting quality hints (Fountain has no page layout, so pragmatic defaults)
    const hasScenes = elementCounts.sceneHeadings > 0
    const hasChars = elementCounts.characterCues > 0
    const hasDlg = elementCounts.dialogueLines > 0
    const qualityIndicators = {
      hasProperFormatting: hasScenes && hasChars && hasDlg,
      hasStandardElements: hasScenes && (hasChars || hasDlg),
      hasConsistentMargins: true // not applicable to plain text; assume OK
      // ocrConfidence not applicable for Fountain/TXT
    }

    const finalPageCount = totalPages + (titlePage ? 1 : 0)

    const result: ParsedScript = {
      title: titlePage?.title || extractInlineTitle(lines),
      author: titlePage?.author,
      format: 'fountain',
      pageCount: finalPageCount,
      scenes,
      characters,
      metadata: {
        parsedAt: new Date(),
        originalFilename: filename,
        fileSize: file.length,
        titlePageDetected: !!titlePage,
        bodyPages: totalPages,
        renderingMethod: 'enhanced-fountain-algorithm',
        elementCounts,         // ✅ used by compliance scorer
        qualityIndicators      // ✅ used by compliance scorer
      }
    }

    return { success: true, data: result, warnings: [] }
  } catch (error) {
    return {
      success: false,
      error: `Enhanced Fountain parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

function detectTitlePage(lines: string[]): { titlePage: TitlePageMetadata | null; bodyStartIndex: number } {
  const metadata: TitlePageMetadata = {}
  let titlePageEnd = 0
  let foundMetadata = false

  for (let i = 0; i < Math.min(30, lines.length); i++) {
    const line = lines[i].trim()
    if (!line) continue

    const colonIndex = line.indexOf(':')
    if (colonIndex > 0 && colonIndex < line.length - 1) {
      const key = line.substring(0, colonIndex).trim().toLowerCase()
      const value = line.substring(colonIndex + 1).trim()
      if (value) {
        metadata[key] = value
        foundMetadata = true
        titlePageEnd = i + 1
      }
    } else if (foundMetadata && isSceneHeading(line)) {
      break
    } else if (foundMetadata && line && !line.startsWith('[[') && !line.startsWith('/*')) {
      break
    }
  }

  return { titlePage: foundMetadata ? metadata : null, bodyStartIndex: titlePageEnd }
}

function parseFountainElements(lines: string[]): RenderedElement[] {
  const elements: RenderedElement[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    if (!line || line.startsWith('[[') || line.startsWith('/*')) {
      i++
      continue
    }

    if (line === '===') {
      elements.push({ type: 'page_break', content: line, lines: [line] })
      i++
      continue
    }

    if (isSceneHeading(line)) {
      elements.push({ type: 'scene_heading', content: line, lines: [line] })
      i++
      continue
    }

    if (isTransition(line)) {
      elements.push({ type: 'transition', content: line, lines: [line] })
      i++
      continue
    }

    if (isCharacterCue(line, lines[i + 1])) {
      const characterName = line.replace(/\s*\(.*\)$/, '')
      elements.push({ type: 'character', content: characterName, lines: [line], character: characterName })
      i++

      // collect subsequent dialogue/parenthetical
      while (i < lines.length) {
        const nextLine = lines[i]?.trim()
        if (!nextLine) {
          i++
          break
        }
        if (isSceneHeading(nextLine) || isCharacterCue(nextLine, lines[i + 1]) || isTransition(nextLine)) break

        if (nextLine.startsWith('(') && nextLine.endsWith(')')) {
          elements.push({ type: 'parenthetical', content: nextLine, lines: [nextLine], character: characterName })
        } else {
          elements.push({ type: 'dialogue', content: nextLine, lines: [nextLine], character: characterName })
        }
        i++
      }
      continue
    }

    // Action block
    const actionLines: string[] = []
    while (i < lines.length) {
      const currentLine = lines[i].trim()
      if (!currentLine) {
        i++
        break
      }
      if (isSceneHeading(currentLine) || isCharacterCue(currentLine, lines[i + 1]) || isTransition(currentLine) || currentLine === '===') {
        break
      }
      actionLines.push(currentLine)
      i++
    }
    if (actionLines.length > 0) {
      elements.push({ type: 'action', content: actionLines.join(' '), lines: actionLines })
    }
  }

  return elements
}

function renderToScreenplayLayout(elements: RenderedElement[]): RenderedElement[] {
  return elements.map((element) => {
    let wrappedLines: string[] = []
    switch (element.type) {
      case 'scene_heading':
      case 'action':
      case 'transition':
        wrappedLines = wrapText(element.content, 60)
        break
      case 'character':
        wrappedLines = [element.content]
        break
      case 'dialogue':
        wrappedLines = wrapText(element.content, 35)
        break
      case 'parenthetical':
        wrappedLines = wrapText(element.content, 30)
        break
      case 'page_break':
        wrappedLines = [element.content]
        break
    }
    return { ...element, lines: wrappedLines }
  })
}

function paginateElements(elements: RenderedElement[]): { pages: RenderedElement[][]; totalPages: number } {
  const pages: RenderedElement[][] = []
  let currentPage: RenderedElement[] = []
  let linesOnPage = 0
  const LINES_PER_PAGE = 55

  for (const element of elements) {
    if (element.type === 'page_break') {
      if (currentPage.length > 0) {
        pages.push(currentPage)
        currentPage = []
        linesOnPage = 0
      }
      continue
    }

    const linesNeeded = element.lines.length + 1
    if (linesOnPage + linesNeeded > LINES_PER_PAGE && currentPage.length > 0) {
      pages.push(currentPage)
      currentPage = []
      linesOnPage = 0
    }

    currentPage.push(element)
    linesOnPage += linesNeeded
  }

  if (currentPage.length > 0) pages.push(currentPage)

  return { pages, totalPages: pages.length }
}

// Produce a linear stream of Scene items with page numbers
function convertToScenesLinear(rendered: RenderedElement[], pages: RenderedElement[][]): Scene[] {
  const pageOf = new Map<RenderedElement, number>()
  pages.forEach((pg, idx) => pg.forEach((el) => pageOf.set(el, idx + 1)))

  const out: Scene[] = []
  let lineNumber = 1
  let sceneCounter = 0

  for (const el of rendered) {
    const pageNumber = pageOf.get(el) ?? 1

    if (el.type === 'scene_heading') {
      sceneCounter += 1
      out.push({
        id: `scene-${sceneCounter}`,
        type: 'scene',
        content: el.content,
        pageNumber,
        lineNumber,
        sceneNumber: extractSceneNumber(el.content),
        slugInfo: parseSceneSlug(el.content)
      })
    } else if (el.type === 'character') {
      out.push({
        id: `sc-${sceneCounter}-${lineNumber}-char`,
        type: 'character',
        content: el.content,
        pageNumber,
        lineNumber,
        character: el.character
      })
    } else if (el.type === 'dialogue') {
      out.push({
        id: `sc-${sceneCounter}-${lineNumber}-dlg`,
        type: 'dialogue',
        content: el.content,
        pageNumber,
        lineNumber,
        character: el.character
      })
    } else if (el.type === 'parenthetical') {
      out.push({
        id: `sc-${sceneCounter}-${lineNumber}-par`,
        type: 'parenthetical',
        content: el.content,
        pageNumber,
        lineNumber,
        character: el.character
      })
    } else if (el.type === 'transition') {
      out.push({
        id: `sc-${sceneCounter}-${lineNumber}-trn`,
        type: 'transition',
        content: el.content,
        pageNumber,
        lineNumber
      })
    } else if (el.type === 'action') {
      out.push({
        id: `sc-${sceneCounter}-${lineNumber}-act`,
        type: 'action',
        content: el.content,
        pageNumber,
        lineNumber
      })
    }

    lineNumber += el.lines.length + 1
  }

  return out
}

function extractCharacters(elements: RenderedElement[]): string[] {
  const characters = new Set<string>()
  elements.forEach((el) => {
    if (el.type === 'character' && el.content) {
      const clean = el.content.replace(/\s*\(.*\)$/, '').trim()
      if (clean) characters.add(clean)
    }
  })
  return Array.from(characters)
}

// ---------- Helpers ----------

function isSceneHeading(line: string): boolean {
  if (!line) return false
  if (line.startsWith('.')) return true // dot-forced
  const upper = line.toUpperCase()
  return (
    upper.startsWith('INT.') ||
    upper.startsWith('EXT.') ||
    upper.startsWith('INT/EXT.') ||
    upper.startsWith('I/E.') ||
    upper.startsWith('EST.') ||
    upper.startsWith('INT ') ||
    upper.startsWith('EXT ')
  )
}

function isTransition(line: string): boolean {
  const upper = line.toUpperCase()
  return upper.endsWith(' TO:') && upper === line
}

function isCharacterCue(line: string, nextLine?: string): boolean {
  if (!line || line !== line.toUpperCase()) return false
  if (line.length > 40) return false
  if (!nextLine) return false
  const trimmedNext = nextLine.trim()
  if (!trimmedNext) return false
  if (isSceneHeading(line) || isTransition(line)) return false

  const commonActionWords = [
    'CUT TO:', 'FADE IN:', 'FADE OUT:', 'DISSOLVE TO:', 'SMASH CUT TO:',
    'A MOMENT LATER', 'LATER', 'MEANWHILE', 'SUDDENLY', 'THEN',
    'THE END', 'TITLE CARD:', 'SUPER:', 'INSERT:', 'CLOSE UP:',
    'WIDE SHOT:', 'MEDIUM SHOT:', 'TIGHT SHOT:', 'ESTABLISHING SHOT:',
    'MONTAGE:', 'SERIES OF SHOTS:'
  ]
  if (commonActionWords.some((w) => line.includes(w))) return false
  if (!/^[A-Z\s\.\(\)]+$/.test(line)) return false

  const isNextDialogue = trimmedNext !== trimmedNext.toUpperCase() && !isSceneHeading(trimmedNext) && !isTransition(trimmedNext)
  const isNextParenthetical = trimmedNext.startsWith('(') && trimmedNext.endsWith(')')
  return isNextDialogue || isNextParenthetical
}

function wrapText(text: string, maxWidth: number): string[] {
  if (!text) return []
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).length > maxWidth && cur) {
      lines.push(cur)
      cur = w
    } else {
      cur = cur ? cur + ' ' + w : w
    }
  }
  if (cur) lines.push(cur)
  return lines.length > 0 ? lines : ['']
}

function extractSceneNumber(line: string): string | undefined {
  const m = line.match(/^(\d+[A-Z]?)\s+/) || line.match(/\s+(\d+[A-Z]?)$/)
  return m?.[1]
}

function parseSceneSlug(line: string): { intExt?: string; location?: string; tod?: string } {
  const clean = line.replace(/^\d+[A-Z]?\s*/, '')
  const slugMatch = clean.match(/^(INT\.?|EXT\.?|INT\/EXT\.?|I\/E\.?)\s+(.+?)(?:\s*-\s*(.+))?$/i)
  if (slugMatch) {
    let intExt = slugMatch[1].replace('.', '').toUpperCase()
    if (intExt === 'I/E') intExt = 'INT/EXT'
    const location = slugMatch[2]?.trim()
    const tod = slugMatch[3]?.trim().toUpperCase()
    return { intExt, location, tod }
  }
  const simple = clean.match(/^(INT\.?|EXT\.?|INT\/EXT\.?|I\/E\.?)\s+(.+)$/i)
  if (simple) {
    let intExt = simple[1].replace('.', '').toUpperCase()
    if (intExt === 'I/E') intExt = 'INT/EXT'
    const location = simple[2]?.trim()
    return { intExt, location }
  }
  return { location: clean.trim() }
}

function extractInlineTitle(lines: string[]): string | undefined {
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim()
    if (line && !isSceneHeading(line) && line.length < 60) return line
  }
  return undefined
}
