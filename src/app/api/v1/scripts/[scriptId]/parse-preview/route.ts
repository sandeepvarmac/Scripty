import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { buildParsePreview } from '@/lib/api/dashboard-service'
import { ok, error } from '@/lib/api/response'\nimport { getErrorDetails, getErrorMessage, getErrorStatus } from '@/lib/api/errors'
import { getErrorStatus, getErrorMessage, getErrorDetails } from '@/lib/api/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { scriptId: string } }
) {
  try {
    const { userId } = await requireAuth(request)
    const { scriptId } = params
    const preview = await buildParsePreview(scriptId, userId)
    return ok(preview)
  } catch (err) {
    const status = getErrorStatus(err)
    const message = getErrorMessage(err, 'Failed to build parse preview')
    console.error('Parse preview error:', err)
    return error(message, status, getErrorDetails(err))
  }
}

