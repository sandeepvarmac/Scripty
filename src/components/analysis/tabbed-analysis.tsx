'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  BarChart3,
  Users,
  MessageSquare,
  Film,
  Layers,
  Eye,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload
} from 'lucide-react'
import { AIAnalysisPrompt } from './ai-analysis-prompt'
import { format } from 'date-fns'
import type { Analysis, Character, Evidence, Scene, Script } from '@prisma/client'
import {
  calculateFilmRuntime,
  analyzeScriptContent,
  getActionDialogueRatio,
  formatRuntime
} from '@/lib/utils/runtime-calculator'

// Helper function to get AI detected genres from analysis results
function getAIDetectedGenres(script: ScriptWithData): string[] {
  // Get the most recent completed analysis that has genre information
  const recentAnalysis = script.analyses
    .filter(a => a.status === 'COMPLETED' && a.genre && a.genre !== 'Unknown')
    .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())[0]

  if (recentAnalysis?.genre) {
    // Handle comma-separated genres or single genre
    return recentAnalysis.genre.split(',').map(g => g.trim()).filter(g => g)
  }

  // Fallback: if no AI analysis available, return empty array
  return []
}

// Helper function to get genre analysis description
function getGenreAnalysisDescription(script: ScriptWithData, genres: string[]): string {
  if (genres.length === 0) {
    return 'Run AI analysis to detect genre classification based on story elements and narrative structure'
  }

  // Get the most recent analysis summary if available
  const recentAnalysis = script.analyses
    .filter(a => a.status === 'COMPLETED' && a.summary)
    .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())[0]

  if (recentAnalysis?.summary) {
    return recentAnalysis.summary
  }

  // Generate a generic description based on detected genres
  if (genres.length === 1) {
    return `${genres[0]} elements detected through comprehensive narrative analysis`
  } else {
    return `${genres.slice(0, -1).join(', ')} and ${genres[genres.length - 1]} elements detected through narrative analysis`
  }
}

type SceneWithEvidence = Scene & { evidences: Evidence[] }
type ScriptWithData = Script & {
  scenes: SceneWithEvidence[]
  characters: Character[]
  analyses: Analysis[]
  project?: {
    id: string
    name: string
    type: string
    genre?: string | null
    targetAudience?: string | null
    targetBudget?: string
    developmentStage?: string
  }
}

interface TabbedAnalysisProps {
  script: ScriptWithData
}

export function TabbedAnalysis({ script }: TabbedAnalysisProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  const hasAnalysis = script.analyses.some(a => a.status === 'COMPLETED')

  const handleStartAnalysis = async (
    analysisType: 'quick' | 'comprehensive' | 'custom',
    options?: string[]
  ) => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          const newProgress = prev + Math.random() * 15
          return newProgress >= 95 ? 95 : newProgress
        })
      }, 1000)

      const response = await fetch(`/api/scripts/${script.id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisType,
          options: options || []
        })
      })

      clearInterval(progressInterval)

      if (response.ok) {
        setAnalysisProgress(100)
        // Refresh the page to show new analysis
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        const error = await response.json()
        console.error('Analysis failed:', error)
        setIsAnalyzing(false)
        setAnalysisProgress(0)
        alert('Analysis failed: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Analysis error:', error)
      setIsAnalyzing(false)
      setAnalysisProgress(0)
      alert('Analysis failed. Please try again.')
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'coverage', label: 'Coverage Report', icon: FileText },
    { id: 'scenes', label: 'Scene Analysis', icon: Film },
    { id: 'characters', label: 'Character Analysis', icon: Users },
    { id: 'dialogue', label: 'Dialogue Analysis', icon: MessageSquare },
    { id: 'structure', label: 'Structure Analysis', icon: Layers },
    { id: 'script', label: 'Script Viewer', icon: Eye },
  ]

  return (
    <div className="space-y-6">
      {/* Script Metadata Section */}
      <ScriptMetadata script={script} />

      {/* AI Analysis Prompt */}
      <AIAnalysisPrompt
        scriptId={script.id}
        hasAnalysis={hasAnalysis}
        onStartAnalysis={handleStartAnalysis}
        isAnalyzing={isAnalyzing}
        progress={analysisProgress}
      />

      {/* Tab Navigation */}
      <Card>
        <div className="border-b">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-brand text-brand bg-brand/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <CardContent className="p-6">
          {activeTab === 'overview' && <OverviewTab script={script} />}
          {activeTab === 'coverage' && <CoverageTab script={script} />}
          {activeTab === 'scenes' && <ScenesTab script={script} />}
          {activeTab === 'characters' && <CharactersTab script={script} />}
          {activeTab === 'dialogue' && <DialogueTab script={script} />}
          {activeTab === 'structure' && <StructureTab script={script} />}
          {activeTab === 'script' && <ScriptViewerTab script={script} />}
        </CardContent>
      </Card>
    </div>
  )
}

function ScriptMetadata({ script }: { script: ScriptWithData }) {
  const latestAnalysis = script.analyses.find(a => a.status === 'COMPLETED')

  // Enhanced runtime calculation
  const contentAnalysis = analyzeScriptContent(script.scenes)
  const runtimeEstimate = calculateFilmRuntime({
    pageCount: script.pageCount,
    actionPercentage: contentAnalysis.actionPercentage,
    dialoguePercentage: contentAnalysis.dialoguePercentage,
    genre: script.project?.genre ? script.project.genre.split(', ') : undefined
  })

  // Real data from database and analysis
  const aiDetectedGenres = getAIDetectedGenres(script)
  const userSelectedGenres = script.project?.genre
    ? script.project.genre.split(', ').filter(g => g.trim() !== '')
    : ['Not specified']
  const targetAudience = script.project?.targetAudience || 'General'
  const marketability = 'Good' // Would come from AI analysis
  const fileSize = `${(script.fileSize / (1024 * 1024)).toFixed(1)} MB`
  const totalIssues = script.scenes.reduce((acc, scene) => acc + scene.evidences.length, 0)
  const actionDialogueRatio = getActionDialogueRatio(contentAnalysis.actionPercentage, contentAnalysis.dialoguePercentage)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{script.title || script.originalFilename}</CardTitle>
            <CardDescription>
              {script.project && (
                <span className="text-brand font-medium">{script.project.name}</span>
              )}
              {script.project && ' • '}
              Script Analysis Dashboard
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Script Information Grid */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Script Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <MetricCard
              icon={<FileText className="h-5 w-5" />}
              label="Format"
              value={script.format.toUpperCase()}
              subtext="File Type"
              color="blue"
            />
            <MetricCard
              icon={<BarChart3 className="h-5 w-5" />}
              label="Pages"
              value={script.pageCount.toString()}
              subtext={getPageCountSubtext(script)}
              color="green"
            />
            <MetricCard
              icon={<Film className="h-5 w-5" />}
              label="Scenes"
              value={countActualScenes(script.scenes).toString()}
              subtext="Scene Headings"
              color="purple"
            />
            <MetricCard
              icon={<Users className="h-5 w-5" />}
              label="Characters"
              value={script.totalCharacters.toString()}
              subtext="Speaking Roles"
              color="orange"
            />
            <MetricCard
              icon={<Eye className="h-5 w-5" />}
              label="Film Runtime"
              value={runtimeEstimate.formatted}
              subtext={`Est. Duration (${runtimeEstimate.confidence} confidence)`}
              color="indigo"
            />
            <MetricCard
              icon={<Download className="h-5 w-5" />}
              label="File Size"
              value={fileSize}
              subtext="Original Size"
              color="gray"
            />
          </div>
        </div>

        {/* Project & Analysis Grid */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Project & Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <MetricCard
              icon={<Layers className="h-5 w-5" />}
              label="Project"
              value={script.project?.name || 'Unassigned'}
              subtext={script.project?.type || 'N/A'}
              color="brand"
            />
            <MetricCard
              icon={latestAnalysis ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
              label="Analysis"
              value={latestAnalysis ? 'Complete' : 'Pending'}
              subtext={latestAnalysis ? `Score: ${latestAnalysis.score?.toFixed(1) || 'N/A'}/10` : 'In Progress'}
              color={latestAnalysis ? 'green' : 'yellow'}
            />
            <MetricCard
              icon={<AlertCircle className="h-5 w-5" />}
              label="Issues"
              value={totalIssues.toString()}
              subtext="Detected"
              color={totalIssues > 10 ? 'red' : totalIssues > 5 ? 'yellow' : 'green'}
            />
            <MetricCard
              icon={<Users className="h-5 w-5" />}
              label="Target Audience"
              value={targetAudience}
              subtext="Demographics"
              color="purple"
            />
            <MetricCard
              icon={<BarChart3 className="h-5 w-5" />}
              label="Marketability"
              value={marketability}
              subtext="Commercial Potential"
              color="emerald"
            />
          </div>
        </div>

        {/* Genre Analysis */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Genre Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Detected Genres</h4>
                  <p className="text-xs text-blue-600">Based on script analysis</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {aiDetectedGenres.length > 0 ? (
                  aiDetectedGenres.map((genre) => (
                    <Badge key={genre} className="bg-blue-600 text-white hover:bg-blue-700">
                      {genre}
                    </Badge>
                  ))
                ) : (
                  <Badge className="bg-gray-500 text-white">
                    Analysis needed
                  </Badge>
                )}
              </div>
              <p className="text-xs text-blue-700">
                {getGenreAnalysisDescription(script, aiDetectedGenres)}
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 bg-gray-500 rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Selected Genres</h4>
                  <p className="text-xs text-gray-600">Chosen during project creation</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {userSelectedGenres.map((genre) => (
                  <Badge key={genre} variant="outline" className="border-gray-400 text-gray-700">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Version & Timeline */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Version & Timeline
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<RefreshCw className="h-5 w-5" />}
              label="Version"
              value={`v${script.versionMajor}.${script.versionMinor}`}
              subtext={script.isLatestVersion ? 'Latest' : 'Outdated'}
              color={script.isLatestVersion ? 'green' : 'yellow'}
            />
            <MetricCard
              icon={<MessageSquare className="h-5 w-5" />}
              label="Content Mix"
              value={actionDialogueRatio}
              subtext="Action/Dialogue"
              color="purple"
            />
            <MetricCard
              icon={<Upload className="h-5 w-5" />}
              label="Uploaded"
              value={format(new Date(script.uploadedAt), 'MMM d')}
              subtext={format(new Date(script.uploadedAt), 'yyyy')}
              color="blue"
            />
            {latestAnalysis && (
              <MetricCard
                icon={<CheckCircle className="h-5 w-5" />}
                label="Analyzed"
                value={format(new Date(latestAnalysis.completedAt!), 'MMM d')}
                subtext={format(new Date(latestAnalysis.completedAt!), 'yyyy')}
                color="green"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MetadataItem({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div className="text-center p-3 border rounded-lg">
      <p className="text-2xl font-bold text-brand">{value}</p>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </div>
  )
}

// Tab Components
function OverviewTab({ script }: { script: ScriptWithData }) {
  return (
    <div className="space-y-6">
      {/* Log Line */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Log Line
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-900 italic">
              "A compelling one-sentence summary of your script will appear here based on the narrative analysis..."
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Synopsis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Synopsis</CardTitle>
          <CardDescription>Comprehensive summary of your script</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A detailed synopsis will provide a comprehensive overview of the narrative,
            highlighting key plot points, character arcs, and thematic elements based on the script analysis.
          </p>
        </CardContent>
      </Card>

      {/* Key Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-green-700">Key Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">Strong character development</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">Compelling dialogue</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">Clear narrative structure</p>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-3">
                View Detailed Analysis
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-amber-700">Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                <p className="text-sm text-amber-800">Pacing in Act II could be tightened</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                <p className="text-sm text-amber-800">Some exposition feels heavy</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                <p className="text-sm text-amber-800">Supporting characters need development</p>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-3">
                View Recommendations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}

function CoverageTab({ script }: { script: ScriptWithData }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Coverage Report content coming soon...</h3>
        <p className="text-muted-foreground">
          Traditional script coverage format with professional analysis and recommendations.
        </p>
      </div>
    </div>
  )
}

function ScenesTab({ script }: { script: ScriptWithData }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Scene Analysis</h3>
        <Badge variant="secondary">{script.scenes.length} scenes</Badge>
      </div>

      {script.scenes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No scene data available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {script.scenes.map((scene, index) => (
            <Card key={scene.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">
                      {scene.sceneNumber || `Scene ${index + 1}`}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Page {scene.pageNumber} • Line {scene.lineNumber}
                    </p>
                  </div>
                  {scene.character && (
                    <Badge variant="outline">{scene.character}</Badge>
                  )}
                </div>
                <p className="text-sm line-clamp-2 mb-3">{scene.content}</p>

                {scene.evidences.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Evidence ({scene.evidences.length})</p>
                    <div className="grid gap-2">
                      {scene.evidences.slice(0, 2).map((evidence) => (
                        <div key={evidence.id} className="p-2 bg-muted/50 rounded text-xs">
                          <span className="font-medium">{evidence.type}</span>
                          <p className="text-muted-foreground mt-1">{evidence.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function CharactersTab({ script }: { script: ScriptWithData }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Character Analysis</h3>
        <Badge variant="secondary">{script.characters.length} characters</Badge>
      </div>

      {script.characters.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No character data available</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {script.characters.map((character) => (
            <Card key={character.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{character.name}</h4>
                  <Badge variant="outline">{character.dialogueCount} lines</Badge>
                </div>
                {character.firstAppearance && (
                  <p className="text-sm text-muted-foreground">
                    First appears at line {character.firstAppearance}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function DialogueTab({ script }: { script: ScriptWithData }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Dialogue Analysis content coming soon...</h3>
        <p className="text-muted-foreground">
          Analysis of dialogue quality, patterns, and character voice consistency.
        </p>
      </div>
    </div>
  )
}

function StructureTab({ script }: { script: ScriptWithData }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Structure Analysis content coming soon...</h3>
        <p className="text-muted-foreground">
          Story structure analysis including act breaks, pacing, and narrative flow.
        </p>
      </div>
    </div>
  )
}

function ScriptViewerTab({ script }: { script: ScriptWithData }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const scenesPerPage = 5

  const filteredScenes = script.scenes.filter(scene =>
    scene.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (scene.sceneNumber && scene.sceneNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (scene.character && scene.character.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const totalPages = Math.ceil(filteredScenes.length / scenesPerPage)
  const startIndex = (currentPage - 1) * scenesPerPage
  const paginatedScenes = filteredScenes.slice(startIndex, startIndex + scenesPerPage)

  return (
    <div className="space-y-6">
      {/* Header with Search and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Script Viewer</h3>
          <p className="text-sm text-muted-foreground">
            {script.scenes.length} scenes • {script.pageCount} pages
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search scenes..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10 pr-4 py-2 border rounded-md text-sm w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Script Content */}
      <Card>
        <CardContent className="p-0">
          {script.scenes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No script content available</p>
            </div>
          ) : filteredScenes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No scenes match your search</p>
            </div>
          ) : (
            <div className="divide-y">
              {paginatedScenes.map((scene, index) => (
                <div key={scene.id} className="p-6">
                  {/* Scene Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-bold text-brand uppercase tracking-wide">
                          {scene.sceneNumber || `SCENE ${startIndex + index + 1}`}
                        </h4>
                        {scene.character && (
                          <Badge variant="outline" className="text-xs">
                            {scene.character}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Page {scene.pageNumber}</span>
                        <span>•</span>
                        <span>Line {scene.lineNumber}</span>
                        {scene.type && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{scene.type.replace('_', ' ')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {scene.evidences.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {scene.evidences.length} issues
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Scene Content */}
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <div className="font-mono text-sm whitespace-pre-wrap leading-relaxed text-gray-900">
                      {scene.content}
                    </div>
                  </div>

                  {/* Evidence/Issues */}
                  {scene.evidences.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Issues Detected
                      </p>
                      <div className="grid gap-2">
                        {scene.evidences.map((evidence) => (
                          <div
                            key={evidence.id}
                            className="p-3 bg-amber-50 border border-amber-200 rounded text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-amber-800 capitalize">
                                {evidence.type.replace('_', ' ')}
                              </span>
                              <Badge variant="outline" className="text-xs bg-white">
                                Line {evidence.lineNumber}
                              </Badge>
                            </div>
                            <p className="text-amber-700">{evidence.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + scenesPerPage, filteredScenes.length)} of {filteredScenes.length} scenes
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to count actual scene headings per Hollywood format
function countActualScenes(scenes: any[]): number {
  if (!scenes) return 0

  // Count only scene headings (EXT./INT. locations)
  return scenes.filter(scene =>
    scene.type === 'scene' ||
    scene.type === 'SCENE_HEADING' ||
    (scene.content && (
      scene.content.toUpperCase().startsWith('INT.') ||
      scene.content.toUpperCase().startsWith('EXT.') ||
      scene.content.toUpperCase().startsWith('I/E.') ||
      scene.content.toUpperCase().startsWith('INT/EXT.')
    ))
  ).length
}

// Helper function to get appropriate page count subtext
function getPageCountSubtext(script: any): string {
  if (script.format?.toLowerCase() === 'fountain') {
    // For enhanced Fountain parsing, show if title page was detected
    const metadata = script.metadata || {}
    if (metadata.titlePageDetected && metadata.bodyPages) {
      return `${metadata.bodyPages} body + 1 title`
    }
    return "Enhanced Count"
  }
  return "Total Pages"
}

// MetricCard Component
function MetricCard({
  icon,
  label,
  value,
  subtext,
  color = 'gray'
}: {
  icon: React.ReactNode
  label: string
  value: string
  subtext: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'gray' | 'brand' | 'yellow' | 'red' | 'emerald'
}) {
  const colorClasses = {
    blue: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600',
    green: 'border-green-200 bg-gradient-to-br from-green-50 to-green-100 text-green-600',
    purple: 'border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600',
    orange: 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600',
    indigo: 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600',
    gray: 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600',
    brand: 'border-brand/20 bg-gradient-to-br from-brand/5 to-brand/10 text-brand',
    yellow: 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-600',
    red: 'border-red-200 bg-gradient-to-br from-red-50 to-red-100 text-red-600',
    emerald: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600'
  }

  const iconColorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white',
    orange: 'bg-orange-500 text-white',
    indigo: 'bg-indigo-500 text-white',
    gray: 'bg-gray-500 text-white',
    brand: 'bg-brand text-white',
    yellow: 'bg-yellow-500 text-white',
    red: 'bg-red-500 text-white',
    emerald: 'bg-emerald-500 text-white'
  }

  return (
    <div className={`p-4 border rounded-lg ${colorClasses[color]} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconColorClasses[color]} shrink-0`}>
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm font-medium text-gray-700">{label}</div>
        <div className="text-xs text-gray-500">{subtext}</div>
      </div>
    </div>
  )
}