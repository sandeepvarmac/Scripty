'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Upload,
  GitBranch,
  BarChart3,
  Users,
  MessageSquare,
  Film,
  Calendar,
  FileText,
  Star,
  AlertTriangle,
  Minus
} from 'lucide-react'
import { format } from 'date-fns'
import type { Analysis, Script } from '@prisma/client'

type ScriptWithAnalyses = Script & {
  analyses: Analysis[]
  project?: {
    id: string
    name: string
  } | null
}

interface VersionComparisonProps {
  currentScript: ScriptWithAnalyses
  allVersions: ScriptWithAnalyses[]
  onUploadNewVersion: () => void
  onCompareVersions: (versionIds: string[]) => void
}

interface VersionMetrics {
  score: number
  issuesCount: number
  recommendationsCount: number
  strengthsCount: number
  genre: string
  lastAnalyzed: Date | null
}

function getVersionMetrics(script: ScriptWithAnalyses): VersionMetrics {
  const latestAnalysis = script.analyses
    .filter(a => a.status === 'COMPLETED')
    .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())[0]

  if (!latestAnalysis) {
    return {
      score: 0,
      issuesCount: 0,
      recommendationsCount: 0,
      strengthsCount: 0,
      genre: 'Unknown',
      lastAnalyzed: null
    }
  }

  const results = latestAnalysis.results as any || {}
  const insights = results.insights || []
  const recommendations = results.recommendations || []
  const strengths = results.strengths || []

  return {
    score: latestAnalysis.score || 0,
    issuesCount: insights.length,
    recommendationsCount: recommendations.length,
    strengthsCount: strengths.length,
    genre: results.genre || latestAnalysis.genre || 'Unknown',
    lastAnalyzed: latestAnalysis.completedAt
  }
}

function getScoreTrend(current: number, previous: number): 'up' | 'down' | 'same' {
  if (current > previous) return 'up'
  if (current < previous) return 'down'
  return 'same'
}

function getScoreColor(score: number): string {
  if (score >= 8) return 'text-success-600'
  if (score >= 6) return 'text-warning-600'
  return 'text-danger-600'
}

function getScoreBgColor(score: number): string {
  if (score >= 8) return 'bg-success-50 border-success-200'
  if (score >= 6) return 'bg-warning-50 border-warning-200'
  return 'bg-danger-50 border-danger-200'
}

export function VersionComparison({
  currentScript,
  allVersions,
  onUploadNewVersion,
  onCompareVersions
}: VersionComparisonProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])

  // Sort versions by version number (descending)
  const sortedVersions = allVersions.sort((a, b) => {
    if (a.versionMajor !== b.versionMajor) {
      return b.versionMajor - a.versionMajor
    }
    return b.versionMinor - a.versionMinor
  })

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId)
      }
      if (prev.length < 3) { // Allow comparing up to 3 versions
        return [...prev, versionId]
      }
      return prev
    })
  }

  if (sortedVersions.length <= 1) {
    return (
      <Card className="border-brand-200 bg-gradient-to-br from-brand-50 to-brand-100">
        <CardHeader>
          <CardTitle className="flex items-center text-brand-900">
            <GitBranch className="h-5 w-5 mr-3" />
            Version Management
          </CardTitle>
          <CardDescription className="text-brand-700">
            Track script improvements across iterations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Upload className="h-12 w-12 text-brand-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-brand-900 mb-2">Upload Additional Versions</h3>
            <p className="text-brand-700 mb-4">
              Upload revised versions of your script to track improvements over time and see what recommendations worked.
            </p>
            <Button
              onClick={onUploadNewVersion}
              className="bg-brand-600 hover:bg-brand-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload New Version
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <GitBranch className="h-5 w-5 mr-3" />
              Script Versions
            </CardTitle>
            <CardDescription>
              Track improvements and compare analysis results across versions
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {selectedVersions.length > 0 && (
              <Button
                onClick={() => onCompareVersions(selectedVersions)}
                variant="outline"
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Compare Selected ({selectedVersions.length})
              </Button>
            )}
            <Button
              onClick={onUploadNewVersion}
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload New Version
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Version Timeline */}
        <div className="space-y-4">
          {sortedVersions.map((version, index) => {
            const metrics = getVersionMetrics(version)
            const previousVersion = sortedVersions[index + 1]
            const previousMetrics = previousVersion ? getVersionMetrics(previousVersion) : null
            const scoreTrend = previousMetrics ? getScoreTrend(metrics.score, previousMetrics.score) : 'same'
            const isSelected = selectedVersions.includes(version.id)
            const isCurrent = version.id === currentScript.id

            return (
              <div key={version.id} className="relative">
                {/* Connection Line */}
                {index < sortedVersions.length - 1 && (
                  <div className="absolute left-8 top-16 w-0.5 h-8 bg-gray-200" />
                )}

                <div
                  className={`border rounded-lg p-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-brand-400 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${
                    isCurrent ? 'ring-2 ring-success-200 bg-success-50' : ''
                  }`}
                  onClick={() => handleVersionSelect(version.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Version Icon */}
                      <div className={`p-2 rounded-full ${
                        isCurrent
                          ? 'bg-success-500 text-white'
                          : metrics.lastAnalyzed
                            ? 'bg-brand-500 text-white'
                            : 'bg-gray-400 text-white'
                      }`}>
                        {isCurrent ? (
                          <Star className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>

                      {/* Version Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            v{version.versionMajor}.{version.versionMinor}
                            {version.versionLabel && ` - ${version.versionLabel}`}
                          </h4>
                          {isCurrent && (
                            <Badge className="bg-success-600 text-white">Current</Badge>
                          )}
                          {isSelected && (
                            <Badge variant="outline" className="border-brand-400 text-brand-600">
                              Selected
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(new Date(version.uploadedAt), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            {version.pageCount} pages
                          </span>
                          <span className="flex items-center">
                            <Film className="h-4 w-4 mr-1" />
                            {version.totalScenes} scenes
                          </span>
                        </div>

                        {/* Analysis Metrics */}
                        {metrics.lastAnalyzed ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Score */}
                            <div className={`p-3 rounded-lg border ${getScoreBgColor(metrics.score)}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-600">Score</span>
                                {scoreTrend !== 'same' && (
                                  <div className="flex items-center">
                                    {scoreTrend === 'up' ? (
                                      <TrendingUp className="h-3 w-3 text-success-600" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3 text-danger-600" />
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className={`text-lg font-bold ${getScoreColor(metrics.score)}`}>
                                {metrics.score.toFixed(1)}/10
                              </div>
                            </div>

                            {/* Issues */}
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <div className="text-xs font-medium text-gray-600 mb-1">Issues</div>
                              <div className="text-lg font-bold text-amber-700">
                                {metrics.issuesCount}
                              </div>
                            </div>

                            {/* Genre */}
                            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                              <div className="text-xs font-medium text-gray-600 mb-1">Genre</div>
                              <div className="text-sm font-semibold text-purple-700 truncate">
                                {metrics.genre}
                              </div>
                            </div>

                            {/* Last Analyzed */}
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="text-xs font-medium text-gray-600 mb-1">Analyzed</div>
                              <div className="text-xs text-gray-700">
                                {format(metrics.lastAnalyzed, 'MMM d')}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">No analysis available</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center space-x-2">
                      {metrics.lastAnalyzed && previousMetrics && (
                        <div className="text-right">
                          <div className="text-xs text-gray-500">vs previous</div>
                          <div className="flex items-center space-x-1">
                            {scoreTrend === 'up' && (
                              <>
                                <TrendingUp className="h-3 w-3 text-success-600" />
                                <span className="text-xs text-success-600 font-medium">
                                  +{(metrics.score - previousMetrics.score).toFixed(1)}
                                </span>
                              </>
                            )}
                            {scoreTrend === 'down' && (
                              <>
                                <TrendingDown className="h-3 w-3 text-danger-600" />
                                <span className="text-xs text-danger-600 font-medium">
                                  {(metrics.score - previousMetrics.score).toFixed(1)}
                                </span>
                              </>
                            )}
                            {scoreTrend === 'same' && (
                              <>
                                <Minus className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-400">0.0</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Selection Instructions */}
        {selectedVersions.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">
              Click on versions to select them for comparison (up to 3 versions)
            </p>
          </div>
        )}

        {/* Comparison Summary */}
        {selectedVersions.length > 1 && (
          <div className="p-4 bg-brand-50 border border-brand-200 rounded-lg">
            <h4 className="font-semibold text-brand-900 mb-2">
              Ready to Compare {selectedVersions.length} Versions
            </h4>
            <p className="text-sm text-brand-700 mb-3">
              Compare analysis results, track improvements, and see which recommendations were most effective.
            </p>
            <div className="flex space-x-2">
              <Button
                onClick={() => onCompareVersions(selectedVersions)}
                size="sm"
                className="bg-brand-600 hover:bg-brand-700"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Compare Selected Versions
              </Button>
              <Button
                onClick={() => setSelectedVersions([])}
                variant="outline"
                size="sm"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}