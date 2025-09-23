import { Prisma, PrismaClient } from '@prisma/client'

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json' | 'fdx'
  type: 'coverage' | 'notes' | 'analysis' | 'changelist'
  includeMetadata?: boolean
  template?: string
  emailTo?: string
  bundleFormat?: 'individual' | 'zip' | 'folder'
}

export interface ExportResult {
  id: string
  url: string
  filename: string
  size: number
  mimeType: string
  expiresAt: Date
}

export class ExportService {
  constructor(private prisma: PrismaClient) {}

  async exportScript(
    scriptId: string,
    options: ExportOptions,
    userId?: string
  ): Promise<ExportResult> {
    // Create export job record
    const exportJob = await this.prisma.exportJob.create({
      data: {
        scriptId,
        userId,
        format: options.format,
        type: options.type,
        status: 'PENDING',
        options: options as any,
        createdAt: new Date()
      }
    })

    try {
      // Update status to processing
      await this.prisma.exportJob.update({
        where: { id: exportJob.id },
        data: { status: 'PROCESSING', startedAt: new Date() }
      })

      let result: ExportResult

      // Route to appropriate export generator
      switch (options.type) {
        case 'coverage':
          result = await this.generateCoverageExport(scriptId, options)
          break
        case 'notes':
          result = await this.generateNotesExport(scriptId, options)
          break
        case 'analysis':
          result = await this.generateAnalysisExport(scriptId, options)
          break
        case 'changelist':
          result = await this.generateChangelistExport(scriptId, options)
          break
        default:
          throw new Error(`Unknown export type: ${options.type}`)
      }

      // Update job with success
      await this.prisma.exportJob.update({
        where: { id: exportJob.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          downloadUrl: result.url,
          filename: result.filename,
          fileSize: result.size,
          mimeType: result.mimeType,
          expiresAt: result.expiresAt
        }
      })

      // Send email notification if requested
      if (options.emailTo) {
        await this.sendExportNotification(options.emailTo, result, exportJob.id)
      }

      return result

    } catch (error) {
      // Update job with failure
      await this.prisma.exportJob.update({
        where: { id: exportJob.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  }

  private async generateCoverageExport(
    scriptId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    // Load script and analysis data
    const script = await this.prisma.script.findUnique({
      where: { id: scriptId },
      include: {
        project: true,
        scores: true,
        beats: true,
        notes: true,
        riskFlags: true
      }
    })

    if (!script) {
      throw new Error('Script not found')
    }

    if (options.format === 'pdf') {
      return this.generateCoveragePDF(script, options)
    } else {
      throw new Error(`Unsupported format for coverage export: ${options.format}`)
    }
  }

  private async generateNotesExport(
    scriptId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    const notes = await this.prisma.note.findMany({
      where: { scriptId },
      orderBy: [{ page: 'asc' }, { lineRef: 'asc' }]
    })

    if (options.format === 'csv') {
      return this.generateNotesCSV(notes, scriptId, options)
    } else if (options.format === 'pdf') {
      return this.generateNotesPDF(notes, scriptId, options)
    } else {
      throw new Error(`Unsupported format for notes export: ${options.format}`)
    }
  }

  private async generateAnalysisExport(
    scriptId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    const analysisData = await this.loadCompleteAnalysisData(scriptId)

    if (options.format === 'json') {
      return this.generateAnalysisJSON(analysisData, scriptId, options)
    } else if (options.format === 'csv') {
      return this.generateAnalysisCSV(analysisData, scriptId, options)
    } else {
      throw new Error(`Unsupported format for analysis export: ${options.format}`)
    }
  }

  private async generateChangelistExport(
    scriptId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    const script = await this.prisma.script.findUnique({
      where: { id: scriptId },
      include: { notes: true }
    })

    if (!script) {
      throw new Error('Script not found')
    }

    if (options.format === 'fdx') {
      return this.generateFDXChangelist(script, options)
    } else {
      throw new Error(`Unsupported format for changelist export: ${options.format}`)
    }
  }

  private async generateCoveragePDF(script: any, options: ExportOptions): Promise<ExportResult> {
    const { CoveragePDFGenerator } = await import('./generators/coverage-pdf')
    const generator = new CoveragePDFGenerator()
    return generator.generate(script, options)
  }

  private async generateNotesCSV(notes: any[], scriptId: string, options: ExportOptions): Promise<ExportResult> {
    const { NotesCSVGenerator } = await import('./generators/notes-csv')
    const generator = new NotesCSVGenerator()
    return generator.generate(notes, scriptId, options)
  }

  private async generateNotesPDF(notes: any[], scriptId: string, options: ExportOptions): Promise<ExportResult> {
    const { NotesPDFGenerator } = await import('./generators/notes-pdf')
    const generator = new NotesPDFGenerator()
    return generator.generate(notes, scriptId, options)
  }

  private async generateAnalysisJSON(data: any, scriptId: string, options: ExportOptions): Promise<ExportResult> {
    const { AnalysisJSONGenerator } = await import('./generators/analysis-json')
    const generator = new AnalysisJSONGenerator()
    return generator.generate(data, scriptId, options)
  }

  private async generateAnalysisCSV(data: any, scriptId: string, options: ExportOptions): Promise<ExportResult> {
    const { AnalysisCSVGenerator } = await import('./generators/analysis-csv')
    const generator = new AnalysisCSVGenerator()
    return generator.generate(data, scriptId, options)
  }

  private async generateFDXChangelist(script: any, options: ExportOptions): Promise<ExportResult> {
    const { FDXChangelistGenerator } = await import('./generators/fdx-changelist')
    const generator = new FDXChangelistGenerator()
    return generator.generate(script, options)
  }

  private async loadCompleteAnalysisData(scriptId: string) {
    return {
      script: await this.prisma.script.findUnique({
        where: { id: scriptId },
        include: { project: true }
      }),
      beats: await this.prisma.beat.findMany({
        where: { scriptId },
        orderBy: { page: 'asc' }
      }),
      notes: await this.prisma.note.findMany({
        where: { scriptId },
        orderBy: [{ page: 'asc' }, { lineRef: 'asc' }]
      }),
      scores: await this.prisma.score.findMany({
        where: { scriptId },
        orderBy: { category: 'asc' }
      }),
      pageMetrics: await this.prisma.pageMetric.findMany({
        where: { scriptId },
        orderBy: { page: 'asc' }
      }),
      characterScenes: await this.prisma.characterScene.findMany({
        where: { scriptId },
        orderBy: [{ characterId: 'asc' }, { sceneId: 'asc' }]
      }),
      feasibility: await this.prisma.feasibilityMetric.findMany({
        where: { scriptId },
        orderBy: { category: 'asc' }
      }),
      riskFlags: await this.prisma.riskFlag.findMany({
        where: { scriptId },
        orderBy: { severity: 'desc' }
      })
    }
  }

  private async sendExportNotification(
    email: string,
    result: ExportResult,
    jobId: string
  ): Promise<void> {
    // Implementation would integrate with email service
    console.log(`Export notification sent to ${email} for job ${jobId}`)
  }

  async getExportJobs(scriptId: string, userId?: string) {
    return this.prisma.exportJob.findMany({
      where: {
        scriptId,
        ...(userId ? { userId } : {})
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async getExportJob(jobId: string) {
    return this.prisma.exportJob.findUnique({
      where: { id: jobId }
    })
  }

  async deleteExpiredExports() {
    const expired = await this.prisma.exportJob.findMany({
      where: {
        expiresAt: { lt: new Date() },
        status: 'COMPLETED'
      }
    })

    for (const job of expired) {
      // Delete file from storage
      if (job.downloadUrl) {
        // Implementation would delete from file storage
        console.log(`Deleting expired export: ${job.downloadUrl}`)
      }

      // Update job status
      await this.prisma.exportJob.update({
        where: { id: job.id },
        data: { status: 'EXPIRED' }
      })
    }

    return expired.length
  }
}