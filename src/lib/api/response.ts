import { NextResponse } from 'next/server'

export function ok<T>(data: T) {
  return NextResponse.json(data)
}

export function error(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status })
}
