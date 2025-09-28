"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Star,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  FileText
} from "lucide-react"

interface CoverageDashboardProps {
  script: any
  dashboardData: any
}

export function CoverageDashboard({ script, dashboardData }: CoverageDashboardProps) {
  const {
    beats = [],
    scores = [],
    notes = [],
    riskFlags = []
  } = dashboardData ?? {}

  // Calculate recommendation
  const avgScore = scores.length > 0
    ? scores.reduce((sum: number, score: any) => sum + score.value, 0) / scores.length
    : 0

  const getRecommendation = () => {
    if (avgScore >= 8) return { level: "RECOMMEND", color: "success", icon: CheckCircle }
    if (avgScore >= 6) return { level: "CONSIDER", color: "warning", icon: AlertCircle }
    return { level: "PASS", color: "danger", icon: XCircle }
  }

  const recommendation = getRecommendation()
  const RecommendationIcon = recommendation.icon

  // Get key strengths and concerns
  const strengths = scores
    .filter((score: any) => score.value >= 7)
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 3)

  const concerns = scores
    .filter((score: any) => score.value < 6)
    .sort((a: any, b: any) => a.value - b.value)
    .slice(0, 3)

  const highPriorityNotes = notes
    .filter((note: any) => note.severity === 'HIGH')
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommendation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <RecommendationIcon className={`w-8 h-8 ${recommendation.color === 'success' ? 'text-success' : recommendation.color === 'warning' ? 'text-warning' : 'text-destructive'}`} />
              <div>
                <p className={`text-2xl font-bold ${recommendation.color === 'success' ? 'text-success' : recommendation.color === 'warning' ? 'text-warning' : 'text-destructive'}`}>
                  {recommendation.level}
                </p>
                <p className="text-sm text-muted-foreground">
                  Based on {scores.length} criteria
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{avgScore.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">/ 10</span>
              </div>
              <Progress value={avgScore * 10} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {avgScore >= 8 ? "Excellent" : avgScore >= 6 ? "Good" : "Needs Work"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Key Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Story Beats</span>
              <Badge variant={beats.length >= 7 ? "default" : "secondary"}>
                {beats.length}/7
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">High Priority Notes</span>
              <Badge variant={highPriorityNotes.length > 0 ? "destructive" : "default"}>
                {highPriorityNotes.length}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Risk Flags</span>
              <Badge variant={riskFlags.length > 0 ? "destructive" : "default"}>
                {riskFlags.length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Script Details */}
      <Card>
        <CardHeader>
          <CardTitle>Script Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-foreground mb-1">Logline</h4>
                <p className="text-foreground leading-relaxed">
                  {script.logline || "No logline available"}
                </p>
              </div>

              {script.synopsisShort && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Synopsis</h4>
                  <p className="text-foreground leading-relaxed">
                    {script.synopsisShort}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-foreground mb-1">Genre</h4>
                <Badge variant="outline">{script.genreOverride || "Unspecified"}</Badge>
              </div>

              {script.comps?.titles?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Comparables</h4>
                  <div className="flex flex-wrap gap-2">
                    {script.comps.titles.map((comp: string, index: number) => (
                      <Badge key={index} variant="outline">{comp}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-foreground mb-1">Format</h4>
                <p className="text-foreground">{script.pageCount} pages</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Concerns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <TrendingUp className="w-5 h-5" />
              Key Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strengths.length > 0 ? (
              <div className="space-y-4">
                {strengths.map((score: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        {score.category.replace('_', ' ')}
                      </span>
                      <Badge className="bg-success/10 text-success border-success/20">
                        {score.value}/10
                      </Badge>
                    </div>
                    {score.rationale && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {score.rationale}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">No significant strengths identified above 7.0</p>
            )}
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <TrendingDown className="w-5 h-5" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {concerns.length > 0 ? (
              <div className="space-y-4">
                {concerns.map((score: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        {score.category.replace('_', ' ')}
                      </span>
                      <Badge variant="destructive">
                        {score.value}/10
                      </Badge>
                    </div>
                    {score.rationale && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {score.rationale}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">No significant concerns identified below 6.0</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* High Priority Notes */}
      {highPriorityNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              High Priority Issues
            </CardTitle>
            <CardDescription>
              Critical issues that should be addressed before production
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {highPriorityNotes.map((note: any, index: number) => (
                <div key={index} className="border-l-4 border-destructive/20 pl-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="font-medium text-foreground">
                      {note.area.replace('_', ' ')} Issue
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      {note.severity}
                    </Badge>
                  </div>
                  {note.excerpt && (
                    <p className="text-sm text-foreground bg-muted p-2 rounded italic">
                      "{note.excerpt}"
                    </p>
                  )}
                  {note.suggestion && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <strong>Suggestion:</strong> {note.suggestion}
                    </p>
                  )}
                  {note.page && (
                    <p className="text-xs text-muted-foreground">Page {note.page}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coverage Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Coverage Report</CardTitle>
          <CardDescription>
            Generate professional coverage materials for stakeholders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Download Coverage PDF
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              View Full Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
