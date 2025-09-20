// Final Draft FDX format parser
// FDX is an XML-based format used by Final Draft software

import { ParsedScript, Scene, ParserResult } from './index'

export async function parseFdxFile(file: Buffer, filename: string): Promise<ParserResult> {
  try {
    const content = file.toString('utf-8')

    // Basic XML validation
    if (!content.includes('<?xml') || !content.includes('<FinalDraft')) {
      return {
        success: false,
        error: 'Invalid FDX file format'
      }
    }

    // Extract basic metadata
    const title = extractXmlValue(content, 'Title') || extractXmlValue(content, 'TitlePage')
    const author = extractXmlValue(content, 'Author') || extractXmlValue(content, 'WrittenBy')

    // Parse scenes from FDX content
    const scenes = await parseFdxScenes(content)
    const characters = extractCharactersFromFdx(content)

    // Estimate page count (FDX doesn't always have explicit page numbers)
    const pageCount = Math.max(1, Math.ceil(scenes.length / 50))

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
        fileSize: file.length
      }
    }

    return {
      success: true,
      data: result,
      warnings: ['FDX parsing is basic - some formatting may be lost']
    }

  } catch (error) {
    return {
      success: false,
      error: `FDX parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function parseFdxScenes(content: string): Promise<Scene[]> {
  const scenes: Scene[] = []
  let sceneId = 1
  let pageNumber = 1
  let lineNumber = 0

  // Extract paragraph elements which contain the screenplay content
  const paragraphMatches = content.matchAll(/<Paragraph[^>]*>(.*?)<\/Paragraph>/gs)

  for (const match of paragraphMatches) {
    lineNumber++
    const paragraphContent = match[1]

    // Extract the actual text content, removing XML tags
    const textContent = extractTextFromFdxParagraph(paragraphContent)

    if (!textContent.trim()) continue

    // Determine element type based on FDX Type attribute
    const typeMatch = match[0].match(/Type="([^"]*)"/)
    const fdxType = typeMatch?.[1] || 'Action'

    const scene: Scene = {
      id: `fdx-${sceneId++}`,
      type: mapFdxTypeToSceneType(fdxType),
      content: textContent.trim(),
      pageNumber,
      lineNumber
    }

    // Extract character name for dialogue
    if (scene.type === 'character' || scene.type === 'dialogue') {
      scene.character = extractCharacterFromFdxType(fdxType, textContent)
    }

    // Extract scene number for scene headers
    if (scene.type === 'scene') {
      scene.sceneNumber = extractSceneNumberFromFdx(textContent)
    }

    scenes.push(scene)

    // Estimate page breaks (roughly every 50 elements)
    if (sceneId % 50 === 0) {
      pageNumber++
    }
  }

  return scenes
}

function extractXmlValue(content: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, 'i')
  const match = content.match(regex)
  return match?.[1]?.trim()
}

function extractTextFromFdxParagraph(paragraphContent: string): string {
  // Remove all XML tags and decode entities
  return paragraphContent
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function mapFdxTypeToSceneType(fdxType: string): Scene['type'] {
  switch (fdxType.toLowerCase()) {
    case 'scene heading':
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

function extractCharacterFromFdxType(fdxType: string, content: string): string | undefined {
  if (fdxType.toLowerCase() === 'character') {
    // Remove parentheticals and clean up character name
    return content.replace(/\s*\(.*\)$/, '').trim()
  }
  return undefined
}

function extractSceneNumberFromFdx(content: string): string | undefined {
  // Look for scene numbers in the scene heading
  const match = content.match(/^(\d+[A-Z]?)\s+/) || content.match(/\s+(\d+[A-Z]?)$/)
  return match?.[1]
}

function extractCharactersFromFdx(content: string): string[] {
  const characters = new Set<string>()

  // Find all character paragraph types
  const characterMatches = content.matchAll(/<Paragraph[^>]*Type="Character"[^>]*>(.*?)<\/Paragraph>/gs)

  for (const match of characterMatches) {
    const characterName = extractTextFromFdxParagraph(match[1])
    if (characterName) {
      // Clean up character name (remove parentheticals)
      const cleanName = characterName.replace(/\s*\(.*\)$/, '').trim()
      if (cleanName) {
        characters.add(cleanName)
      }
    }
  }

  return Array.from(characters)
}