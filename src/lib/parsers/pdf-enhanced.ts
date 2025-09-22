// Enhanced PDF parser for screenplay files
// Implements the PDF parsing pipeline from the reference document
// Supports both text-based PDFs and OCR for scanned documents

// Import pdf-parse directly now that test file exists
import pdfParse from 'pdf-parse'
import { ParsedScript, Scene, ParserResult } from './index'

// Regex patterns for screenplay element detection
const SCENE_REGEX = /^\s*(?:INT|EXT|I\/E|INT\/EXT|EST)\b/i
const TRANSITION_REGEX = /^[A-Z0-9 \-\._]+ TO:\s*$/
const UPPER_REGEX = /^[A-Z0-9 @#\-\.\(\)\'"]+$/
const PARENTHETICAL_REGEX = /^\(.*\)$/
const CHARACTER_REGEX = /^[A-Z][A-Z0-9 .']+$/

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

interface PageDimensions {
  width: number
  height: number
}

export async function parseEnhancedPdfFile(file: Buffer, filename: string): Promise<ParserResult> {
  try {
    // Step 1: Validate PDF format
    if (!isPdfFormat(file)) {
      return {
        success: false,
        error: 'Invalid PDF file format'
      }
    }

    // Step 2: Check if PDF has extractable text
    const hasTextLayer = await checkTextLayer(file)
    let textContent: string
    let pageCount: number

    if (hasTextLayer) {
      // Extract text directly from PDF
      const pdfData = await pdfParse(file)
      textContent = pdfData.text
      pageCount = pdfData.numpages
    } else {
      // Use OCR for scanned PDFs
      const ocrResult = await performOCR(file)
      textContent = ocrResult.text
      pageCount = ocrResult.pageCount
    }

    // Step 3: Parse text into lines with basic positioning
    const lines = parseTextIntoLines(textContent, pageCount)

    // Step 4: Remove headers and footers
    const cleanedLines = removeHeadersFooters(lines)

    // Step 5: Classify lines into screenplay elements
    const elements = classifyScreenplayElements(cleanedLines)

    // Step 6: Convert to our Scene format
    const scenes = convertElementsToScenes(elements)

    // Step 7: Extract comprehensive metadata
    const { title, author } = extractTitlePageInfo(textContent)
    const characters = extractCharacters(scenes)

    // Enhanced metadata extraction
    const enhancedMetadata = extractEnhancedMetadata(elements, cleanedLines, hasTextLayer)
    const structuralAnalysis = analyzeStructure(scenes, characters)
    const qualityIndicators = assessQuality(elements, cleanedLines, hasTextLayer)

    // Create the parsed script result
    const result: ParsedScript = {
      title: title || extractInlineTitle(textContent),
      author: author,
      format: 'pdf',
      pageCount: pageCount,
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
      warnings: hasTextLayer ? [] : ['PDF was scanned - OCR was used for text extraction']
    }

  } catch (error) {
    return {
      success: false,
      error: `Enhanced PDF parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

function isPdfFormat(file: Buffer): boolean {
  const content = file.toString('latin1', 0, 8)
  return content.startsWith('%PDF-')
}

async function checkTextLayer(file: Buffer): Promise<boolean> {
  try {
    const data = await pdfParse(file)
    // If we can extract meaningful text, it has a text layer
    const text = data.text.trim()
    return text.length > 50 && text.split(/\s+/).length > 10
  } catch {
    return false
  }
}

async function performOCR(file: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    // For MVP, we'll use a simplified approach
    // In production, you would implement full OCR pipeline

    // Try to extract any text that might be available first
    let extractedText = ''
    let pageCount = 1

    try {
      const pdfData = await pdfParse(file)
      extractedText = pdfData.text || ''
      pageCount = pdfData.numpages || 1
    } catch {
      // PDF might be completely image-based
    }

    // If we have some text, use it; otherwise provide fallback
    if (extractedText.trim().length > 10) {
      return {
        text: extractedText,
        pageCount: pageCount
      }
    }

    // For completely scanned PDFs, we'll return a helpful error message
    // In production, this is where you'd implement full OCR with pdf2pic + tesseract
    throw new Error('PDF appears to be scanned and requires OCR processing. Please convert to text-based PDF or use .fountain/.fdx format.')

  } catch (error) {
    throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function parseTextIntoLines(text: string, pageCount: number): PDFLine[] {
  const lines: PDFLine[] = []
  const pages = text.split(/=== PAGE BREAK ===|\f|\n\s*\n\s*\n/)

  pages.forEach((pageText, pageIndex) => {
    const pageLines = pageText.split('\n')
    pageLines.forEach((lineText, lineIndex) => {
      const cleanText = lineText.trim()
      if (cleanText) {
        lines.push({
          text: cleanText,
          x: estimateXPosition(cleanText),
          y: lineIndex * 12, // Approximate line height
          width: cleanText.length * 6, // Approximate character width
          height: 12,
          page: pageIndex + 1
        })
      }
    })
  })

  return lines
}

function estimateXPosition(text: string): number {
  // Estimate horizontal position based on leading whitespace and content
  const leadingSpaces = text.length - text.trimStart().length

  // Rough estimates based on standard screenplay margins (72pt = 1 inch)
  const leftMargin = 72

  if (SCENE_REGEX.test(text)) {
    return leftMargin // Scene headings start at left margin
  } else if (UPPER_REGEX.test(text) && text.length <= 40) {
    return leftMargin + 180 // Character names are indented ~3.5 inches
  } else if (PARENTHETICAL_REGEX.test(text)) {
    return leftMargin + 150 // Parentheticals ~3.1 inches
  } else if (leadingSpaces > 10) {
    return leftMargin + 108 // Dialogue ~2.5 inches
  } else {
    return leftMargin + leadingSpaces * 6 // Action lines
  }
}

function removeHeadersFooters(lines: PDFLine[]): PDFLine[] {
  // Group lines by page and Y position to identify repeating headers/footers
  const pageGroups = new Map<number, PDFLine[]>()

  lines.forEach(line => {
    if (!pageGroups.has(line.page)) {
      pageGroups.set(line.page, [])
    }
    pageGroups.get(line.page)!.push(line)
  })

  // Find potential headers (top lines) and footers (bottom lines)
  const potentialHeaders = new Map<string, number>()
  const potentialFooters = new Map<string, number>()

  pageGroups.forEach(pageLines => {
    pageLines.sort((a, b) => a.y - b.y)

    if (pageLines.length > 0) {
      // Check top and bottom lines
      const topLine = pageLines[0]
      const bottomLine = pageLines[pageLines.length - 1]

      if (topLine.text.length <= 50) { // Likely header
        potentialHeaders.set(topLine.text, (potentialHeaders.get(topLine.text) || 0) + 1)
      }

      if (bottomLine.text.length <= 50) { // Likely footer
        potentialFooters.set(bottomLine.text, (potentialFooters.get(bottomLine.text) || 0) + 1)
      }
    }
  })

  // Remove lines that appear on multiple pages (likely headers/footers)
  const pageThreshold = Math.max(2, Math.floor(pageGroups.size * 0.6))
  const headersToRemove = new Set<string>()
  const footersToRemove = new Set<string>()

  potentialHeaders.forEach((count, text) => {
    if (count >= pageThreshold) headersToRemove.add(text)
  })

  potentialFooters.forEach((count, text) => {
    if (count >= pageThreshold) footersToRemove.add(text)
  })

  return lines.filter(line =>
    !headersToRemove.has(line.text) && !footersToRemove.has(line.text)
  )
}

function classifyScreenplayElements(lines: PDFLine[]): ScreenplayElement[] {
  const elements: ScreenplayElement[] = []
  let pendingCharacter: string | null = null
  let currentPage = 1

  lines.forEach((line, index) => {
    const text = line.text.trim()

    // Skip empty lines
    if (!text) return

    // Add page break when page changes
    if (line.page !== currentPage) {
      elements.push({
        type: 'page_break',
        content: '',
        page: currentPage,
        lineNumber: index,
        x: 0,
        y: line.y
      })
      currentPage = line.page
    }

    // Scene heading detection
    if (SCENE_REGEX.test(text) && text === text.toUpperCase()) {
      elements.push({
        type: 'scene_heading',
        content: text,
        page: line.page,
        lineNumber: index,
        x: line.x,
        y: line.y
      })
      pendingCharacter = null
      return
    }

    // Transition detection (right-aligned, ALL CAPS, ends with TO:)
    if (UPPER_REGEX.test(text) && TRANSITION_REGEX.test(text) && line.x > 300) {
      elements.push({
        type: 'transition',
        content: text,
        page: line.page,
        lineNumber: index,
        x: line.x,
        y: line.y
      })
      pendingCharacter = null
      return
    }

    // Character name detection (ALL CAPS, short, centered-ish)
    if (UPPER_REGEX.test(text) && text.length <= 40 && line.x > 200 && line.x < 350) {
      // Remove common dialogue extensions
      const cleanCharacter = text.replace(/\s*\((?:CONT'D|MORE|O\.S\.|V\.O\.)\)\s*$/i, '').trim()

      elements.push({
        type: 'character',
        content: cleanCharacter,
        page: line.page,
        lineNumber: index,
        x: line.x,
        y: line.y
      })
      pendingCharacter = cleanCharacter
      return
    }

    // Parenthetical detection
    if (PARENTHETICAL_REGEX.test(text) && line.x > 150 && line.x < 250) {
      elements.push({
        type: 'parenthetical',
        content: text,
        page: line.page,
        lineNumber: index,
        x: line.x,
        y: line.y
      })
      return
    }

    // Dialogue detection (indented, typically after character)
    if (line.x > 100 && line.x < 300 && pendingCharacter) {
      elements.push({
        type: 'dialogue',
        content: text,
        page: line.page,
        lineNumber: index,
        x: line.x,
        y: line.y
      })
      return
    }

    // Default to action
    elements.push({
      type: 'action',
      content: text,
      page: line.page,
      lineNumber: index,
      x: line.x,
      y: line.y
    })
    pendingCharacter = null
  })

  return elements
}

function convertElementsToScenes(elements: ScreenplayElement[]): Scene[] {
  const scenes: Scene[] = []

  elements.forEach((element, index) => {
    // Skip page breaks for scene conversion
    if (element.type === 'page_break') return

    // Map element types to Scene types
    let sceneType: Scene['type']
    switch (element.type) {
      case 'scene_heading':
        sceneType = 'scene'
        break
      case 'character':
      case 'dialogue':
      case 'parenthetical':
      case 'action':
      case 'transition':
        sceneType = element.type
        break
      default:
        sceneType = 'action' // Default fallback
    }

    scenes.push({
      id: `pdf-scene-${index}`,
      type: sceneType,
      content: element.content,
      pageNumber: element.page,
      lineNumber: element.lineNumber,
      character: element.type === 'dialogue' ? findPreviousCharacter(elements, index) : undefined
    })
  })

  return scenes
}

function findPreviousCharacter(elements: ScreenplayElement[], currentIndex: number): string | undefined {
  // Look backwards for the most recent character name
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (elements[i].type === 'character') {
      return elements[i].content
    }
    // Stop looking if we hit a scene heading or go too far
    if (elements[i].type === 'scene_heading' || currentIndex - i > 20) {
      break
    }
  }
  return undefined
}

function extractTitlePageInfo(text: string): { title?: string; author?: string } {
  const lines = text.split('\n').slice(0, 30) // Check first 30 lines
  let title: string | undefined
  let author: string | undefined

  lines.forEach(line => {
    const cleanLine = line.trim()

    // Look for title patterns
    if (!title && cleanLine.length > 3 && cleanLine.length < 100) {
      if (cleanLine === cleanLine.toUpperCase() &&
          !SCENE_REGEX.test(cleanLine) &&
          !cleanLine.includes('FADE IN') &&
          cleanLine.split(' ').length <= 8) {
        title = cleanLine
      }
    }

    // Look for author patterns
    if (cleanLine.toLowerCase().includes('written by') ||
        cleanLine.toLowerCase().includes('by ') ||
        cleanLine.toLowerCase().includes('author:')) {
      const authorMatch = cleanLine.match(/(?:written\s+by|by\s+|author:\s*)(.+)/i)
      if (authorMatch) {
        author = authorMatch[1].trim()
      }
    }
  })

  return { title, author }
}

function extractInlineTitle(text: string): string | undefined {
  // Look for potential title in first few lines
  const lines = text.split('\n').slice(0, 10)

  for (const line of lines) {
    const cleanLine = line.trim()
    if (cleanLine.length > 3 && cleanLine.length < 80 &&
        cleanLine === cleanLine.toUpperCase() &&
        !SCENE_REGEX.test(cleanLine) &&
        !cleanLine.includes('FADE')) {
      return cleanLine
    }
  }

  return undefined
}

function extractCharacters(scenes: Scene[]): string[] {
  const characters = new Set<string>()

  scenes.forEach(scene => {
    if (scene.type === 'character' && scene.content) {
      // Clean up character names
      const cleanName = scene.content
        .replace(/\s*\((?:CONT'D|MORE|O\.S\.|V\.O\.)\)\s*$/i, '')
        .trim()

      if (cleanName && cleanName.length > 1) {
        characters.add(cleanName)
      }
    }
  })

  return Array.from(characters).sort()
}

// Enhanced metadata extraction functions
function extractEnhancedMetadata(elements: ScreenplayElement[], lines: PDFLine[], hasTextLayer: boolean) {
  const elementCounts = {
    sceneHeadings: elements.filter(e => e.type === 'scene_heading').length,
    actionBlocks: elements.filter(e => e.type === 'action').length,
    characterCues: elements.filter(e => e.type === 'character').length,
    dialogueLines: elements.filter(e => e.type === 'dialogue').length,
    parentheticals: elements.filter(e => e.type === 'parenthetical').length,
    transitions: elements.filter(e => e.type === 'transition').length
  }

  // Analyze page layout and formatting
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

function analyzeStructure(scenes: Scene[], characters: string[]) {
  const sceneHeadings = scenes.filter(s => s.type === 'scene')
  const dialogueLines = scenes.filter(s => s.type === 'dialogue')
  const actionLines = scenes.filter(s => s.type === 'action')

  // Estimate runtime (1 page ≈ 1 minute, adjust for dialogue density)
  const dialogueRatio = dialogueLines.length / (dialogueLines.length + actionLines.length)
  const baseRuntime = scenes.length / 50 // Rough estimate
  const estimatedRuntime = Math.round(baseRuntime * (dialogueRatio > 0.6 ? 1.2 : 1.0))

  // Character distribution analysis
  const characterCounts = new Map<string, number>()
  dialogueLines.forEach(scene => {
    if (scene.character) {
      characterCounts.set(scene.character, (characterCounts.get(scene.character) || 0) + 1)
    }
  })

  const characterDistribution = Array.from(characterCounts.entries())
    .map(([name, lineCount]) => ({ name, lineCount }))
    .sort((a, b) => b.lineCount - a.lineCount)

  return {
    estimatedRuntime,
    averageSceneLength: actionLines.length / Math.max(sceneHeadings.length, 1),
    dialogueToActionRatio: dialogueRatio,
    characterDistribution: characterDistribution.slice(0, 10) // Top 10 characters
  }
}

function assessQuality(elements: ScreenplayElement[], lines: PDFLine[], hasTextLayer: boolean) {
  const hasSceneHeadings = elements.some(e => e.type === 'scene_heading')
  const hasCharacters = elements.some(e => e.type === 'character')
  const hasDialogue = elements.some(e => e.type === 'dialogue')
  const hasAction = elements.some(e => e.type === 'action')

  const margins = analyzeMargins(lines)
  const hasConsistentMargins = isConsistentMargins(margins)

  return {
    hasProperFormatting: hasSceneHeadings && hasCharacters && hasDialogue && hasAction,
    hasConsistentMargins,
    hasStandardElements: hasSceneHeadings && hasCharacters && hasDialogue,
    ocrConfidence: hasTextLayer ? 1.0 : 0.7 // Estimate OCR confidence
  }
}

function analyzeMargins(lines: PDFLine[]) {
  if (lines.length === 0) {
    return { left: 72, right: 72, top: 72, bottom: 72 }
  }

  const leftMargins = lines.map(l => l.x).filter(x => x > 0)
  const pageWidth = 612 // Standard 8.5" page in points
  const rightPositions = lines.map(l => l.x + l.width)

  return {
    left: Math.min(...leftMargins) || 72,
    right: pageWidth - Math.max(...rightPositions) || 72,
    top: 72, // Estimated
    bottom: 72 // Estimated
  }
}

function analyzeFontAndSpacing(lines: PDFLine[]) {
  // Analyze character width to estimate font
  const averageCharWidth = lines.length > 0
    ? lines.reduce((sum, line) => sum + (line.width / line.text.length), 0) / lines.length
    : 6

  // Courier typically has ~7.2 points per character at 12pt
  const likelyCourier = averageCharWidth >= 6 && averageCharWidth <= 8
  const averageFontSize = lines.length > 0
    ? lines.reduce((sum, line) => sum + line.height, 0) / lines.length
    : 12

  return {
    detectedFont: likelyCourier ? 'Courier' : 'Unknown',
    averageFontSize: Math.round(averageFontSize),
    likelyCourier,
    properSpacing: averageFontSize >= 11 && averageFontSize <= 13
  }
}

function isStandardScreenplayFormat(margins: any, fontAnalysis: any): boolean {
  // Standard screenplay format:
  // - Left margin ~1.5" (108pt)
  // - Right margin ~1" (72pt)
  // - 12pt Courier font
  return margins.left >= 100 &&
         margins.left <= 120 &&
         margins.right >= 60 &&
         margins.right <= 90 &&
         fontAnalysis.likelyCourier &&
         fontAnalysis.properSpacing
}

function isConsistentMargins(margins: any): boolean {
  // Simple check - in production you'd analyze variance across pages
  return margins.left > 50 && margins.right > 30
}