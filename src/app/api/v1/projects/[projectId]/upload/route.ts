import { NextRequest } from 'next/server'
import { parseScript, parseScriptEnhanced, ScriptFile, NormalizedScript, ParsedScript, Scene } from '@/lib/parsers'
import { saveScriptToEvidenceStore } from '@/lib/evidence-store'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { ok, error } from '@/lib/api/response'
import { getErrorStatus, getErrorMessage, getErrorDetails } from '@/lib/api/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['.fdx', '.fountain', '.pdf', '.txt'])

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = await requireAuth(request)
    const { projectId } = params

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const pdfPassword = formData.get('pdfPassword') as string | null

    if (!file) {
      return error('No file uploaded', 400)
    }

    if (!ALLOWED_EXTENSIONS.has(getExtension(file.name))) {
      return error('Unsupported file type. Please upload .fdx, .fountain, .pdf, or .txt files.', 400)
    }

    if (file.size > MAX_FILE_SIZE) {
      return error('File size exceeds 10MB limit', 400)
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
        deletedAt: null
      }
    })

    if (!project) {
      return error('Project not found or access denied', 404)
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Use enhanced multiplexer with proper format detection and password support
    const scriptFile: ScriptFile = {
      name: file.name,
      mime: file.type,
      bytes: buffer,
      pdfPassword: pdfPassword || undefined
    }

    const enhancedResult = await parseScriptEnhanced(scriptFile)
    if (!enhancedResult.success || !enhancedResult.data) {
      return error(enhancedResult.error ?? 'Unable to parse file', 422)
    }

    // Convert enhanced result back to legacy format for evidence store
    const legacyData = convertToLegacyFormat(enhancedResult.data)
    const parseResult = {
      success: true,
      data: legacyData,
      warnings: enhancedResult.warnings
    }

    const savedScript = await saveScriptToEvidenceStore({
      userId,
      projectId,
      parsedScript: parseResult.data
    })

    return ok({
      success: true,
      data: {
        fileId: savedScript.id,
        scriptId: savedScript.id,
        format: savedScript.format,
        warnings: parseResult.warnings ?? []
      }
    })
  } catch (err) {
    const status = getErrorStatus(err)
    const message = getErrorMessage(err, 'Failed to process file upload')
    console.error('Project upload error:', err)
    return error(message, status, getErrorDetails(err))
  }
}

function getExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? `.${parts.pop()!.toLowerCase()}` : ''
}

// Convert enhanced NormalizedScript back to legacy ParsedScript format
function convertToLegacyFormat(normalized: NormalizedScript): ParsedScript {
  // Convert normalized scenes back to legacy Scene format
  const scenes: Scene[] = []
  normalized.scenes.forEach((scene, sceneIndex) => {
    scene.elements.forEach((element, elementIndex) => {
      scenes.push({
        id: `${scene.id}-${elementIndex}`,
        type: mapElementToSceneType(element.kind),
        content: element.text,
        pageNumber: scene.pageStart || 1,
        lineNumber: sceneIndex * 10 + elementIndex,
        character: 'character' in element ? element.character : undefined,
        sceneNumber: scene.number?.toString(),
        confidence: element.confidence
      })
    })
  })

  const characters = normalized.characters.map(c => c.name)

  return {
    title: normalized.title,
    author: normalized.author,
    format: normalized.format.toLowerCase() as 'fdx' | 'fountain' | 'pdf',
    pageCount: normalized.pages || 1,
    scenes,
    characters,
    metadata: {
      parsedAt: normalized.meta.parsedAt,
      originalFilename: normalized.meta.originalFilename,
      fileSize: normalized.meta.bytes,
      titlePageDetected: !!normalized.title,
      bodyPages: normalized.pages ? normalized.pages - (normalized.title ? 1 : 0) : 1,
      renderingMethod: `enhanced-${normalized.format.toLowerCase()}-multiplexer`,
      qualityIndicators: {
        hasProperFormatting: normalized.meta.confidence > 0.8,
        hasConsistentMargins: true,
        hasStandardElements: true,
        ocrConfidence: normalized.meta.usedOCR ? normalized.meta.confidence : undefined
      }
    }
  }
}

function mapElementToSceneType(kind: string): 'scene' | 'action' | 'dialogue' | 'character' | 'parenthetical' | 'transition' {
  const mapping: Record<string, any> = {
    'SCENE_HEADING': 'scene',
    'ACTION': 'action',
    'DIALOGUE': 'dialogue',
    'TRANSITION': 'transition',
    'PARENTHETICAL': 'parenthetical',
    'SHOT': 'action'
  }
  return mapping[kind] || 'action'
}

