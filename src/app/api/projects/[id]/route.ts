import { NextRequest, NextResponse } from 'next/server'
import { RealAuthService } from '@/lib/auth/real-auth-service'
import { prisma } from '@/lib/prisma'

// Delete project (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

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

    // Parse request body for delete options
    const body = await request.json()
    const { scriptAction = 'delete' } = body // 'delete' or 'unassign'

    // Validate scriptAction
    if (!['delete', 'unassign'].includes(scriptAction)) {
      return NextResponse.json(
        { error: 'Invalid script action. Must be "delete" or "unassign"' },
        { status: 400 }
      )
    }

    // Find project and verify ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
        deletedAt: null
      },
      include: {
        scripts: {
          where: { deletedAt: null },
          select: { id: true, title: true, originalFilename: true }
        },
        _count: {
          select: { scripts: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Use transaction to ensure atomic operation
    await prisma.$transaction(async (tx) => {
      // Handle scripts based on user choice
      if (scriptAction === 'delete') {
        // Soft delete all scripts in the project
        await tx.script.updateMany({
          where: {
            projectId: projectId,
            deletedAt: null
          },
          data: {
            deletedAt: new Date()
          }
        })
      } else if (scriptAction === 'unassign') {
        // Remove project association (make scripts unassigned)
        await tx.script.updateMany({
          where: {
            projectId: projectId,
            deletedAt: null
          },
          data: {
            projectId: null
          }
        })
      }

      // Soft delete the project
      await tx.project.update({
        where: { id: projectId },
        data: {
          deletedAt: new Date()
        }
      })

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE_PROJECT',
          entityType: 'PROJECT',
          entityId: projectId,
          metadata: {
            projectName: project.name,
            scriptAction,
            scriptCount: project._count.scripts,
            scriptIds: project.scripts.map(s => s.id)
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: `Project "${project.name}" has been deleted successfully`,
      deletedProject: {
        id: project.id,
        name: project.name,
        scriptAction,
        scriptsAffected: project._count.scripts
      }
    })

  } catch (error) {
    console.error('Delete project error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete project',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Get project details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

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

    // Find project and verify ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
        deletedAt: null
      },
      include: {
        scripts: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            originalFilename: true,
            versionMajor: true,
            versionMinor: true,
            isLatestVersion: true,
            uploadedAt: true,
            _count: {
              select: { analyses: true }
            }
          }
        },
        _count: {
          select: { scripts: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      project
    })

  } catch (error) {
    console.error('Get project error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get project',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}