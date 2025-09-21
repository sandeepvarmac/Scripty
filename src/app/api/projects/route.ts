import { NextRequest, NextResponse } from 'next/server'
import { RealAuthService } from '@/lib/auth/real-auth-service'
import { prisma } from '@/lib/prisma'

// Get user's projects
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

    // Get user's projects
    const projects = await prisma.project.findMany({
      where: {
        userId: user.id,
        deletedAt: null
      },
      include: {
        scripts: {
          where: { deletedAt: null },
          select: { id: true, title: true, versionMajor: true, versionMinor: true }
        },
        _count: {
          select: { scripts: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      projects
    })

  } catch (error) {
    console.error('Get projects error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get projects',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Create new project
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
    const {
      name,
      type,
      genre,
      description,
      targetBudget = 'LOW',
      targetAudience = 'General',
      developmentStage = 'FIRST_DRAFT'
    } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Project name and type are required' },
        { status: 400 }
      )
    }

    // Validate project type
    const validTypes = ['SHORT_FILM', 'FEATURE_INDEPENDENT', 'FEATURE_MAINSTREAM', 'WEB_SERIES', 'TV_SERIES', 'OTHER']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid project type' },
        { status: 400 }
      )
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name,
        type,
        genre,
        description,
        targetBudget,
        targetAudience,
        developmentStage
      }
    })

    return NextResponse.json({
      success: true,
      project
    })

  } catch (error) {
    console.error('Create project error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create project',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}