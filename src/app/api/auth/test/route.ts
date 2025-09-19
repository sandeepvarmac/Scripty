import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Auth test endpoint called with:', body)

    // Simulate a successful response
    return NextResponse.json({
      success: true,
      message: 'Auth endpoint is working',
      data: body
    })
  } catch (error) {
    console.error('Test auth error:', error)
    return NextResponse.json(
      { error: 'Test endpoint failed' },
      { status: 500 }
    )
  }
}