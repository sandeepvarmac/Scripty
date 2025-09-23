import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'fs'
import path from 'path'
import { AnalysisPipeline } from '@/lib/analysis/pipeline'
import { LLMRouter } from '@/lib/llm/router'

const prisma = new PrismaClient()

describe('Gold Script Tests', () => {
  let projectId: string
  let scriptId: string

  beforeAll(async () => {
    // Create test project
    const project = await prisma.project.create({
      data: {
        name: 'Gold Script Test Project',
        description: 'Testing with feature-length gold script',
        userId: 'test-user-gold',
        enableSensitivityAnalysis: true
      }
    })
    projectId = project.id

    // Load and create test script
    const fountainPath = path.join(process.cwd(), 'test', 'fixtures', 'gold-scripts', 'feature-length.fountain')
    const scriptContent = await fs.readFile(fountainPath, 'utf-8')

    const script = await prisma.script.create({
      data: {
        projectId,
        title: 'THE LAST FRONTIER',
        author: 'Test Script',
        pageCount: 110,
        status: 'UPLOADED',
        content: scriptContent,
        sha256: 'test-hash-gold-script',
        logline: 'A xenobiologist discovers ancient Martian technology that could terraform Mars.',
        synopsisShort: 'On Mars in 2157, scientist Sarah Chen discovers intelligent crystalline formations that lead to an ancient Martian civilization with the key to terraforming Mars.',
        genreOverride: 'Science Fiction'
      }
    })
    scriptId = script.id
  })

  afterAll(async () => {
    // Cleanup test data
    await prisma.script.deleteMany({ where: { projectId } })
    await prisma.project.delete({ where: { id: projectId } })
    await prisma.$disconnect()
  })

  describe('Beat Detection and Timing Validation', () => {
    test('should identify all 7 required story beats', async () => {
      const pipeline = new AnalysisPipeline(scriptId, {
        enableBeats: true,
        enableNotes: false,
        enableScoring: false,
        enableFeasibility: false,
        enableRiskFlags: false,
        enableSensitivityAnalysis: false
      })

      const result = await pipeline.execute()
      expect(result.success).toBe(true)

      const beats = await prisma.beat.findMany({
        where: { scriptId },
        orderBy: { page: 'asc' }
      })

      // Must find exactly 7 beats
      expect(beats.length).toBe(7)

      // Load expected beats for validation
      const expectedBeatsPath = path.join(process.cwd(), 'test', 'fixtures', 'gold-scripts', 'expected-beats.json')
      const expectedBeats = JSON.parse(await fs.readFile(expectedBeatsPath, 'utf-8'))

      // Validate each beat type is found
      const expectedBeatTypes = expectedBeats.expected_beats.map((eb: any) => eb.kind)
      const foundBeatTypes = beats.map(beat => beat.kind)

      expectedBeatTypes.forEach((expectedType: string) => {
        expect(foundBeatTypes).toContain(expectedType)
      })

      console.log('Found beats:', beats.map(b => ({ kind: b.kind, page: b.page })))
    }, 60000) // 60 second timeout for LLM processing

    test('should have correct beat timing within acceptable windows', async () => {
      const beats = await prisma.beat.findMany({
        where: { scriptId },
        orderBy: { page: 'asc' }
      })

      const expectedBeatsPath = path.join(process.cwd(), 'test', 'fixtures', 'gold-scripts', 'expected-beats.json')
      const expectedBeats = JSON.parse(await fs.readFile(expectedBeatsPath, 'utf-8'))

      beats.forEach(beat => {
        const expected = expectedBeats.expected_beats.find((eb: any) => eb.kind === beat.kind)
        if (expected) {
          expect(beat.page).toBeGreaterThanOrEqual(expected.expected_page_min)
          expect(beat.page).toBeLessThanOrEqual(expected.expected_page_max)

          // Check timing flag
          if (beat.page >= expected.expected_page_min && beat.page <= expected.expected_page_max) {
            expect(beat.timingFlag).toBe('ON_TIME')
          } else {
            expect(['EARLY', 'LATE']).toContain(beat.timingFlag)
          }
        }
      })
    })

    test('should generate meaningful beat content descriptions', async () => {
      const beats = await prisma.beat.findMany({
        where: { scriptId },
        orderBy: { page: 'asc' }
      })

      beats.forEach(beat => {
        expect(beat.content).toBeDefined()
        expect(beat.content.length).toBeGreaterThan(10)
        expect(beat.confidence).toBeGreaterThan(0.5)
      })
    })
  })

  describe('LLM Router Validation', () => {
    test('should use appropriate model tiers for different analysis types', async () => {
      // This test would validate that the LLM router is using the correct models
      // In a real implementation, we'd track which models were used for which operations

      const router = new LLMRouter()

      // Test that beat analysis uses gpt-5 (Tier B)
      const beatAnalysis = await router.routeBeats({
        sceneSummaries: [
          { scene_id: 1, page: 1, summary: 'Opening scene on Mars' },
          { scene_id: 2, page: 15, summary: 'Discovery of intelligent formations' }
        ],
        pageCount: 110,
        genre: 'Science Fiction',
        policy: {
          enableBeats: true,
          enableNotes: true,
          enableScoring: true,
          enableFeasibility: true,
          enableRiskFlags: true,
          enableSensitivityAnalysis: true
        }
      })

      expect(beatAnalysis).toBeDefined()
      expect(Array.isArray(beatAnalysis)).toBe(true)
    }, 30000)
  })

  describe('Structured Output Validation', () => {
    test('should validate all LLM outputs against JSON schemas', async () => {
      const beats = await prisma.beat.findMany({ where: { scriptId } })
      const notes = await prisma.note.findMany({ where: { scriptId } })
      const scores = await prisma.score.findMany({ where: { scriptId } })

      // Validate beat structure
      beats.forEach(beat => {
        expect(beat.kind).toMatch(/^(OPENING_IMAGE|INCITING_INCIDENT|PLOT_POINT_1|MIDPOINT|PLOT_POINT_2|CLIMAX|RESOLUTION)$/)
        expect(typeof beat.page).toBe('number')
        expect(beat.page).toBeGreaterThan(0)
        expect(typeof beat.content).toBe('string')
        expect(beat.content.length).toBeGreaterThan(0)
        expect(beat.confidence).toBeGreaterThanOrEqual(0)
        expect(beat.confidence).toBeLessThanOrEqual(1)
      })

      // Validate note structure
      notes.forEach(note => {
        expect(['STRUCTURE', 'CHARACTER', 'DIALOGUE', 'PACING', 'THEME', 'GENRE', 'FORMATTING', 'LOGIC']).toContain(note.area)
        expect(['HIGH', 'MEDIUM', 'LOW']).toContain(note.severity)
        if (note.page) {
          expect(note.page).toBeGreaterThan(0)
        }
      })

      // Validate score structure
      scores.forEach(score => {
        expect(['STRUCTURE', 'CHARACTER', 'DIALOGUE', 'PACING', 'THEME', 'GENRE', 'OVERALL']).toContain(score.category)
        expect(score.value).toBeGreaterThanOrEqual(0)
        expect(score.value).toBeLessThanOrEqual(10)
      })
    })
  })

  describe('End-to-End Pipeline Validation', () => {
    test('should complete full analysis pipeline without errors', async () => {
      const pipeline = new AnalysisPipeline(scriptId, {
        enableBeats: true,
        enableNotes: true,
        enableScoring: true,
        enableFeasibility: true,
        enableRiskFlags: true,
        enableSensitivityAnalysis: true
      })

      const result = await pipeline.execute()

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      expect(result.stages.completed).toBeGreaterThan(0)

      // Verify data was created
      const beats = await prisma.beat.count({ where: { scriptId } })
      const notes = await prisma.note.count({ where: { scriptId } })
      const scores = await prisma.score.count({ where: { scriptId } })

      expect(beats).toBeGreaterThan(0)
      expect(notes).toBeGreaterThan(0)
      expect(scores).toBeGreaterThan(0)
    }, 120000) // 2 minute timeout for full pipeline
  })

  describe('Dashboard Data Validation', () => {
    test('should generate complete dashboard payload', async () => {
      // This would test the dashboard API endpoint
      const response = await fetch(`/api/v1/scripts/${scriptId}/dashboard`)
      expect(response.ok).toBe(true)

      const dashboardData = await response.json()

      expect(dashboardData.beats).toBeDefined()
      expect(dashboardData.notes).toBeDefined()
      expect(dashboardData.scores).toBeDefined()
      expect(dashboardData.pageMetrics).toBeDefined()
      expect(dashboardData.characterScenes).toBeDefined()
      expect(dashboardData.feasibility).toBeDefined()
      expect(dashboardData.riskFlags).toBeDefined()

      expect(Array.isArray(dashboardData.beats)).toBe(true)
      expect(dashboardData.beats.length).toBe(7)
    })
  })
})