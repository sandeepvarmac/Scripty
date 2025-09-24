import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { requireAuth } from '@/lib/api/auth'
import { replaceScores } from '@/lib/api/note-service'
import { validate } from '@/lib/api/validator'
import { ok, error } from '@/lib/api/response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { scriptId: string } }
) {
  try {
    const { userId } = await requireAuth(request)
    const { scriptId } = params
    const body = await request.json()

    if (!body?.scores || !Array.isArray(body.scores)) {
      return error('Request body must include a scores array', 400)
    }

    const normalized = body.scores.map((score: any) => {
      validate('score', score)
      return {
        id: score.id as string | undefined,
        category: score.category as Prisma.ScoreCategory,
        value: Number(score.value),
        rationale: score.rationale as string | undefined
      }
    })

    const result = await replaceScores(scriptId, userId, normalized)
    return ok(result)
  } catch (err) {
    const status = (err as any)?.status ?? 500
    const message = err instanceof Error ? err.message : 'Failed to update scores'
    console.error('Scores update error:', err)
    return error(message, status, (err as any)?.details)
  }
}
