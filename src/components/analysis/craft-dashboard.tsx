"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Target,
  MessageCircle,
  Globe,
  Palette,
  Film,
  FileText,
  Shield,
  Flag,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface CraftDashboardProps {
  script: any
  dashboardData: any
}

export function CraftDashboard({ script, dashboardData }: CraftDashboardProps) {
  const { beats, scores, notes, subplots, themeStatements, riskFlags } = dashboardData

  // Get scores by category
  const getScoreByCategory = (category: string) => {
    const score = scores.find((s: any) => s.category === category)
    return score ? score.value : 0
  }

  // Beat timing analysis
  const expectedBeats = [
    { kind: 'INCITING', expectedPage: 12, window: [8, 17] },
    { kind: 'ACT1_BREAK', expectedPage: 25, window: [20, 30] },
    { kind: 'MIDPOINT', expectedPage: 55, window: [50, 60] },
    { kind: 'LOW_POINT', expectedPage: 75, window: [70, 80] },
    { kind: 'ACT2_BREAK', expectedPage: 90, window: [85, 95] },
    { kind: 'CLIMAX', expectedPage: 104, window: [100, 110] },
    { kind: 'RESOLUTION', expectedPage: 110, window: [105, 115] }
  ]

  const beatAnalysis = expectedBeats.map(expected => {
    const actualBeat = beats.find((b: any) => b.kind === expected.kind)
    const timing = actualBeat ? (
      actualBeat.page >= expected.window[0] && actualBeat.page <= expected.window[1]
        ? 'ON_TIME'
        : actualBeat.page < expected.window[0] ? 'EARLY' : 'LATE'
    ) : 'MISSING'

    return {
      kind: expected.kind,
      expected: expected.expectedPage,
      actual: actualBeat?.page || null,
      timing,
      confidence: actualBeat?.confidence || 0,
      rationale: actualBeat?.rationale || null
    }
  })

  // Notes by area
  const notesByArea = notes.reduce((acc: any, note: any) => {
    acc[note.area] = (acc[note.area] || 0) + 1
    return acc
  }, {})

  const craftAreas = [
    { key: 'STRUCTURE', label: 'Structure & Beats', icon: Target, score: getScoreByCategory('STRUCTURE') },
    { key: 'CHARACTER', label: 'Character Development', icon: Target, score: getScoreByCategory('CHARACTER') },
    { key: 'DIALOGUE', label: 'Dialogue Quality', icon: MessageCircle, score: getScoreByCategory('DIALOGUE') },
    { key: 'PACING', label: 'Pacing & Flow', icon: Clock, score: getScoreByCategory('PACING') },
    { key: 'THEME', label: 'Theme & Stakes', icon: Palette, score: getScoreByCategory('THEME') },
    { key: 'GENRE_FIT', label: 'Genre & Market', icon: Film, score: getScoreByCategory('GENRE_FIT') },
    { key: 'ORIGINALITY', label: 'World & Logic', icon: Globe, score: getScoreByCategory('ORIGINALITY') },
    { key: 'FEASIBILITY', label: 'Formatting', icon: FileText, score: getScoreByCategory('FEASIBILITY') }
  ]

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="space-y-6">
      {/* Craft Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {craftAreas.slice(0, 4).map((area, index) => {
          const Icon = area.icon
          const getScoreColor = (score: number) => {
            if (score >= 8) return 'success'
            if (score >= 6) return 'warning'
            return 'danger'
          }

          return (
            <Card key={area.key} className="p-4">
              <div className="flex items-center gap-3">
                <Icon className={`w-6 h-6 text-${getScoreColor(area.score)}-600`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 truncate">{area.label}</p>
                  <p className="text-xl font-bold text-gray-900">{area.score.toFixed(1)}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Craft Analysis Tabs */}
      <Tabs defaultValue="structure" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-8">
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="conflict">Conflict</TabsTrigger>
          <TabsTrigger value="dialogue">Dialogue</TabsTrigger>
          <TabsTrigger value="world">World</TabsTrigger>
          <TabsTrigger value="genre">Genre</TabsTrigger>
          <TabsTrigger value="formatting">Format</TabsTrigger>
          <TabsTrigger value="sensitivity">Sensitivity</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Story Beats */}
            <Card>
              <CardHeader>
                <CardTitle>Story Beats Analysis</CardTitle>
                <CardDescription>
                  Structural beats and timing vs. expected windows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {beatAnalysis.map((beat, index) => {
                    const getTimingIcon = (timing: string) => {
                      switch (timing) {
                        case 'ON_TIME': return <CheckCircle className="w-4 h-4 text-success-600" />
                        case 'EARLY': case 'LATE': return <AlertCircle className="w-4 h-4 text-warning-600" />
                        case 'MISSING': return <XCircle className="w-4 h-4 text-danger-600" />
                        default: return <AlertCircle className="w-4 h-4 text-gray-400" />
                      }
                    }

                    return (
                      <div key={beat.kind} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTimingIcon(beat.timing)}
                          <div>
                            <p className="font-medium text-gray-900">
                              {beat.kind.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-gray-600">
                              {beat.actual ? `Page ${beat.actual}` : 'Not found'}
                              {beat.timing !== 'MISSING' && ` (expected ~${beat.expected})`}
                            </p>
                          </div>
                        </div>
                        <Badge variant={beat.timing === 'ON_TIME' ? 'default' :
                                      beat.timing === 'MISSING' ? 'destructive' : 'secondary'}>
                          {beat.timing.replace('_', ' ')}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Beat Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Beat Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={beats.map(b => ({ page: b.page, kind: b.kind.replace('_', ' '), confidence: b.confidence * 100 }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="page" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="confidence" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subplot Analysis */}
          {subplots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Subplot Threads</CardTitle>
                <CardDescription>Secondary storylines and their development</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subplots.map((subplot: any, index: number) => (
                    <div key={index} className="border-l-4 border-brand-200 pl-4 space-y-2">
                      <h4 className="font-medium text-gray-900">{subplot.label}</h4>
                      {subplot.description && (
                        <p className="text-sm text-gray-600">{subplot.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="conflict" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Theme Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Theme Statements</CardTitle>
                <CardDescription>Central themes and their confidence scores</CardDescription>
              </CardHeader>
              <CardContent>
                {themeStatements.length > 0 ? (
                  <div className="space-y-4">
                    {themeStatements.map((theme: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <p className="text-gray-900 leading-relaxed">"{theme.statement}"</p>
                        <div className="flex items-center gap-2">
                          <Progress value={theme.confidence * 100} className="h-2 flex-1" />
                          <span className="text-sm text-gray-600">{(theme.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 italic">No theme statements identified</p>
                )}
              </CardContent>
            </Card>

            {/* Stakes & Conflict */}
            <Card>
              <CardHeader>
                <CardTitle>Conflict Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Theme Score</h4>
                    <div className="flex items-center gap-3">
                      <Progress value={getScoreByCategory('THEME') * 10} className="flex-1" />
                      <span className="font-bold">{getScoreByCategory('THEME')}/10</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Character Development</h4>
                    <div className="flex items-center gap-3">
                      <Progress value={getScoreByCategory('CHARACTER') * 10} className="flex-1" />
                      <span className="font-bold">{getScoreByCategory('CHARACTER')}/10</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dialogue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dialogue Quality Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{getScoreByCategory('DIALOGUE')}</p>
                  <p className="text-sm text-gray-600">Overall Score</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{notesByArea.DIALOGUE || 0}</p>
                  <p className="text-sm text-gray-600">Dialogue Notes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {notes.filter((n: any) => n.area === 'DIALOGUE' && n.severity === 'HIGH').length}
                  </p>
                  <p className="text-sm text-gray-600">Critical Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="world" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>World Building & Logic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Originality Score</h4>
                  <div className="flex items-center gap-3">
                    <Progress value={getScoreByCategory('ORIGINALITY') * 10} className="flex-1" />
                    <span className="font-bold">{getScoreByCategory('ORIGINALITY')}/10</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Logic Issues</h4>
                  <p className="text-2xl font-bold text-gray-900">{notesByArea.LOGIC || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="genre" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Genre & Market Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Genre Fit Score</h4>
                  <div className="flex items-center gap-3">
                    <Progress value={getScoreByCategory('GENRE_FIT') * 10} className="flex-1" />
                    <span className="font-bold">{getScoreByCategory('GENRE_FIT')}/10</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Primary Genre</h4>
                  <Badge variant="outline" className="text-base">{script.genreOverride || 'Unspecified'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formatting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Formatting Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Page Count</span>
                  <Badge variant="outline">{script.pageCount} pages</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Formatting Issues</span>
                  <Badge variant={notesByArea.FORMATTING ? "destructive" : "default"}>
                    {notesByArea.FORMATTING || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sensitivity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Sensitivity Analysis
              </CardTitle>
              <CardDescription>
                Optional content analysis for inclusive representation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-600">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Sensitivity analysis is opt-in</p>
                <p className="text-sm">Enable in project settings to see representation insights</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5" />
                Risk Flags
              </CardTitle>
              <CardDescription>
                Legal-adjacent content flags (non-legal advice)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {riskFlags.length > 0 ? (
                <div className="space-y-4">
                  {riskFlags.map((risk: any, index: number) => (
                    <div key={index} className="border-l-4 border-danger-200 pl-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">{risk.kind.replace('_', ' ')}</Badge>
                        <span className="text-sm text-gray-600">
                          {risk.page && `Page ${risk.page}`}
                        </span>
                      </div>
                      {risk.snippet && (
                        <p className="text-sm bg-gray-50 p-2 rounded italic">"{risk.snippet}"</p>
                      )}
                      {risk.notes && (
                        <p className="text-sm text-gray-600">{risk.notes}</p>
                      )}
                    </div>
                  ))}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">
                      <strong>Disclaimer:</strong> This analysis does not constitute legal advice.
                      Consult qualified legal counsel for definitive guidance on content risks.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success-600" />
                  <p>No risk flags identified</p>
                  <p className="text-sm">Content appears clear of obvious legal-adjacent concerns</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}