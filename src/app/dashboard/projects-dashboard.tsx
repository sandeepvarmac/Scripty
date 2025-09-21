'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import {
  FileText, Clock, CheckCircle, XCircle, Plus, Upload, ChevronDown, ChevronRight,
  Folder, FolderOpen, Eye, Trash2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Project {
  id: string
  name: string
  type: string
  genre?: string
  description?: string
  targetBudget: string
  targetAudience: string
  developmentStage: string
  createdAt: string
  scripts: Array<{
    id: string
    title: string | null
    versionMajor: number
    versionMinor: number
  }>
  _count: {
    scripts: number
  }
}

interface Script {
  id: string
  title: string | null
  originalFilename: string
  format: string
  pageCount: number
  uploadedAt: string
  versionMajor: number
  versionMinor: number
  isLatestVersion: boolean
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

export function ProjectsDashboard() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [scripts, setScripts] = useState<Script[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [deletingScript, setDeletingScript] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsResponse, scriptsResponse] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/scripts')
        ])

        const [projectsResult, scriptsResult] = await Promise.all([
          projectsResponse.json(),
          scriptsResponse.json()
        ])

        if (projectsResponse.ok) {
          setProjects(projectsResult.projects)
          // Auto-expand projects that have scripts
          const projectsWithScripts = projectsResult.projects.filter((p: Project) => p._count.scripts > 0)
          setExpandedProjects(new Set(projectsWithScripts.map((p: Project) => p.id)))
        } else {
          console.error('Failed to fetch projects:', projectsResult.error)
        }

        if (scriptsResponse.ok) {
          setScripts(scriptsResult.data.scripts)
        } else {
          console.error('Failed to fetch scripts:', scriptsResult.error)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  const handleCreateProject = () => {
    router.push('/upload')
  }

  const handleUploadScript = () => {
    router.push('/upload')
  }

  const handleDeleteScript = async (scriptId: string, scriptTitle: string) => {
    const confirmMessage = `⚠️ Delete Script: "${scriptTitle}"\n\n` +
      `This will permanently delete:\n` +
      `• The screenplay file\n` +
      `• All AI analyses and coverage reports\n` +
      `• All scene and character data\n` +
      `• All associated evidence and insights\n\n` +
      `This action cannot be undone.\n\n` +
      `Are you sure you want to proceed?`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setDeletingScript(scriptId)

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

      alert(`✅ Script "${scriptTitle}" has been successfully deleted.`)

    } catch (error) {
      console.error('Delete script error:', error)
      alert(`❌ Failed to delete script: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDeletingScript(null)
    }
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

  const getStatusText = (script: Script) => {
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

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'SHORT_FILM':
        return 'Short Film'
      case 'FEATURE_INDEPENDENT':
        return 'Feature (Independent)'
      case 'FEATURE_MAINSTREAM':
        return 'Feature (Mainstream)'
      case 'WEB_SERIES':
        return 'Web Series'
      case 'TV_SERIES':
        return 'TV Series'
      case 'OTHER':
        return 'Other'
      default:
        return type
    }
  }

  const getProjectScripts = (projectId: string) => {
    return scripts.filter(script => script.project?.id === projectId)
  }

  const getUnassignedScripts = () => {
    return scripts.filter(script => !script.project)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Projects</CardTitle>
          <CardDescription>Loading your projects and scripts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Clock className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const unassignedScripts = getUnassignedScripts()

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Projects</CardTitle>
              <CardDescription>
                Organize and manage your screenplays by project
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={handleCreateProject} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
              <Button onClick={handleUploadScript} variant="brand">
                <Upload className="h-4 w-4 mr-2" />
                Upload Script
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Projects */}
      {projects.length === 0 && unassignedScripts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Primary Upload Area */}
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group" onClick={handleUploadScript}>
                <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-6 group-hover:text-brand transition-colors" />
                <h3 className="text-xl font-semibold mb-3">Start your first project</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Upload your screenplay to create a project. Supports .fdx, .fountain, and .pdf files up to 10MB
                </p>
                <Button variant="brand" size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Upload Script
                </Button>
              </div>

              {/* Quick Tips for Empty State */}
              <div className="grid md:grid-cols-3 gap-4 pt-6 border-t">
                <div className="text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-sm font-semibold text-brand">1</span>
                  </div>
                  <h4 className="font-medium mb-2">Create a project</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload your first script to automatically create a project
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
                  <h4 className="font-medium mb-2">Manage versions</h4>
                  <p className="text-sm text-muted-foreground">
                    Track script iterations within your project
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Project Cards */}
          {projects.map((project) => {
            const projectScripts = getProjectScripts(project.id)
            const isExpanded = expandedProjects.has(project.id)

            return (
              <Card key={project.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <button
                      className="flex items-center space-x-3 text-left flex-1 hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                      onClick={() => toggleProject(project.id)}
                    >
                      <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                        {isExpanded ? (
                          <FolderOpen className="h-5 w-5 text-brand" />
                        ) : (
                          <Folder className="h-5 w-5 text-brand" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{project.name}</h3>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {getProjectTypeLabel(project.type)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                          <span>{projectScripts.length} {projectScripts.length === 1 ? 'script' : 'scripts'}</span>
                          {project.genre && (
                            <>
                              <span>•</span>
                              <span>{project.genre}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>Created {format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUploadScript}
                      className="ml-3"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Script
                    </Button>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    {projectScripts.length === 0 ? (
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/30">
                        <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground mb-4">No scripts in this project yet</p>
                        <Button variant="outline" onClick={handleUploadScript}>
                          <Plus className="h-4 w-4 mr-2" />
                          Upload First Script
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {projectScripts.map((script) => {
                          const status = getStatusText(script)
                          return (
                            <div
                              key={script.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-8 h-8 rounded bg-brand/10 flex items-center justify-center">
                                  <FileText className="h-4 w-4 text-brand" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium">{script.title || script.originalFilename}</h4>
                                    <span className="text-xs bg-muted px-2 py-1 rounded">
                                      v{script.versionMajor}.{script.versionMinor}
                                    </span>
                                    {script.isLatestVersion && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                        Latest
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <span>{script.format}</span>
                                    <span>•</span>
                                    <span>{script.pageCount} pages</span>
                                    <span>•</span>
                                    <span>{script._count.scenes} scenes</span>
                                    <span>•</span>
                                    <span>Uploaded {format(new Date(script.uploadedAt), 'MMM d, yyyy')}</span>
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
                                    onClick={() => handleDeleteScript(script.id, script.title || script.originalFilename)}
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
                )}
              </Card>
            )
          })}

          {/* Unassigned Scripts */}
          {unassignedScripts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span>Unassigned Scripts</span>
                  <span className="text-sm bg-muted px-2 py-1 rounded">
                    {unassignedScripts.length}
                  </span>
                </CardTitle>
                <CardDescription>
                  Scripts that haven't been assigned to a project yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {unassignedScripts.map((script) => {
                    const status = getStatusText(script)
                    return (
                      <div
                        key={script.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-medium">{script.title || script.originalFilename}</h4>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <span>{script.format}</span>
                              <span>•</span>
                              <span>{script.pageCount} pages</span>
                              <span>•</span>
                              <span>Uploaded {format(new Date(script.uploadedAt), 'MMM d, yyyy')}</span>
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
                              onClick={() => handleDeleteScript(script.id, script.title || script.originalFilename)}
                              disabled={deletingScript === script.id}
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
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}