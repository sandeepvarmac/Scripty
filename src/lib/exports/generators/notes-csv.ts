import { BaseGenerator } from './base-generator'
import { ExportOptions, ExportResult } from '../export-service'

export class NotesCSVGenerator extends BaseGenerator {
  async generate(notes: any[], scriptId: string, options: ExportOptions): Promise<ExportResult> {
    const headers = [
      'ID',
      'Page',
      'Line Reference',
      'Area',
      'Severity',
      'Excerpt',
      'Suggestion',
      'Rule Code',
      'Created At',
      'Updated At'
    ]

    const rows = notes.map(note => [
      note.id,
      note.page || '',
      note.lineRef || '',
      note.area,
      note.severity,
      this.escapeCsvField(note.excerpt || ''),
      this.escapeCsvField(note.suggestion || ''),
      note.ruleCode || '',
      note.createdAt ? new Date(note.createdAt).toISOString() : '',
      note.updatedAt ? new Date(note.updatedAt).toISOString() : ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Add metadata if requested
    const finalContent = options.includeMetadata
      ? this.addMetadata(csvContent, notes, scriptId)
      : csvContent

    const filename = `notes-${scriptId}.csv`
    return this.saveFile(finalContent, filename, 'text/csv')
  }

  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  private addMetadata(csvContent: string, notes: any[], scriptId: string): string {
    const metadata = [
      `# ScriptyBoy Notes Export`,
      `# Script ID: ${scriptId}`,
      `# Generated: ${new Date().toISOString()}`,
      `# Total Notes: ${notes.length}`,
      `# High Priority: ${notes.filter(n => n.severity === 'HIGH').length}`,
      `# Medium Priority: ${notes.filter(n => n.severity === 'MEDIUM').length}`,
      `# Low Priority: ${notes.filter(n => n.severity === 'LOW').length}`,
      `#`,
      ``
    ].join('\n')

    return metadata + csvContent
  }
}