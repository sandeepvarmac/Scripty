"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorAlert } from "@/components/ui/error-alert"
import { PasswordStrengthIndicator, validatePassword } from "@/components/ui/password-strength"

const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  privacyOptOut: z.boolean().default(true),
  terms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignUpFormData = z.infer<typeof signUpSchema>

interface SignUpFormProps {
  onSubmit: (data: SignUpFormData) => Promise<void>
  onToggleForm: () => void
  isLoading?: boolean
}

export function SignUpForm({ onSubmit, onToggleForm, isLoading }: SignUpFormProps) {
  const [privacyOptOut, setPrivacyOptOut] = React.useState(true)
  const [acceptTerms, setAcceptTerms] = React.useState(false)
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<SignUpFormData>({
    defaultValues: {
      privacyOptOut: true,
      terms: false
    }
  })

  const watchedPassword = watch("password", "")

  React.useEffect(() => {
    setPassword(watchedPassword)
  }, [watchedPassword])

  const onFormSubmit = async (data: SignUpFormData) => {
    try {
      setError(null)

      // Validate password strength
      const passwordStrength = validatePassword(data.password)
      if (passwordStrength.score < 4) {
        setError("Please choose a stronger password to secure your account")
        return
      }

      await onSubmit({
        ...data,
        privacyOptOut,
        terms: acceptTerms
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account. Please try again.")
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Start analyzing your screenplays with AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <ErrorAlert
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                {...register("firstName", { required: true })}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                {...register("lastName", { required: true })}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email", { required: true })}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register("password", { required: true })}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}

            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator password={password} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register("confirmPassword", { required: true })}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Privacy Settings */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm">Privacy Settings</h4>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="privacy-opt-out"
                checked={privacyOptOut}
                onCheckedChange={(checked) => setPrivacyOptOut(checked as boolean)}
              />
              <label
                htmlFor="privacy-opt-out"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Do not use my scripts for AI training
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Your scripts will never be used to improve AI models when this is enabled (recommended).
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
            />
            <label
              htmlFor="terms"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I accept the{" "}
              <a href="/terms" className="text-primary underline-offset-4 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-primary underline-offset-4 hover:underline">
                Privacy Policy
              </a>
            </label>
          </div>
          {errors.terms && (
            <p className="text-sm text-destructive">{errors.terms.message}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            variant="brand"
            disabled={isLoading || !acceptTerms}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="text-center text-sm">
          Already have an account?{" "}
          <button
            type="button"
            className="text-primary underline-offset-4 hover:underline"
            onClick={onToggleForm}
          >
            Sign in
          </button>
        </div>
      </CardContent>
    </Card>
  )
}