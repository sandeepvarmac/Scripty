import jwt from 'jsonwebtoken'
import { User, Role } from '@prisma/client'

type UserWithRole = User & { role?: Role | null }

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret'

export interface JWTPayload {
  userId: string
  email: string
  role?: string
  organizationId?: string
  iat: number
  exp: number
}

export interface RefreshTokenPayload {
  userId: string
  tokenId: string
  iat: number
  exp: number
}

export class JWTService {
  static generateAccessToken(user: UserWithRole, organizationId?: string): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role?.name,
      organizationId: organizationId || user.organizationId || undefined,
    }

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '15m', // Short-lived access token
      issuer: 'scriptyboy',
      audience: 'scriptyboy-api',
    })
  }

  static generateRefreshToken(userId: string, tokenId: string): string {
    const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      userId,
      tokenId,
    }

    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: '7d', // Long-lived refresh token
      issuer: 'scriptyboy',
      audience: 'scriptyboy-refresh',
    })
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'scriptyboy',
        audience: 'scriptyboy-api',
      }) as JWTPayload
    } catch (error) {
      throw new Error(`Invalid access token: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET, {
        issuer: 'scriptyboy',
        audience: 'scriptyboy-refresh',
      }) as RefreshTokenPayload
    } catch (error) {
      throw new Error(`Invalid refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    return authHeader.slice(7)
  }
}