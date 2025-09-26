// Evidence Store Service
// Handles saving parsed scripts and creating scene-level evidence for analysis

import { prisma } from '@/lib/prisma'
import { NormalizedScript } from '@/lib/parsers'

export interface SaveScriptOptions {
  userId: string
  projectId: string | null
  normalizedScript: NormalizedScript
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
  const { userId, projectId, normalizedScript, fileUrl } = options

  // Add comprehensive validation and error logging
  if (!normalizedScript) {
    console.error('SaveScriptToEvidenceStore: normalizedScript is null/undefined')
    throw new Error('Normalized script is null or undefined')
  }
  if (!normalizedScript.scenes) {
    console.error('SaveScriptToEvidenceStore: missing scenes array', {
      hasScenes: !!normalizedScript.scenes,
      scriptKeys: Object.keys(normalizedScript)
    })
    throw new Error('Normalized script missing scenes array')
  }
  if (!normalizedScript.characters) {
    console.error('SaveScriptToEvidenceStore: missing characters array', {
      hasCharacters: !!normalizedScript.characters,
      scriptKeys: Object.keys(normalizedScript)
    })
    throw new Error('Normalized script missing characters array')
  }
  if (!normalizedScript.meta) {
    console.warn('SaveScriptToEvidenceStore: missing meta object, will use defaults', {
      hasMeta: !!normalizedScript.meta,
      scriptKeys: Object.keys(normalizedScript)
    })
  }

  try {
    // Start a transaction to ensure data consistency (increased timeout for large scripts)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the script record
      const script = await tx.script.create({
        data: {
          userId,
          projectId,
          originalFilename: normalizedScript.meta?.originalFilename || 'unknown_file',
          title: normalizedScript.title,
          author: normalizedScript.author,
          format: mapFormatToEnum(normalizedScript.format),
          fileSize: normalizedScript.meta?.bytes || 0,
          pageCount: normalizedScript.pages || 0,
          totalScenes: normalizedScript.scenes.length,
          totalCharacters: normalizedScript.characters.length,
          status: 'COMPLETED',
          processedAt: new Date(),
          fileUrl
        }
      })

      // 2. Flatten normalized scenes into scene elements for database storage
      const sceneData: any[] = []
      let globalIndex = 0

      for (const normalizedScene of normalizedScript.scenes) {
        for (const element of normalizedScene.elements) {
          const isSceneHeading = element.kind === 'SCENE_HEADING'
          const isDialogue = element.kind === 'DIALOGUE' && 'character' in element

          // Clean text to remove null bytes and other problematic characters
          const cleanText = element.text ? element.text.replace(/[\0\x00]/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim() : ''
          const cleanCharacter = (isDialogue && element.character) ? element.character.replace(/[\0\x00]/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim() : null
          const cleanLocation = (isSceneHeading && normalizedScene.slug?.location) ? normalizedScene.slug.location.replace(/[\0\x00]/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim() : null
          const cleanTod = (isSceneHeading && normalizedScene.slug?.tod) ? normalizedScene.slug.tod.replace(/[\0\x00]/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim() : null

          sceneData.push({
            scriptId: script.id,
            sceneNumber: isSceneHeading ? normalizedScene.number?.toString() : null,
            type: mapElementKindToSceneType(element.kind),
            content: cleanText,
            pageNumber: normalizedScene.pageStart || 0,
            lineNumber: globalIndex + 1,
            character: cleanCharacter,
            orderIndex: globalIndex++,
            wordCount: cleanText ? cleanText.split(' ').length : 0,
            // Enhanced scene information - only for actual scene headings
            intExt: isSceneHeading ? (
              normalizedScene.slug?.intExt === 'INT' ? 'INT' :
              normalizedScene.slug?.intExt === 'EXT' ? 'EXT' :
              normalizedScene.slug?.intExt === 'INT/EXT' ? 'INT_EXT' : null
            ) : null,
            location: cleanLocation,
            tod: cleanTod
          })
        }
      }

      // Use createMany for much better performance
      await tx.scene.createMany({
        data: sceneData
      })

      // Get created scenes for evidence generation
      const scenes = await tx.scene.findMany({
        where: { scriptId: script.id },
        orderBy: { orderIndex: 'asc' }
      })

      // 3. Save unique characters from normalized data
      const characterMap = new Map<string, number>()

      // Count dialogue occurrences from the flattened scene data
      sceneData.forEach((sceneElement) => {
        if (sceneElement.character) {
          characterMap.set(sceneElement.character, (characterMap.get(sceneElement.character) || 0) + 1)
        }
      })

      // Use createMany for characters as well
      const characterData = Array.from(characterMap.entries()).map(([name, dialogueCount]) => ({
        scriptId: script.id,
        name,
        dialogueCount,
        firstAppearance: findFirstAppearanceInNormalizedScenes(normalizedScript.scenes, name)
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
    console.error('Normalized script metadata:', JSON.stringify(normalizedScript.meta, null, 2))
    console.error('User ID:', userId)
    console.error('Project ID:', projectId)
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

function mapElementKindToSceneType(kind: string): 'SCENE_HEADING' | 'ACTION' | 'CHARACTER' | 'DIALOGUE' | 'PARENTHETICAL' | 'TRANSITION' {
  switch (kind) {
    case 'SCENE_HEADING': return 'SCENE_HEADING'
    case 'ACTION': return 'ACTION'
    case 'DIALOGUE': return 'DIALOGUE'
    case 'PARENTHETICAL': return 'PARENTHETICAL'
    case 'TRANSITION': return 'TRANSITION'
    case 'SHOT': return 'ACTION' // Map SHOT to ACTION
    default: return 'ACTION'
  }
}

function findFirstAppearanceInNormalizedScenes(scenes: NormalizedScript['scenes'], characterName: string): number | null {
  let lineNumber = 1

  for (const scene of scenes) {
    for (const element of scene.elements) {
      if (element.kind === 'DIALOGUE' && 'character' in element && element.character === characterName) {
        return lineNumber
      }
      lineNumber++
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