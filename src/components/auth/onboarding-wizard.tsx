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
  initialData?: {
    firstName?: string
    lastName?: string
    email?: string
  }
}

export function OnboardingWizard({ onComplete, initialData }: OnboardingWizardProps) {
  // Skip name step if we already have the data
  const skipNameStep = !!(initialData?.firstName && initialData?.lastName)

  const [step, setStep] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState<OnboardingData>({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    projectType: "" as any, // Force user to select
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

  const totalSteps = 3 // Always 3 steps now
  const startStep = 1 // Always start at step 1

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

          {/* Step 1: Project Focus */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">What's your focus?</h3>
                <p className="text-muted-foreground">
                  This helps us tailor the analysis and feedback to your specific writing needs.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">What do you primarily write?</Label>
                <div className="grid gap-3">
                  {[
                    { value: "short", label: "Short Films", desc: "Scripts under 40 pages" },
                    { value: "feature", label: "Feature Films", desc: "Full-length screenplays (90-120 pages)" },
                    { value: "tv", label: "TV/Streaming Series", desc: "Episodes, pilots, and series" },
                    { value: "other", label: "Other", desc: "Web series, commercials, etc." }
                  ].map((option) => (
                    <div
                      key={option.value}
                      className={`border rounded-lg p-4 cursor-pointer transition-all hover:bg-muted/50 ${
                        formData.projectType === option.value
                          ? "border-brand bg-brand/5 ring-1 ring-brand/20"
                          : "border-border"
                      }`}
                      onClick={() => updateFormData({ projectType: option.value as any })}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.projectType === option.value
                            ? "border-brand bg-brand"
                            : "border-muted-foreground"
                        }`}>
                          {formData.projectType === option.value && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Privacy Settings */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Privacy & Data Protection</h3>
                <p className="text-muted-foreground">
                  Control how your scripts and data are handled. Your privacy is our priority.
                </p>
              </div>
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

          {/* Step 3: Summary & Preferences */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Almost done!</h3>
                <p className="text-muted-foreground">
                  Review your settings and set notification preferences.
                </p>
              </div>

              {/* Summary */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <h4 className="font-medium">Your Settings</h4>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{formData.firstName} {formData.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Focus:</span>
                    <span>{
                      formData.projectType === "short" ? "Short Films" :
                      formData.projectType === "feature" ? "Feature Films" :
                      formData.projectType === "tv" ? "TV/Series" :
                      formData.projectType === "other" ? "Other" : "Not selected"
                    }</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">AI Training:</span>
                    <span>{formData.privacyDoNotTrain ? "Disabled (Protected)" : "Allowed"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data Retention:</span>
                    <span>{formData.retentionDays === -1 ? "Indefinite" : `${formData.retentionDays} days`}</span>
                  </div>
                </div>
              </div>

              <h4 className="font-medium">Notification Preferences</h4>
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
                disabled={step === 1 && !formData.projectType}
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