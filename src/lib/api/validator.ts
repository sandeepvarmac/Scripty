import Ajv, { ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'

import beatSchema from '../../../openapi/schemas/beat.schema.json'
import noteSchema from '../../../openapi/schemas/note.schema.json'
import riskFlagSchema from '../../../openapi/schemas/risk-flag.schema.json'
import themeStatementSchema from '../../../openapi/schemas/theme-statement.schema.json'
import sceneThemeAlignmentSchema from '../../../openapi/schemas/scene-theme-alignment.schema.json'
import feasibilityMetricSchema from '../../../openapi/schemas/feasibility-metric.schema.json'
import pageMetricSchema from '../../../openapi/schemas/page-metric.schema.json'
import characterSceneSchema from '../../../openapi/schemas/character-scene.schema.json'
import subplotSchema from '../../../openapi/schemas/subplot.schema.json'
import subplotSpanSchema from '../../../openapi/schemas/subplot-span.schema.json'
import scoreSchema from '../../../openapi/schemas/score.schema.json'
import elementSchema from '../../../openapi/schemas/element.schema.json'

export type SchemaId =
  | 'beat'
  | 'note'
  | 'riskFlag'
  | 'themeStatement'
  | 'sceneThemeAlignment'
  | 'feasibilityMetric'
  | 'pageMetric'
  | 'characterScene'
  | 'subplot'
  | 'subplotSpan'
  | 'score'
  | 'element'

const ajv = new Ajv({
  strict: true,
  allErrors: true
})
addFormats(ajv)

const schemaMap: Record<SchemaId, any> = {
  beat: beatSchema,
  note: noteSchema,
  riskFlag: riskFlagSchema,
  themeStatement: themeStatementSchema,
  sceneThemeAlignment: sceneThemeAlignmentSchema,
  feasibilityMetric: feasibilityMetricSchema,
  pageMetric: pageMetricSchema,
  characterScene: characterSceneSchema,
  subplot: subplotSchema,
  subplotSpan: subplotSpanSchema,
  score: scoreSchema,
  element: elementSchema
}

Object.entries(schemaMap).forEach(([key, schema]) => {
  ajv.addSchema(schema, key)
})

const validatorCache: Partial<Record<SchemaId, ValidateFunction>> = {}

export function validate<T = unknown>(schemaId: SchemaId, payload: T): void {
  let validator = validatorCache[schemaId]
  if (!validator) {
    validator = ajv.getSchema(schemaId)
    if (!validator) {
      throw new Error(`Validator not registered for schema '${schemaId}'`)
    }
    validatorCache[schemaId] = validator
  }

  const valid = validator(payload)
  if (!valid) {
    const message = ajv.errorsText(validator.errors, { dataVar: schemaId })
    const error = new Error(`Validation failed for ${schemaId}: ${message}`)
    ;(error as any).details = validator.errors
    throw error
  }
}
