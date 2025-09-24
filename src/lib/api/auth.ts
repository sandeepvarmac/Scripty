import { NextRequest } from 'next/server'
import { RealAuthService } from '@/lib/auth/real-auth-service'

export interface AuthContext {
  userId: string
  user: Awaited<ReturnType<typeof RealAuthService.getUserById>>
}

export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    throw Object.assign(new Error('Authentication required'), { status: 401 })
  }

  const payload = await RealAuthService.verifyToken(token)
  if (!payload) {
    throw Object.assign(new Error('Invalid authentication token'), { status: 401 })
  }

  const user = await RealAuthService.getUserById(payload.userId)
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 })
  }

  return { userId: payload.userId, user }
}
