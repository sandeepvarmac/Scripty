'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { FileText, Clock, CheckCircle, XCircle, Play, Trash2, Eye, Plus, Upload } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface Script {
  id: string
  title: string | null
  originalFilename: string
  format: string
  pageCount: number
  uploadedAt: string
  project?: {
    id: string
    name: string
    type: string
  }
  analyses: Array<{
    id: string
    status: string
    startedAt: string
    score?: number
  }>
  _count: {
    scenes: number
    characters: number
    analyses: number
  }
}

export function ScriptsDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [scripts, setScripts] = useState<Script[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingScript, setDeletingScript] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{open: boolean, script?: Script}>({
    open: false,
    script: undefined
  })

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

  const handleDeleteScript = (script: Script) => {
    setDeleteConfirm({ open: true, script })
  }

  const confirmDeleteScript = async () => {
    if (!deleteConfirm.script) return

    const { id: scriptId, title, originalFilename } = deleteConfirm.script
    const scriptTitle = title || originalFilename

    setDeletingScript(scriptId)
    setDeleteConfirm({ open: false, script: undefined })

    try {
      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete script')
      }

      // Remove script from local state
      setScripts(scripts.filter(s => s.id !== scriptId))

      toast({
        variant: "default",
        title: "Script Deleted",
        description: `"${scriptTitle}" has been successfully deleted.`
      })

    } catch (error) {
      console.error('Delete script error:', error)
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: `Failed to delete script: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setDeletingScript(null)
    }
  }

  const handleUploadClick = () => {
    router.push('/upload')
  }

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
          {scripts.length > 0 && (
            <Button onClick={handleUploadClick} variant="brand">
              <Plus className="h-4 w-4 mr-2" />
              Upload Script
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {scripts.length === 0 ? (
          <div className="space-y-6">
            {/* Primary Upload Area */}
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group" onClick={handleUploadClick}>
              <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-6 group-hover:text-brand transition-colors" />
              <h3 className="text-xl font-semibold mb-3">Upload your first screenplay</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Drop your script here or click to browse. Supports .fdx, .fountain, and .pdf files up to 10MB
              </p>
              <Button variant="brand" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Choose File
              </Button>
            </div>

            {/* Quick Tips for Empty State */}
            <div className="grid md:grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center p-4">
                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-sm font-semibold text-brand">1</span>
                </div>
                <h4 className="font-medium mb-2">Upload your script</h4>
                <p className="text-sm text-muted-foreground">
                  Final Draft (.fdx) files provide the best results
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-sm font-semibold text-brand">2</span>
                </div>
                <h4 className="font-medium mb-2">AI analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Get comprehensive coverage and feedback
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-sm font-semibold text-brand">3</span>
                </div>
                <h4 className="font-medium mb-2">Improve your script</h4>
                <p className="text-sm text-muted-foreground">
                  Review insights and enhance your story
                </p>
              </div>
            </div>
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
                        {script.project && (
                          <>
                            <span className="text-brand font-medium">{script.project.name}</span>
                            <span>•</span>
                          </>
                        )}
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
                      {script.analyses[0]?.score && (
                        <div className="flex items-center justify-end space-x-1 mb-1">
                          <span className="text-lg font-bold text-brand">{script.analyses[0].score.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">/10</span>
                        </div>
                      )}
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteScript(script)}
                        disabled={deletingScript === script.id}
                        className={deletingScript === script.id ? "text-gray-400 cursor-not-allowed" : ""}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deletingScript === script.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, script: undefined })}
        title="Delete Script"
        description={`Are you sure you want to delete "${deleteConfirm.script?.title || deleteConfirm.script?.originalFilename}"? This will permanently delete the screenplay file, all AI analyses and coverage reports, all scene and character data, and all associated evidence and insights. This action cannot be undone.`}
        confirmText="Delete Script"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteScript}
      />
    </Card>
  )
}