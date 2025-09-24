import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { buildDashboardPayload } from '@/lib/api/dashboard-service'
import { ok, error } from '@/lib/api/response'
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
    const payload = await buildDashboardPayload(scriptId, userId)
    return ok(payload)
  } catch (err) {
    const status = getErrorStatus(err)
    const message = getErrorMessage(err, 'Failed to load dashboard')
    console.error('Dashboard error:', err)
    return error(message, status, getErrorDetails(err))
  }
}
