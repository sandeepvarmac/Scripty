import { NextRequest, NextResponse } from 'next/server'
import { RealAuthService } from '@/lib/auth/real-auth-service'
import { getAnalysisResult, getAnalysisHistory } from '@/lib/analysis'

interface RouteParams {
  params: { id: string }
}

// Get specific analysis result
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Check if this is a request for analysis history (query param)
    const url = new URL(request.url)
    const isHistory = url.searchParams.has('history')

    if (isHistory) {
      // Get analysis history for script
      const history = await getAnalysisHistory(params.id, user.id)
      return NextResponse.json({
        success: true,
        data: { history }
      })
    } else {
      // Get specific analysis result
      const analysis = await getAnalysisResult(params.id, user.id)

      if (!analysis) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: { analysis }
      })
    }

  } catch (error) {
    console.error('Get analysis error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get analysis',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}