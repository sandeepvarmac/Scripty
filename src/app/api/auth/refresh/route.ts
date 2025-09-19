import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth/auth-service'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      )
    }

    const ipAddress = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]
    const userAgent = request.headers.get('user-agent')

    const result = await AuthService.refreshTokens(
      refreshToken,
      ipAddress || undefined,
      userAgent || undefined
    )

    if (!result.success) {
      // Clear invalid cookies
      const response = NextResponse.json(
        { error: result.error },
        { status: 401 }
      )

      response.cookies.delete('accessToken')
      response.cookies.delete('refreshToken')

      return response
    }

    // Set new tokens
    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user!.id,
        email: result.user!.email,
        name: result.user!.name,
        role: result.user!.role?.name,
      },
    })

    response.cookies.set('accessToken', result.tokens!.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
    })

    response.cookies.set('refreshToken', result.tokens!.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}