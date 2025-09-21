"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  privacyDoNotTrain: z.boolean().default(true),
  retentionDays: z.number().default(90),
  emailNotifications: z.boolean().default(true),
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
  const [acceptTerms, setAcceptTerms] = React.useState(false)
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [privacyDoNotTrain, setPrivacyDoNotTrain] = React.useState(true)
  const [retentionDays, setRetentionDays] = React.useState(90)
  const [emailNotifications, setEmailNotifications] = React.useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<SignUpFormData>({
    defaultValues: {
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
        terms: acceptTerms,
        privacyDoNotTrain,
        retentionDays,
        emailNotifications
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

          {/* Privacy Settings Section */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
            <h4 className="font-medium text-sm">Privacy & Data Settings</h4>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="privacy-training"
                  checked={privacyDoNotTrain}
                  onCheckedChange={(checked) => setPrivacyDoNotTrain(checked as boolean)}
                />
                <div className="space-y-1">
                  <label htmlFor="privacy-training" className="text-sm font-medium">
                    Do not use my scripts for AI training (Recommended)
                  </label>
                  <p className="text-xs text-muted-foreground">
                    When enabled, your uploaded scripts will never be used to improve AI models. This protects your intellectual property.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="retention" className="text-sm">Data Retention Period</Label>
                <Select value={retentionDays.toString()} onValueChange={(value) => setRetentionDays(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days (Recommended)</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="-1">Keep indefinitely</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How long to keep your uploaded scripts and analysis data
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={(checked) => setEmailNotifications(checked as boolean)}
                />
                <div className="space-y-1">
                  <label htmlFor="email-notifications" className="text-sm font-medium">
                    Email notifications
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when analysis is complete and for important account updates
                  </p>
                </div>
              </div>
            </div>
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