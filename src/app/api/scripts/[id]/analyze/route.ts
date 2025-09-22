import { NextRequest, NextResponse } from 'next/server'
import { RealAuthService } from '@/lib/auth/real-auth-service'
import { analyzeScriptWithAI, type AIAnalysisType } from '@/lib/analysis/ai-analysis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for AI analysis

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const scriptId = params.id
    const body = await request.json()
    const { analysisType = 'comprehensive', options = [] } = body

    // Validate analysis type
    const validTypes: AIAnalysisType[] = [
      'QUICK_OVERVIEW',
      'COMPREHENSIVE',
      'STORY_STRUCTURE',
      'CHARACTER_DEVELOPMENT',
      'DIALOGUE_QUALITY',
      'PACING_FLOW',
      'THEME_ANALYSIS'
    ]

    let analysisTypes: AIAnalysisType[]

    if (analysisType === 'quick') {
      analysisTypes = ['QUICK_OVERVIEW']
    } else if (analysisType === 'comprehensive') {
      analysisTypes = ['COMPREHENSIVE']
    } else if (analysisType === 'custom' && options.length > 0) {
      // Map custom options to analysis types
      const optionMap: Record<string, AIAnalysisType> = {
        'genre': 'QUICK_OVERVIEW', // Genre is part of quick overview
        'structure': 'STORY_STRUCTURE',
        'characters': 'CHARACTER_DEVELOPMENT',
        'dialogue': 'DIALOGUE_QUALITY',
        'pacing': 'PACING_FLOW',
        'themes': 'THEME_ANALYSIS'
      }

      analysisTypes = options
        .map((option: string) => optionMap[option])
        .filter((type: AIAnalysisType | undefined): type is AIAnalysisType =>
          type !== undefined && validTypes.includes(type)
        )

      if (analysisTypes.length === 0) {
        return NextResponse.json(
          { error: 'No valid analysis options selected' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid analysis type or options' },
        { status: 400 }
      )
    }

    // Start AI analysis
    const results = await analyzeScriptWithAI({
      scriptId,
      userId: user.id,
      analysisTypes
    })

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error) {
    console.error('AI Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze script' },
      { status: 500 }
    )
  }
}