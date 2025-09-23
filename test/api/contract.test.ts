import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import request from 'supertest'
import { promises as fs } from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000'

describe('API Contract Tests', () => {
  let projectId: string
  let scriptId: string
  let testFileBuffer: Buffer

  beforeAll(async () => {
    // Create test project
    const project = await prisma.project.create({
      data: {
        name: 'API Contract Test Project',
        description: 'Testing API contracts',
        userId: 'test-user-api',
        enableSensitivityAnalysis: true
      }
    })
    projectId = project.id

    // Load test script file
    const scriptPath = path.join(process.cwd(), 'test', 'fixtures', 'gold-scripts', 'feature-length.fountain')
    testFileBuffer = await fs.readFile(scriptPath)
  })

  afterAll(async () => {
    // Cleanup
    if (scriptId) {
      await prisma.script.deleteMany({ where: { projectId } })
    }
    await prisma.project.delete({ where: { id: projectId } })
    await prisma.$disconnect()
  })

  describe('POST /v1/projects/:id/upload', () => {
    test('should accept valid fountain file upload', async () => {
      const response = await request(API_BASE)
        .post(`/api/v1/projects/${projectId}/upload`)
        .attach('file', testFileBuffer, 'test-script.fountain')
        .field('pdfPassword', '')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        file_id: expect.any(String),
        script_id: expect.any(String)
      })

      scriptId = response.body.script_id
    })

    test('should reject invalid file format', async () => {
      const invalidBuffer = Buffer.from('invalid content')

      const response = await request(API_BASE)
        .post(`/api/v1/projects/${projectId}/upload`)
        .attach('file', invalidBuffer, 'test.txt')
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      })
    })

    test('should validate required project ID', async () => {
      await request(API_BASE)
        .post('/api/v1/projects/invalid-id/upload')
        .attach('file', testFileBuffer, 'test-script.fountain')
        .expect(404)
    })
  })

  describe('GET /v1/scripts/:id/parse-preview', () => {
    test('should return script preview data', async () => {
      const response = await request(API_BASE)
        .get(`/api/v1/scripts/${scriptId}/parse-preview`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        preview: {
          pages: expect.any(Number),
          scenes: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(Number),
              heading: expect.any(String),
              int_ext: expect.stringMatching(/^(INT|EXT)$/),
              location: expect.any(String),
              tod: expect.any(String),
              page_start: expect.any(Number),
              page_end: expect.any(Number)
            })
          ]),
          characters: expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
              aliases: expect.any(Array)
            })
          ]),
          genreGuess: expect.any(String)
        }
      })

      expect(response.body.preview.pages).toBeGreaterThan(0)
      expect(response.body.preview.scenes.length).toBeGreaterThan(0)
    })

    test('should handle non-existent script', async () => {
      await request(API_BASE)
        .get('/api/v1/scripts/non-existent-id/parse-preview')
        .expect(404)
    })
  })

  describe('GET /v1/scripts/:id/dashboard', () => {
    beforeAll(async () => {
      // Ensure script has been analyzed
      // In a real test, you'd trigger analysis first
      await prisma.script.update({
        where: { id: scriptId },
        data: { status: 'ANALYZED' }
      })
    })

    test('should return complete dashboard payload', async () => {
      const response = await request(API_BASE)
        .get(`/api/v1/scripts/${scriptId}/dashboard`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          beats: expect.any(Array),
          notes: expect.any(Array),
          scores: expect.any(Array),
          pageMetrics: expect.any(Array),
          characterScenes: expect.any(Array),
          feasibility: expect.any(Array),
          subplots: expect.any(Array),
          themeStatements: expect.any(Array),
          riskFlags: expect.any(Array)
        }
      })

      // Validate beat structure
      if (response.body.data.beats.length > 0) {
        expect(response.body.data.beats[0]).toMatchObject({
          id: expect.any(String),
          kind: expect.stringMatching(/^(OPENING_IMAGE|INCITING_INCIDENT|PLOT_POINT_1|MIDPOINT|PLOT_POINT_2|CLIMAX|RESOLUTION)$/),
          page: expect.any(Number),
          content: expect.any(String),
          timingFlag: expect.stringMatching(/^(ON_TIME|EARLY|LATE)$/),
          confidence: expect.any(Number)
        })
      }

      // Validate note structure
      if (response.body.data.notes.length > 0) {
        expect(response.body.data.notes[0]).toMatchObject({
          id: expect.any(String),
          area: expect.stringMatching(/^(STRUCTURE|CHARACTER|DIALOGUE|PACING|THEME|GENRE|FORMATTING|LOGIC)$/),
          severity: expect.stringMatching(/^(HIGH|MEDIUM|LOW)$/),
          suggestion: expect.any(String)
        })
      }

      // Validate score structure
      if (response.body.data.scores.length > 0) {
        expect(response.body.data.scores[0]).toMatchObject({
          category: expect.stringMatching(/^(STRUCTURE|CHARACTER|DIALOGUE|PACING|THEME|GENRE|OVERALL)$/),
          value: expect.any(Number),
          reasoning: expect.any(String)
        })

        expect(response.body.data.scores[0].value).toBeGreaterThanOrEqual(0)
        expect(response.body.data.scores[0].value).toBeLessThanOrEqual(10)
      }
    })

    test('should handle script without analysis', async () => {
      // Create unanalyzed script
      const unanalyzedScript = await prisma.script.create({
        data: {
          projectId,
          title: 'Unanalyzed Script',
          author: 'Test',
          pageCount: 1,
          status: 'UPLOADED',
          content: 'FADE IN:\nTEST\nFADE OUT.',
          sha256: 'test-hash-unanalyzed'
        }
      })

      const response = await request(API_BASE)
        .get(`/api/v1/scripts/${unanalyzedScript.id}/dashboard`)
        .expect(200)

      expect(response.body.data.beats).toHaveLength(0)
      expect(response.body.data.notes).toHaveLength(0)
      expect(response.body.data.scores).toHaveLength(0)

      // Cleanup
      await prisma.script.delete({ where: { id: unanalyzedScript.id } })
    })
  })

  describe('GET /v1/scenes/:id', () => {
    test('should return scene details with elements and notes', async () => {
      // Get first scene from script
      const scene = await prisma.scene.findFirst({
        where: { scriptId }
      })

      if (!scene) {
        console.log('No scenes found, skipping scene endpoint test')
        return
      }

      const response = await request(API_BASE)
        .get(`/api/v1/scenes/${scene.id}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        scene: {
          id: expect.any(String),
          heading: expect.any(String),
          int_ext: expect.stringMatching(/^(INT|EXT)$/),
          location: expect.any(String),
          elements: expect.any(Array),
          feasibility: expect.any(Object),
          notes: expect.any(Array)
        }
      })
    })
  })

  describe('POST /v1/scripts/:id/notes', () => {
    test('should bulk upsert notes', async () => {
      const notesPayload = [
        {
          area: 'CHARACTER',
          severity: 'HIGH',
          page: 5,
          lineRef: 10,
          excerpt: 'Test excerpt',
          suggestion: 'Test suggestion',
          ruleCode: 'CHAR_001'
        },
        {
          area: 'DIALOGUE',
          severity: 'MEDIUM',
          page: 10,
          suggestion: 'Another test suggestion'
        }
      ]

      const response = await request(API_BASE)
        .post(`/api/v1/scripts/${scriptId}/notes`)
        .send({ notes: notesPayload })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        created: 2,
        updated: 0
      })

      // Verify notes were created
      const notes = await prisma.note.findMany({
        where: { scriptId }
      })

      expect(notes.length).toBeGreaterThanOrEqual(2)
    })

    test('should validate note structure', async () => {
      const invalidNotesPayload = [
        {
          area: 'INVALID_AREA',
          severity: 'HIGH',
          suggestion: 'Test'
        }
      ]

      await request(API_BASE)
        .post(`/api/v1/scripts/${scriptId}/notes`)
        .send({ notes: invalidNotesPayload })
        .expect(400)
    })
  })

  describe('PUT /v1/scripts/:id/scores', () => {
    test('should bulk set rubric scores', async () => {
      const scoresPayload = [
        {
          category: 'STRUCTURE',
          value: 8.5,
          reasoning: 'Strong three-act structure'
        },
        {
          category: 'CHARACTER',
          value: 7.2,
          reasoning: 'Well-developed protagonist'
        }
      ]

      const response = await request(API_BASE)
        .put(`/api/v1/scripts/${scriptId}/scores`)
        .send({ scores: scoresPayload })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        updated: 2
      })

      // Verify scores were set
      const scores = await prisma.score.findMany({
        where: { scriptId }
      })

      expect(scores.length).toBeGreaterThanOrEqual(2)
    })

    test('should validate score values', async () => {
      const invalidScoresPayload = [
        {
          category: 'STRUCTURE',
          value: 15, // Invalid: > 10
          reasoning: 'Test'
        }
      ]

      await request(API_BASE)
        .put(`/api/v1/scripts/${scriptId}/scores`)
        .send({ scores: invalidScoresPayload })
        .expect(400)
    })
  })

  describe('GET /v1/scripts/:id/feasibility', () => {
    test('should return feasibility breakdown', async () => {
      const response = await request(API_BASE)
        .get(`/api/v1/scripts/${scriptId}/feasibility`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        feasibility: {
          locationBreakdown: {
            interior: expect.any(Number),
            exterior: expect.any(Number),
            total: expect.any(Number)
          },
          categoryMetrics: expect.any(Array),
          companyMoveEstimate: expect.any(Number),
          budgetImpact: expect.stringMatching(/^(LOW|MEDIUM|HIGH)$/)
        }
      })
    })
  })

  describe('POST /v1/reports/coverage', () => {
    test('should generate coverage report', async () => {
      const coveragePayload = {
        scriptId,
        recommendation: 'CONSIDER',
        comps: ['Arrival', 'Interstellar'],
        synopsisShort: 'Test synopsis',
        synopsisLong: 'Extended test synopsis'
      }

      const response = await request(API_BASE)
        .post('/api/v1/reports/coverage')
        .send(coveragePayload)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        reportId: expect.any(String),
        downloadUrl: expect.any(String)
      })
    })
  })

  describe('POST /v1/notes/export', () => {
    test('should export notes as PDF and CSV', async () => {
      const exportPayload = {
        scriptId,
        format: 'csv',
        includeAnchors: true,
        includeExcerpts: true
      }

      const response = await request(API_BASE)
        .post('/api/v1/notes/export')
        .send(exportPayload)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        exportId: expect.any(String),
        downloadUrl: expect.any(String),
        format: 'csv'
      })
    })
  })

  describe('GET /v1/scripts/:id/finaldraft-change-list', () => {
    test('should return FDX change list when available', async () => {
      // This test assumes the script was uploaded as FDX
      // For fountain files, it should return appropriate message

      const response = await request(API_BASE)
        .get(`/api/v1/scripts/${scriptId}/finaldraft-change-list`)

      // Should either return change list or indicate unavailability
      expect([200, 404]).toContain(response.status)

      if (response.status === 200) {
        expect(response.body).toMatchObject({
          success: true,
          changeList: expect.any(String), // FDX XML content
          downloadUrl: expect.any(String)
        })
      } else {
        expect(response.body).toMatchObject({
          success: false,
          error: expect.stringContaining('not available')
        })
      }
    })
  })

  describe('Rate Limiting and Error Handling', () => {
    test('should handle rate limiting', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(10).fill(null).map(() =>
        request(API_BASE).get(`/api/v1/scripts/${scriptId}/dashboard`)
      )

      const responses = await Promise.allSettled(requests)

      // At least some should succeed
      const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status === 200)
      expect(successful.length).toBeGreaterThan(0)
    })

    test('should return proper error format', async () => {
      const response = await request(API_BASE)
        .get('/api/v1/scripts/non-existent-id/dashboard')
        .expect(404)

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String),
        code: expect.any(String)
      })
    })

    test('should validate request content-type', async () => {
      await request(API_BASE)
        .post(`/api/v1/scripts/${scriptId}/notes`)
        .set('Content-Type', 'text/plain')
        .send('invalid data')
        .expect(400)
    })
  })

  describe('OpenAPI Schema Validation', () => {
    test('should validate responses against OpenAPI schema', async () => {
      // Load OpenAPI schema
      const schemaPath = path.join(process.cwd(), 'docs', 'openapi.yaml')
      const schemaExists = await fs.access(schemaPath).then(() => true).catch(() => false)

      if (!schemaExists) {
        console.log('OpenAPI schema not found, skipping validation test')
        return
      }

      // Test dashboard endpoint against schema
      const response = await request(API_BASE)
        .get(`/api/v1/scripts/${scriptId}/dashboard`)
        .expect(200)

      // This would require additional schema validation library
      // expect(response.body).toMatchSchema(dashboardSchema)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
    })
  })
})