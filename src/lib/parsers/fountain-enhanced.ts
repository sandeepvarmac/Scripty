// Enhanced Fountain format parser with accurate page counting
// Implements industry-standard screenplay layout estimation

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

    // Step 1: Detect title page
    const { titlePage, bodyStartIndex } = detectTitlePage(lines)

    // Step 2: Parse Fountain elements
    const elements = parseFountainElements(lines.slice(bodyStartIndex))

    // Step 3: Render to screenplay layout
    const renderedElements = renderToScreenplayLayout(elements)

    // Step 4: Paginate
    const { pages, totalPages } = paginateElements(renderedElements)

    // Step 5: Convert to scenes for database storage
    const scenes = convertToScenes(elements)
    const characters = extractCharacters(elements)

    // Calculate total pages (body + title page if exists)
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
        renderingMethod: 'enhanced-fountain-algorithm'
      }
    }

    return {
      success: true,
      data: result,
      warnings: []
    }

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

  // Scan first 30 lines for key-value pairs
  for (let i = 0; i < Math.min(30, lines.length); i++) {
    const line = lines[i].trim()

    if (!line) continue

    // Check for key-value format (Key: Value)
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
      // Found a scene heading after metadata, title page ends
      break
    } else if (foundMetadata && line && !line.startsWith('[[') && !line.startsWith('/*')) {
      // Found substantial content after metadata
      break
    }
  }

  return {
    titlePage: foundMetadata ? metadata : null,
    bodyStartIndex: titlePageEnd
  }
}

function parseFountainElements(lines: string[]): RenderedElement[] {
  const elements: RenderedElement[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    // Skip empty lines and comments
    if (!line || line.startsWith('[[') || line.startsWith('/*')) {
      i++
      continue
    }

    // Manual page break
    if (line === '===') {
      elements.push({
        type: 'page_break',
        content: line,
        lines: [line]
      })
      i++
      continue
    }

    // Scene heading
    if (isSceneHeading(line)) {
      elements.push({
        type: 'scene_heading',
        content: line,
        lines: [line]
      })
      i++
      continue
    }

    // Transition
    if (isTransition(line)) {
      elements.push({
        type: 'transition',
        content: line,
        lines: [line]
      })
      i++
      continue
    }

    // Character cue (short all-caps line followed by dialogue/parenthetical)
    if (isCharacterCue(line, lines[i + 1])) {
      const characterName = line.replace(/\s*\(.*\)$/, '') // Remove parentheticals from name
      elements.push({
        type: 'character',
        content: line,
        lines: [line],
        character: characterName
      })
      i++

      // Process following dialogue and parentheticals
      while (i < lines.length) {
        const nextLine = lines[i]?.trim()

        if (!nextLine) {
          i++
          break // End of dialogue block
        }

        if (isSceneHeading(nextLine) || isCharacterCue(nextLine, lines[i + 1]) || isTransition(nextLine)) {
          break // Next element starts
        }

        if (nextLine.startsWith('(') && nextLine.endsWith(')')) {
          // Parenthetical
          elements.push({
            type: 'parenthetical',
            content: nextLine,
            lines: [nextLine],
            character: characterName
          })
        } else {
          // Dialogue
          elements.push({
            type: 'dialogue',
            content: nextLine,
            lines: [nextLine],
            character: characterName
          })
        }
        i++
      }
      continue
    }

    // Action block - accumulate until next structural boundary
    const actionLines: string[] = []
    while (i < lines.length) {
      const currentLine = lines[i].trim()

      if (!currentLine) {
        i++
        break // End of action block
      }

      if (isSceneHeading(currentLine) || isCharacterCue(currentLine, lines[i + 1]) ||
          isTransition(currentLine) || currentLine === '===') {
        break // Next element starts
      }

      actionLines.push(currentLine)
      i++
    }

    if (actionLines.length > 0) {
      elements.push({
        type: 'action',
        content: actionLines.join(' '),
        lines: actionLines
      })
    }
  }

  return elements
}

function renderToScreenplayLayout(elements: RenderedElement[]): RenderedElement[] {
  return elements.map(element => {
    let wrappedLines: string[] = []

    switch (element.type) {
      case 'scene_heading':
      case 'action':
      case 'transition':
        wrappedLines = wrapText(element.content, 60)
        break
      case 'character':
        wrappedLines = [element.content] // Character cues take one line
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

    return {
      ...element,
      lines: wrappedLines
    }
  })
}

function paginateElements(elements: RenderedElement[]): { pages: RenderedElement[][]; totalPages: number } {
  const pages: RenderedElement[][] = []
  let currentPage: RenderedElement[] = []
  let linesOnPage = 0
  const LINES_PER_PAGE = 55

  for (const element of elements) {
    // Manual page break
    if (element.type === 'page_break') {
      if (currentPage.length > 0) {
        pages.push(currentPage)
        currentPage = []
        linesOnPage = 0
      }
      continue
    }

    // Calculate lines needed (content + blank line after)
    const linesNeeded = element.lines.length + 1

    // Check if element fits on current page
    if (linesOnPage + linesNeeded > LINES_PER_PAGE && currentPage.length > 0) {
      // Start new page
      pages.push(currentPage)
      currentPage = []
      linesOnPage = 0
    }

    currentPage.push(element)
    linesOnPage += linesNeeded
  }

  // Add final page if it has content
  if (currentPage.length > 0) {
    pages.push(currentPage)
  }

  return {
    pages,
    totalPages: pages.length
  }
}

function convertToScenes(elements: RenderedElement[]): Scene[] {
  const scenes: Scene[] = []
  let lineNumber = 1
  let pageNumber = 1

  for (const element of elements) {
    scenes.push({
      id: `${element.type}-${scenes.length + 1}`,
      type: mapElementTypeToSceneType(element.type),
      content: element.content,
      pageNumber,
      lineNumber,
      character: element.character,
      sceneNumber: element.type === 'scene_heading' ? extractSceneNumber(element.content) : undefined
    })

    lineNumber += element.lines.length + 1 // +1 for blank line

    // Simple page estimation for scene storage
    if (lineNumber > pageNumber * 55) {
      pageNumber++
    }
  }

  return scenes
}

function extractCharacters(elements: RenderedElement[]): string[] {
  const characters = new Set<string>()

  elements.forEach(element => {
    if (element.character) {
      characters.add(element.character)
    }
  })

  return Array.from(characters)
}

// Helper functions
function isSceneHeading(line: string): boolean {
  if (!line) return false

  // Handle dot-forced scene headings
  if (line.startsWith('.')) {
    return true
  }

  const upperLine = line.toUpperCase()
  return upperLine.startsWith('INT.') ||
         upperLine.startsWith('EXT.') ||
         upperLine.startsWith('INT/EXT.') ||
         upperLine.startsWith('I/E.') ||
         upperLine.startsWith('EST.') ||
         upperLine.startsWith('INT ') ||
         upperLine.startsWith('EXT ')
}

function isTransition(line: string): boolean {
  const upperLine = line.toUpperCase()
  return upperLine.endsWith(' TO:') && upperLine === line
}

function isCharacterCue(line: string, nextLine?: string): boolean {
  // Must be all caps
  if (!line || line !== line.toUpperCase()) return false

  // Must be 40 chars or less
  if (line.length > 40) return false

  // Must be followed by dialogue or parenthetical
  if (!nextLine) return false

  const trimmedNext = nextLine.trim()
  if (!trimmedNext) return false

  // Exclude scene headings and transitions
  if (isSceneHeading(line) || isTransition(line)) return false

  return true
}

function wrapText(text: string, maxWidth: number): string[] {
  if (!text) return []

  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if ((currentLine + ' ' + word).length > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = currentLine ? currentLine + ' ' + word : word
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.length > 0 ? lines : ['']
}

function mapElementTypeToSceneType(type: string): string {
  switch (type) {
    case 'scene_heading': return 'scene'
    case 'action': return 'action'
    case 'character': return 'character'
    case 'dialogue': return 'dialogue'
    case 'parenthetical': return 'parenthetical'
    case 'transition': return 'transition'
    default: return 'action'
  }
}

function extractSceneNumber(line: string): string | undefined {
  const matches = line.match(/^(\d+[A-Z]?)\s+/) || line.match(/\s+(\d+[A-Z]?)$/)
  return matches?.[1]
}

function extractInlineTitle(lines: string[]): string | undefined {
  // Look for potential title in first few lines if no title page
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim()
    if (line && !isSceneHeading(line) && line.length < 60) {
      return line
    }
  }
  return undefined
}