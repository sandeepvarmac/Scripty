import { NextRequest, NextResponse } from 'next/server'
import { RealAuthService } from '@/lib/auth/real-auth-service'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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

    // Get user's scripts with analysis data
    const scripts = await prisma.script.findMany({
      where: {
        userId: user.id,
        deletedAt: null // Only show non-deleted scripts
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        analyses: {
          orderBy: { startedAt: 'desc' }
        },
        _count: {
          select: {
            scenes: true,
            characters: true,
            analyses: true
          }
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: { scripts }
    })

  } catch (error) {
    console.error('Get scripts error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get scripts',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}