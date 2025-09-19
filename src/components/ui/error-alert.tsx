import { AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ErrorAlertProps {
  message: string
  onDismiss?: () => void
  className?: string
}

export function ErrorAlert({ message, onDismiss, className }: ErrorAlertProps) {
  if (!message) return null

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-auto p-1 hover:bg-destructive/20"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}