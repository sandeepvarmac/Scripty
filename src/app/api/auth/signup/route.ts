import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth/auth-service'
import { z } from 'zod'

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  projectType: z.enum(['SHORT', 'FEATURE', 'TV', 'OTHER']).optional(),
  privacyDoNotTrain: z.boolean().optional(),
  retentionDays: z.number().optional(),
  emailNotifications: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = signUpSchema.parse(body)

    const ipAddress = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]
    const userAgent = request.headers.get('user-agent')

    const result = await AuthService.signUp(
      validatedData,
      ipAddress || undefined,
      userAgent || undefined
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Set HTTP-only cookies for tokens
    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user!.id,
        email: result.user!.email,
        name: result.user!.name,
        firstName: result.user!.firstName,
        lastName: result.user!.lastName,
        projectType: result.user!.projectType,
        role: result.user!.role?.name,
      },
    })

    // Set secure cookies
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}