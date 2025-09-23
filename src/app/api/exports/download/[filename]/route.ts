import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params

    // Validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    // Construct file path
    const exportsDir = path.join(process.cwd(), 'tmp', 'exports')
    const filePath = path.join(exportsDir, filename)

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath)

    // Determine MIME type based on extension
    const ext = path.extname(filename).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.html': 'text/html',
      '.csv': 'text/csv',
      '.json': 'application/json',
      '.fdx': 'application/xml',
      '.zip': 'application/zip'
    }

    const mimeType = mimeTypes[ext] || 'application/octet-stream'

    // Set headers for download
    const headers = new Headers()
    headers.set('Content-Type', mimeType)
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    headers.set('Content-Length', fileBuffer.length.toString())
    headers.set('Cache-Control', 'no-cache')

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Download failed:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}