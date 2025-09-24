import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { summarizeFeasibility } from '@/lib/api/dashboard-service'
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
    const summary = await summarizeFeasibility(scriptId, userId)
    return ok(summary)
  } catch (err) {
    const status = (err as any)?.status ?? 500
    const message = err instanceof Error ? err.message : 'Failed to load feasibility metrics'
    console.error('Feasibility error:', err)
    return error(message, status)
  }
}
