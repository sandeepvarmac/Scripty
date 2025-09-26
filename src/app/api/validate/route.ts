import { NextRequest, NextResponse } from 'next/server'
import { parseScript } from '@/lib/parsers'
import type { ScriptFile } from '@/lib/parsers/index'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Accept multipart/form-data
    const form = await req.formData()
    const file = form.get('file') as File | null
    const pdfPassword = (form.get('pdfPassword') as string) || undefined

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'No file uploaded. Use `file` field in multipart/form-data.' },
        { status: 400 }
      )
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const scriptFile: ScriptFile = {
      name: file.name || 'upload',
      mime: file.type || 'application/octet-stream',
      bytes,
      pdfPassword
    }

    // Run parse + compliance gate (lightweight)
    const result = await parseScript(
      scriptFile.bytes,
      scriptFile.name,
      scriptFile.mime,
      { pdfPassword: scriptFile.pdfPassword }
    )

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error || 'Parse failed', warnings: result.warnings || [] },
        { status: 400 }
      )
    }

    const data = result.data!

    // Keep response small; validation endpoints should be lightweight
    return NextResponse.json({
      ok: true,
      blocked: result.blocked === true,
      compliance: result.compliance,     // { score, reasons[], metrics{...} }
      warnings: result.warnings || [],
      // lightweight preview for the UI
      preview: {
        format: data.format,
        title: data.title ?? data.meta?.originalFilename,
        pages: data.pages,
        usedOCR: data.meta.usedOCR,
        passwordProtected: data.meta.passwordProtected,
        confidence: result.confidence
      }
    })
  } catch (err: any) {
    console.error('Validation endpoint error:', {
      message: err?.message,
      stack: err?.stack,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type
    })

    return NextResponse.json(
      { ok: false, error: err?.message || 'Unexpected server error' },
      { status: 500 }
    )
  }
}