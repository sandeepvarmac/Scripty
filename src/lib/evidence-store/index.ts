// Evidence Store Service
// Handles saving parsed scripts and creating scene-level evidence for analysis

import { prisma } from '@/lib/prisma'
import { ParsedScript, Scene as ParsedScene } from '@/lib/parsers'

export interface SaveScriptOptions {
  userId: string
  parsedScript: ParsedScript
  fileUrl?: string // Optional file storage URL
}

export interface SavedScript {
  id: string
  title?: string
  format: string
  pageCount: number
  totalScenes: number
  totalCharacters: number
  status: string
}

export interface SceneEvidence {
  id: string
  type: string
  content: string
  confidence: number
  tags: string[]
}

// Main function to save parsed script data to evidence store
export async function saveScriptToEvidenceStore(
  options: SaveScriptOptions
): Promise<SavedScript> {
  const { userId, parsedScript, fileUrl } = options


  if (!parsedScript.scenes) {
    throw new Error('Parsed script missing scenes array')
  }
  if (!parsedScript.characters) {
    throw new Error('Parsed script missing characters array')
  }

  try {
    // Start a transaction to ensure data consistency (increased timeout for large scripts)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the script record
      const script = await tx.script.create({
        data: {
          userId,
          originalFilename: parsedScript.metadata.originalFilename,
          title: parsedScript.title,
          author: parsedScript.author,
          format: mapFormatToEnum(parsedScript.format),
          fileSize: parsedScript.metadata.fileSize,
          pageCount: parsedScript.pageCount,
          totalScenes: parsedScript.scenes.length,
          totalCharacters: parsedScript.characters.length,
          status: 'COMPLETED',
          processedAt: new Date(),
          fileUrl
        }
      })

      // 2. Save scenes in batches to avoid timeout
      const scenes = []
      const batchSize = 50 // Process 50 scenes at a time

      for (let i = 0; i < parsedScript.scenes.length; i += batchSize) {
        const batch = parsedScript.scenes.slice(i, i + batchSize)
        const batchScenes = await Promise.all(
          batch.map((scene, batchIndex) =>
            tx.scene.create({
              data: {
                scriptId: script.id,
                sceneNumber: scene.sceneNumber,
                type: mapSceneTypeToEnum(scene.type),
                content: scene.content,
                pageNumber: scene.pageNumber,
                lineNumber: scene.lineNumber,
                character: scene.character,
                orderIndex: i + batchIndex,
                wordCount: scene.content ? scene.content.split(' ').length : 0
              }
            })
          )
        )
        scenes.push(...batchScenes)
      }

      // 3. Save unique characters
      const characterMap = new Map<string, number>()
      parsedScript.scenes.forEach((scene) => {
        if (scene.character) {
          characterMap.set(scene.character, (characterMap.get(scene.character) || 0) + 1)
        }
      })

      const characters = await Promise.all(
        Array.from(characterMap.entries()).map(([name, dialogueCount]) =>
          tx.character.create({
            data: {
              scriptId: script.id,
              name,
              dialogueCount,
              firstAppearance: findFirstAppearance(parsedScript.scenes, name)
            }
          })
        )
      )

      // 4. Generate initial evidence from scenes
      await generateInitialEvidence(tx, script.id, scenes)

      return {
        id: script.id,
        title: script.title,
        format: script.format,
        pageCount: script.pageCount,
        totalScenes: script.totalScenes,
        totalCharacters: script.totalCharacters,
        status: script.status
      }
    }, {
      timeout: 60000 // 60 seconds timeout for very large scripts
    })

    return result

  } catch (error) {
    console.error('Error saving script to evidence store:', error)
    throw new Error(`Failed to save script: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Get script with scenes for analysis
export async function getScriptWithScenes(scriptId: string, userId: string) {
  return await prisma.script.findFirst({
    where: {
      id: scriptId,
      userId
    },
    include: {
      scenes: {
        orderBy: { orderIndex: 'asc' },
        include: {
          evidences: {
            orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }]
          }
        }
      },
      characters: {
        orderBy: { dialogueCount: 'desc' }
      },
      analyses: {
        orderBy: { startedAt: 'desc' }
      }
    }
  })
}

// Search for evidence by type and tags
export async function searchEvidence(
  scriptId: string,
  type?: string,
  tags?: string[],
  minConfidence?: number
) {
  const where: any = {
    scene: {
      scriptId
    }
  }

  if (type) {
    where.type = type
  }

  if (tags && tags.length > 0) {
    where.tags = {
      hasSome: tags
    }
  }

  if (minConfidence !== undefined) {
    where.confidence = {
      gte: minConfidence
    }
  }

  return await prisma.evidence.findMany({
    where,
    include: {
      scene: {
        select: {
          content: true,
          pageNumber: true,
          lineNumber: true,
          type: true
        }
      }
    },
    orderBy: [
      { confidence: 'desc' },
      { scene: { orderIndex: 'asc' } }
    ]
  })
}

// Helper functions
function mapFormatToEnum(format: string): 'FDX' | 'FOUNTAIN' | 'PDF' {
  switch (format.toLowerCase()) {
    case 'fdx': return 'FDX'
    case 'fountain': return 'FOUNTAIN'
    case 'pdf': return 'PDF'
    default: return 'FOUNTAIN'
  }
}

function mapSceneTypeToEnum(type: string): 'SCENE_HEADING' | 'ACTION' | 'CHARACTER' | 'DIALOGUE' | 'PARENTHETICAL' | 'TRANSITION' {
  switch (type) {
    case 'scene': return 'SCENE_HEADING'
    case 'action': return 'ACTION'
    case 'character': return 'CHARACTER'
    case 'dialogue': return 'DIALOGUE'
    case 'parenthetical': return 'PARENTHETICAL'
    case 'transition': return 'TRANSITION'
    default: return 'ACTION'
  }
}

function findFirstAppearance(scenes: ParsedScene[], characterName: string): number | null {
  for (const scene of scenes) {
    if (scene.character === characterName) {
      return scene.lineNumber
    }
  }
  return null
}

// Generate basic evidence from scenes
async function generateInitialEvidence(tx: any, scriptId: string, scenes: any[]) {
  const evidencePromises: Promise<any>[] = []

  scenes.forEach((scene) => {
    // Generate evidence for dialogue issues (long dialogue blocks)
    if (scene.type === 'DIALOGUE' && scene.wordCount > 50) {
      evidencePromises.push(
        tx.evidence.create({
          data: {
            sceneId: scene.id,
            type: 'DIALOGUE_ISSUE',
            content: 'Long dialogue block detected',
            context: scene.content.substring(0, 200),
            confidence: 0.7,
            tags: ['long-dialogue', 'pacing'],
            startLine: scene.lineNumber,
            endLine: scene.lineNumber
          }
        })
      )
    }

    // Generate evidence for scene structure
    if (scene.type === 'SCENE_HEADING') {
      evidencePromises.push(
        tx.evidence.create({
          data: {
            sceneId: scene.id,
            type: 'STRUCTURE_ELEMENT',
            content: 'Scene heading identified',
            context: scene.content,
            confidence: 0.9,
            tags: ['scene-break', 'structure'],
            startLine: scene.lineNumber,
            endLine: scene.lineNumber
          }
        })
      )
    }
  })

  // Execute all evidence creation in parallel
  if (evidencePromises.length > 0) {
    await Promise.all(evidencePromises)
  }
}