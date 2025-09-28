"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  Users,
  Clock,
  DollarSign,
  StickyNote,
  Download,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Target,
  Palette,
  Globe,
  Settings,
  Shield,
  Flag
} from "lucide-react"

// Import dashboard components
import { CoverageDashboard } from "./coverage-dashboard"
import { CraftDashboard } from "./craft-dashboard"
import { CharactersDashboard } from "./characters-dashboard"
import { PacingDashboard } from "./pacing-dashboard"
import { FeasibilityDashboard } from "./feasibility-dashboard"
import { NotesDashboard } from "./notes-dashboard"
import { ExportsDashboard } from "./exports-dashboard"

interface ScriptData {
  id: string
  title: string
  author: string
  pageCount: number
  status: string
  logline: string
  synopsisShort: string
  genreOverride: string
  comps: any
  processedAt: string
}

interface DashboardData {
  beats: any[]
  notes: any[]
  scores: any[]
  pageMetrics: any[]
  characterScenes: any[]
  feasibility: any[]
  subplots: any[]
  themeStatements: any[]
  riskFlags: any[]
}

export function ScriptAnalysisDashboard({ scriptId }: { scriptId: string }) {
  const [script, setScript] = React.useState<ScriptData | null>(null)
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState("coverage")

  React.useEffect(() => {
    loadDashboardData()
  }, [scriptId])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load script data
      const scriptResponse = await fetch(`/api/v1/scripts/${scriptId}`)
      if (!scriptResponse.ok) {
        throw new Error(`Failed to load script: ${scriptResponse.statusText}`)
      }
      const scriptData = await scriptResponse.json()
      setScript(scriptData)

      // Load dashboard data
      const dashboardResponse = await fetch(`/api/v1/scripts/${scriptId}/dashboard`)
      if (!dashboardResponse.ok) {
        throw new Error(`Failed to load dashboard: ${dashboardResponse.statusText}`)
      }
      const dashboard = await dashboardResponse.json()
      setDashboardData(dashboard)

    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-brand-600">Loading analysis dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="m-6">
        <CardHeader>
          <CardTitle className="text-danger-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Error Loading Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  if (!script || !dashboardData) {
    return (
      <Card className="m-6">
        <CardHeader>
          <CardTitle>Script Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">The requested script could not be found.</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate summary metrics
  const avgScore = dashboardData?.scores?.length > 0
    ? dashboardData.scores.reduce((sum, score) => sum + score.value, 0) / dashboardData.scores.length
    : 0

  const highSeverityNotes = dashboardData?.notes?.filter(note => note.severity === 'HIGH')?.length ?? 0
  const beatsFound = dashboardData?.beats?.length ?? 0
  const riskCount = dashboardData?.riskFlags?.length ?? 0

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">{script.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>By {script.author}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{script.pageCount} pages</span>
              <Separator orientation="vertical" className="h-4" />
              <Badge variant={script.status === 'COMPLETED' ? 'default' : 'secondary'}>
                {script.status}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-brand-600" />
              <div>
                <p className="text-sm text-gray-600">Overall Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {avgScore.toFixed(1)}/10
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-success-600" />
              <div>
                <p className="text-sm text-gray-600">Story Beats</p>
                <p className="text-2xl font-bold text-gray-900">
                  {beatsFound}/7
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <StickyNote className={`w-8 h-8 ${highSeverityNotes > 0 ? 'text-warning-600' : 'text-success-600'}`} />
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-gray-900">
                  {highSeverityNotes}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Shield className={`w-8 h-8 ${riskCount > 0 ? 'text-danger-600' : 'text-success-600'}`} />
              <div>
                <p className="text-sm text-gray-600">Risk Flags</p>
                <p className="text-2xl font-bold text-gray-900">
                  {riskCount}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 h-auto">
          <TabsTrigger value="coverage" className="flex items-center gap-2 py-3">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Coverage</span>
          </TabsTrigger>
          <TabsTrigger value="craft" className="flex items-center gap-2 py-3">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Craft</span>
          </TabsTrigger>
          <TabsTrigger value="characters" className="flex items-center gap-2 py-3">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Characters</span>
          </TabsTrigger>
          <TabsTrigger value="pacing" className="flex items-center gap-2 py-3">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Pacing</span>
          </TabsTrigger>
          <TabsTrigger value="feasibility" className="flex items-center gap-2 py-3">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Feasibility</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2 py-3">
            <StickyNote className="w-4 h-4" />
            <span className="hidden sm:inline">Notes</span>
          </TabsTrigger>
          <TabsTrigger value="exports" className="flex items-center gap-2 py-3">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coverage" className="space-y-6">
          <CoverageDashboard
            script={script}
            dashboardData={dashboardData}
          />
        </TabsContent>

        <TabsContent value="craft" className="space-y-6">
          <CraftDashboard
            script={script}
            dashboardData={dashboardData}
          />
        </TabsContent>

        <TabsContent value="characters" className="space-y-6">
          <CharactersDashboard
            script={script}
            dashboardData={dashboardData}
          />
        </TabsContent>

        <TabsContent value="pacing" className="space-y-6">
          <PacingDashboard
            script={script}
            dashboardData={dashboardData}
          />
        </TabsContent>

        <TabsContent value="feasibility" className="space-y-6">
          <FeasibilityDashboard
            script={script}
            dashboardData={dashboardData}
          />
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <NotesDashboard
            script={script}
            dashboardData={dashboardData}
            onNotesUpdate={loadDashboardData}
          />
        </TabsContent>

        <TabsContent value="exports" className="space-y-6">
          <ExportsDashboard
            script={script}
            dashboardData={dashboardData}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}