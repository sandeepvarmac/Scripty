import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/database'
import { PlanType, ProjectType } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

export interface SignUpData {
  email: string
  password: string
  firstName?: string
  lastName?: string
  projectType?: ProjectType
  privacyDoNotTrain?: boolean
  retentionDays?: number
  emailNotifications?: boolean
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email: string
    name: string
    firstName: string
    lastName: string
  }
  token?: string
  error?: string
}

export class RealAuthService {
  static async signUp(data: SignUpData, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      })

      if (existingUser) {
        await this.logAuthEvent('SIGN_UP', data.email, false, ipAddress, userAgent, {
          error: 'Email already exists'
        })
        return { success: false, error: 'An account with this email already exists. Please sign in instead or use a different email address.' }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 12)

      // Determine plan limits
      const planLimits = this.getPlanLimits('FREE')

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          name: data.firstName && data.lastName
            ? `${data.firstName} ${data.lastName}`
            : data.firstName || data.lastName || null,
          projectType: data.projectType || 'FEATURE_INDEPENDENT',
          privacyDoNotTrain: data.privacyDoNotTrain ?? true,
          retentionDays: data.retentionDays || 90,
          emailNotifications: data.emailNotifications ?? true,
          plan: 'FREE',
          analysesLimit: planLimits.analysesLimit,
          analysesUsed: 0
        }
      })

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      )

      // Log successful signup
      await this.logAuthEvent('SIGN_UP', user.email, true, ipAddress, userAgent, {
        userId: user.id
      })

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || ''
        },
        token
      }
    } catch (error) {
      console.error('Signup error:', error)
      await this.logAuthEvent('SIGN_UP', data.email, false, ipAddress, userAgent, {
        error: 'Internal server error'
      })
      return { success: false, error: 'Internal server error' }
    }
  }

  static async signIn(data: SignInData, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: data.email }
      })

      if (!user || !user.passwordHash) {
        await this.logAuthEvent('FAILED_LOGIN', data.email, false, ipAddress, userAgent, {
          error: 'User not found'
        })
        return { success: false, error: 'No account found with this email address. Please check your email or sign up for a new account.' }
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, user.passwordHash)

      if (!isValidPassword) {
        await this.logAuthEvent('FAILED_LOGIN', data.email, false, ipAddress, userAgent, {
          error: 'Invalid password'
        })
        return { success: false, error: 'Incorrect password. Please check your password and try again.' }
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      )

      // Log successful signin
      await this.logAuthEvent('SIGN_IN', user.email, true, ipAddress, userAgent, {
        userId: user.id
      })

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || ''
        },
        token
      }
    } catch (error) {
      console.error('Signin error:', error)
      await this.logAuthEvent('SIGN_IN', data.email, false, ipAddress, userAgent, {
        error: 'Internal server error'
      })
      return { success: false, error: 'Internal server error' }
    }
  }

  static async verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
      return payload
    } catch (error) {
      return null
    }
  }

  static async getUserById(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          plan: true,
          analysesUsed: true,
          analysesLimit: true,
          projectType: true,
          privacyDoNotTrain: true,
          retentionDays: true,
          emailNotifications: true,
          createdAt: true,
          lastLoginAt: true
        }
      })
      return user
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  }

  private static async logAuthEvent(
    action: string,
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    metadata?: any
  ) {
    try {
      await prisma.authLog.create({
        data: {
          email,
          action: action as any,
          success,
          ipAddress,
          userAgent,
          metadata
        }
      })
    } catch (error) {
      console.error('Failed to log auth event:', error)
    }
  }

  private static getPlanLimits(plan: PlanType) {
    switch (plan) {
      case 'FREE':
        return { analysesLimit: 3 }
      case 'SOLO':
        return { analysesLimit: 10 }
      case 'PRO':
        return { analysesLimit: 50 }
      case 'SHOWRUNNER':
        return { analysesLimit: 200 }
      default:
        return { analysesLimit: 3 }
    }
  }
}