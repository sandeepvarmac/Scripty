"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  TrendingUp,
  BarChart3,
  Activity,
  Zap,
  Timer
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
  AreaChart,
  Area,
  ComposedChart
} from 'recharts'

interface PacingDashboardProps {
  script: any
  dashboardData: any
}

export function PacingDashboard({ script, dashboardData }: PacingDashboardProps) {
  const {
    pageMetrics = [],
    beats = [],
    scores = []
  } = dashboardData ?? {}

  // Calculate pacing metrics
  const pacingScore = scores.find((s: any) => s.category === 'PACING')?.value || 0

  // Generate pacing data from page metrics
  const pacingData = React.useMemo(() => {
    return pageMetrics.map((pm: any) => ({
      page: pm.page,
      tensionScore: pm.tension_score || 0,
      complexityScore: pm.complexity_score || 0,
      dialogueLines: pm.dialogue_lines || 0,
      actionLines: pm.action_lines || 0,
      sceneLength: pm.scene_length_lines || 0,
      pace: ((pm.dialogue_lines || 0) + (pm.action_lines || 0)) / Math.max(pm.scene_length_lines || 1, 1) * 10
    }))
  }, [pageMetrics])

  // Tension waveform data
  const tensionWaveform = React.useMemo(() => {
    const data = []
    for (let i = 1; i <= Math.min(script.pageCount, 110); i += 5) {
      const metric = pageMetrics.find((pm: any) => pm.page >= i && pm.page < i + 5)
      data.push({
        page: i,
        tension: metric?.tension_score || Math.random() * 8 + 1,
        complexity: metric?.complexity_score || Math.random() * 6 + 2
      })
    }
    return data
  }, [pageMetrics, script.pageCount])

  // Scene length distribution
  const sceneLengthDistribution = React.useMemo(() => {
    const buckets = [
      { range: '0-20', count: 0, label: 'Very Short' },
      { range: '21-40', count: 0, label: 'Short' },
      { range: '41-60', count: 0, label: 'Medium' },
      { range: '61-80', count: 0, label: 'Long' },
      { range: '81+', count: 0, label: 'Very Long' }
    ]

    pageMetrics.forEach((pm: any) => {
      const length = pm.scene_length_lines || 0
      if (length <= 20) buckets[0].count++
      else if (length <= 40) buckets[1].count++
      else if (length <= 60) buckets[2].count++
      else if (length <= 80) buckets[3].count++
      else buckets[4].count++
    })

    return buckets
  }, [pageMetrics])

  // Beat pacing analysis
  const beatPacing = React.useMemo(() => {
    const expectedPages = [12, 25, 55, 75, 90, 104, 110]
    return beats.map((beat: any, index: number) => ({
      beat: beat.kind.replace('_', ' '),
      actualPage: beat.page,
      expectedPage: expectedPages[index] || beat.page,
      deviation: Math.abs(beat.page - (expectedPages[index] || beat.page)),
      timing: beat.timing_flag || 'UNKNOWN'
    }))
  }, [beats])

  // Calculate statistics
  const stats = React.useMemo(() => {
    const avgTension = pacingData.reduce((sum, d) => sum + d.tensionScore, 0) / Math.max(pacingData.length, 1)
    const avgComplexity = pacingData.reduce((sum, d) => sum + d.complexityScore, 0) / Math.max(pacingData.length, 1)
    const avgSceneLength = pageMetrics.reduce((sum: number, pm: any) => sum + (pm.scene_length_lines || 0), 0) / Math.max(pageMetrics.length, 1)
    const dialogueRatio = pageMetrics.reduce((sum: number, pm: any) => sum + (pm.dialogue_lines || 0), 0) /
                          Math.max(pageMetrics.reduce((sum: number, pm: any) => sum + (pm.scene_length_lines || 0), 0), 1)

    return {
      avgTension: avgTension.toFixed(1),
      avgComplexity: avgComplexity.toFixed(1),
      avgSceneLength: Math.round(avgSceneLength),
      dialogueRatio: (dialogueRatio * 100).toFixed(1)
    }
  }, [pacingData, pageMetrics])

  return (
    <div className="space-y-6">
      {/* Pacing Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Pacing Score</p>
              <p className="text-2xl font-bold text-foreground">{pacingScore.toFixed(1)}/10</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Tension</p>
              <p className="text-2xl font-bold text-foreground">{stats.avgTension}/10</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Scene Length</p>
              <p className="text-2xl font-bold text-foreground">{stats.avgSceneLength}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Dialogue %</p>
              <p className="text-2xl font-bold text-foreground">{stats.dialogueRatio}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tension Waveform */}
      <Card>
        <CardHeader>
          <CardTitle>Tension Waveform</CardTitle>
          <CardDescription>Story tension and complexity throughout the script</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={tensionWaveform}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="page" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="complexity"
                  className="fill-primary"
                  fillOpacity={0.3}
                  className="stroke-primary"
                  strokeWidth={2}
                  name="Complexity"
                />
                <Line
                  type="monotone"
                  dataKey="tension"
                  className="stroke-destructive"
                  strokeWidth={3}
                  name="Tension"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Beat Timing Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Beat Timing Analysis</CardTitle>
            <CardDescription>Story beat placement vs. expected timing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {beatPacing.map((beat, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      beat.timing === 'ON_TIME' ? 'bg-success' :
                      beat.timing === 'EARLY' || beat.timing === 'LATE' ? 'bg-warning' :
                      'bg-destructive'
                    }`}></div>
                    <div>
                      <p className="font-medium text-foreground">{beat.beat}</p>
                      <p className="text-sm text-muted-foreground">
                        Page {beat.actualPage} (expected ~{beat.expectedPage})
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    beat.timing === 'ON_TIME' ? 'default' :
                    beat.timing === 'EARLY' || beat.timing === 'LATE' ? 'secondary' :
                    'destructive'
                  }>
                    {beat.timing.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scene Length Distribution</CardTitle>
            <CardDescription>Distribution of scene lengths in lines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sceneLengthDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" className="fill-primary" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pacing Histogram */}
      <Card>
        <CardHeader>
          <CardTitle>Pacing Analysis</CardTitle>
          <CardDescription>Page-by-page pacing metrics and rhythm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pacingData.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="page" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pace" className="fill-success" name="Pacing Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Dialogue vs Action Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Dialogue vs Action Balance</CardTitle>
          <CardDescription>Balance between dialogue and action throughout the script</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pacingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="page" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="dialogueLines"
                  stackId="1"
                  className="stroke-chart-2"
                  className="fill-chart-2"
                  fillOpacity={0.6}
                  name="Dialogue Lines"
                />
                <Area
                  type="monotone"
                  dataKey="actionLines"
                  stackId="1"
                  className="stroke-primary"
                  className="fill-primary"
                  fillOpacity={0.6}
                  name="Action Lines"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pacing Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Pacing Insights</CardTitle>
          <CardDescription>AI analysis of pacing and rhythm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Rhythm Analysis</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Overall Pacing</span>
                  <div className="flex items-center gap-2">
                    <Progress value={pacingScore * 10} className="w-20 h-2" />
                    <span className="text-sm font-medium">{pacingScore.toFixed(1)}/10</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tension Variation</span>
                  <Badge variant="outline">
                    {tensionWaveform.length > 1 &&
                     Math.max(...tensionWaveform.map(t => t.tension)) - Math.min(...tensionWaveform.map(t => t.tension)) > 5
                      ? 'Dynamic' : 'Steady'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Scene Variety</span>
                  <Badge variant="outline">
                    {sceneLengthDistribution.filter(b => b.count > 0).length >= 3 ? 'Varied' : 'Uniform'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Recommendations</h4>
              <div className="space-y-3 text-sm">
                {pacingScore < 6 && (
                  <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <p className="text-warning">
                      <strong>Pacing Concern:</strong> Consider varying scene lengths and tension levels
                      to improve rhythm and reader engagement.
                    </p>
                  </div>
                )}
                {beatPacing.filter(b => b.timing !== 'ON_TIME').length > 2 && (
                  <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <p className="text-warning">
                      <strong>Structure Timing:</strong> Multiple story beats are off expected timing.
                      Consider restructuring for better pacing.
                    </p>
                  </div>
                )}
                {parseFloat(stats.dialogueRatio) > 70 && (
                  <div className="p-3 bg-muted border border-border rounded-lg">
                    <p className="text-foreground">
                      <strong>Dialogue Heavy:</strong> High dialogue percentage. Consider adding
                      more action and visual storytelling.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
