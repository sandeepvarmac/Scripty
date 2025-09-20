'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { FileText, Clock, CheckCircle, XCircle, Play, Trash2, Eye, Plus } from 'lucide-react'
import Link from 'next/link'

interface Script {
  id: string
  title: string | null
  originalFilename: string
  format: string
  pageCount: number
  uploadedAt: string
  analyses: Array<{
    id: string
    status: string
    startedAt: string
  }>
  _count: {
    scenes: number
    characters: number
    analyses: number
  }
}

export function ScriptsDashboard() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const response = await fetch('/api/scripts')
        const result = await response.json()

        if (response.ok) {
          setScripts(result.data.scripts)
        } else {
          console.error('Failed to fetch scripts:', result.error)
        }
      } catch (error) {
        console.error('Error fetching scripts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchScripts()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusText = (script: typeof scripts[0]) => {
    if (script._count.analyses === 0) {
      return { text: 'No Analysis', color: 'text-muted-foreground' }
    }

    const latestAnalysis = script.analyses[0]
    if (!latestAnalysis) {
      return { text: 'No Analysis', color: 'text-muted-foreground' }
    }

    switch (latestAnalysis.status) {
      case 'COMPLETED':
        return { text: 'Analysis Complete', color: 'text-green-600' }
      case 'FAILED':
        return { text: 'Analysis Failed', color: 'text-red-600' }
      case 'IN_PROGRESS':
        return { text: 'Analyzing...', color: 'text-blue-600' }
      default:
        return { text: 'Unknown Status', color: 'text-muted-foreground' }
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Scripts</CardTitle>
          <CardDescription>Loading your scripts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Clock className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading scripts...</p>
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
            <CardTitle>Your Scripts</CardTitle>
            <CardDescription>
              Manage and analyze your uploaded screenplays
            </CardDescription>
          </div>
          <Link href="/upload">
            <Button variant="brand">
              <Plus className="h-4 w-4 mr-2" />
              Upload Script
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {scripts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">No scripts uploaded yet</h3>
            <p className="mb-6">Upload your first screenplay to get started with AI-powered analysis</p>
            <Link href="/upload">
              <Button variant="brand">
                <Plus className="h-4 w-4 mr-2" />
                Upload Your First Script
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {scripts.map((script) => {
              const status = getStatusText(script)
              return (
                <div
                  key={script.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-brand" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{script.title || script.originalFilename}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{script.format}</span>
                        <span>•</span>
                        <span>{script.pageCount} pages</span>
                        <span>•</span>
                        <span>{script._count.scenes} scenes</span>
                        <span>•</span>
                        <span>Uploaded {format(script.uploadedAt, 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        {script.analyses[0] && getStatusIcon(script.analyses[0].status)}
                        <span className={`text-sm ${status.color}`}>{status.text}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {script._count.analyses} {script._count.analyses === 1 ? 'analysis' : 'analyses'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link href={`/analysis/${script.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      {script._count.analyses === 0 && (
                        <Link href={`/analysis/${script.id}`}>
                          <Button variant="brand" size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Analyze
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}