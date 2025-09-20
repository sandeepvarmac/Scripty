import { NextRequest, NextResponse } from 'next/server'
import { RealAuthService } from '@/lib/auth/real-auth-service'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

// Delete script with soft delete approach
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const scriptId = params.id

    // Verify script ownership
    const script = await prisma.script.findFirst({
      where: {
        id: scriptId,
        userId: user.id
      }
    })

    if (!script) {
      return NextResponse.json(
        { error: 'Script not found or access denied' },
        { status: 404 }
      )
    }

    // Soft delete approach: Add deletedAt timestamp
    // This preserves data for retention policy compliance
    const deletedAt = new Date()

    await prisma.$transaction(async (tx) => {
      // Soft delete the script
      await tx.script.update({
        where: { id: scriptId },
        data: {
          deletedAt,
          status: 'DELETED'
        }
      })

      // Soft delete related scenes
      await tx.scene.updateMany({
        where: { scriptId },
        data: { deletedAt }
      })

      // Soft delete related characters
      await tx.character.updateMany({
        where: { scriptId },
        data: { deletedAt }
      })

      // Soft delete related analyses
      await tx.analyse.updateMany({
        where: { scriptId },
        data: { deletedAt }
      })

      // Soft delete related evidence (through scenes)
      const sceneIds = await tx.scene.findMany({
        where: { scriptId },
        select: { id: true }
      })

      if (sceneIds.length > 0) {
        await tx.evidence.updateMany({
          where: {
            sceneId: {
              in: sceneIds.map(s => s.id)
            }
          },
          data: { deletedAt }
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Script and all associated data have been successfully deleted'
    })

  } catch (error) {
    console.error('Delete script error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete script',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}