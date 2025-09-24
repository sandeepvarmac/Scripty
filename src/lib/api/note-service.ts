import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getScriptOrThrow } from './dashboard-service'

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

export async function bulkUpsertNotes(scriptId: string, userId: string, notes: NotePayload[]) {
  await getScriptOrThrow(scriptId, userId)

  return prisma.$transaction(async (tx) => {
    let updated = 0

    for (const payload of notes) {
      if (payload.id) {
        await tx.note.upsert({
          where: { id: payload.id },
          update: {
            severity: payload.severity,
            area: payload.area,
            sceneId: payload.scene_id,
            page: payload.page,
            lineRef: payload.line_ref,
            excerpt: payload.excerpt,
            suggestion: payload.suggestion,
            applyHook: payload.apply_hook as Prisma.InputJsonValue,
            ruleCode: payload.rule_code
          },
          create: {
            id: payload.id,
            scriptId,
            severity: payload.severity,
            area: payload.area,
            sceneId: payload.scene_id,
            page: payload.page,
            lineRef: payload.line_ref,
            excerpt: payload.excerpt,
            suggestion: payload.suggestion,
            applyHook: payload.apply_hook as Prisma.InputJsonValue,
            ruleCode: payload.rule_code
          }
        })
      } else {
        await tx.note.create({
          data: {
            scriptId,
            severity: payload.severity,
            area: payload.area,
            sceneId: payload.scene_id,
            page: payload.page,
            lineRef: payload.line_ref,
            excerpt: payload.excerpt,
            suggestion: payload.suggestion,
            applyHook: payload.apply_hook as Prisma.InputJsonValue,
            ruleCode: payload.rule_code
          }
        })
      }
      updated += 1
    }

    return {
      success: true,
      count: updated
    }
  })
}

interface ScorePayload {
  id?: string
  category: Prisma.ScoreCategory
  value: number
  rationale?: string
}

export async function replaceScores(scriptId: string, userId: string, scores: ScorePayload[]) {
  await getScriptOrThrow(scriptId, userId)

  return prisma.$transaction(async (tx) => {
    await tx.score.deleteMany({ where: { scriptId } })

    if (scores.length > 0) {
      await tx.score.createMany({
        data: scores.map(score => ({
          id: score.id,
          scriptId,
          category: score.category,
          value: new Prisma.Decimal(score.value),
          rationale: score.rationale
        }))
      })
    }

    const stored = await tx.score.findMany({
      where: { scriptId },
      orderBy: { category: 'asc' }
    })

    return {
      success: true,
      scores: stored.map(score => ({
        id: score.id,
        category: score.category,
        value: Number(score.value),
        rationale: score.rationale ?? undefined
      }))
    }
  })
}
