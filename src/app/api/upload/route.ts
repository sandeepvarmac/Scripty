import { NextRequest, NextResponse } from 'next/server'
import { parseScript } from '@/lib/parsers'
import { saveScriptToEvidenceStore } from '@/lib/evidence-store'
import { RealAuthService } from '@/lib/auth/real-auth-service'
import { prisma } from '@/lib/prisma'
import { assessScreenplayQuality } from '@/lib/quality/screenplay-quality'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie and authenticate user
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token and get user
    const payload = await RealAuthService.verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const user = await RealAuthService.getUserById(payload.userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate projectId if provided
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: user.id,
          deletedAt: null
        }
      })

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        )
      }
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
    const allowedExtensions = ['.fdx', '.fountain', '.pdf', '.txt']
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        {
          error: 'Please upload a screenplay file in one of these supported formats:',
          supportedFormats: [
            { extension: '.fountain', description: 'Fountain format (recommended)' },
            { extension: '.fdx', description: 'Final Draft format' },
            { extension: '.pdf', description: 'PDF screenplay' },
            { extension: '.txt', description: 'Plain text screenplay' }
          ],
          rejectedFormat: extension,
          message: `Files with extension '${extension}' are not supported. Other document formats (.docx, .doc, .rtf) cannot be processed.`
        },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse the script
    let parseResult
    try {
      parseResult = await parseScript(buffer, file.name, file.type)
    } catch (error) {
      console.error('Upload parsing pipeline error:', error)
      return NextResponse.json(
        { error: 'Server failed to parse this file. Please try converting to Fountain (.fountain) or Final Draft (.fdx) format while we improve PDF support.' },
        { status: 500 }
      )
    }

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error },
        { status: 422 }
      )
    }

    // Assess screenplay quality
    const qualityAssessment = assessScreenplayQuality(parseResult.data!)

    // Use authenticated user ID
    const userId = user.id

    // Save to evidence store
    const savedScript = await saveScriptToEvidenceStore({
      userId,
      projectId: projectId || null,
      parsedScript: parseResult.data!
    })

    // Return saved script data with quality assessment
    return NextResponse.json({
      success: true,
      data: {
        script: savedScript,
        parsed: parseResult.data,
        qualityAssessment
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
