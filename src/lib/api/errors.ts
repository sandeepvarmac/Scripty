export interface ApiError {
  status?: number
  details?: unknown
  message?: string
}

export function getErrorStatus(error: unknown, fallback = 500): number {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const candidate = (error as ApiError).status
    if (typeof candidate === 'number') {
      return candidate
    }
  }
  return fallback
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as ApiError).message === 'string') {
    return (error as ApiError).message as string
  }
  return fallback
}

export function getErrorDetails(error: unknown): unknown {
  if (typeof error === 'object' && error !== null && 'details' in error) {
    return (error as ApiError).details
  }
  return undefined
}
