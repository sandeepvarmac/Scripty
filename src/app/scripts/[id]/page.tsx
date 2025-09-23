"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { AppShell, AppHeader, AppContent } from "@/components/app-shell"
import { BrandHeader } from "@/components/ui/brand-header"
import { ScriptAnalysisDashboard } from "@/components/analysis/script-dashboard"

export default function ScriptAnalysisPage() {
  const params = useParams()
  const scriptId = params.id as string

  return (
    <AppShell>
      <AppHeader>
        <BrandHeader showNavigation />
      </AppHeader>
      <AppContent className="flex flex-col">
        <ScriptAnalysisDashboard scriptId={scriptId} />
      </AppContent>
    </AppShell>
  )
}