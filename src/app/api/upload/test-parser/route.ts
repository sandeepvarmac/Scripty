import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Test parsing import
    const { parseScript } = await import('@/lib/parsers')

    return NextResponse.json({
      success: true,
      message: 'Parser import successful',
      parserAvailable: typeof parseScript === 'function'
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Parser import error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}