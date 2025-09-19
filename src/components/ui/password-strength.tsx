import { Check, X } from "lucide-react"
import { validatePassword, getPasswordStrengthText, type PasswordStrength } from "@/lib/validation/password"

interface PasswordStrengthProps {
  password: string
  className?: string
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthProps) {
  const strength = validatePassword(password)

  if (!password) return null

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span
            className="font-medium"
            style={{ color: strength.color }}
          >
            {getPasswordStrengthText(strength.strength)}
          </span>
        </div>
        <div className="flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i < strength.score
                  ? 'opacity-100'
                  : 'bg-muted opacity-30'
              }`}
              style={{
                backgroundColor: i < strength.score ? strength.color : undefined
              }}
            />
          ))}
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-1">
        {strength.requirements.map((req) => (
          <div
            key={req.key}
            className={`flex items-center space-x-2 text-xs transition-colors ${
              req.met
                ? 'text-green-600'
                : 'text-muted-foreground'
            }`}
          >
            {req.met ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Export strength validation for forms
export { validatePassword, getPasswordStrengthText }