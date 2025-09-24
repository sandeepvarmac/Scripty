import { NextRequest } from 'next/server'
import { ExportService } from '@/lib/exports'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { getScriptOrThrow } from '@/lib/api/dashboard-service'
import { ok, error } from '@/lib/api/response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { scriptId: string } }
) {
  try {
    const { userId } = await requireAuth(request)
    const { scriptId } = params
    const script = await getScriptOrThrow(scriptId, userId)

    if (script.format !== 'FDX') {
      return ok({
        success: true,
        data: {
          available: false,
          diff: [],
          message: 'Change list is only available for Final Draft (FDX) uploads.'
        }
      })
    }

    const exportService = new ExportService(prisma)
    const result = await exportService.exportScript(scriptId, {
      type: 'changelist',
      format: 'fdx',
      includeMetadata: true,
      bundleFormat: 'individual'
    }, userId)

    return ok({
      success: true,
      data: {
        available: true,
        diff: [],
        downloadUrl: result.url,
        message: 'Download the generated FDX change list to review detailed differences.'
      }
    })
  } catch (err) {
    const status = (err as any)?.status ?? 500
    const message = err instanceof Error ? err.message : 'Failed to generate Final Draft change list'
    console.error('Change list error:', err)
    return error(message, status)
  }
}
