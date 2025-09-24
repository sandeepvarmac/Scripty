import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { requireAuth } from '@/lib/api/auth'
import { replaceScores } from '@/lib/api/note-service'
import { validate } from '@/lib/api/validator'
import { ok, error } from '@/lib/api/response'
import { getErrorDetails, getErrorMessage, getErrorStatus } from '@/lib/api/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ScorePayload {
  id?: string
  category: Prisma.ScoreCategory
  value: number
  rationale?: string
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { scriptId: string } }
) {
  try {
    const { userId } = await requireAuth(request)
    const { scriptId } = params
    const body = (await request.json()) as unknown

    if (!body || typeof body !== 'object' || !('scores' in body)) {
      return error('Request body must include a scores array', 400)
    }

    const scoresInput = (body as { scores?: unknown }).scores
    if (!Array.isArray(scoresInput)) {
      return error('Request body must include a scores array', 400)
    }

    const normalized: ScorePayload[] = scoresInput.map((raw) => {
      validate('score', raw)
      const { id, category, value, rationale } = raw as ScorePayload
      return {
        id,
        category,
        value: Number(value),
        rationale
      }
    })

    const result = await replaceScores(scriptId, userId, normalized)
    return ok(result)
  } catch (err) {
    const status = getErrorStatus(err)
    const message = getErrorMessage(err, 'Failed to update scores')
    console.error('Scores update error:', err)
    return error(message, status, getErrorDetails(err))
  }
}
