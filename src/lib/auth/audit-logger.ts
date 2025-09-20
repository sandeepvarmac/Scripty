import { prisma } from '@/lib/prisma'
import { AuthAction } from '@prisma/client'

export interface AuthLogData {
  userId?: string
  email?: string
  action: AuthAction
  success: boolean
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

export class AuthAuditLogger {
  static async log(data: AuthLogData): Promise<void> {
    try {
      await prisma.authLog.create({
        data: {
          userId: data.userId || null,
          email: data.email || null,
          action: data.action,
          success: data.success,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
        },
      })
    } catch (error) {
      // Log to console if database logging fails
      console.error('Failed to log auth event:', error)
      console.error('Auth event data:', data)
    }
  }

  static async logSignUp(
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      email,
      action: AuthAction.SIGN_UP,
      success,
      ipAddress,
      userAgent,
      metadata,
    })
  }

  static async logSignIn(
    email: string,
    userId: string | undefined,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      email,
      action: AuthAction.SIGN_IN,
      success,
      ipAddress,
      userAgent,
      metadata,
    })
  }

  static async logSignOut(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: AuthAction.SIGN_OUT,
      success: true,
      ipAddress,
      userAgent,
    })
  }

  static async logTokenRefresh(
    userId: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      action: AuthAction.TOKEN_REFRESH,
      success,
      ipAddress,
      userAgent,
      metadata,
    })
  }

  static async logFailedLogin(
    email: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    await this.log({
      email,
      action: AuthAction.FAILED_LOGIN,
      success: false,
      ipAddress,
      userAgent,
      metadata: reason ? { reason } : undefined,
    })
  }
}