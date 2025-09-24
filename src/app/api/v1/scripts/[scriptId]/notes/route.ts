import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { requireAuth } from '@/lib/api/auth'
import { bulkUpsertNotes } from '@/lib/api/note-service'
import { validate } from '@/lib/api/validator'
import { ok, error } from '@/lib/api/response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { scriptId: string } }
) {
  try {
    const { userId } = await requireAuth(request)
    const { scriptId } = params
    const body = await request.json()

    if (!body?.notes || !Array.isArray(body.notes)) {
      return error('Request body must include a notes array', 400)
    }

    const normalized = body.notes.map((note: any) => {
      validate('note', note)
      return {
        id: note.id as string | undefined,
        severity: note.severity as Prisma.NoteSeverity,
        area: note.area as Prisma.NoteArea,
        scene_id: note.scene_id as string | undefined,
        page: note.page as number | undefined,
        line_ref: note.line_ref as number | undefined,
        excerpt: note.excerpt as string | undefined,
        suggestion: note.suggestion as string | undefined,
        apply_hook: note.apply_hook as Record<string, unknown> | undefined,
        rule_code: note.rule_code as string | undefined
      }
    })

    const result = await bulkUpsertNotes(scriptId, userId, normalized)
    return ok(result)
  } catch (err) {
    const status = (err as any)?.status ?? 500
    const message = err instanceof Error ? err.message : 'Failed to upsert notes'
    console.error('Notes upsert error:', err)
    return error(message, status, (err as any)?.details)
  }
}
