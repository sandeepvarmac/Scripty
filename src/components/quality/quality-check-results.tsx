// Quality Check Results Component
// Shows quality assessment results and user options

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  FileText,
  Upload,
  Eye,
  Clock,
  Zap,
  BookOpen
} from 'lucide-react'
import { QualityAssessment } from '@/lib/quality/screenplay-quality'
import SampleScreenplay from './sample-screenplay'

interface QualityCheckResultsProps {
  qualityAssessment: QualityAssessment
  onNewUpload: () => void
  onProceedAnyway?: () => void
  showProceedOption?: boolean
}

export default function QualityCheckResults({
  qualityAssessment,
  onNewUpload,
  onProceedAnyway,
  showProceedOption = false
}: QualityCheckResultsProps) {
  const [showSample, setShowSample] = useState(false)
  const [showConversionPreview, setShowConversionPreview] = useState(false)

  const scorePercentage = Math.round(qualityAssessment.overallScore * 100)
  const thresholdPercentage = Math.round(qualityAssessment.threshold * 100)
  const passes = qualityAssessment.passesThreshold

  // Get severity color
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 0.8) return 'bg-success/10 border-success/20'
    if (score >= 0.6) return 'bg-warning/10 border-warning/20'
    return 'bg-destructive/10 border-destructive/20'
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'major':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-blue-500" />
    }
  }

  if (showSample) {
    return <SampleScreenplay onClose={() => setShowSample(false)} />
  }

  return (
    <div className="space-y-6">
      {/* Quality Score Header */}
      <Card className={getScoreBgColor(qualityAssessment.overallScore)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`text-2xl ${getScoreColor(qualityAssessment.overallScore)}`}>
                {passes ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6" />
                    Quality Check Passed
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-6 w-6" />
                    Quality Check Failed
                  </div>
                )}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {passes
                  ? 'Your screenplay meets our standards for meaningful AI analysis'
                  : 'This file needs improvement for meaningful AI analysis'
                }
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(qualityAssessment.overallScore)}`}>
                {scorePercentage}%
              </div>
              <div className="text-sm text-muted-foreground">
                Threshold: {thresholdPercentage}%
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Quality Score</span>
              <span>{scorePercentage}% / {thresholdPercentage}%</span>
            </div>
            <Progress value={scorePercentage} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Issues and Strengths */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues */}
        {qualityAssessment.issues.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Issues Found ({qualityAssessment.issues.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {qualityAssessment.issues.map((issue, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-destructive/10">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{issue.issue}</span>
                        <Badge variant={issue.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {issue.impact}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Strengths */}
        {qualityAssessment.strengths.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Strengths ({qualityAssessment.strengths.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {qualityAssessment.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-success/10 rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">{strength}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      {qualityAssessment.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {qualityAssessment.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 p-2 border-l-4 border-blue-200 bg-blue-50">
                  <span className="text-sm">• {rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Options */}
      <Card>
        <CardHeader>
          <CardTitle>What would you like to do?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* View Sample Format */}
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 text-center"
              onClick={() => setShowSample(true)}
            >
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <div className="font-semibold">View Sample Format</div>
                <div className="text-xs text-muted-foreground">
                  Learn proper screenplay structure
                </div>
              </div>
            </Button>

            {/* AI Conversion (Coming Soon) */}
            <div className="relative">
              <Button
                variant="outline"
                disabled
                className="h-auto p-4 flex flex-col items-center gap-2 text-center w-full opacity-60"
              >
                <Sparkles className="h-8 w-8 text-primary" />
                <div>
                  <div className="font-semibold">AI Format Conversion</div>
                  <div className="text-xs text-muted-foreground">
                    Convert your content automatically
                  </div>
                </div>
              </Button>
              <Badge className="absolute -top-2 -right-2 text-xs bg-primary">
                Coming Soon
              </Badge>
            </div>

            {/* Upload Different File */}
            <Button
              variant="default"
              className="h-auto p-4 flex flex-col items-center gap-2 text-center"
              onClick={onNewUpload}
            >
              <Upload className="h-8 w-8" />
              <div>
                <div className="font-semibold">Upload Different File</div>
                <div className="text-xs text-muted-foreground">
                  Try a properly formatted screenplay
                </div>
              </div>
            </Button>
          </div>

          {/* AI Conversion Preview */}
          {showConversionPreview && (
            <div className="mt-6">
              <AIConversionPlaceholder />
            </div>
          )}

          {/* Proceed Anyway Option (if enabled) */}
          {showProceedOption && onProceedAnyway && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    You can proceed with analysis anyway, but results may be limited due to quality issues.
                  </span>
                  <Button variant="ghost" size="sm" onClick={onProceedAnyway}>
                    Proceed Anyway
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// AI Conversion Placeholder Component
function AIConversionPlaceholder() {
  return (
    <div className="border-2 border-dashed border-purple-200 rounded-lg p-6 bg-purple-50">
      <div className="text-center">
        <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-purple-900 mb-2">
          AI Format Conversion
        </h3>
        <p className="text-purple-700 mb-4 max-w-md mx-auto">
          Our AI will soon be able to convert your document into proper
          screenplay format with scene headings, character names, and
          dialogue structure.
        </p>

        <div className="bg-warning/10 border border-warning/20 rounded-md p-3 mb-4 max-w-lg mx-auto">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-left">
              <p className="text-sm text-yellow-800 font-semibold mb-1">
                Important Disclaimer:
              </p>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• AI conversion based solely on your uploaded content</li>
                <li>• Results will require manual review and editing</li>
                <li>• May not perfectly capture intended formatting</li>
                <li>• Best results come from properly formatted screenplays</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button disabled variant="outline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Feature in Development
          </Button>
          <Button variant="ghost" size="sm">
            Notify When Available
          </Button>
        </div>
      </div>
    </div>
  )
}