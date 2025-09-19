import { prisma } from '@/lib/prisma'
import { PasswordService } from './password'
import { JWTService } from './jwt'
import { RateLimiterService } from './rate-limiter'
import { AuthAuditLogger } from './audit-logger'
import { User, ProjectType, AuthAction, Role, Organization } from '@/generated/prisma'

type UserWithRelations = User & {
  role?: Role | null
  organization?: Organization | null
}
import crypto from 'crypto'

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

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

export interface AuthResult {
  success: boolean
  user?: UserWithRelations
  tokens?: AuthTokens
  error?: string
  remainingAttempts?: number
}

export class AuthService {
  static async signUp(
    data: SignUpData,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResult> {
    const { email, password, ...profileData } = data

    // Rate limiting
    const emailLimit = await RateLimiterService.checkLimit(
      RateLimiterService.getRateLimitKey('signup', email)
    )

    if (!emailLimit.allowed) {
      await AuthAuditLogger.logSignUp(email, false, ipAddress, userAgent, {
        reason: 'Rate limit exceeded',
      })
      return {
        success: false,
        error: 'Too many signup attempts. Please try again later.',
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      await AuthAuditLogger.logSignUp(email, false, ipAddress, userAgent, {
        reason: 'Email already exists',
      })
      return {
        success: false,
        error: 'An account with this email already exists.',
      }
    }

    // Validate password strength
    const passwordValidation = PasswordService.validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      await AuthAuditLogger.logSignUp(email, false, ipAddress, userAgent, {
        reason: 'Weak password',
        errors: passwordValidation.errors,
      })
      return {
        success: false,
        error: passwordValidation.errors.join('. '),
      }
    }

    try {
      // Hash password
      const passwordHash = await PasswordService.hash(password)

      // Get default user role
      const defaultRole = await prisma.role.findFirst({
        where: { isDefault: true },
      })

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          name: profileData.firstName && profileData.lastName
            ? `${profileData.firstName} ${profileData.lastName}`
            : undefined,
          projectType: profileData.projectType || ProjectType.FEATURE,
          privacyDoNotTrain: profileData.privacyDoNotTrain ?? true,
          retentionDays: profileData.retentionDays ?? 90,
          emailNotifications: profileData.emailNotifications ?? true,
          roleId: defaultRole?.id,
        },
        include: {
          role: true,
          organization: true,
        },
      })

      // Generate tokens
      const tokens = await this.generateTokens(user)

      // Log successful signup
      await AuthAuditLogger.logSignUp(email, true, ipAddress, userAgent, {
        userId: user.id,
      })

      return {
        success: true,
        user,
        tokens,
      }
    } catch (error) {
      await AuthAuditLogger.logSignUp(email, false, ipAddress, userAgent, {
        reason: 'Database error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return {
        success: false,
        error: 'Failed to create account. Please try again.',
      }
    }
  }

  static async signIn(
    data: SignInData,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResult> {
    const { email, password } = data

    // Rate limiting
    const emailLimit = await RateLimiterService.checkLimit(
      RateLimiterService.getRateLimitKey('login', email)
    )

    if (!emailLimit.allowed) {
      await AuthAuditLogger.logFailedLogin(email, ipAddress, userAgent, 'Rate limit exceeded')
      return {
        success: false,
        error: 'Too many login attempts. Please try again later.',
        remainingAttempts: 0,
      }
    }

    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          role: true,
          organization: true,
        },
      })

      if (!user || !user.passwordHash) {
        await AuthAuditLogger.logFailedLogin(email, ipAddress, userAgent, 'User not found')
        return {
          success: false,
          error: 'Invalid email or password.',
          remainingAttempts: emailLimit.remainingPoints,
        }
      }

      // Verify password
      const isValidPassword = await PasswordService.verify(password, user.passwordHash)

      if (!isValidPassword) {
        await AuthAuditLogger.logSignIn(email, user.id, false, ipAddress, userAgent, {
          reason: 'Invalid password',
        })
        return {
          success: false,
          error: 'Invalid email or password.',
          remainingAttempts: emailLimit.remainingPoints,
        }
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })

      // Generate tokens
      const tokens = await this.generateTokens(user)

      // Reset rate limit on successful login
      await RateLimiterService.resetLimit(
        RateLimiterService.getRateLimitKey('login', email)
      )

      // Log successful signin
      await AuthAuditLogger.logSignIn(email, user.id, true, ipAddress, userAgent)

      return {
        success: true,
        user,
        tokens,
      }
    } catch (error) {
      await AuthAuditLogger.logSignIn(email, undefined, false, ipAddress, userAgent, {
        reason: 'System error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return {
        success: false,
        error: 'Login failed. Please try again.',
      }
    }
  }

  static async refreshTokens(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResult> {
    try {
      // Verify refresh token
      const payload = JWTService.verifyRefreshToken(refreshToken)

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: {
          user: {
            include: {
              role: true,
              organization: true,
            },
          },
        },
      })

      if (!storedToken || storedToken.expiresAt < new Date()) {
        await AuthAuditLogger.logTokenRefresh(
          payload.userId,
          false,
          ipAddress,
          userAgent,
          { reason: 'Invalid or expired refresh token' }
        )
        return {
          success: false,
          error: 'Invalid or expired refresh token.',
        }
      }

      // Delete old refresh token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      })

      // Generate new tokens
      const tokens = await this.generateTokens(storedToken.user)

      await AuthAuditLogger.logTokenRefresh(
        storedToken.user.id,
        true,
        ipAddress,
        userAgent
      )

      return {
        success: true,
        user: storedToken.user,
        tokens,
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to refresh tokens.',
      }
    }
  }

  static async signOut(
    refreshToken: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Remove refresh token from database
      await prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { token: refreshToken },
            { userId },
          ],
        },
      })

      await AuthAuditLogger.logSignOut(userId, ipAddress, userAgent)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  private static async generateTokens(user: UserWithRelations): Promise<AuthTokens> {
    // Generate refresh token
    const refreshTokenId = crypto.randomUUID()
    const refreshToken = JWTService.generateRefreshToken(user.id, refreshTokenId)

    // Store refresh token in database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    })

    // Generate access token
    const accessToken = JWTService.generateAccessToken(user)

    // Access token expires in 15 minutes
    const accessExpiresAt = new Date()
    accessExpiresAt.setMinutes(accessExpiresAt.getMinutes() + 15)

    return {
      accessToken,
      refreshToken,
      expiresAt: accessExpiresAt,
    }
  }
}