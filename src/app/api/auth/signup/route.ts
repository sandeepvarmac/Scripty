import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { RealAuthService } from '@/lib/auth/real-auth-service'
import { ProjectType } from '@prisma/client'

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

    // Get client info for audit logging
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    // Call real auth service
    const result = await RealAuthService.signUp({
      email: validatedData.email,
      password: validatedData.password,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      projectType: validatedData.projectType as ProjectType,
      privacyDoNotTrain: validatedData.privacyDoNotTrain,
      retentionDays: validatedData.retentionDays,
      emailNotifications: validatedData.emailNotifications
    }, ipAddress, userAgent)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Set HTTP-only cookie with JWT token
    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
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

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}