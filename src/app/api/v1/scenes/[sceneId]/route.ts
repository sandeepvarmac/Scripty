import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { buildSceneDetail } from '@/lib/api/dashboard-service'
import { ok, error } from '@/lib/api/response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { sceneId: string } }
) {
  try {
    const { userId } = await requireAuth(request)
    const { sceneId } = params
    const detail = await buildSceneDetail(sceneId, userId)
    return ok(detail)
  } catch (err) {
    const status = (err as any)?.status ?? 500
    const message = err instanceof Error ? err.message : 'Failed to load scene'
    console.error('Scene detail error:', err)
    return error(message, status)
  }
}
