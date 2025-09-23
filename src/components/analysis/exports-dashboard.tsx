"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  Film,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Archive
} from "lucide-react"
import { ExportClient, ExportJob } from "@/lib/exports/client"

interface ExportsDashboardProps {
  script: any
  dashboardData: any
}

export function ExportsDashboard({ script, dashboardData }: ExportsDashboardProps) {
  const [selectedExports, setSelectedExports] = React.useState<string[]>([])
  const [emailAddress, setEmailAddress] = React.useState("")
  const [exportJobs, setExportJobs] = React.useState<ExportJob[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const exportClient = new ExportClient()

  // Load export history on component mount
  React.useEffect(() => {
    loadExportHistory()
  }, [script.id])

  const loadExportHistory = async () => {
    const result = await exportClient.getExportHistory(script.id)
    if (result.success && result.exports) {
      setExportJobs(result.exports)
    } else if (result.error) {
      setError(result.error)
    }
  }

  const exportTypes = [
    {
      id: 'coverage_pdf',
      name: 'Coverage Report',
      description: 'Professional coverage report with recommendation',
      icon: FileText,
      format: 'PDF',
      size: '~2-4 MB',
      color: 'text-blue-600'
    },
    {
      id: 'notes_pdf',
      name: 'Notes Report',
      description: 'Detailed analysis notes and feedback',
      icon: FileText,
      format: 'PDF',
      size: '~1-3 MB',
      color: 'text-green-600'
    },
    {
      id: 'notes_csv',
      name: 'Notes Spreadsheet',
      description: 'Structured notes data for analysis',
      icon: FileSpreadsheet,
      format: 'CSV',
      size: '~50-200 KB',
      color: 'text-emerald-600'
    },
    {
      id: 'analysis_json',
      name: 'Analysis Data',
      description: 'Complete structured analysis results',
      icon: FileCode,
      format: 'JSON',
      size: '~100-500 KB',
      color: 'text-purple-600'
    },
    {
      id: 'fdx_changelist',
      name: 'FDX Change List',
      description: 'Final Draft XML with tracked changes',
      icon: Film,
      format: 'FDX',
      size: '~500KB-2MB',
      color: 'text-orange-600'
    }
  ]

  const handleExportSelection = (exportId: string, checked: boolean) => {
    if (checked) {
      setSelectedExports(prev => [...prev, exportId])
    } else {
      setSelectedExports(prev => prev.filter(id => id !== exportId))
    }
  }

  const handleBulkExport = async () => {
    if (selectedExports.length === 0) return

    setLoading(true)
    setError(null)

    try {
      // Map selected exports to format/type combinations
      const exportRequests = selectedExports.map(exportId => {
        const exportType = exportTypes.find(et => et.id === exportId)
        if (!exportType) throw new Error(`Unknown export type: ${exportId}`)

        // Parse the export ID to get format and type
        const [type, format] = exportId.split('_')
        return { format, type }
      })

      const result = await exportClient.bulkExport(script.id, exportRequests as any, {
        includeMetadata: true,
        emailTo: emailAddress || undefined
      })

      if (result.success) {
        // Refresh export history
        await loadExportHistory()
        setSelectedExports([])
        setEmailAddress("")
      }

      if (result.errors && result.errors.length > 0) {
        setError(`Some exports failed: ${result.errors.join(', ')}`)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exports')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-success-600" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-danger-600" />
      case 'processing': return <Clock className="w-4 h-4 text-warning-600 animate-spin" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed': return 'default'
      case 'failed': return 'destructive'
      case 'processing': return 'secondary'
      default: return 'outline'
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    return exportClient.formatFileSize(bytes)
  }

  const formatTimeAgo = (dateStr: string) => {
    return exportClient.formatTimeAgo(dateStr)
  }

  return (
    <div className="space-y-6">
      {/* Export Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Download className="w-8 h-8 text-brand-600" />
            <div>
              <p className="text-sm text-gray-600">Total Exports</p>
              <p className="text-2xl font-bold text-gray-900">{exportJobs.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-success-600" />
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {exportJobs.filter(j => j.status === 'completed').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-warning-600" />
            <div>
              <p className="text-sm text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-gray-900">
                {exportJobs.filter(j => j.status === 'processing').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Archive className="w-8 h-8 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Total Size</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatFileSize(exportJobs.reduce((sum, job) => sum + (job.size || 0), 0))}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Export Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Exports</CardTitle>
          <CardDescription>
            Create professional deliverables from your script analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Export Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exportTypes.map((exportType) => {
                const Icon = exportType.icon
                const isSelected = selectedExports.includes(exportType.id)

                return (
                  <div
                    key={exportType.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-brand-300 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleExportSelection(exportType.id, !isSelected)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleExportSelection(exportType.id, checked as boolean)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Icon className={`w-6 h-6 ${exportType.color} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{exportType.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {exportType.format}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{exportType.description}</p>
                        <p className="text-xs text-gray-500">Est. size: {exportType.size}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Export Options */}
            {selectedExports.length > 0 && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Export Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Email when complete (optional)
                    </label>
                    <div className="flex gap-2">
                      <Mail className="w-4 h-4 text-gray-400 mt-2.5" />
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Bundle format
                    </label>
                    <Select defaultValue="individual">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual files</SelectItem>
                        <SelectItem value="zip">ZIP archive</SelectItem>
                        <SelectItem value="folder">Organized folder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Export Error</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                {selectedExports.length > 0 && (
                  <span>{selectedExports.length} export{selectedExports.length !== 1 ? 's' : ''} selected</span>
                )}
              </div>
              <Button
                onClick={handleBulkExport}
                disabled={selectedExports.length === 0 || loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {loading ? 'Generating...' : 'Generate Exports'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
          <CardDescription>Recent export jobs and downloads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exportJobs.length > 0 ? (
              exportJobs.map((job) => {
                const exportType = exportTypes.find(et => et.id === job.type)
                const Icon = exportType?.icon || FileText

                return (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Icon className={`w-6 h-6 ${exportType?.color || 'text-gray-600'}`} />
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {exportType?.name || job.type}
                          </h4>
                          <Badge variant={getStatusColor(job.status) as any}>
                            {getStatusIcon(job.status)}
                            <span className="ml-1 capitalize">{job.status}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Created {formatTimeAgo(job.createdAt)}</span>
                          {job.fileSize && (
                            <span>{formatFileSize(job.fileSize)}</span>
                          )}
                          {job.completedAt && (
                            <span>Completed {formatTimeAgo(job.completedAt)}</span>
                          )}
                        </div>
                        {job.errorMessage && (
                          <p className="text-sm text-danger-600 mt-1">{job.errorMessage}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {job.status === 'processing' && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Progress value={65} className="w-20 h-2" />
                          <span>65%</span>
                        </div>
                      )}

                      {job.status === 'completed' && job.downloadUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={job.downloadUrl} download>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      )}

                      {job.status === 'failed' && (
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Archive className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p>No exports generated yet</p>
                <p className="text-sm">Create your first export using the options above</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Templates & Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Export Templates & Settings</CardTitle>
          <CardDescription>Customize export formats and templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Coverage Report Settings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Template</span>
                    <span className="font-medium">Industry Standard</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Include Reader Bio</span>
                    <span className="font-medium">Yes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Logo/Letterhead</span>
                    <span className="font-medium">ScriptyBoy Default</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Watermark</span>
                    <span className="font-medium">Confidential</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Data Export Settings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">CSV Delimiter</span>
                    <span className="font-medium">Comma</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">JSON Format</span>
                    <span className="font-medium">Pretty Print</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Include Metadata</span>
                    <span className="font-medium">Yes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Compression</span>
                    <span className="font-medium">Auto</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Customize Templates
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}