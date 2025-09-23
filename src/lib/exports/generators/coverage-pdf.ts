import { BaseGenerator } from './base-generator'
import { ExportOptions, ExportResult } from '../export-service'

export class CoveragePDFGenerator extends BaseGenerator {
  async generate(script: any, options: ExportOptions): Promise<ExportResult> {
    // Calculate overall recommendation
    const avgScore = script.scores.length > 0
      ? script.scores.reduce((sum: number, score: any) => sum + score.value, 0) / script.scores.length
      : 0

    const recommendation = this.getRecommendation(avgScore, script.riskFlags)

    // Generate HTML content for PDF
    const htmlContent = this.generateCoverageHTML(script, recommendation, avgScore)

    // In a real implementation, this would use a PDF library like Puppeteer or jsPDF
    // For now, we'll create an HTML file that can be converted to PDF
    const filename = `coverage-report-${script.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.html`

    return this.saveFile(htmlContent, filename, 'text/html')
  }

  private getRecommendation(avgScore: number, riskFlags: any[]): {
    decision: 'PASS' | 'CONSIDER' | 'RECOMMEND'
    reasoning: string
  } {
    const highRiskFlags = riskFlags.filter(rf => rf.severity === 'HIGH').length
    const mediumRiskFlags = riskFlags.filter(rf => rf.severity === 'MEDIUM').length

    if (avgScore >= 8 && highRiskFlags === 0) {
      return {
        decision: 'RECOMMEND',
        reasoning: 'Strong script with excellent fundamentals and minimal risk factors.'
      }
    } else if (avgScore >= 6 && highRiskFlags <= 1) {
      return {
        decision: 'CONSIDER',
        reasoning: 'Solid script with good potential. Address noted concerns for stronger commercial viability.'
      }
    } else {
      return {
        decision: 'PASS',
        reasoning: 'Script requires significant development before consideration. Major structural or content issues identified.'
      }
    }
  }

  private generateCoverageHTML(script: any, recommendation: any, avgScore: number): string {
    const today = this.formatDate(new Date())

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coverage Report - ${script.title}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
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
        .script-info {
            background: #f8f9fa;
            padding: 20px;
            border-left: 4px solid #2563eb;
            margin: 20px 0;
        }
        .recommendation {
            background: ${recommendation.decision === 'RECOMMEND' ? '#d1fae5' :
                         recommendation.decision === 'CONSIDER' ? '#fef3c7' : '#fee2e2'};
            border: 2px solid ${recommendation.decision === 'RECOMMEND' ? '#10b981' :
                                recommendation.decision === 'CONSIDER' ? '#f59e0b' : '#ef4444'};
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .scores-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        .score-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        .beats-section {
            margin: 30px 0;
        }
        .beat-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
        }
        .notes-section {
            margin: 30px 0;
        }
        .note-item {
            background: #fafafa;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #6b7280;
            border-radius: 4px;
        }
        .high-priority {
            border-left-color: #ef4444;
        }
        .medium-priority {
            border-left-color: #f59e0b;
        }
        .low-priority {
            border-left-color: #10b981;
        }
        .page-break {
            page-break-before: always;
        }
        h1 { font-size: 28px; margin-bottom: 10px; }
        h2 { font-size: 22px; color: #2563eb; margin-top: 30px; margin-bottom: 15px; }
        h3 { font-size: 18px; color: #374151; margin-top: 20px; margin-bottom: 10px; }
        .synopsis {
            font-style: italic;
            background: #f9fafb;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">SCRIPTYBOY</div>
        <h1>SCRIPT COVERAGE REPORT</h1>
        <p><strong>${script.title}</strong> by ${script.author}</p>
        <p>${today}</p>
    </div>

    <div class="script-info">
        <h2>Script Information</h2>
        <p><strong>Title:</strong> ${script.title}</p>
        <p><strong>Author:</strong> ${script.author}</p>
        <p><strong>Pages:</strong> ${script.pageCount}</p>
        <p><strong>Genre:</strong> ${script.genreOverride || 'Not specified'}</p>
        <p><strong>Analysis Date:</strong> ${this.formatDate(new Date(script.processedAt))}</p>
    </div>

    ${script.logline ? `
    <div>
        <h2>Logline</h2>
        <p style="font-style: italic;">${script.logline}</p>
    </div>
    ` : ''}

    ${script.synopsisShort ? `
    <div class="synopsis">
        <h2>Synopsis</h2>
        <p>${script.synopsisShort}</p>
    </div>
    ` : ''}

    <div class="recommendation">
        <h2>RECOMMENDATION: ${recommendation.decision}</h2>
        <p><strong>Overall Score:</strong> ${avgScore.toFixed(1)}/10</p>
        <p><strong>Analysis:</strong> ${recommendation.reasoning}</p>
    </div>

    <h2>Detailed Scores</h2>
    <div class="scores-grid">
        ${script.scores.map((score: any) => `
            <div class="score-item">
                <strong>${score.category.replace('_', ' ')}</strong><br>
                ${score.value}/10
                ${score.reasoning ? `<br><small style="color: #6b7280;">${score.reasoning}</small>` : ''}
            </div>
        `).join('')}
    </div>

    ${script.beats && script.beats.length > 0 ? `
    <div class="beats-section">
        <h2>Story Structure</h2>
        <p>Analysis of key story beats and plot points:</p>
        ${script.beats.map((beat: any) => `
            <div class="beat-item">
                <span><strong>${beat.kind.replace('_', ' ')}</strong></span>
                <span>Page ${beat.page}</span>
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${script.notes && script.notes.length > 0 ? `
    <div class="notes-section page-break">
        <h2>Development Notes</h2>
        <p>Specific feedback and suggestions for improvement:</p>
        ${script.notes.slice(0, 15).map((note: any) => `
            <div class="note-item ${note.severity.toLowerCase()}-priority">
                <strong>${note.area.replace('_', ' ')} - ${note.severity} Priority</strong>
                ${note.page ? `<span style="float: right;">Page ${note.page}</span>` : ''}
                ${note.excerpt ? `<p style="font-style: italic; margin: 8px 0;">"${note.excerpt}"</p>` : ''}
                ${note.suggestion ? `<p><strong>Suggestion:</strong> ${note.suggestion}</p>` : ''}
            </div>
        `).join('')}
        ${script.notes.length > 15 ? `<p><em>Note: Showing first 15 of ${script.notes.length} total notes. Full notes available in detailed exports.</em></p>` : ''}
    </div>
    ` : ''}

    ${script.riskFlags && script.riskFlags.length > 0 ? `
    <div class="page-break">
        <h2>Risk Assessment</h2>
        <p>Potential concerns for production or distribution:</p>
        ${script.riskFlags.map((risk: any) => `
            <div class="note-item ${risk.severity.toLowerCase()}-priority">
                <strong>${risk.category.replace('_', ' ')} Risk - ${risk.severity}</strong>
                <p>${risk.description}</p>
                ${risk.mitigation ? `<p><strong>Mitigation:</strong> ${risk.mitigation}</p>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="footer">
        <p>This coverage report was generated by ScriptyBoy AI Analysis Platform</p>
        <p>For questions about this analysis, please contact your development team</p>
        <p>© ${new Date().getFullYear()} ScriptyBoy. All rights reserved.</p>
    </div>
</body>
</html>
    `.trim()
  }
}