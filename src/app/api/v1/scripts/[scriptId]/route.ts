import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { getScriptOrThrow } from '@/lib/api/dashboard-service'
import { ok, error } from '@/lib/api/response'
import { getErrorDetails, getErrorMessage, getErrorStatus } from '@/lib/api/errors'

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
    return ok(script)
  } catch (err) {
    const status = getErrorStatus(err)
    const message = getErrorMessage(err, 'Failed to get script')
    console.error('Get script error:', err)
    return error(message, status, getErrorDetails(err))
  }
}