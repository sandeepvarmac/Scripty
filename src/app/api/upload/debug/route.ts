import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Test basic functionality
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Basic upload processing works',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Debug error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}