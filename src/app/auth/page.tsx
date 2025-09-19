"use client"

import * as React from "react"
import { SignInForm } from "@/components/auth/sign-in-form"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { OnboardingWizard } from "@/components/auth/onboarding-wizard"
import { ScriptyBoyLogo } from "@/components/ui/logo"

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [showOnboarding, setShowOnboarding] = React.useState(false)

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
        window.location.href = '/dashboard'
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
    email: string
    password: string
    confirmPassword: string
    privacyOptOut: boolean
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
          email: data.email,
          password: data.password,
          privacyDoNotTrain: data.privacyOptOut,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        // Successful sign up - show onboarding
        console.log('Sign up successful:', result.user)
        setShowOnboarding(true)
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

  const handleOnboardingComplete = async (onboardingData: any) => {
    try {
      // TODO: Save onboarding data and redirect to dashboard
      console.log("Onboarding complete:", onboardingData)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call

      // Redirect to dashboard
      window.location.href = "/dashboard"
    } catch (error) {
      console.error("Failed to complete onboarding:", error)
    }
  }

  // Show onboarding wizard after successful signup
  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />
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