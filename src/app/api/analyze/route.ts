import { NextRequest, NextResponse } from 'next/server'
import { RealAuthService } from '@/lib/auth/real-auth-service'
import { analyzeScript, type AnalysisType } from '@/lib/analysis'

export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookie
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
        { error: 'Invalid authentication token' },
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

    // Parse request body
    const body = await request.json()
    const { scriptId, analysisTypes = ['COMPREHENSIVE'] } = body

    if (!scriptId) {
      return NextResponse.json(
        { error: 'Script ID is required' },
        { status: 400 }
      )
    }

    // Validate analysis types
    const validTypes: AnalysisType[] = ['STRUCTURE', 'PACING', 'CHARACTER', 'DIALOGUE', 'FORMAT', 'COMPREHENSIVE']
    const invalidTypes = analysisTypes.filter((type: string) => !validTypes.includes(type as AnalysisType))

    if (invalidTypes.length > 0) {
      return NextResponse.json(
        { error: `Invalid analysis types: ${invalidTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Run analysis
    const results = await analyzeScript({
      scriptId,
      userId: user.id,
      analysisTypes
    })

    return NextResponse.json({
      success: true,
      data: {
        analyses: results,
        scriptId
      }
    })

  } catch (error) {
    console.error('Analysis error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Analysis failed',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}