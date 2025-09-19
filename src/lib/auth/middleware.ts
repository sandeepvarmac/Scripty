import { NextRequest, NextResponse } from 'next/server'
import { JWTService } from './jwt'
import { prisma } from '@/lib/prisma'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role?: string
    organizationId?: string
  }
}

export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Try to get token from cookie
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token
    const payload = JWTService.verifyAccessToken(accessToken)

    // Add user data to request
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId,
    }

    return handler(authenticatedRequest)
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}

export async function withRole(
  requiredRole: string,
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, async (req) => {
    if (!req.user?.role || req.user.role !== requiredRole) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return handler(req)
  })
}

export async function withPermission(
  requiredPermission: string,
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, async (req) => {
    if (!req.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's role and permissions
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    })

    if (!user?.role) {
      return NextResponse.json(
        { error: 'No role assigned' },
        { status: 403 }
      )
    }

    const permissions = user.role.permissions as string[]
    if (!permissions.includes(requiredPermission)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return handler(req)
  })
}

export function getClientIp(request: NextRequest): string | undefined {
  return request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]
}

export function getUserAgent(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined
}