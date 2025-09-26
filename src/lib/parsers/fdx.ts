// Final Draft FDX format parser
// - Validates basic FDX structure
// - Parses <Paragraph Type="..."> stream into a LINEAR list of Scene items
// - Attributes Dialogue to the most recent Character cue
// - Adds slugInfo + sceneNumber on scene headings
// - Emits elementCounts + qualityIndicators for compliance gating

import { ParsedScript, Scene, ParserResult } from './index'

export async function parseFdxFile(file: Buffer, filename: string): Promise<ParserResult> {
  try {
    const content = file.toString('utf-8')

    // Basic XML validation
    if (!content.includes('<?xml') || !content.includes('<FinalDraft')) {
      return { success: false, error: 'Invalid FDX file format' }
    }

    // Extract basic metadata (best-effort)
    const title = extractXmlValue(content, 'Title') || extractFromTitlePage(content, 'Title')
    const author =
      extractXmlValue(content, 'Author') ||
      extractXmlValue(content, 'WrittenBy') ||
      extractFromTitlePage(content, 'Author') ||
      extractFromTitlePage(content, 'WrittenBy')

    // Parse scenes from FDX content
    const scenes = await parseFdxScenes(content)

    // Character list from Character paragraphs
    const characters = extractCharactersFromFdx(content)

    // --- elementCounts for compliance ---
    const elementCounts = countElements(scenes)

    // --- qualityIndicators for compliance ---
    const hasScenes = elementCounts.sceneHeadings > 0
    const hasChars = elementCounts.characterCues > 0
    const hasDlg = elementCounts.dialogueLines > 0
    const qualityIndicators = {
      hasProperFormatting: hasScenes && hasChars && hasDlg,
      hasStandardElements: hasScenes && (hasChars || hasDlg),
      hasConsistentMargins: true // FDX abstracts layout; treat as OK for formatting gate
      // ocrConfidence not applicable to FDX
    }

    // Estimate page count (FDX may not store explicit pagination)
    // Rough proxy: ~50 elements per page, but prefer Scene headings if present (1 page ≈ ~1–3 scenes)
    const approxByElements = Math.max(1, Math.ceil(scenes.length / 50))
    const approxByScenes = Math.max(1, Math.ceil(elementCounts.sceneHeadings / 2))
    const pageCount = hasScenes ? Math.max(approxByElements, approxByScenes) : approxByElements

    const result: ParsedScript = {
      title,
      author,
      format: 'fdx',
      pageCount,
      scenes,
      characters,
      metadata: {
        parsedAt: new Date(),
        originalFilename: filename,
        fileSize: file.length,
        elementCounts,      // used by compliance scorer
        qualityIndicators   // used by compliance scorer
      }
    }

    return {
      success: true,
      data: result,
      warnings: ['FDX parsing uses a lightweight XML pass; some fine formatting may be simplified']
    }
  } catch (error) {
    return {
      success: false,
      error: `FDX parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ------------------- Core FDX Parsing -------------------

function resolveParagraphType(node: string): string {
  const attrMatch = node.match(/\bType="([^"]*)"/i)
  if (attrMatch?.[1]) return attrMatch[1].trim().toLowerCase()

  const nestedMatch = node.match(/<Type[^>]*>([\s\S]*?)<\/Type>/i)
  if (nestedMatch?.[1]) return nestedMatch[1].trim().toLowerCase()

  return 'action'
}

async function parseFdxScenes(content: string): Promise<Scene[]> {
  const scenes: Scene[] = []
  let sceneId = 1
  let pageNumber = 1
  let lineNumber = 0

  // Keep track of the most recent Character for Dialogue attribution
  let lastCharacter: string | undefined

  // Capture explicit page breaks if present (rare)
  const pageBreakIndices = new Set<number>()
  const pageBreakRegex = /<PageBreak\s*\/>/gi
  let pageBreakMatch
  while ((pageBreakMatch = pageBreakRegex.exec(content)) !== null) {
    // We don't have a direct mapping to a paragraph index here;
    // practical approach: we will still use element-count pagination below.
    // Keeping this placeholder in case you later wire explicit pagination.
  }

  // Iterate over all Paragraph nodes
  const paragraphRegex = /<Paragraph\b[^>]*>([\s\S]*?)<\/Paragraph>/gi
  let match: RegExpExecArray | null
  let elementCounter = 0

  while ((match = paragraphRegex.exec(content)) !== null) {
    lineNumber++
    const paragraphNode = match[0]
    const paragraphInner = match[1]

    const textContent = extractTextFromFdxParagraph(paragraphInner)
    if (!textContent.trim()) continue

    // Type attribute determines screenplay element
    const typeKey = resolveParagraphType(paragraphNode)

    // Map to our Scene['type']
    const kind: Scene['type'] = mapFdxTypeToSceneType(typeKey)

    const scene: Scene = {
      id: `fdx-${sceneId++}`,
      type: kind,
      content: textContent.trim(),
      pageNumber,
      lineNumber
    }

    // Handle Character → Dialogue linkage
    if (kind === 'character') {
      // Clean character name (remove parentheticals/extensions)
      const cleaned = textContent.replace(/\s*\(.*\)$/, '').trim()
      scene.character = cleaned
      lastCharacter = cleaned
    } else if (kind === 'dialogue') {
      scene.character = lastCharacter
    }

    // Scene heading extras: sceneNumber + slugInfo
    if (kind === 'scene') {
      scene.sceneNumber = extractSceneNumberFromHeading(textContent)
      scene.slugInfo = parseSceneSlug(textContent)
      // Reset lastCharacter when a new scene begins
      lastCharacter = undefined
    }

    scenes.push(scene)

    // Heuristic pagination: bump page roughly every ~50 elements
    elementCounter++
    if (elementCounter % 50 === 0) {
      pageNumber++
    }
  }

  return scenes
}

// ------------------- Element Counting -------------------

function countElements(scenes: Scene[]) {
  const counts = {
    sceneHeadings: 0,
    actionBlocks: 0,
    characterCues: 0,
    dialogueLines: 0,
    parentheticals: 0,
    transitions: 0
  }
  for (const s of scenes) {
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

// ------------------- XML/Text Helpers -------------------

function extractXmlValue(doc: string, tagName: string): string | undefined {
  const re = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i')
  const m = doc.match(re)
  return m?.[1]?.replace(/<[^>]*>/g, '').trim() || undefined
}

// Some FDX files carry Title Page info in an explicit TitlePage structure
function extractFromTitlePage(doc: string, key: string): string | undefined {
  // Extremely lightweight pass; expand if you need richer TitlePage parsing
  const re = new RegExp(`<_${key}[^>]*>([\\s\\S]*?)<\\/_${key}>`, 'i')
  const m = doc.match(re)
  return m?.[1]?.replace(/<[^>]*>/g, '').trim() || undefined
}

function extractTextFromFdxParagraph(paragraphInnerXml: string): string {
  // Remove nested tags (Text, DualDialogue, etc.) and decode common entities
  return paragraphInnerXml
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function mapFdxTypeToSceneType(fdxTypeLower: string): Scene['type'] {
  switch (fdxTypeLower) {
    case 'scene heading':
    case 'scene_heading':
    case 'sceneheading':
      return 'scene'
    case 'character':
      return 'character'
    case 'dialogue':
      return 'dialogue'
    case 'parenthetical':
      return 'parenthetical'
    case 'transition':
      return 'transition'
    case 'action':
    default:
      return 'action'
  }
}

function extractSceneNumberFromHeading(textContent: string): string | undefined {
  const m = textContent.match(/^(\d+[A-Z]?)\s+/) || textContent.match(/\s+(\d+[A-Z]?)$/)
  return m?.[1]
}

// Parse slug into INT/EXT, LOCATION, TOD
function parseSceneSlug(line: string): { intExt?: string; location?: string; tod?: string } {
  const clean = line.replace(/^\d+[A-Z]?\s*/, '')
  const m = clean.match(/^(INT\.?|EXT\.?|INT\/EXT\.?|I\/E\.?)\s+(.+?)(?:\s*-\s*(.+))?$/i)
  if (m) {
    let intExt = m[1].replace('.', '').toUpperCase()
    if (intExt === 'I/E') intExt = 'INT/EXT'
    const location = m[2]?.trim()
    const tod = m[3]?.trim()?.toUpperCase()
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

// Extract character names by scanning Character paragraphs
function extractCharactersFromFdx(content: string): string[] {
  const set = new Set<string>()
  const paragraphRegex = /<Paragraph\b[^>]*>([\s\S]*?)<\/Paragraph>/gi
  let match: RegExpExecArray | null

  while ((match = paragraphRegex.exec(content)) !== null) {
    const node = match[0]
    if (resolveParagraphType(node) !== 'character') continue

    const raw = extractTextFromFdxParagraph(match[1])
    const clean = raw.replace(/\s*\(.*\)$/, '').trim()
    if (clean) set.add(clean)
  }
  return Array.from(set).sort()
}
