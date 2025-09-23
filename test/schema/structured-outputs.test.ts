import { describe, test, expect } from '@jest/globals'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import {
  beatSchema,
  noteSchema,
  scoreSchema,
  riskFlagSchema,
  feasibilityMetricSchema,
  themeStatementSchema,
  pageMetricSchema
} from '@/lib/llm/schemas'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)

describe('Structured Output Schema Validation', () => {
  describe('Beat Schema Validation', () => {
    const validateBeat = ajv.compile(beatSchema)

    test('should validate correct beat structure', () => {
      const validBeat = {
        kind: 'OPENING_IMAGE',
        page: 1,
        content: 'The story opens with a compelling visual that sets the tone.',
        timingFlag: 'ON_TIME',
        confidence: 0.85
      }

      const isValid = validateBeat(validBeat)
      expect(isValid).toBe(true)
      expect(validateBeat.errors).toBe(null)
    })

    test('should reject invalid beat kind', () => {
      const invalidBeat = {
        kind: 'INVALID_BEAT',
        page: 1,
        content: 'Test content',
        timingFlag: 'ON_TIME',
        confidence: 0.85
      }

      const isValid = validateBeat(invalidBeat)
      expect(isValid).toBe(false)
      expect(validateBeat.errors).toBeTruthy()
      expect(validateBeat.errors![0].message).toContain('must be equal to one of the allowed values')
    })

    test('should reject invalid page number', () => {
      const invalidBeat = {
        kind: 'OPENING_IMAGE',
        page: 0,
        content: 'Test content',
        timingFlag: 'ON_TIME',
        confidence: 0.85
      }

      const isValid = validateBeat(invalidBeat)
      expect(isValid).toBe(false)
      expect(validateBeat.errors![0].message).toContain('must be >= 1')
    })

    test('should reject invalid confidence score', () => {
      const invalidBeat = {
        kind: 'OPENING_IMAGE',
        page: 1,
        content: 'Test content',
        timingFlag: 'ON_TIME',
        confidence: 1.5
      }

      const isValid = validateBeat(invalidBeat)
      expect(isValid).toBe(false)
      expect(validateBeat.errors![0].message).toContain('must be <= 1')
    })

    test('should validate all beat kinds', () => {
      const beatKinds = [
        'OPENING_IMAGE',
        'INCITING_INCIDENT',
        'PLOT_POINT_1',
        'MIDPOINT',
        'PLOT_POINT_2',
        'CLIMAX',
        'RESOLUTION'
      ]

      beatKinds.forEach(kind => {
        const beat = {
          kind,
          page: 25,
          content: `Test content for ${kind}`,
          timingFlag: 'ON_TIME',
          confidence: 0.8
        }

        const isValid = validateBeat(beat)
        expect(isValid).toBe(true)
      })
    })
  })

  describe('Note Schema Validation', () => {
    const validateNote = ajv.compile(noteSchema)

    test('should validate correct note structure', () => {
      const validNote = {
        area: 'CHARACTER',
        severity: 'HIGH',
        page: 15,
        lineRef: 23,
        excerpt: 'The character motivation is unclear here.',
        suggestion: 'Consider adding backstory to clarify the character\'s motivation.',
        ruleCode: 'CHAR_MOTIVATION_001'
      }

      const isValid = validateNote(validNote)
      expect(isValid).toBe(true)
      expect(validateNote.errors).toBe(null)
    })

    test('should validate minimal note structure', () => {
      const minimalNote = {
        area: 'DIALOGUE',
        severity: 'LOW',
        suggestion: 'Minor dialogue improvement suggestion.'
      }

      const isValid = validateNote(minimalNote)
      expect(isValid).toBe(true)
    })

    test('should reject invalid area', () => {
      const invalidNote = {
        area: 'INVALID_AREA',
        severity: 'HIGH',
        suggestion: 'Test suggestion'
      }

      const isValid = validateNote(invalidNote)
      expect(isValid).toBe(false)
      expect(validateNote.errors![0].message).toContain('must be equal to one of the allowed values')
    })

    test('should validate all note areas', () => {
      const noteAreas = [
        'STRUCTURE',
        'CHARACTER',
        'DIALOGUE',
        'PACING',
        'THEME',
        'GENRE',
        'FORMATTING',
        'LOGIC'
      ]

      noteAreas.forEach(area => {
        const note = {
          area,
          severity: 'MEDIUM',
          suggestion: `Test suggestion for ${area}`
        }

        const isValid = validateNote(note)
        expect(isValid).toBe(true)
      })
    })

    test('should validate all severity levels', () => {
      const severityLevels = ['HIGH', 'MEDIUM', 'LOW']

      severityLevels.forEach(severity => {
        const note = {
          area: 'STRUCTURE',
          severity,
          suggestion: `Test suggestion with ${severity} severity`
        }

        const isValid = validateNote(note)
        expect(isValid).toBe(true)
      })
    })
  })

  describe('Score Schema Validation', () => {
    const validateScore = ajv.compile(scoreSchema)

    test('should validate correct score structure', () => {
      const validScore = {
        category: 'STRUCTURE',
        value: 7.5,
        reasoning: 'Strong three-act structure with clear turning points.',
        confidence: 0.9
      }

      const isValid = validateScore(validScore)
      expect(isValid).toBe(true)
      expect(validateScore.errors).toBe(null)
    })

    test('should reject out-of-range score values', () => {
      const invalidScore = {
        category: 'CHARACTER',
        value: 15,
        reasoning: 'Test reasoning',
        confidence: 0.8
      }

      const isValid = validateScore(invalidScore)
      expect(isValid).toBe(false)
      expect(validateScore.errors![0].message).toContain('must be <= 10')
    })

    test('should reject negative score values', () => {
      const invalidScore = {
        category: 'DIALOGUE',
        value: -1,
        reasoning: 'Test reasoning',
        confidence: 0.8
      }

      const isValid = validateScore(invalidScore)
      expect(isValid).toBe(false)
      expect(validateScore.errors![0].message).toContain('must be >= 0')
    })

    test('should validate all score categories', () => {
      const categories = [
        'STRUCTURE',
        'CHARACTER',
        'DIALOGUE',
        'PACING',
        'THEME',
        'GENRE',
        'OVERALL'
      ]

      categories.forEach(category => {
        const score = {
          category,
          value: 6.5,
          reasoning: `Test reasoning for ${category}`,
          confidence: 0.75
        }

        const isValid = validateScore(score)
        expect(isValid).toBe(true)
      })
    })
  })

  describe('Risk Flag Schema Validation', () => {
    const validateRiskFlag = ajv.compile(riskFlagSchema)

    test('should validate correct risk flag structure', () => {
      const validRiskFlag = {
        category: 'CONTENT_WARNING',
        severity: 'HIGH',
        description: 'Contains graphic violence that may require content warnings.',
        mitigation: 'Add appropriate content warnings and rating guidance.',
        confidence: 0.85
      }

      const isValid = validateRiskFlag(validRiskFlag)
      expect(isValid).toBe(true)
      expect(validateRiskFlag.errors).toBe(null)
    })

    test('should validate all risk categories', () => {
      const riskCategories = [
        'CONTENT_WARNING',
        'LEGAL_CONCERN',
        'CULTURAL_SENSITIVITY',
        'TECHNICAL_COMPLEXITY',
        'BUDGET_RISK',
        'MARKET_RISK'
      ]

      riskCategories.forEach(category => {
        const riskFlag = {
          category,
          severity: 'MEDIUM',
          description: `Test description for ${category}`,
          confidence: 0.7
        }

        const isValid = validateRiskFlag(riskFlag)
        expect(isValid).toBe(true)
      })
    })
  })

  describe('Feasibility Metric Schema Validation', () => {
    const validateFeasibilityMetric = ajv.compile(feasibilityMetricSchema)

    test('should validate correct feasibility metric structure', () => {
      const validMetric = {
        category: 'LOCATION_COMPLEXITY',
        value: 3.2,
        reasoning: 'Multiple unique locations requiring significant setup.',
        budgetImpact: 'HIGH',
        complexity: 'MEDIUM'
      }

      const isValid = validateFeasibilityMetric(validMetric)
      expect(isValid).toBe(true)
      expect(validateFeasibilityMetric.errors).toBe(null)
    })

    test('should validate all feasibility categories', () => {
      const categories = [
        'LOCATION_COMPLEXITY',
        'CAST_SIZE',
        'SPECIAL_EFFECTS',
        'STUNTS_ACTION',
        'WARDROBE_MAKEUP',
        'EQUIPMENT_NEEDS',
        'POST_PRODUCTION'
      ]

      categories.forEach(category => {
        const metric = {
          category,
          value: 2.5,
          reasoning: `Test reasoning for ${category}`,
          budgetImpact: 'MEDIUM',
          complexity: 'LOW'
        }

        const isValid = validateFeasibilityMetric(metric)
        expect(isValid).toBe(true)
      })
    })
  })

  describe('Theme Statement Schema Validation', () => {
    const validateThemeStatement = ajv.compile(themeStatementSchema)

    test('should validate correct theme statement structure', () => {
      const validTheme = {
        statement: 'Hope persists even in the face of seemingly insurmountable challenges.',
        evidence: 'The protagonist continues searching for a solution despite repeated failures.',
        strength: 'STRONG',
        thematicElements: ['hope', 'perseverance', 'discovery']
      }

      const isValid = validateThemeStatement(validTheme)
      expect(isValid).toBe(true)
      expect(validateThemeStatement.errors).toBe(null)
    })

    test('should validate all strength levels', () => {
      const strengthLevels = ['STRONG', 'MODERATE', 'WEAK']

      strengthLevels.forEach(strength => {
        const theme = {
          statement: 'Test theme statement',
          evidence: 'Test evidence',
          strength,
          thematicElements: ['test', 'elements']
        }

        const isValid = validateThemeStatement(theme)
        expect(isValid).toBe(true)
      })
    })
  })

  describe('Page Metric Schema Validation', () => {
    const validatePageMetric = ajv.compile(pageMetricSchema)

    test('should validate correct page metric structure', () => {
      const validMetric = {
        page: 25,
        tensionScore: 7.2,
        complexityScore: 5.8,
        dialogueLines: 15,
        actionLines: 8,
        sceneLengthLines: 23
      }

      const isValid = validatePageMetric(validMetric)
      expect(isValid).toBe(true)
      expect(validatePageMetric.errors).toBe(null)
    })

    test('should reject negative line counts', () => {
      const invalidMetric = {
        page: 1,
        tensionScore: 5.0,
        complexityScore: 3.0,
        dialogueLines: -1,
        actionLines: 5,
        sceneLengthLines: 10
      }

      const isValid = validatePageMetric(invalidMetric)
      expect(isValid).toBe(false)
      expect(validatePageMetric.errors![0].message).toContain('must be >= 0')
    })

    test('should reject invalid score ranges', () => {
      const invalidMetric = {
        page: 1,
        tensionScore: 15.0, // > 10
        complexityScore: 3.0,
        dialogueLines: 5,
        actionLines: 5,
        sceneLengthLines: 10
      }

      const isValid = validatePageMetric(invalidMetric)
      expect(isValid).toBe(false)
      expect(validatePageMetric.errors![0].message).toContain('must be <= 10')
    })
  })

  describe('Comprehensive Schema Integration', () => {
    test('should validate complete analysis payload', () => {
      const completePayload = {
        beats: [
          {
            kind: 'OPENING_IMAGE',
            page: 1,
            content: 'Opening scene description',
            timingFlag: 'ON_TIME',
            confidence: 0.9
          }
        ],
        notes: [
          {
            area: 'CHARACTER',
            severity: 'MEDIUM',
            page: 5,
            suggestion: 'Character development suggestion'
          }
        ],
        scores: [
          {
            category: 'STRUCTURE',
            value: 8.0,
            reasoning: 'Strong structural foundation',
            confidence: 0.85
          }
        ],
        riskFlags: [
          {
            category: 'CONTENT_WARNING',
            severity: 'LOW',
            description: 'Minor content concern',
            confidence: 0.7
          }
        ],
        feasibility: [
          {
            category: 'LOCATION_COMPLEXITY',
            value: 4.0,
            reasoning: 'Standard location requirements',
            budgetImpact: 'MEDIUM',
            complexity: 'LOW'
          }
        ]
      }

      // Validate each array
      completePayload.beats.forEach(beat => {
        expect(validateBeat(beat)).toBe(true)
      })

      completePayload.notes.forEach(note => {
        expect(validateNote(note)).toBe(true)
      })

      completePayload.scores.forEach(score => {
        expect(validateScore(score)).toBe(true)
      })

      completePayload.riskFlags.forEach(risk => {
        expect(validateRiskFlag(risk)).toBe(true)
      })

      completePayload.feasibility.forEach(metric => {
        expect(validateFeasibilityMetric(metric)).toBe(true)
      })
    })

    test('should collect and report all validation errors', () => {
      const invalidPayload = {
        kind: 'INVALID_BEAT_TYPE',
        page: -1,
        content: '', // Empty content
        timingFlag: 'INVALID_FLAG',
        confidence: 2.0 // > 1.0
      }

      const isValid = validateBeat(invalidPayload)
      expect(isValid).toBe(false)
      expect(validateBeat.errors!.length).toBeGreaterThan(1)

      // Check that all errors are captured
      const errorPaths = validateBeat.errors!.map(err => err.instancePath || err.schemaPath)
      expect(errorPaths).toContain('/kind')
      expect(errorPaths).toContain('/page')
      expect(errorPaths).toContain('/timingFlag')
      expect(errorPaths).toContain('/confidence')
    })
  })

  describe('Performance and Edge Cases', () => {
    test('should handle large arrays efficiently', () => {
      const largeNotesArray = Array(1000).fill(null).map((_, index) => ({
        area: 'DIALOGUE',
        severity: 'LOW',
        page: index + 1,
        suggestion: `Test suggestion ${index}`
      }))

      const startTime = Date.now()
      largeNotesArray.forEach(note => {
        expect(validateNote(note)).toBe(true)
      })
      const endTime = Date.now()

      // Should complete validation in reasonable time (< 1 second)
      expect(endTime - startTime).toBeLessThan(1000)
    })

    test('should handle unicode and special characters', () => {
      const unicodeNote = {
        area: 'CHARACTER',
        severity: 'MEDIUM',
        excerpt: 'Dialogue with émojis 🎬 and spëcial characters',
        suggestion: 'Consider using standard characters for broader compatibility'
      }

      const isValid = validateNote(unicodeNote)
      expect(isValid).toBe(true)
    })

    test('should handle very long strings', () => {
      const longContent = 'A'.repeat(5000)

      const longBeat = {
        kind: 'MIDPOINT',
        page: 50,
        content: longContent,
        timingFlag: 'ON_TIME',
        confidence: 0.8
      }

      const isValid = validateBeat(longBeat)
      expect(isValid).toBe(true)
    })
  })
})