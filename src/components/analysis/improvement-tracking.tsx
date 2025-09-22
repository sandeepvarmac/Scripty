'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  ArrowRight,
  Target,
  TrendingUp,
  FileText,
  Lightbulb,
  RefreshCw,
  Upload
} from 'lucide-react'
import { format } from 'date-fns'
import type { Analysis, Script } from '@prisma/client'

type ScriptWithAnalyses = Script & {
  analyses: Analysis[]
}

interface Recommendation {
  id: string
  text: string
  category: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'NOT_ADDRESSED' | 'IN_PROGRESS' | 'ADDRESSED' | 'DISMISSED'
  version: string
  dateAdded: Date
  dateUpdated?: Date
  notes?: string
}

interface ImprovementTrackingProps {
  currentScript: ScriptWithAnalyses
  allVersions: ScriptWithAnalyses[]
  onMarkRecommendation: (recommendationId: string, status: Recommendation['status'], notes?: string) => void
  onUploadNewVersion: () => void
}

function extractRecommendationsFromAnalyses(scripts: ScriptWithAnalyses[]): Recommendation[] {
  const recommendations: Recommendation[] = []

  scripts.forEach((script) => {
    script.analyses
      .filter(a => a.status === 'COMPLETED')
      .forEach((analysis) => {
        const results = analysis.results as any || {}
        const analysisRecommendations = results.recommendations || []
        const insights = results.insights || []

        // Add recommendations
        analysisRecommendations.forEach((rec: string, index: number) => {
          recommendations.push({
            id: `${analysis.id}-rec-${index}`,
            text: rec,
            category: 'General',
            severity: 'MEDIUM',
            status: 'NOT_ADDRESSED',
            version: `v${script.versionMajor}.${script.versionMinor}`,
            dateAdded: analysis.completedAt || analysis.startedAt,
            dateUpdated: undefined,
            notes: undefined
          })
        })

        // Add high-severity insights as recommendations
        insights
          .filter((insight: any) => insight.severity === 'HIGH')
          .forEach((insight: any, index: number) => {
            recommendations.push({
              id: `${analysis.id}-insight-${index}`,
              text: insight.message,
              category: insight.category || 'General',
              severity: insight.severity,
              status: 'NOT_ADDRESSED',
              version: `v${script.versionMajor}.${script.versionMinor}`,
              dateAdded: analysis.completedAt || analysis.startedAt,
              dateUpdated: undefined,
              notes: undefined
            })
          })
      })
  })

  return recommendations
}

function getSeverityColor(severity: Recommendation['severity']): string {
  switch (severity) {
    case 'HIGH': return 'text-red-600 bg-red-50 border-red-200'
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'LOW': return 'text-blue-600 bg-blue-50 border-blue-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

function getStatusColor(status: Recommendation['status']): string {
  switch (status) {
    case 'ADDRESSED': return 'text-green-600 bg-green-50 border-green-200'
    case 'IN_PROGRESS': return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'DISMISSED': return 'text-gray-600 bg-gray-50 border-gray-200'
    case 'NOT_ADDRESSED': return 'text-amber-600 bg-amber-50 border-amber-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

function getStatusIcon(status: Recommendation['status']) {
  switch (status) {
    case 'ADDRESSED': return <CheckCircle className="h-4 w-4" />
    case 'IN_PROGRESS': return <Clock className="h-4 w-4" />
    case 'DISMISSED': return <X className="h-4 w-4" />
    case 'NOT_ADDRESSED': return <AlertTriangle className="h-4 w-4" />
    default: return <Clock className="h-4 w-4" />
  }
}

export function ImprovementTracking({
  currentScript,
  allVersions,
  onMarkRecommendation,
  onUploadNewVersion
}: ImprovementTrackingProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'addressed'>('active')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const recommendations = extractRecommendationsFromAnalyses(allVersions)

  // Group by status for statistics
  const stats = {
    total: recommendations.length,
    addressed: recommendations.filter(r => r.status === 'ADDRESSED').length,
    inProgress: recommendations.filter(r => r.status === 'IN_PROGRESS').length,
    notAddressed: recommendations.filter(r => r.status === 'NOT_ADDRESSED').length,
    dismissed: recommendations.filter(r => r.status === 'DISMISSED').length
  }

  // Filter recommendations
  const filteredRecommendations = recommendations.filter(rec => {
    const statusFilter =
      filter === 'all' ||
      (filter === 'active' && ['NOT_ADDRESSED', 'IN_PROGRESS'].includes(rec.status)) ||
      (filter === 'addressed' && rec.status === 'ADDRESSED')

    const categoryFilter = selectedCategory === 'all' || rec.category === selectedCategory

    return statusFilter && categoryFilter
  })

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(recommendations.map(r => r.category)))]

  if (recommendations.length === 0) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <Target className="h-5 w-5 mr-3" />
            Improvement Tracking
          </CardTitle>
          <CardDescription className="text-blue-700">
            Track progress on AI recommendations and see what improvements worked
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">No Recommendations Yet</h3>
            <p className="text-blue-700 mb-4">
              Run an AI analysis to get personalized recommendations for improving your script.
            </p>
            <Button
              onClick={() => {/* This would trigger analysis */}}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Run AI Analysis
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
              <Target className="h-5 w-5 mr-3" />
              Improvement Tracking
            </CardTitle>
            <CardDescription>
              Track progress on recommendations and see what improvements worked
            </CardDescription>
          </div>
          <Button
            onClick={onUploadNewVersion}
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Revised Version
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-600">Total Recommendations</div>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.addressed}</div>
            <div className="text-sm text-green-600">Addressed</div>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-yellow-600">In Progress</div>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">{stats.notAddressed}</div>
            <div className="text-sm text-amber-600">Not Addressed</div>
          </div>
        </div>

        {/* Progress Bar */}
        {stats.total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round((stats.addressed / stats.total) * 100)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stats.addressed / stats.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            {[
              { key: 'active', label: 'Active', count: stats.inProgress + stats.notAddressed },
              { key: 'addressed', label: 'Addressed', count: stats.addressed },
              { key: 'all', label: 'All', count: stats.total }
            ].map(({ key, label, count }) => (
              <Button
                key={key}
                onClick={() => setFilter(key as any)}
                variant={filter === key ? 'default' : 'outline'}
                size="sm"
              >
                {label} ({count})
              </Button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="space-y-3">
          {filteredRecommendations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No recommendations match the current filters</p>
            </div>
          ) : (
            filteredRecommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className={`p-4 border rounded-lg ${getStatusColor(recommendation.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(recommendation.status)}
                      <Badge
                        variant="outline"
                        className={`text-xs ${getSeverityColor(recommendation.severity)}`}
                      >
                        {recommendation.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {recommendation.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {recommendation.version}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-900">{recommendation.text}</p>

                    <div className="flex items-center text-xs text-gray-500">
                      <span>Added {format(recommendation.dateAdded, 'MMM d, yyyy')}</span>
                      {recommendation.dateUpdated && (
                        <span className="ml-4">
                          Updated {format(recommendation.dateUpdated, 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>

                    {recommendation.notes && (
                      <div className="p-2 bg-white/50 border border-gray-200 rounded text-xs">
                        <strong>Notes:</strong> {recommendation.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {recommendation.status !== 'ADDRESSED' && (
                      <Button
                        onClick={() => onMarkRecommendation(recommendation.id, 'ADDRESSED')}
                        size="sm"
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Fixed
                      </Button>
                    )}
                    {recommendation.status === 'NOT_ADDRESSED' && (
                      <Button
                        onClick={() => onMarkRecommendation(recommendation.id, 'IN_PROGRESS')}
                        size="sm"
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        In Progress
                      </Button>
                    )}
                    {recommendation.status !== 'DISMISSED' && (
                      <Button
                        onClick={() => onMarkRecommendation(recommendation.id, 'DISMISSED')}
                        size="sm"
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Call to Action */}
        {stats.addressed > 0 && stats.inProgress + stats.notAddressed > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-semibold text-green-900">Great Progress!</h4>
                <p className="text-sm text-green-700">
                  You've addressed {stats.addressed} recommendations.
                  Upload a new version to see how these improvements affected your script's analysis.
                </p>
              </div>
              <Button
                onClick={onUploadNewVersion}
                size="sm"
                className="bg-green-600 hover:bg-green-700 shrink-0"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload New Version
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}