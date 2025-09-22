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
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import type { Analysis, Character, Evidence, Scene, Script } from '@prisma/client'

type SceneWithEvidence = Scene & { evidences: Evidence[] }
type ScriptWithData = Script & {
  scenes: SceneWithEvidence[]
  characters: Character[]
  analyses: Analysis[]
  project?: {
    id: string
    name: string
    type: string
  }
}

interface TabbedAnalysisProps {
  script: ScriptWithData
}

export function TabbedAnalysis({ script }: TabbedAnalysisProps) {
  const [activeTab, setActiveTab] = useState('overview')

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

  // Calculate additional metadata
  const actionDialogueRatio = calculateActionDialogueRatio(script)
  const estimatedReadingTime = Math.ceil(script.pageCount * 1.2) // ~1.2 minutes per page
  const fileSize = script.originalFilename ? 'Unknown' : 'Unknown' // Would need to store this

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
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-analyze
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <MetadataItem
            label="Format"
            value={script.format.toUpperCase()}
            subtext="File Type"
          />
          <MetadataItem
            label="Pages"
            value={script.pageCount.toString()}
            subtext="Total Pages"
          />
          <MetadataItem
            label="Scenes"
            value={script.totalScenes.toString()}
            subtext="Scene Count"
          />
          <MetadataItem
            label="Characters"
            value={script.totalCharacters.toString()}
            subtext="Speaking Roles"
          />
          <MetadataItem
            label="Reading Time"
            value={`${estimatedReadingTime} min`}
            subtext="Est. Duration"
          />
          <MetadataItem
            label="Uploaded"
            value={format(new Date(script.uploadedAt), 'MMM d')}
            subtext={format(new Date(script.uploadedAt), 'yyyy')}
          />
        </div>

        {/* Analysis Status Bar */}
        {latestAnalysis && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">Analysis Complete</span>
                {latestAnalysis.score && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Score: {latestAnalysis.score.toFixed(1)}/10
                  </Badge>
                )}
              </div>
              <span className="text-xs text-green-600">
                {format(new Date(latestAnalysis.completedAt!), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </div>
        )}
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
      {/* AI-Generated Log Line */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            AI-Generated Log Line
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-900 italic">
              "AI-generated log line will appear here based on script analysis..."
            </p>
            <div className="flex items-center justify-between mt-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">AI Generated</Badge>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Synopsis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Synopsis</CardTitle>
          <CardDescription>AI-generated summary of your script</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              AI-generated synopsis will provide a comprehensive overview of the narrative,
              highlighting key plot points, character arcs, and thematic elements...
            </p>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Synopsis
            </Button>
          </div>
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

      {/* Analysis Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Genre Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge className="bg-purple-100 text-purple-800">Drama</Badge>
              <Badge variant="outline">Thriller</Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Strong dramatic elements with thriller undertones
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Target Audience</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium">Adults 25-54</p>
              <p className="text-xs text-muted-foreground">
                Appeals to viewers who enjoy character-driven narratives
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Marketability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="flex">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full ml-1"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full ml-1"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full ml-1"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full ml-1"></div>
              </div>
              <span className="text-sm text-green-600">Good</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Strong commercial potential in current market
            </p>
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

// Helper function
function calculateActionDialogueRatio(script: ScriptWithData) {
  // This would need to be calculated based on actual content analysis
  // For now, returning a placeholder
  return "60% Action, 40% Dialogue"
}