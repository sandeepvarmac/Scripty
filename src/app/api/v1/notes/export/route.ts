import { NextRequest } from 'next/server'
import { ExportService } from '@/lib/exports'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { getScriptOrThrow } from '@/lib/api/dashboard-service'
import { ok, error } from '@/lib/api/response'\nimport { getErrorStatus, getErrorMessage, getErrorDetails } from '@/lib/api/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    const body = await request.json()
    const scriptId: string | undefined = body?.scriptId
    const format: 'pdf' | 'csv' | undefined = body?.format

    if (!scriptId || !format) {
      return error('scriptId and format are required', 400)
    }

    if (!['pdf', 'csv'].includes(format)) {
      return error('Only pdf and csv formats are supported for notes export', 400)
    }

    await getScriptOrThrow(scriptId, userId)

    const exportService = new ExportService(prisma)
    const result = await exportService.exportScript(scriptId, {
      type: 'notes',
      format,
      includeMetadata: true,
      emailTo: body?.emailTo,
      bundleFormat: body?.bundleFormat ?? 'individual'
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
    console.error(' error:', err)
    return error(message, status)
  }
}

