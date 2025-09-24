// Evidence Store Service
// Handles saving parsed scripts and creating scene-level evidence for analysis

import { prisma } from '@/lib/prisma'
import { ParsedScript, Scene as ParsedScene } from '@/lib/parsers'

export interface SaveScriptOptions {
  userId: string
  projectId: string | null
  parsedScript: ParsedScript
  fileUrl?: string // Optional file storage URL
}

export interface SavedScript {
  id: string
  title?: string | null
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
  const { userId, projectId, parsedScript, fileUrl } = options


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
          projectId,
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

      // 2. Save scenes in batches using createMany for better performance
      const sceneData = parsedScript.scenes.map((scene, index) => ({
        scriptId: script.id,
        sceneNumber: scene.sceneNumber,
        type: mapSceneTypeToEnum(scene.type),
        content: scene.content,
        pageNumber: scene.pageNumber,
        lineNumber: scene.lineNumber,
        character: scene.character,
        orderIndex: index,
        wordCount: scene.content ? scene.content.split(' ').length : 0,
        // Enhanced scene information from slug parsing
        intExt: scene.slugInfo?.intExt === 'INT' ? 'INT' :
                scene.slugInfo?.intExt === 'EXT' ? 'EXT' :
                scene.slugInfo?.intExt === 'INT/EXT' ? 'INT_EXT' : null,
        location: scene.slugInfo?.location,
        tod: scene.slugInfo?.tod
      }))

      // Use createMany for much better performance
      await tx.scene.createMany({
        data: sceneData
      })

      // Get created scenes for evidence generation
      const scenes = await tx.scene.findMany({
        where: { scriptId: script.id },
        orderBy: { orderIndex: 'asc' }
      })

      // 3. Save unique characters
      const characterMap = new Map<string, number>()
      parsedScript.scenes.forEach((scene) => {
        if (scene.character) {
          characterMap.set(scene.character, (characterMap.get(scene.character) || 0) + 1)
        }
      })

      // Use createMany for characters as well
      const characterData = Array.from(characterMap.entries()).map(([name, dialogueCount]) => ({
        scriptId: script.id,
        name,
        dialogueCount,
        firstAppearance: findFirstAppearance(parsedScript.scenes, name)
      }))

      await tx.character.createMany({
        data: characterData
      })

      // 4. Generate initial evidence from scenes (in smaller batches)
      await generateInitialEvidenceInBatches(tx, script.id, scenes)

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
      timeout: 180000 // 180 seconds timeout for very large scripts (3 minutes)
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
      userId,
      deletedAt: null
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          type: true,
          genre: true,
          targetAudience: true,
          targetBudget: true,
          developmentStage: true
        }
      },
      scenes: {
        where: { deletedAt: null },
        orderBy: { orderIndex: 'asc' },
        include: {
          evidences: {
            where: { deletedAt: null },
            orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }]
          }
        }
      },
      characters: {
        where: { deletedAt: null },
        orderBy: { dialogueCount: 'desc' }
      },
      analyses: {
        where: { deletedAt: null },
        orderBy: { startedAt: 'desc' }
      }
    }
  })
}

// Get script with complete MVP data for enhanced analysis
export async function getScriptWithEnhancedData(scriptId: string, userId: string) {
  return await prisma.script.findFirst({
    where: {
      id: scriptId,
      userId,
      deletedAt: null
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          type: true,
          genre: true,
          targetAudience: true,
          targetBudget: true,
          developmentStage: true
        }
      },
      scenes: {
        where: { deletedAt: null },
        orderBy: { orderIndex: 'asc' },
        include: {
          evidences: {
            where: { deletedAt: null },
            orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }]
          },
          elements: {
            orderBy: { orderIndex: 'asc' }
          },
          notes: {
            orderBy: { createdAt: 'desc' }
          },
          feasibility: true,
          characterLinks: {
            include: {
              character: true
            }
          },
          themeAlignment: true,
          riskFlags: {
            orderBy: { confidence: 'desc' }
          },
          subplotSpans: {
            include: {
              subplot: true
            }
          }
        }
      },
      characters: {
        where: { deletedAt: null },
        orderBy: { dialogueCount: 'desc' },
        include: {
          sceneLinks: {
            include: {
              scene: true
            }
          }
        }
      },
      analyses: {
        where: { deletedAt: null },
        orderBy: { startedAt: 'desc' }
      },
      beats: {
        orderBy: { page: 'asc' }
      },
      notes: {
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          scene: true,
          evidence: true
        }
      },
      scores: {
        orderBy: { category: 'asc' }
      },
      pageMetrics: {
        orderBy: { page: 'asc' }
      },
      themeStatements: {
        orderBy: { confidence: 'desc' }
      },
      riskFlags: {
        orderBy: { confidence: 'desc' },
        include: {
          scene: true
        }
      },
      subplots: {
        include: {
          spans: {
            include: {
              scene: true
            }
          }
        }
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
      scriptId,
      deletedAt: null
    },
    deletedAt: null
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

// Generate basic evidence from scenes in batches
async function generateInitialEvidenceInBatches(tx: any, scriptId: string, scenes: any[]) {
  const evidenceData: any[] = []

  scenes.forEach((scene) => {
    // Generate evidence for dialogue issues (long dialogue blocks)
    if (scene.type === 'DIALOGUE' && scene.wordCount > 50) {
      evidenceData.push({
        sceneId: scene.id,
        type: 'DIALOGUE_ISSUE',
        content: 'Long dialogue block detected',
        context: scene.content.substring(0, 200),
        confidence: 0.7,
        tags: ['long-dialogue', 'pacing'],
        startLine: scene.lineNumber,
        endLine: scene.lineNumber
      })
    }

    // Generate evidence for scene structure
    if (scene.type === 'SCENE_HEADING') {
      evidenceData.push({
        sceneId: scene.id,
        type: 'STRUCTURE_ELEMENT',
        content: 'Scene heading identified',
        context: scene.content,
        confidence: 0.9,
        tags: ['scene-break', 'structure'],
        startLine: scene.lineNumber,
        endLine: scene.lineNumber
      })
    }
  })

  // Create evidence in batches using createMany for better performance
  if (evidenceData.length > 0) {
    const batchSize = 100
    for (let i = 0; i < evidenceData.length; i += batchSize) {
      const batch = evidenceData.slice(i, i + batchSize)
      await tx.evidence.createMany({
        data: batch
      })
    }
  }
}