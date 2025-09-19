"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorAlert } from "@/components/ui/error-alert"

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type SignInFormData = z.infer<typeof signInSchema>

interface SignInFormProps {
  onSubmit: (data: SignInFormData) => Promise<void>
  onToggleForm: () => void
  isLoading?: boolean
}

export function SignInForm({ onSubmit, onToggleForm, isLoading }: SignInFormProps) {
  const [error, setError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>()

  const onFormSubmit = async (data: SignInFormData) => {
    try {
      setError(null)
      await onSubmit(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in. Please check your credentials and try again.")
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to your ScriptyBoy account
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
          </div>

          <Button
            type="submit"
            className="w-full"
            variant="brand"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="w-full">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
          <Button variant="outline" className="w-full">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.024-.105-.949-.199-2.403.041-3.439.219-.937 1.219-5.175 1.219-5.175s-.31-.62-.31-1.538c0-1.441.83-2.518 1.863-2.518.878 0 1.303.66 1.303 1.448 0 .883-.563 2.2-.853 3.423-.242 1.024.512 1.86 1.52 1.86 1.825 0 3.228-1.924 3.228-4.7 0-2.459-1.767-4.176-4.289-4.176-2.922 0-4.635 2.19-4.635 4.456 0 .882.34 1.827.763 2.34.084.102.096.19.071.295-.078.323-.25 1.018-.284 1.162-.045.186-.148.226-.341.136-1.27-.59-2.065-2.44-2.065-3.928 0-3.204 2.326-6.146 6.704-6.146 3.52 0 6.258 2.508 6.258 5.862 0 3.499-2.205 6.318-5.267 6.318-1.028 0-1.996-.537-2.324-1.178 0 0-.51 1.941-.635 2.419-.229.874-.85 1.968-1.265 2.63.951.293 1.958.449 3.003.449 6.621 0 11.99-5.367 11.99-11.987C24.007 5.367 18.637.001 12.017.001z" fill="#BD081C"/>
            </svg>
            Apple
          </Button>
        </div>

        <div className="text-center text-sm">
          Don't have an account?{" "}
          <button
            type="button"
            className="text-primary underline-offset-4 hover:underline"
            onClick={onToggleForm}
          >
            Sign up
          </button>
        </div>
      </CardContent>
    </Card>
  )
}