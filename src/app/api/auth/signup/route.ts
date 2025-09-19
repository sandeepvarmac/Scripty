import { NextRequest, NextResponse } from 'next/server'
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

    // Mock successful signup for now
    console.log('Signup endpoint called with:', validatedData)

    const response = NextResponse.json({
      success: true,
      message: 'Signup endpoint working!',
      user: {
        id: 'mock-user-id',
        email: validatedData.email,
        name: 'Test User',
      },
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