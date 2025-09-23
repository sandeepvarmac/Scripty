import { BaseGenerator } from './base-generator'
import { ExportOptions, ExportResult } from '../export-service'

export class AnalysisCSVGenerator extends BaseGenerator {
  async generate(data: any, scriptId: string, options: ExportOptions): Promise<ExportResult> {
    const csvSections = this.generateCSVSections(data)
    const csvContent = csvSections.join('\n\n')

    const finalContent = options.includeMetadata
      ? this.addMetadata(csvContent, data, scriptId)
      : csvContent

    const filename = `analysis-${scriptId}.csv`
    return this.saveFile(finalContent, filename, 'text/csv')
  }

  private generateCSVSections(data: any): string[] {
    const sections: string[] = []

    // Script Information
    if (data.script) {
      sections.push(this.generateScriptInfoCSV(data.script))
    }

    // Scores
    if (data.scores?.length) {
      sections.push(this.generateScoresCSV(data.scores))
    }

    // Beats
    if (data.beats?.length) {
      sections.push(this.generateBeatsCSV(data.beats))
    }

    // Page Metrics
    if (data.pageMetrics?.length) {
      sections.push(this.generatePageMetricsCSV(data.pageMetrics))
    }

    // Character Analysis
    if (data.characterScenes?.length) {
      sections.push(this.generateCharacterCSV(data.characterScenes))
    }

    // Feasibility Metrics
    if (data.feasibility?.length) {
      sections.push(this.generateFeasibilityCSV(data.feasibility))
    }

    // Risk Assessment
    if (data.riskFlags?.length) {
      sections.push(this.generateRiskCSV(data.riskFlags))
    }

    return sections
  }

  private generateScriptInfoCSV(script: any): string {
    return [
      '# SCRIPT INFORMATION',
      'Field,Value',
      `ID,${script.id}`,
      `Title,${this.escapeCsvField(script.title || '')}`,
      `Author,${this.escapeCsvField(script.author || '')}`,
      `Page Count,${script.pageCount || 0}`,
      `Genre,${script.genreOverride || ''}`,
      `Status,${script.status || ''}`,
      `Processed At,${script.processedAt || ''}`,
      `Logline,${this.escapeCsvField(script.logline || '')}`,
      `Synopsis,${this.escapeCsvField(script.synopsisShort || '')}`
    ].join('\n')
  }

  private generateScoresCSV(scores: any[]): string {
    const headers = ['Category', 'Score', 'Reasoning', 'Confidence']
    const rows = scores.map(score => [
      score.category,
      score.value,
      this.escapeCsvField(score.reasoning || ''),
      score.confidence || ''
    ])

    return [
      '# SCORES',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
  }

  private generateBeatsCSV(beats: any[]): string {
    const headers = ['Beat Type', 'Page', 'Content', 'Timing Flag', 'Confidence']
    const rows = beats.map(beat => [
      beat.kind,
      beat.page,
      this.escapeCsvField(beat.content || ''),
      beat.timingFlag || '',
      beat.confidence || ''
    ])

    return [
      '# STORY BEATS',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
  }

  private generatePageMetricsCSV(pageMetrics: any[]): string {
    const headers = [
      'Page',
      'Tension Score',
      'Complexity Score',
      'Dialogue Lines',
      'Action Lines',
      'Scene Length Lines'
    ]
    const rows = pageMetrics.map(metric => [
      metric.page,
      metric.tensionScore || 0,
      metric.complexityScore || 0,
      metric.dialogueLines || 0,
      metric.actionLines || 0,
      metric.sceneLengthLines || 0
    ])

    return [
      '# PAGE METRICS',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
  }

  private generateCharacterCSV(characterScenes: any[]): string {
    const headers = [
      'Character ID',
      'Scene ID',
      'Lines',
      'Words',
      'Presence Type'
    ]
    const rows = characterScenes.map(cs => [
      cs.characterId,
      cs.sceneId,
      cs.lines || 0,
      cs.words || 0,
      cs.presenceType || ''
    ])

    return [
      '# CHARACTER ANALYSIS',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
  }

  private generateFeasibilityCSV(feasibility: any[]): string {
    const headers = [
      'Category',
      'Value',
      'Reasoning',
      'Budget Impact',
      'Complexity'
    ]
    const rows = feasibility.map(metric => [
      metric.category,
      metric.value,
      this.escapeCsvField(metric.reasoning || ''),
      metric.budgetImpact || '',
      metric.complexity || ''
    ])

    return [
      '# FEASIBILITY METRICS',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
  }

  private generateRiskCSV(riskFlags: any[]): string {
    const headers = [
      'Category',
      'Severity',
      'Description',
      'Mitigation',
      'Confidence'
    ]
    const rows = riskFlags.map(risk => [
      risk.category,
      risk.severity,
      this.escapeCsvField(risk.description || ''),
      this.escapeCsvField(risk.mitigation || ''),
      risk.confidence || ''
    ])

    return [
      '# RISK ASSESSMENT',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
  }

  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  private addMetadata(csvContent: string, data: any, scriptId: string): string {
    const totalDataPoints = (data.scores?.length || 0) +
                           (data.beats?.length || 0) +
                           (data.pageMetrics?.length || 0) +
                           (data.characterScenes?.length || 0) +
                           (data.feasibility?.length || 0) +
                           (data.riskFlags?.length || 0)

    const metadata = [
      `# ScriptyBoy Analysis Export`,
      `# Script ID: ${scriptId}`,
      `# Generated: ${new Date().toISOString()}`,
      `# Total Data Points: ${totalDataPoints}`,
      `# Export Format: Multi-section CSV`,
      `# Data Structure: Complete Analysis`,
      `#`,
      ``
    ].join('\n')

    return metadata + csvContent
  }
}