import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const { Decimal } = Prisma

type DecimalLike = Prisma.Decimal | number | null | undefined

const toNumber = (value: DecimalLike): number | null => {
  if (value === null || value === undefined) return null
  if (value instanceof Decimal) {
    return value.toNumber()
  }
  return typeof value === 'number' ? value : Number(value)
}

const defined = <T>(value: T | null | undefined): T | undefined =>
  value === null || value === undefined ? undefined : value

export async function getScriptOrThrow(scriptId: string, userId: string) {
  const script = await prisma.script.findFirst({
    where: {
      id: scriptId,
      userId,
      deletedAt: null
    },
    include: {
      project: true
    }
  })

  if (!script) {
    throw Object.assign(new Error('Script not found'), { status: 404 })
  }

  return script
}

export async function buildParsePreview(scriptId: string, userId: string) {
  const script = await getScriptOrThrow(scriptId, userId)

  const scenes = await prisma.scene.findMany({
    where: { scriptId, deletedAt: null },
    select: {
      id: true,
      intExt: true,
      location: true,
      tod: true,
      orderIndex: true
    },
    orderBy: { orderIndex: 'asc' }
  })

  const characters = await prisma.character.count({
    where: { scriptId, deletedAt: null }
  })

  return {
    success: true,
    data: {
      script: {
        id: script.id,
        title: script.title,
        logline: script.logline,
        genreGuess: script.genreOverride ?? 'Unknown',
        pageCount: script.pageCount
      },
      slugParts: scenes.map(scene => ({
        sceneId: scene.id,
        intExt: scene.intExt ?? undefined,
        location: scene.location ?? undefined,
        tod: scene.tod ?? undefined
      })),
      totals: {
        scenes: scenes.length,
        characters
      }
    }
  }
}

export async function buildDashboardPayload(scriptId: string, userId: string) {
  await getScriptOrThrow(scriptId, userId)

  const [beats, notes, riskFlags, themeStatements, themeAlignment, pageMetrics, scores, subplots, subplotSpans] = await Promise.all([
    prisma.beat.findMany({ where: { scriptId }, orderBy: { page: 'asc' } }),
    prisma.note.findMany({ where: { scriptId }, orderBy: [{ severity: 'desc' }, { page: 'asc' }] }),
    prisma.riskFlag.findMany({ where: { scriptId }, orderBy: [{ kind: 'asc' }, { page: 'asc' }] }),
    prisma.themeStatement.findMany({ where: { scriptId } }),
    prisma.sceneThemeAlignment.findMany({ where: { scene: { scriptId } } }),
    prisma.pageMetric.findMany({ where: { scriptId }, orderBy: { page: 'asc' } }),
    prisma.score.findMany({ where: { scriptId }, orderBy: { category: 'asc' } }),
    prisma.subplot.findMany({ where: { scriptId } }),
    prisma.subplotSpan.findMany({ where: { subplot: { scriptId } } })
  ])

  const feasibility = await prisma.feasibilityMetric.findMany({
    where: { scene: { scriptId } },
    include: {
      scene: {
        select: {
          id: true
        }
      }
    }
  })

  const characterScenes = await prisma.characterScene.findMany({
    where: { character: { scriptId } },
    include: {
      character: { select: { id: true } },
      scene: { select: { id: true } }
    }
  })

  return {
    success: true,
    data: {
      beats: beats.map(serializeBeat),
      notes: notes.map(serializeNote),
      riskFlags: riskFlags.map(serializeRiskFlag),
      themeStatements: themeStatements.map(serializeThemeStatement),
      sceneThemeAlignment: themeAlignment.map(serializeSceneThemeAlignment),
      feasibility: feasibility.map(serializeFeasibilityMetric),
      pageMetrics: pageMetrics.map(serializePageMetric),
      characterScenes: characterScenes.map(serializeCharacterScene),
      subplots: subplots.map(serializeSubplot),
      subplotSpans: subplotSpans.map(serializeSubplotSpan),
      scores: scores.map(serializeScore)
    }
  }
}

export async function buildSceneDetail(sceneId: string, userId: string) {
  const scene = await prisma.scene.findFirst({
    where: {
      id: sceneId,
      deletedAt: null,
      script: {
        userId
      }
    },
    include: {
      elements: { orderBy: { orderIndex: 'asc' } },
      feasibility: true,
      notes: { orderBy: [{ severity: 'desc' }, { page: 'asc' }] }
    }
  })

  if (!scene) {
    throw Object.assign(new Error('Scene not found'), { status: 404 })
  }

  return {
    success: true,
    data: {
      scene: {
        id: scene.id,
        orderIndex: scene.orderIndex,
        pageNumber: scene.pageNumber,
        intExt: scene.intExt ?? undefined,
        location: scene.location ?? undefined,
        tod: scene.tod ?? undefined,
        elements: scene.elements.map(serializeElement),
        feasibility: scene.feasibility ? serializeFeasibilityMetric(scene.feasibility) : undefined,
        notes: scene.notes.map(serializeNote)
      }
    }
  }
}

export async function summarizeFeasibility(scriptId: string, userId: string) {
  await getScriptOrThrow(scriptId, userId)

  const [scenes, metrics] = await Promise.all([
    prisma.scene.findMany({
      where: { scriptId, deletedAt: null },
      select: { intExt: true, tod: true }
    }),
    prisma.feasibilityMetric.findMany({ where: { scene: { scriptId } } })
  ])

  const totals = {
    intScenes: scenes.filter(scene => scene.intExt === 'INT').length,
    extScenes: scenes.filter(scene => scene.intExt === 'EXT').length,
    dayScenes: scenes.filter(scene => scene.tod?.toUpperCase().includes('DAY')).length,
    nightScenes: scenes.filter(scene => scene.tod?.toUpperCase().includes('NIGHT')).length
  }

  const flagTotals: Record<string, number> = {}
  metrics.forEach(metric => {
    const entries: Array<[string, boolean | null | undefined]> = [
      ['has_stunts', metric.hasStunts],
      ['has_vfx', metric.hasVfx],
      ['has_sfx', metric.hasSfx],
      ['has_crowd', metric.hasCrowd],
      ['has_minors', metric.hasMinors],
      ['has_animals', metric.hasAnimals],
      ['has_weapons', metric.hasWeapons],
      ['has_vehicles', metric.hasVehicles],
      ['has_special_props', metric.hasSpecialProps]
    ]

    entries.forEach(([key, value]) => {
      if (value) {
        flagTotals[key] = (flagTotals[key] || 0) + 1
      }
    })
  })

  const heatmap = await prisma.pageMetric.findMany({
    where: { scriptId },
    orderBy: { page: 'asc' }
  })

  return {
    success: true,
    data: {
      totals,
      flags: flagTotals,
      heatmap: heatmap.map(serializePageMetric)
    }
  }
}

const serializeBeat = (beat: Prisma.BeatGetPayload<any>) => ({
  id: beat.id,
  kind: beat.kind,
  page: beat.page ?? undefined,
  confidence: toNumber(beat.confidence) ?? undefined,
  timing_flag: beat.timingFlag ?? undefined,
  rationale: beat.rationale ?? undefined
})

const serializeNote = (note: Prisma.NoteGetPayload<any>) => {
  const payload: Record<string, unknown> = {
    id: note.id,
    severity: note.severity,
    area: note.area
  }
  if (note.sceneId) payload.scene_id = note.sceneId
  if (note.page !== null && note.page !== undefined) payload.page = note.page
  if (note.lineRef !== null && note.lineRef !== undefined) payload.line_ref = note.lineRef
  if (note.excerpt) payload.excerpt = note.excerpt
  if (note.suggestion) payload.suggestion = note.suggestion
  if (note.applyHook) payload.apply_hook = note.applyHook as unknown
  if (note.ruleCode) payload.rule_code = note.ruleCode
  return payload
}

const serializeRiskFlag = (flag: Prisma.RiskFlagGetPayload<any>) => {
  const payload: Record<string, unknown> = {
    id: flag.id,
    kind: flag.kind,
    confidence: toNumber(flag.confidence) ?? undefined
  }
  if (flag.sceneId) payload.scene_id = flag.sceneId
  if (flag.page !== null && flag.page !== undefined) payload.page = flag.page
  if (flag.startLine !== null && flag.startLine !== undefined) payload.start_line = flag.startLine
  if (flag.endLine !== null && flag.endLine !== undefined) payload.end_line = flag.endLine
  if (flag.snippet) payload.snippet = flag.snippet
  if (flag.notes) payload.notes = flag.notes
  return payload
}

const serializeThemeStatement = (statement: Prisma.ThemeStatementGetPayload<any>) => ({
  id: statement.id,
  statement: statement.statement,
  confidence: toNumber(statement.confidence) ?? undefined
})

const serializeSceneThemeAlignment = (alignment: Prisma.SceneThemeAlignmentGetPayload<any>) => ({
  scene_id: alignment.sceneId,
  on_theme: alignment.onTheme,
  rationale: alignment.rationale ?? undefined
})

const serializeFeasibilityMetric = (metric: Prisma.FeasibilityMetricGetPayload<any>) => ({
  scene_id: metric.sceneId,
  int_ext: metric.intExt ?? undefined,
  location: metric.location ?? undefined,
  tod: metric.tod ?? undefined,
  has_stunts: defined(metric.hasStunts),
  has_vfx: defined(metric.hasVfx),
  has_sfx: defined(metric.hasSfx),
  has_crowd: defined(metric.hasCrowd),
  has_minors: defined(metric.hasMinors),
  has_animals: defined(metric.hasAnimals),
  has_weapons: defined(metric.hasWeapons),
  has_vehicles: defined(metric.hasVehicles),
  has_special_props: defined(metric.hasSpecialProps),
  complexity_score: metric.complexityScore ?? undefined
})

const serializePageMetric = (metric: Prisma.PageMetricGetPayload<any>) => ({
  page: metric.page,
  scene_length_lines: metric.sceneLengthLines ?? undefined,
  dialogue_lines: metric.dialogueLines ?? undefined,
  action_lines: metric.actionLines ?? undefined,
  tension_score: metric.tensionScore ?? undefined,
  complexity_score: metric.complexityScore ?? undefined
})

const serializeCharacterScene = (link: Prisma.CharacterSceneGetPayload<any>) => ({
  character_id: link.characterId,
  scene_id: link.sceneId,
  lines: link.lines,
  words: link.words,
  on_page: link.onPage
})

const serializeSubplot = (subplot: Prisma.SubplotGetPayload<any>) => ({
  id: subplot.id,
  label: subplot.label,
  description: subplot.description ?? undefined
})

const serializeSubplotSpan = (span: Prisma.SubplotSpanGetPayload<any>) => ({
  subplot_id: span.subplotId,
  scene_id: span.sceneId,
  role: span.role
})

const serializeScore = (score: Prisma.ScoreGetPayload<any>) => ({
  id: score.id,
  category: score.category,
  value: toNumber(score.value) ?? undefined,
  rationale: score.rationale ?? undefined
})

const serializeElement = (element: Prisma.ElementGetPayload<any>) => ({
  id: element.id,
  scene_id: element.sceneId,
  type: element.type,
  char_name: element.charName ?? undefined,
  text: element.text,
  order_index: element.orderIndex
})
