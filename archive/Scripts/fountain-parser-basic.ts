// Fountain format parser
// Fountain is a simple markup syntax for writing screenplays in plain text

import { ParsedScript, Scene, ParserResult } from './index'

export async function parseFountainFile(file: Buffer, filename: string): Promise<ParserResult> {
  try {
    const content = file.toString('utf-8')
    const lines = content.split('\n')

    const scenes: Scene[] = []
    const characters = new Set<string>()
    let currentPageNumber = 1
    let lineNumber = 0

    // Fountain metadata extraction
    const metadata = extractFountainMetadata(lines)

    for (let i = 0; i < lines.length; i++) {
      lineNumber++
      const line = lines[i].trim()

      if (!line) continue

      // Scene headers (INT./EXT.)
      if (isSceneHeader(line)) {
        scenes.push({
          id: `scene-${scenes.length + 1}`,
          type: 'scene',
          content: line,
          pageNumber: currentPageNumber,
          lineNumber,
          sceneNumber: extractSceneNumber(line)
        })
        continue
      }

      // Character names (ALL CAPS followed by dialogue)
      if (isCharacterName(line, lines[i + 1])) {
        const characterName = line.replace(/\s*\(.*\)$/, '') // Remove parentheticals
        characters.add(characterName)

        scenes.push({
          id: `character-${scenes.length + 1}`,
          type: 'character',
          content: line,
          pageNumber: currentPageNumber,
          lineNumber,
          character: characterName
        })

        // Process following dialogue
        let j = i + 1
        while (j < lines.length && lines[j].trim() && !isSceneHeader(lines[j]) && !isCharacterName(lines[j], lines[j + 1])) {
          const dialogueLine = lines[j].trim()

          if (dialogueLine.startsWith('(') && dialogueLine.endsWith(')')) {
            // Parenthetical
            scenes.push({
              id: `parenthetical-${scenes.length + 1}`,
              type: 'parenthetical',
              content: dialogueLine,
              pageNumber: currentPageNumber,
              lineNumber: j + 1,
              character: characterName
            })
          } else {
            // Dialogue
            scenes.push({
              id: `dialogue-${scenes.length + 1}`,
              type: 'dialogue',
              content: dialogueLine,
              pageNumber: currentPageNumber,
              lineNumber: j + 1,
              character: characterName
            })
          }
          j++
        }
        i = j - 1 // Skip processed dialogue lines
        continue
      }

      // Transitions (TO:, FADE IN:, etc.)
      if (isTransition(line)) {
        scenes.push({
          id: `transition-${scenes.length + 1}`,
          type: 'transition',
          content: line,
          pageNumber: currentPageNumber,
          lineNumber
        })
        continue
      }

      // Action/Description lines
      if (line && !line.startsWith('[[') && !line.startsWith('/*')) {
        scenes.push({
          id: `action-${scenes.length + 1}`,
          type: 'action',
          content: line,
          pageNumber: currentPageNumber,
          lineNumber
        })
      }

      // Estimate page breaks (55 lines per page is standard)
      if (lineNumber % 55 === 0) {
        currentPageNumber++
      }
    }

    const result: ParsedScript = {
      title: metadata.title,
      author: metadata.author,
      format: 'fountain',
      pageCount: currentPageNumber,
      scenes,
      characters: Array.from(characters),
      metadata: {
        parsedAt: new Date(),
        originalFilename: filename,
        fileSize: file.length
      }
    }

    return {
      success: true,
      data: result,
      warnings: metadata.warnings
    }

  } catch (error) {
    return {
      success: false,
      error: `Fountain parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

function extractFountainMetadata(lines: string[]) {
  const metadata: { title?: string; author?: string; warnings: string[] } = { warnings: [] }

  // Look for title page metadata at the beginning
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const line = lines[i].trim()

    if (line.toLowerCase().startsWith('title:')) {
      metadata.title = line.substring(6).trim()
    } else if (line.toLowerCase().startsWith('author:') || line.toLowerCase().startsWith('written by:')) {
      metadata.author = line.split(':')[1]?.trim()
    }
  }

  return metadata
}

function isSceneHeader(line: string): boolean {
  const upperLine = line.toUpperCase()
  return upperLine.startsWith('INT.') ||
         upperLine.startsWith('EXT.') ||
         upperLine.startsWith('INT ') ||
         upperLine.startsWith('EXT ')
}

function isCharacterName(line: string, nextLine?: string): boolean {
  // Character names are typically all caps and followed by dialogue
  if (!line || line !== line.toUpperCase()) return false

  // Must have some dialogue or parenthetical following
  if (!nextLine || !nextLine.trim()) return false

  // Exclude action lines that might be all caps
  if (line.includes('.') && (line.includes('INT') || line.includes('EXT'))) return false

  return true
}

function isTransition(line: string): boolean {
  const upperLine = line.toUpperCase()
  return upperLine.endsWith(' TO:') ||
         upperLine === 'FADE IN:' ||
         upperLine === 'FADE OUT:' ||
         upperLine === 'FADE TO BLACK:' ||
         upperLine === 'CUT TO:'
}

function extractSceneNumber(line: string): string | undefined {
  // Look for scene numbers like "1" or "1A" at the beginning or end
  const matches = line.match(/^(\d+[A-Z]?)\s+/) || line.match(/\s+(\d+[A-Z]?)$/)
  return matches?.[1]
}