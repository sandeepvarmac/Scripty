import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { RealAuthService } from '@/lib/auth/real-auth-service'

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = signInSchema.parse(body)

    // Get client info for audit logging
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    // Call real auth service
    const result = await RealAuthService.signIn({
      email: validatedData.email,
      password: validatedData.password
    }, ipAddress, userAgent)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    // Set HTTP-only cookie with JWT token
    const response = NextResponse.json({
      success: true,
      message: 'Signed in successfully',
      user: result.user,
    })

    response.cookies.set('auth-token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Signin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}