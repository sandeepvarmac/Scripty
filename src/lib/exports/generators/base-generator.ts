import { ExportOptions, ExportResult } from '../export-service'
import { promises as fs } from 'fs'
import path from 'path'

export abstract class BaseGenerator {
  protected async saveFile(
    content: Buffer | string,
    filename: string,
    mimeType: string
  ): Promise<ExportResult> {
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(process.cwd(), 'tmp', 'exports')
    await fs.mkdir(exportsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const uniqueFilename = `${timestamp}-${filename}`
    const filePath = path.join(exportsDir, uniqueFilename)

    // Write file
    if (typeof content === 'string') {
      await fs.writeFile(filePath, content, 'utf8')
    } else {
      await fs.writeFile(filePath, content)
    }

    // Get file stats
    const stats = await fs.stat(filePath)

    // Generate download URL (would be replaced with actual URL in production)
    const downloadUrl = `/api/exports/download/${uniqueFilename}`

    // Set expiration (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    return {
      id: uniqueFilename,
      url: downloadUrl,
      filename: uniqueFilename,
      size: stats.size,
      mimeType,
      expiresAt
    }
  }

  protected generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  protected formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  protected formatFileSize(bytes: number): string {
    const mb = bytes / (1024 * 1024)
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
  }
}