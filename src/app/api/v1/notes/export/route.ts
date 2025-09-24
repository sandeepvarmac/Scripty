import { NextRequest } from 'next/server'
import { ExportService } from '@/lib/exports'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { getScriptOrThrow } from '@/lib/api/dashboard-service'
import { ok, error } from '@/lib/api/response'
import { getErrorDetails, getErrorMessage, getErrorStatus } from '@/lib/api/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type NotesExportFormat = 'pdf' | 'csv'

interface NotesExportBody {
  scriptId: string
  format: NotesExportFormat
  emailTo?: string
  bundleFormat?: 'individual' | 'zip'
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    const body = (await request.json()) as unknown

    if (!isNotesExportBody(body)) {
      return error('scriptId and format are required', 400)
    }

    const { scriptId, format, emailTo, bundleFormat } = body
    await getScriptOrThrow(scriptId, userId)

    const exportService = new ExportService(prisma)
    const result = await exportService.exportScript(scriptId, {
      type: 'notes',
      format,
      includeMetadata: true,
      emailTo,
      bundleFormat: bundleFormat ?? 'individual'
    }, userId)

    return ok({
      success: true,
      jobId: result.id,
      downloadUrl: result.url,
      expiresAt: result.expiresAt
    })
  } catch (err) {
    const status = getErrorStatus(err)
    const message = getErrorMessage(err, 'Failed to export notes')
    console.error('Notes export error:', err)
    return error(message, status, getErrorDetails(err))
  }
}

function isNotesExportBody(value: unknown): value is NotesExportBody {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  if (typeof data.scriptId !== 'string') return false
  if (data.scriptId.trim().length === 0) return false
  if (data.format !== 'pdf' && data.format !== 'csv') return false
  if (data.emailTo !== undefined && typeof data.emailTo !== 'string') return false
  if (data.bundleFormat !== undefined && data.bundleFormat !== 'individual' && data.bundleFormat !== 'zip') return false
  return true
}
