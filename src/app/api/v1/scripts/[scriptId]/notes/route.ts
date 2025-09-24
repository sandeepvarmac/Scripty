import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { requireAuth } from '@/lib/api/auth'
import { bulkUpsertNotes } from '@/lib/api/note-service'
import { validate } from '@/lib/api/validator'
import { ok, error } from '@/lib/api/response'
import { getErrorDetails, getErrorMessage, getErrorStatus } from '@/lib/api/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface NotePayload {
  id?: string
  severity: Prisma.NoteSeverity
  area: Prisma.NoteArea
  scene_id?: string
  page?: number
  line_ref?: number
  excerpt?: string
  suggestion?: string
  apply_hook?: Record<string, unknown>
  rule_code?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { scriptId: string } }
) {
  try {
    const { userId } = await requireAuth(request)
    const { scriptId } = params
    const body = (await request.json()) as unknown

    if (!body || typeof body !== 'object' || !('notes' in body)) {
      return error('Request body must include a notes array', 400)
    }

    const notesInput = (body as { notes?: unknown }).notes
    if (!Array.isArray(notesInput)) {
      return error('Request body must include a notes array', 400)
    }

    const normalized: NotePayload[] = notesInput.map((raw) => {
      validate('note', raw)
      const {
        id,
        severity,
        area,
        scene_id,
        page,
        line_ref,
        excerpt,
        suggestion,
        apply_hook,
        rule_code
      } = raw as NotePayload
      return {
        id,
        severity,
        area,
        scene_id,
        page,
        line_ref,
        excerpt,
        suggestion,
        apply_hook,
        rule_code
      }
    })

    const result = await bulkUpsertNotes(scriptId, userId, normalized)
    return ok(result)
  } catch (err) {
    const status = getErrorStatus(err)
    const message = getErrorMessage(err, 'Failed to upsert notes')
    console.error('Notes upsert error:', err)
    return error(message, status, getErrorDetails(err))
  }
}
