import { NextRequest, NextResponse } from 'next/server'
import { parseScript } from '@/lib/parsers'
import { saveScriptToEvidenceStore } from '@/lib/evidence-store'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedExtensions = ['.fdx', '.fountain', '.pdf']
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: `Unsupported file type. Please upload ${allowedExtensions.join(', ')} files.` },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse the script
    const parseResult = await parseScript(buffer, file.name, file.type)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error },
        { status: 422 }
      )
    }

    // TODO: Get user ID from authentication
    // For now, using a placeholder - this should be extracted from JWT token
    const userId = 'user_placeholder'

    // Save to evidence store
    const savedScript = await saveScriptToEvidenceStore({
      userId,
      parsedScript: parseResult.data!
    })

    // Return saved script data
    return NextResponse.json({
      success: true,
      data: {
        script: savedScript,
        parsed: parseResult.data
      },
      warnings: parseResult.warnings
    })

  } catch (error) {
    console.error('Upload parsing error:', error)
    return NextResponse.json(
      { error: 'Failed to process file upload' },
      { status: 500 }
    )
  }
}