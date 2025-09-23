import { BaseGenerator } from './base-generator'
import { ExportOptions, ExportResult } from '../export-service'

export class NotesPDFGenerator extends BaseGenerator {
  async generate(notes: any[], scriptId: string, options: ExportOptions): Promise<ExportResult> {
    const htmlContent = this.generateNotesHTML(notes, scriptId)
    const filename = `notes-report-${scriptId}.html`
    return this.saveFile(htmlContent, filename, 'text/html')
  }

  private generateNotesHTML(notes: any[], scriptId: string): string {
    const today = this.formatDate(new Date())
    const groupedNotes = this.groupNotesByArea(notes)

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notes Report - ${scriptId}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 1in;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .summary-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid #e5e7eb;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
        }
        .area-section {
            margin: 30px 0;
            page-break-inside: avoid;
        }
        .area-title {
            background: #2563eb;
            color: white;
            padding: 10px 15px;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .note-item {
            background: #fafafa;
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
            border-left: 4px solid #6b7280;
        }
        .note-item.high {
            border-left-color: #ef4444;
            background: #fef2f2;
        }
        .note-item.medium {
            border-left-color: #f59e0b;
            background: #fffbeb;
        }
        .note-item.low {
            border-left-color: #10b981;
            background: #f0fdf4;
        }
        .note-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .severity-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            color: white;
        }
        .severity-high { background: #ef4444; }
        .severity-medium { background: #f59e0b; }
        .severity-low { background: #10b981; }
        .excerpt {
            font-style: italic;
            background: #f3f4f6;
            padding: 10px;
            border-radius: 4px;
            margin: 8px 0;
            color: #6b7280;
        }
        .suggestion {
            margin-top: 8px;
        }
        .page-ref {
            font-size: 12px;
            color: #6b7280;
            margin-top: 5px;
        }
        .page-break {
            page-break-before: always;
        }
        h1 { font-size: 28px; margin-bottom: 10px; }
        h2 { font-size: 22px; color: #2563eb; margin-top: 30px; margin-bottom: 15px; }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        .toc {
            background: #f9fafb;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .toc ul {
            list-style: none;
            padding: 0;
        }
        .toc li {
            padding: 5px 0;
            border-bottom: 1px dotted #d1d5db;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">SCRIPTYBOY</div>
        <h1>DETAILED NOTES REPORT</h1>
        <p>Script Analysis Notes</p>
        <p>${today}</p>
    </div>

    <div class="summary-stats">
        <div class="stat-card">
            <div class="stat-number">${notes.length}</div>
            <div>Total Notes</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${notes.filter(n => n.severity === 'HIGH').length}</div>
            <div>High Priority</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${notes.filter(n => n.severity === 'MEDIUM').length}</div>
            <div>Medium Priority</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${notes.filter(n => n.severity === 'LOW').length}</div>
            <div>Low Priority</div>
        </div>
    </div>

    <div class="toc">
        <h2>Table of Contents</h2>
        <ul>
            ${Object.keys(groupedNotes).map(area => `
                <li>
                    <strong>${this.formatAreaName(area)}</strong>
                    (${groupedNotes[area].length} notes)
                </li>
            `).join('')}
        </ul>
    </div>

    ${Object.entries(groupedNotes).map(([area, areaNotes]) => `
        <div class="area-section">
            <div class="area-title">${this.formatAreaName(area)}</div>
            ${(areaNotes as any[]).map(note => `
                <div class="note-item ${note.severity.toLowerCase()}">
                    <div class="note-header">
                        <span class="severity-badge severity-${note.severity.toLowerCase()}">
                            ${note.severity} PRIORITY
                        </span>
                        ${note.page ? `<span class="page-ref">Page ${note.page}${note.lineRef ? `, Line ${note.lineRef}` : ''}</span>` : ''}
                    </div>

                    ${note.excerpt ? `
                        <div class="excerpt">
                            "${note.excerpt}"
                        </div>
                    ` : ''}

                    ${note.suggestion ? `
                        <div class="suggestion">
                            <strong>Suggestion:</strong> ${note.suggestion}
                        </div>
                    ` : ''}

                    ${note.ruleCode ? `
                        <div class="page-ref">
                            Rule: ${note.ruleCode}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `).join('')}

    <div class="footer">
        <p>This notes report was generated by ScriptyBoy AI Analysis Platform</p>
        <p>Total notes analyzed: ${notes.length}</p>
        <p>© ${new Date().getFullYear()} ScriptyBoy. All rights reserved.</p>
    </div>
</body>
</html>
    `.trim()
  }

  private groupNotesByArea(notes: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {}

    notes.forEach(note => {
      const area = note.area || 'GENERAL'
      if (!grouped[area]) {
        grouped[area] = []
      }
      grouped[area].push(note)
    })

    // Sort notes within each area by severity and page
    Object.keys(grouped).forEach(area => {
      grouped[area].sort((a, b) => {
        const severityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
        const severityDiff = (severityOrder[b.severity as keyof typeof severityOrder] || 0) -
                           (severityOrder[a.severity as keyof typeof severityOrder] || 0)
        if (severityDiff !== 0) return severityDiff
        return (a.page || 0) - (b.page || 0)
      })
    })

    return grouped
  }

  private formatAreaName(area: string): string {
    return area.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }
}