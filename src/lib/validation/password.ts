export interface PasswordRequirement {
  key: string
  label: string
  regex: RegExp
  met: boolean
}

export interface PasswordStrength {
  score: number // 0-5
  requirements: PasswordRequirement[]
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'
  color: string
}

export function validatePassword(password: string): PasswordStrength {
  const requirements: PasswordRequirement[] = [
    {
      key: 'length',
      label: 'At least 8 characters',
      regex: /.{8,}/,
      met: false
    },
    {
      key: 'lowercase',
      label: 'One lowercase letter',
      regex: /[a-z]/,
      met: false
    },
    {
      key: 'uppercase',
      label: 'One uppercase letter',
      regex: /[A-Z]/,
      met: false
    },
    {
      key: 'number',
      label: 'One number',
      regex: /\d/,
      met: false
    },
    {
      key: 'special',
      label: 'One special character (!@#$%^&*)',
      regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      met: false
    }
  ]

  // Check each requirement
  requirements.forEach(req => {
    req.met = req.regex.test(password)
  })

  // Calculate score (0-5)
  const score = requirements.filter(req => req.met).length

  // Determine strength level
  let strength: PasswordStrength['strength']
  let color: string

  switch (score) {
    case 0:
    case 1:
      strength = 'very-weak'
      color = '#ef4444' // red-500
      break
    case 2:
      strength = 'weak'
      color = '#f97316' // orange-500
      break
    case 3:
      strength = 'fair'
      color = '#eab308' // yellow-500
      break
    case 4:
      strength = 'good'
      color = '#22c55e' // green-500
      break
    case 5:
      strength = 'strong'
      color = '#16a34a' // green-600
      break
    default:
      strength = 'very-weak'
      color = '#ef4444'
  }

  return {
    score,
    requirements,
    strength,
    color
  }
}

export function getPasswordStrengthText(strength: PasswordStrength['strength']): string {
  switch (strength) {
    case 'very-weak':
      return 'Very Weak'
    case 'weak':
      return 'Weak'
    case 'fair':
      return 'Fair'
    case 'good':
      return 'Good'
    case 'strong':
      return 'Strong'
    default:
      return 'Very Weak'
  }
}