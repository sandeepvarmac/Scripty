import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { summarizeFeasibility } from '@/lib/api/dashboard-service'
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
    const summary = await summarizeFeasibility(scriptId, userId)
    return ok(summary)
  } catch (err) {
    const status = getErrorStatus(err)
    const message = getErrorMessage(err, 'Failed to load feasibility metrics')
    console.error('Feasibility error:', err)
    return error(message, status, getErrorDetails(err))
  }
}
