import { NextRequest } from 'next/server'
import { parseScript, NormalizedScript } from '@/lib/parsers'
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

    // Use normalized parser with proper format detection
    const parseResult = await parseScript(buffer, file.name, file.type)
    if (!parseResult.success || !parseResult.data) {
      return error(parseResult.error ?? 'Unable to parse file', 422)
    }

    const savedScript = await saveScriptToEvidenceStore({
      userId,
      projectId,
      normalizedScript: parseResult.data
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


