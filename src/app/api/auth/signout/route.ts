import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth/auth-service'
import { JWTService } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value
    const accessToken = request.cookies.get('accessToken')?.value

    let userId: string | undefined

    // Try to get user ID from access token
    if (accessToken) {
      try {
        const payload = JWTService.verifyAccessToken(accessToken)
        userId = payload.userId
      } catch {
        // Token might be expired, try to get from refresh token
      }
    }

    const ipAddress = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]
    const userAgent = request.headers.get('user-agent')

    if (refreshToken && userId) {
      await AuthService.signOut(
        refreshToken,
        userId,
        ipAddress || undefined,
        userAgent || undefined
      )
    }

    // Clear cookies
    const response = NextResponse.json({ success: true })

    response.cookies.delete('accessToken')
    response.cookies.delete('refreshToken')

    return response
  } catch (error) {
    console.error('Signout error:', error)

    // Clear cookies even on error
    const response = NextResponse.json({ success: true })
    response.cookies.delete('accessToken')
    response.cookies.delete('refreshToken')

    return response
  }
}