"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScriptyBoyLogo } from "@/components/ui/logo"

interface OnboardingData {
  firstName: string
  lastName: string
  projectType: "short" | "feature" | "tv" | "other"
  privacyDoNotTrain: boolean
  retentionDays: number
  emailNotifications: boolean
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => Promise<void>
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState<OnboardingData>({
    firstName: "",
    lastName: "",
    projectType: "feature",
    privacyDoNotTrain: true, // Default ON as per requirements
    retentionDays: 90,
    emailNotifications: true
  })

  const updateFormData = (updates: Partial<OnboardingData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      await onComplete(formData)
    } finally {
      setIsLoading(false)
    }
  }

  const totalSteps = 3

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ScriptyBoyLogo size="md" />
          </div>
          <CardTitle>Welcome to ScriptyBoy!</CardTitle>
          <CardDescription>
            Let's set up your account (Step {step} of {totalSteps})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="gradient-brand h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tell us about yourself</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => updateFormData({ firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateFormData({ lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectType">What do you primarily write?</Label>
                <select
                  id="projectType"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  value={formData.projectType}
                  onChange={(e) => updateFormData({ projectType: e.target.value as any })}
                >
                  <option value="short">Short Films</option>
                  <option value="feature">Feature Films</option>
                  <option value="tv">TV/Streaming Series</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Privacy Settings */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Privacy & Data Settings</h3>
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="privacy-training"
                    checked={formData.privacyDoNotTrain}
                    onCheckedChange={(checked) => updateFormData({ privacyDoNotTrain: checked as boolean })}
                  />
                  <div className="space-y-1">
                    <label htmlFor="privacy-training" className="text-sm font-medium">
                      Do not use my scripts for AI training (Recommended)
                    </label>
                    <p className="text-xs text-muted-foreground">
                      When enabled, your uploaded scripts will never be used to improve AI models. This setting protects your intellectual property.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retention">Data Retention Period</Label>
                  <select
                    id="retention"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={formData.retentionDays}
                    onChange={(e) => updateFormData({ retentionDays: parseInt(e.target.value) })}
                  >
                    <option value={30}>30 days</option>
                    <option value={90}>90 days (Recommended)</option>
                    <option value={365}>1 year</option>
                    <option value={-1}>Keep indefinitely</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    How long to keep your uploaded scripts and analysis data
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="email-notifications"
                    checked={formData.emailNotifications}
                    onCheckedChange={(checked) => updateFormData({ emailNotifications: checked as boolean })}
                  />
                  <div className="space-y-1">
                    <label htmlFor="email-notifications" className="text-sm font-medium">
                      Email notifications
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Get notified when your analysis is complete, new features are available, and important account updates.
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Setup Summary</h4>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p>Name: {formData.firstName} {formData.lastName}</p>
                  <p>Focus: {formData.projectType === "short" ? "Short Films" :
                           formData.projectType === "feature" ? "Feature Films" :
                           formData.projectType === "tv" ? "TV/Series" : "Other"}</p>
                  <p>Privacy Protection: {formData.privacyDoNotTrain ? "Enabled" : "Disabled"}</p>
                  <p>Data Retention: {formData.retentionDays === -1 ? "Indefinite" : `${formData.retentionDays} days`}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              Previous
            </Button>

            {step < totalSteps ? (
              <Button
                variant="brand"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && (!formData.firstName || !formData.lastName)}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="brand"
                onClick={handleComplete}
                disabled={isLoading}
              >
                {isLoading ? "Setting up..." : "Complete Setup"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}