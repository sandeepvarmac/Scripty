import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ExportService } from '@/lib/exports'

export async function POST(
  request: NextRequest,
  { params }: { params: { scriptId: string } }
) {
  try {
    const { scriptId } = params
    const body = await request.json()

    const {
      format,
      type,
      includeMetadata = false,
      template,
      emailTo,
      bundleFormat = 'individual'
    } = body

    // Validate required fields
    if (!format || !type) {
      return NextResponse.json(
        { error: 'Format and type are required' },
        { status: 400 }
      )
    }

    // Validate format and type combinations
    const validCombinations = {
      coverage: ['pdf'],
      notes: ['csv', 'pdf'],
      analysis: ['json', 'csv'],
      changelist: ['fdx']
    }

    if (!validCombinations[type as keyof typeof validCombinations]?.includes(format)) {
      return NextResponse.json(
        { error: `Invalid format '${format}' for type '${type}'` },
        { status: 400 }
      )
    }

    // Check if script exists
    const script = await prisma.script.findUnique({
      where: { id: scriptId }
    })

    if (!script) {
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      )
    }

    // Create export service and generate export
    const exportService = new ExportService(prisma)
    const result = await exportService.exportScript(scriptId, {
      format,
      type,
      includeMetadata,
      template,
      emailTo,
      bundleFormat
    })

    return NextResponse.json({
      success: true,
      export: result
    })

  } catch (error) {
    console.error('Export generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { scriptId: string } }
) {
  try {
    const { scriptId } = params

    // Get export history for this script
    const exportService = new ExportService(prisma)
    const exports = await exportService.getExportJobs(scriptId)

    return NextResponse.json({
      success: true,
      exports: exports.map(exp => ({
        id: exp.id,
        type: exp.type,
        format: exp.format,
        status: exp.status,
        filename: exp.filename,
        fileSize: exp.fileSize,
        downloadUrl: exp.downloadUrl,
        createdAt: exp.createdAt,
        completedAt: exp.completedAt,
        expiresAt: exp.expiresAt,
        errorMessage: exp.errorMessage
      }))
    })

  } catch (error) {
    console.error('Failed to fetch export history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch export history' },
      { status: 500 }
    )
  }
}