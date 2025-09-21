"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SignInForm } from "@/components/auth/sign-in-form"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { ScriptyBoyLogo } from "@/components/ui/logo"

export default function AuthPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSignIn = async (data: { email: string; password: string }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        // Successful sign in - redirect to dashboard
        console.log('Sign in successful:', result.user)
        router.push('/dashboard')
      } else {
        // Throw error to be caught by form
        throw new Error(result.error || 'Sign in failed')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      // Re-throw to let form handle the error display
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (data: {
    firstName: string
    lastName: string
    email: string
    password: string
    confirmPassword: string
    privacyDoNotTrain: boolean
    retentionDays: number
    emailNotifications: boolean
    terms: boolean
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          privacyDoNotTrain: data.privacyDoNotTrain,
          retentionDays: data.retentionDays,
          emailNotifications: data.emailNotifications,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        // Successful sign up - redirect directly to dashboard
        console.log('Sign up successful:', result.user)
        router.push('/dashboard')
      } else {
        // Throw error to be caught by form
        throw new Error(result.error || 'Sign up failed')
      }
    } catch (error) {
      console.error('Sign up error:', error)
      // Re-throw to let form handle the error display
      throw error
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-brand items-center justify-center p-12">
        <div className="text-center text-white space-y-6">
          <ScriptyBoyLogo size="lg" className="mx-auto" />
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Welcome to ScriptyBoy</h1>
            <p className="text-xl text-white/90">
              Professional screenplay analysis powered by AI
            </p>
            <div className="space-y-2 text-white/80">
              <p>✓ Industry-standard coverage reports</p>
              <p>✓ Scene-anchored diagnostics</p>
              <p>✓ Actionable rewrite suggestions</p>
              <p>✓ Privacy-first approach</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {isSignUp ? (
            <SignUpForm
              onSubmit={handleSignUp}
              onToggleForm={() => setIsSignUp(false)}
              isLoading={isLoading}
            />
          ) : (
            <SignInForm
              onSubmit={handleSignIn}
              onToggleForm={() => setIsSignUp(true)}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  )
}