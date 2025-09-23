import { ExportOptions } from './export-service'

export interface ExportJob {
  id: string
  type: string
  format: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired'
  filename?: string
  fileSize?: number
  downloadUrl?: string
  createdAt: string
  completedAt?: string
  expiresAt?: string
  errorMessage?: string
}

export class ExportClient {
  constructor(private baseUrl: string = '/api/v1') {}

  async createExport(scriptId: string, options: ExportOptions): Promise<{
    success: boolean
    export?: any
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/scripts/${scriptId}/exports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create export')
      }

      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getExportHistory(scriptId: string): Promise<{
    success: boolean
    exports?: ExportJob[]
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/scripts/${scriptId}/exports`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch export history')
      }

      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  getDownloadUrl(filename: string): string {
    return `/api/exports/download/${filename}`
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  formatTimeAgo(date: string): string {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`

    const diffWeeks = Math.floor(diffDays / 7)
    if (diffWeeks < 4) return `${diffWeeks}w ago`

    return past.toLocaleDateString()
  }

  async bulkExport(
    scriptId: string,
    exportTypes: Array<{
      format: 'pdf' | 'csv' | 'json' | 'fdx'
      type: 'coverage' | 'notes' | 'analysis' | 'changelist'
    }>,
    options: Partial<ExportOptions> = {}
  ): Promise<{
    success: boolean
    exports?: any[]
    errors?: string[]
  }> {
    const results = await Promise.allSettled(
      exportTypes.map(exportType =>
        this.createExport(scriptId, {
          ...options,
          format: exportType.format,
          type: exportType.type
        })
      )
    )

    const successes: any[] = []
    const errors: string[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successes.push(result.value.export)
      } else {
        const error = result.status === 'rejected'
          ? result.reason
          : result.value.error
        errors.push(`${exportTypes[index].type} ${exportTypes[index].format}: ${error}`)
      }
    })

    return {
      success: successes.length > 0,
      exports: successes,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  validateExportRequest(format: string, type: string): {
    valid: boolean
    error?: string
  } {
    const validCombinations = {
      coverage: ['pdf'],
      notes: ['csv', 'pdf'],
      analysis: ['json', 'csv'],
      changelist: ['fdx']
    }

    if (!validCombinations[type as keyof typeof validCombinations]) {
      return {
        valid: false,
        error: `Invalid export type: ${type}`
      }
    }

    if (!validCombinations[type as keyof typeof validCombinations].includes(format)) {
      return {
        valid: false,
        error: `Format '${format}' not supported for type '${type}'`
      }
    }

    return { valid: true }
  }
}