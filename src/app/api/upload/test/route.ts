import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Upload API is reachable' })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'POST method works',
    contentType: request.headers.get('content-type')
  })
}