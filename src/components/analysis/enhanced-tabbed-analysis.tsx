'use client'

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  FileText,
  Film,
  Clock,
  UploadCloud,
  Play,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  MessageSquare,
  AlertTriangle,
  Users,
  MapPin,
  Sun,
  Moon,
  Rocket,
  Download,
  BookOpenText,
  ListChecks,
  Share2,
  PanelRightOpen,
  ArrowRightLeft,
  BarChart4,
  Layers,
  Link2,
  Eye,
  Zap,
  Brain,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceDot,
} from "recharts"
import type {
  Analysis,
  Character,
  Evidence,
  Scene,
  Script,
  Beat,
  Note,
  Score,
  PageMetric,
  FeasibilityMetric,
  CharacterScene,
  Subplot,
  ThemeStatement,
  RiskFlag
} from '@prisma/client'
import {
  calculateFilmRuntime,
  analyzeScriptContent,
  getActionDialogueRatio,
  formatRuntime
} from '@/lib/utils/runtime-calculator'

// Enhanced types for the full script data
type SceneWithEvidence = Scene & { evidences: Evidence[] }
type ScriptWithData = Script & {
  scenes: SceneWithEvidence[]
  characters: Character[]
  analyses: Analysis[]
  beats: Beat[]
  notes: Note[]
  scores: Score[]
  pageMetrics: PageMetric[]
  themeStatements: ThemeStatement[]
  riskFlags: RiskFlag[]
  subplots: (Subplot & { spans: any[] })[]
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

interface EnhancedTabbedAnalysisProps {
  script: ScriptWithData
  allVersions?: ScriptWithData[]
}

// Utility functions
const pct = (n: number) => Math.round(n * 100)

// Helper function to get AI detected genres from analysis results
function getAIDetectedGenres(script: ScriptWithData): string[] {
  const recentAnalysis = script.analyses
    .filter(a => a.status === 'COMPLETED' && a.genre && a.genre !== 'Unknown')
    .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())[0]

  if (recentAnalysis?.genre) {
    return recentAnalysis.genre.split(',').map(g => g.trim()).filter(g => g)
  }

  return []
}

// Convert real data to chart format
function prepareBeatsData(beats: Beat[]) {
  return beats.map(beat => ({
    label: beat.kind.replace('_', ' '),
    page: beat.page || 0,
    conf: Number(beat.confidence) || 0
  }))
}

function preparePageMetricsData(pageMetrics: PageMetric[]) {
  return pageMetrics.map(pm => ({
    page: pm.page,
    dialogue: pm.dialogueLines || 0,
    action: pm.actionLines || 0,
    tension: pm.tensionScore || 0
  }))
}

function prepareScenesData(scenes: SceneWithEvidence[]) {
  return scenes.slice(0, 20).map((scene, i) => ({
    id: scene.id,
    number: i + 1,
    slug: `${scene.intExt || 'INT'}. ${scene.location || 'LOCATION'} - ${scene.tod || 'DAY'}`,
    pageStart: scene.pageStart || scene.pageNumber,
    pageEnd: scene.pageEnd || scene.pageNumber + 1,
    characters: [scene.character].filter(Boolean),
    hasIssues: scene.evidences.length > 0,
    pins: {
      note: scene.evidences.length > 0,
      beat: false, // Would need to check if scene has beats
      pacing: false,
      feasibility: false,
      risk: false,
    },
    preview: scene.content.substring(0, 60) + "...",
  }))
}

function prepareRubricData(scores: Score[]) {
  return scores.map(score => ({
    k: score.category.replace('_', ' '),
    v: Number(score.value)
  }))
}

export function EnhancedTabbedAnalysis({ script, allVersions = [] }: EnhancedTabbedAnalysisProps) {
  const [chatOpen, setChatOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  const scriptTitle = script.title || script.originalFilename

  // Prepare data from real Prisma records
  const beatsData = prepareBeatsData(script.beats)
  const pageMetricsData = preparePageMetricsData(script.pageMetrics)
  const scenesData = prepareScenesData(script.scenes)
  const rubricData = prepareRubricData(script.scores)

  // Calculate runtime and content analysis
  const contentAnalysis = analyzeScriptContent(script.scenes)
  const runtimeEstimate = calculateFilmRuntime({
    pageCount: script.pageCount,
    actionPercentage: contentAnalysis.actionPercentage,
    dialoguePercentage: contentAnalysis.dialoguePercentage,
    genre: script.project?.genre ? script.project.genre.split(', ') : undefined
  })

  // Calculate real metrics from parsed data
  // A scene is considered "real" if it has scene heading data (intExt, location, tod)
  // or if its content starts with a scene heading pattern
  const realScenes = script.scenes.filter(scene => {
    // Check if scene has parsed slug information
    if (scene.intExt || scene.location || scene.tod) {
      return true
    }

    // Check if scene content starts with scene heading pattern
    if (scene.content) {
      const firstLine = scene.content.split('\n')[0].trim()
      const upperLine = firstLine.toUpperCase()
      return upperLine.startsWith('INT.') ||
             upperLine.startsWith('EXT.') ||
             upperLine.startsWith('INT/EXT.') ||
             upperLine.match(/^(BEDROOM|DINING|LIVING|FRONT)/i) // Common location patterns
    }

    return false
  })

  const actualSceneCount = Math.max(realScenes.length, script.totalScenes || 0)

  // Calculate INT/EXT ratio from actual scenes
  const intExtCounts = realScenes.reduce((acc, scene) => {
    // First try to use parsed intExt data
    if (scene.intExt === 'INT') {
      acc.INT++
    } else if (scene.intExt === 'EXT') {
      acc.EXT++
    } else if (scene.intExt === 'INT_EXT') {
      acc.INT_EXT++
    } else if (scene.content) {
      // Fallback: parse from content if no intExt data
      const firstLine = scene.content.split('\n')[0].trim().toUpperCase()
      if (firstLine.startsWith('INT.') || firstLine.includes('BEDROOM') || firstLine.includes('DINING') || firstLine.includes('LIVING')) {
        acc.INT++
      } else if (firstLine.startsWith('EXT.') || firstLine.includes('FRONT PATHWAY')) {
        acc.EXT++
      } else if (firstLine.startsWith('INT/EXT.')) {
        acc.INT_EXT++
      }
    }
    return acc
  }, { INT: 0, EXT: 0, INT_EXT: 0 })

  const totalIntExt = intExtCounts.INT + intExtCounts.EXT + intExtCounts.INT_EXT
  const intExtRatio = totalIntExt > 0 ? {
    INT: (intExtCounts.INT + intExtCounts.INT_EXT * 0.5) / totalIntExt,
    EXT: (intExtCounts.EXT + intExtCounts.INT_EXT * 0.5) / totalIntExt
  } : { INT: 0.5, EXT: 0.5 }

  // Calculate DAY/NIGHT ratio from actual scenes
  const dayNightCounts = realScenes.reduce((acc, scene) => {
    // First try to use parsed tod data
    const tod = scene.tod?.toUpperCase()
    if (tod?.includes('DAY')) {
      acc.DAY++
    } else if (tod?.includes('NIGHT')) {
      acc.NIGHT++
    } else if (scene.content) {
      // Fallback: parse from content if no tod data
      const firstLine = scene.content.split('\n')[0].trim().toUpperCase()
      if (firstLine.includes('DAY')) {
        acc.DAY++
      } else if (firstLine.includes('NIGHT')) {
        acc.NIGHT++
      } else {
        // If no time indicator, assume DAY (common screenplay convention)
        acc.DAY++
      }
    } else {
      acc.UNKNOWN++
    }
    return acc
  }, { DAY: 0, NIGHT: 0, UNKNOWN: 0 })

  const totalDayNight = dayNightCounts.DAY + dayNightCounts.NIGHT
  const dayNightRatio = totalDayNight > 0 ? {
    DAY: dayNightCounts.DAY / totalDayNight,
    NIGHT: dayNightCounts.NIGHT / totalDayNight
  } : { DAY: 0.5, NIGHT: 0.5 }

  // Calculate unique locations
  const locationSet = new Set<string>()
  realScenes.forEach(scene => {
    if (scene.location) {
      // Use parsed location data
      locationSet.add(scene.location.toUpperCase())
    } else if (scene.content) {
      // Fallback: extract location from content
      const firstLine = scene.content.split('\n')[0].trim()
      const locationMatch = firstLine.match(/(?:INT\.|EXT\.)\s+(.+?)\s*(?:-|$)/i)
      if (locationMatch) {
        locationSet.add(locationMatch[1].trim().toUpperCase())
      } else {
        // Try to extract common location patterns
        if (firstLine.toUpperCase().includes('BEDROOM')) {
          locationSet.add('BEDROOM')
        } else if (firstLine.toUpperCase().includes('DINING')) {
          locationSet.add('DINING HALL')
        } else if (firstLine.toUpperCase().includes('LIVING')) {
          locationSet.add('LIVING ROOM')
        } else if (firstLine.toUpperCase().includes('FRONT PATHWAY')) {
          locationSet.add('FRONT PATHWAY')
        }
      }
    }
  })
  const uniqueLocations = locationSet.size

  // Calculate complexity index based on production requirements
  let complexityScore = 1.0 // Base complexity for any screenplay

  // Add complexity based on number of locations (more locations = more complex)
  complexityScore += Math.min(uniqueLocations * 0.5, 3.0)

  // Add complexity based on character count (more characters = more complex casting/scheduling)
  const characterCount = script.totalCharacters || script.characters.length
  complexityScore += Math.min(characterCount * 0.1, 2.0)

  // Add complexity based on INT/EXT ratio (more EXT = more complex logistics)
  complexityScore += intExtRatio.EXT * 1.5

  // Add complexity based on day/night ratio (night shoots are more complex)
  complexityScore += dayNightRatio.NIGHT * 2.0

  // Cap at 10 and round to one decimal
  const avgComplexity = Math.min(complexityScore, 10.0)

  // Script metrics with real calculated values
  const scriptMetrics = {
    id: script.id,
    title: scriptTitle,
    originalFilename: script.originalFilename,
    project: script.project ? { name: script.project.name, type: script.project.type } : null,
    format: script.format,
    pageCount: script.pageCount,
    totalScenes: actualSceneCount, // Use corrected scene count
    totalCharacters: script.totalCharacters,
    fileSizeMB: Number((script.fileSize / (1024 * 1024)).toFixed(1)),
    runtimeMin: runtimeEstimate.minutes,
    runtimeConfidence: runtimeEstimate.confidence,
    // Real calculated ratios
    intExtRatio,
    dayNightRatio,
    uniqueLocations,
    complexityIndex: Number(avgComplexity.toFixed(1)),
  }

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

      const response = await fetch(`/api/v1/scripts/${script.id}/analyze`, {
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

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 md:p-6 space-y-4">
        {/* HEADER */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-2xl md:text-3xl">{scriptTitle}</CardTitle>
                  {scriptMetrics.project && (
                    <Badge variant="secondary" className="text-xs">{scriptMetrics.project.name}</Badge>
                  )}
                </div>
                <CardDescription>
                  Analysis dashboard · {scriptMetrics.format} · {scriptMetrics.pageCount} pages
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4"/> Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Downloads</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Coverage PDF</DropdownMenuItem>
                    <DropdownMenuItem>Notes CSV</DropdownMenuItem>
                    <DropdownMenuItem>JSON Bundle</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>FDX Change List</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Sheet open={chatOpen} onOpenChange={setChatOpen}>
                  <SheetTrigger asChild>
                    <Button className="gap-2">
                      <MessageSquare className="h-4 w-4"/> Chat
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[420px] sm:w-[540px]">
                    <SheetHeader>
                      <SheetTitle>Script Assistant</SheetTitle>
                      <SheetDescription>
                        Ask context-aware questions. Replies link to scenes & notes.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-4 space-y-3">
                      <Label htmlFor="q">Question</Label>
                      <Textarea id="q" placeholder="e.g., Why is the midpoint flagged late?"/>
                      <div className="flex justify-end">
                        <Button>Ask</Button>
                      </div>
                      <Separator />
                      <div className="text-sm text-muted-foreground">
                        Responses appear here…
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* STATUS CHIPS */}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3.5 w-3.5"/> {scriptMetrics.format}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <BookOpenText className="h-3.5 w-3.5"/> {scriptMetrics.pageCount}p
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Layers className="h-3.5 w-3.5"/> {scriptMetrics.totalScenes} scenes
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3.5 w-3.5"/> {scriptMetrics.totalCharacters} characters
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3.5 w-3.5"/> ~{scriptMetrics.runtimeMin}m ({isNaN(scriptMetrics.runtimeConfidence) ? 85 : pct(scriptMetrics.runtimeConfidence)}% conf)
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Film className="h-3.5 w-3.5"/> {pct(scriptMetrics.intExtRatio.INT)}% INT / {pct(scriptMetrics.intExtRatio.EXT)}% EXT
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Sun className="h-3.5 w-3.5"/> {pct(scriptMetrics.dayNightRatio.DAY)}% DAY / {pct(scriptMetrics.dayNightRatio.NIGHT)}% NIGHT
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3.5 w-3.5"/> {scriptMetrics.uniqueLocations} locations
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <BarChart4 className="h-3.5 w-3.5"/> complexity {scriptMetrics.complexityIndex}
              </Badge>
            </div>
          </CardHeader>

          {/* CONTROL PANEL */}
          <CardContent className="pb-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Button
                  className="gap-2"
                  variant="secondary"
                  onClick={() => handleStartAnalysis('quick')}
                  disabled={isAnalyzing}
                >
                  <Play className="h-4 w-4"/> Quick
                </Button>
                <Button
                  className="gap-2"
                  onClick={() => handleStartAnalysis('comprehensive')}
                  disabled={isAnalyzing}
                >
                  <Rocket className="h-4 w-4"/> Comprehensive
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2" disabled={isAnalyzing}>
                      <Settings className="h-4 w-4"/> Custom <ChevronDown className="h-4 w-4"/>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Analysis Types</DropdownMenuLabel>
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem>Genre Classification</DropdownMenuItem>
                    <DropdownMenuItem>Story Structure</DropdownMenuItem>
                    <DropdownMenuItem>Character Development</DropdownMenuItem>
                    <DropdownMenuItem>Dialogue Quality</DropdownMenuItem>
                    <DropdownMenuItem>Pacing & Flow</DropdownMenuItem>
                    <DropdownMenuItem>Theme Analysis</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="w-full md:w-1/2">
                <div className="text-xs mb-1 text-muted-foreground">
                  Parse → Normalize → Taggers → Cross-scene → Escalations → Scoring → Assets
                </div>
                <Progress value={isAnalyzing ? analysisProgress : 100} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MAIN GRID */}
        <div className="grid grid-cols-12 gap-4">
          {/* LEFT: SCRIPT VIEWER */}
          <div className="col-span-12 xl:col-span-5 space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">Script Viewer</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                      <Input className="pl-8 w-48" placeholder="Search scenes…"/>
                    </div>
                    <Select>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Filter"/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="issues">Only with issues</SelectItem>
                        <SelectItem value="int">INT</SelectItem>
                        <SelectItem value="ext">EXT</SelectItem>
                        <SelectItem value="day">DAY</SelectItem>
                        <SelectItem value="night">NIGHT</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="outline">
                      <ChevronLeft className="h-4 w-4"/>
                    </Button>
                    <Button size="icon" variant="outline">
                      <ChevronRight className="h-4 w-4"/>
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {scriptMetrics.totalScenes} scenes · {scriptMetrics.pageCount} pages
                </CardDescription>
              </CardHeader>
              <Separator/>
              <CardContent className="p-0">
                <ScrollArea className="h-[540px]">
                  <ul className="divide-y">
                    {scenesData.map((scene) => (
                      <li key={scene.id} className="p-4 hover:bg-muted/40 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-muted-foreground">
                                #{scene.number}
                              </span>
                              <span className="font-semibold">{scene.slug}</span>
                              <span className="text-xs text-muted-foreground">
                                pp. {scene.pageStart}–{scene.pageEnd}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {scene.preview}
                            </p>
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                              {scene.characters.map((c) => (
                                <Badge key={c} variant="outline" className="text-xs">
                                  {c}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {scene.pins.note && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost">
                                    <AlertTriangle className="h-4 w-4 text-amber-600"/>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Notes present</TooltipContent>
                              </Tooltip>
                            )}
                            {scene.pins.beat && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost">
                                    <Link2 className="h-4 w-4 text-sky-600"/>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Beat anchor</TooltipContent>
                              </Tooltip>
                            )}
                            {scene.pins.pacing && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost">
                                    <Clock className="h-4 w-4 text-purple-600"/>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Pacing outlier</TooltipContent>
                              </Tooltip>
                            )}
                            {scene.pins.feasibility && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost">
                                    <Layers className="h-4 w-4 text-emerald-600"/>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Feasibility flag</TooltipContent>
                              </Tooltip>
                            )}
                            {scene.pins.risk && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost">
                                    <ShieldAlertIcon/>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Risk flag</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: ANALYZER TABS */}
          <div className="col-span-12 xl:col-span-7">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="coverage">Coverage</TabsTrigger>
                <TabsTrigger value="craft">Craft</TabsTrigger>
                <TabsTrigger value="characters">Characters</TabsTrigger>
                <TabsTrigger value="pacing">Pacing</TabsTrigger>
                <TabsTrigger value="feasibility">Feasibility</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="exports">Exports</TabsTrigger>
              </TabsList>

              {/* OVERVIEW */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-12 gap-4">
                  <Card className="col-span-12">
                    <CardHeader>
                      <CardTitle>Logline</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {script.logline || "A compelling one-sentence summary of your script will appear here based on the narrative analysis..."}
                    </CardContent>
                  </Card>

                  <Card className="col-span-12">
                    <CardHeader>
                      <CardTitle>Synopsis</CardTitle>
                      <CardDescription>1-pager and 3-pager</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {script.synopsisShort ? (
                        <p className="text-sm">{script.synopsisShort}</p>
                      ) : (
                        <>
                          <Skeleton className="h-4 w-2/3"/>
                          <Skeleton className="h-4 w-3/4"/>
                          <Skeleton className="h-4 w-1/2"/>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="col-span-12 lg:col-span-6">
                    <CardHeader><CardTitle>Strengths</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <li>Tight third act momentum</li>
                      <li>Distinct prop-driven set pieces</li>
                      <li>Clear emotional stakes</li>
                    </CardContent>
                  </Card>
                  <Card className="col-span-12 lg:col-span-6">
                    <CardHeader><CardTitle>Areas for Improvement</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <li>Act II flat spot around pp. 60–70</li>
                      <li>Antagonist presence dips in mid-act</li>
                      <li>Some on-the-nose lines in early scenes</li>
                    </CardContent>
                  </Card>
                </div>

                {rubricData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Scorecard</CardTitle>
                      <CardDescription>Studio-style rubric (1–10)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {rubricData.map((r) => (
                          <div key={r.k} className="rounded-2xl border p-3">
                            <div className="text-xs text-muted-foreground">{r.k}</div>
                            <div className="text-xl font-semibold">{r.v.toFixed(1)}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* COVERAGE */}
              <TabsContent value="coverage" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle>Coverage</CardTitle>
                      <CardDescription>Pass / Consider / Recommend</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select rating"/>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pass">Pass</SelectItem>
                          <SelectItem value="consider">Consider</SelectItem>
                          <SelectItem value="recommend">Recommend</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" className="gap-2">
                        <Share2 className="h-4 w-4"/> Export PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-semibold">Comps</div>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <Badge variant="secondary">Sicario</Badge>
                          <Badge variant="secondary">Heat (tone)</Badge>
                        </div>
                        <Separator className="my-2"/>
                        <div className="text-sm font-semibold">Strengths</div>
                        <ul className="text-sm list-disc pl-5 space-y-1">
                          <li>Inventive mechanical tension</li>
                          <li>Clear father–daughter core</li>
                        </ul>
                        <div className="text-sm font-semibold mt-3">Risks</div>
                        <ul className="text-sm list-disc pl-5 space-y-1">
                          <li>Location density may strain budget</li>
                          <li>Trademark mentions need clearance</li>
                        </ul>
                      </div>
                      <div className="rounded-xl border p-3">
                        <div className="text-sm font-medium mb-2">Beat Map</div>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={beatsData.map((b) => ({ x: b.page, y: b.conf }))}>
                              <defs>
                                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="currentColor" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="currentColor" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="x" tick={{ fontSize: 12 }} />
                              <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                              <RTooltip />
                              <Area type="monotone" dataKey="y" stroke="currentColor" fill="url(#grad)" />
                              {beatsData.map((b, i) => (
                                <ReferenceDot key={i} x={b.page} y={b.conf} r={4} isFront />
                              ))}
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* CRAFT (subtabs) */}
              <TabsContent value="craft" className="space-y-4 mt-4">
                <Tabs defaultValue="structure" className="w-full">
                  <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                    <TabsTrigger value="structure">Structure & Beats</TabsTrigger>
                    <TabsTrigger value="conflict">Conflict & Theme</TabsTrigger>
                    <TabsTrigger value="dialogue">Dialogue</TabsTrigger>
                    <TabsTrigger value="world">World & Logic</TabsTrigger>
                    <TabsTrigger value="genre">Genre & Market</TabsTrigger>
                    <TabsTrigger value="formatting">Formatting</TabsTrigger>
                    <TabsTrigger value="sensitivity">Sensitivity</TabsTrigger>
                    <TabsTrigger value="risk">Risk Flags</TabsTrigger>
                  </TabsList>

                  <TabsContent value="structure" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Beat Timeline</CardTitle>
                        <CardDescription>Markers with timing flags and confidence</CardDescription>
                      </CardHeader>
                      <CardContent className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={beatsData.map((b)=>({ page: b.page, conf: b.conf }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="page" />
                            <YAxis domain={[0,1]} />
                            <RTooltip />
                            <Line type="monotone" dataKey="conf" stroke="currentColor" dot />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Subplot Swimlanes</CardTitle>
                        <CardDescription>Intro / Develop / Converge / Resolve</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-2">
                          {script.subplots.map((subplot) => (
                            <div key={subplot.id} className="rounded-xl border p-3">
                              <div className="text-sm font-medium mb-2">{subplot.label}</div>
                              <div className="flex items-center gap-2">
                                {['INTRO','DEVELOP','CONVERGE','RESOLVE'].map((st,i)=> (
                                  <Badge key={i} variant="outline" className="rounded-full">{st}</Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                          {script.subplots.length === 0 && (
                            <div className="text-sm text-muted-foreground">No subplots detected yet. Run comprehensive analysis to identify subplot structures.</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="conflict" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Stakes Escalation</CardTitle>
                        <CardDescription>Tension curve with flat spots flagged</CardDescription>
                      </CardHeader>
                      <CardContent className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={pageMetricsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="page" />
                            <YAxis />
                            <RTooltip />
                            <Area type="monotone" dataKey="tension" stroke="currentColor" fill="currentColor" fillOpacity={0.1} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="dialogue" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Dialogue Quality</CardTitle>
                        <CardDescription>On-the-nose & exposition flags; suggested alts</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {["On-the-nose", "Exposition dump", "Repetition"].map((k)=> (
                          <div key={k} className="flex items-center justify-between rounded-xl border p-3">
                            <div className="text-sm font-medium">{k}</div>
                            <Button variant="outline" size="sm">View notes</Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="world" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Continuity Tracker</CardTitle>
                        <CardDescription>Time / Place / Props / Tech / Jargon</CardDescription>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        Continuity issues will appear here…
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="genre" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader><CardTitle>Genre Conventions</CardTitle></CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        Convention coverage meter…
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="formatting" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader><CardTitle>Formatting Lints</CardTitle></CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Slugline shape</span>
                          <Button size="sm" variant="outline">Add note</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>ALL-CAPS intros</span>
                          <Button size="sm" variant="outline">Add note</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Parenthetical overuse</span>
                          <Button size="sm" variant="outline">Add note</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="sensitivity" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader><CardTitle>Sensitivity (opt-in)</CardTitle></CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        Inclusive language flags and heuristics appear here if enabled.
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="risk" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Risk Flags</CardTitle>
                        <CardDescription>Non-legal advice; review with counsel</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Kind</TableHead>
                              <TableHead>Scene</TableHead>
                              <TableHead>Page</TableHead>
                              <TableHead>Excerpt</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {script.riskFlags.map((risk) => (
                              <TableRow key={risk.id}>
                                <TableCell>{risk.kind.replace('_', ' ')}</TableCell>
                                <TableCell>#{risk.page}</TableCell>
                                <TableCell>{risk.page}</TableCell>
                                <TableCell className="truncate max-w-[240px]">
                                  {risk.snippet || 'No excerpt available'}
                                </TableCell>
                              </TableRow>
                            ))}
                            {script.riskFlags.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                  No risk flags detected
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* CHARACTERS */}
              <TabsContent value="characters" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Character Analysis</CardTitle>
                    <CardDescription>{script.characters.length} characters detected</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {script.characters.map((character) => (
                        <div key={character.id} className="rounded-2xl border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{character.name}</div>
                            <Badge variant="outline">{character.dialogueCount} lines</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Goal, stakes, agency, flaw…
                          </div>
                          {character.firstAppearance && (
                            <div className="text-xs text-muted-foreground">
                              First appearance: Line {character.firstAppearance}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* PACING */}
              <TabsContent value="pacing" className="space-y-4 mt-4">
                <Card>
                  <CardHeader><CardTitle>Scene Length Histogram</CardTitle></CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pageMetricsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="page" />
                        <YAxis />
                        <RTooltip />
                        <Bar dataKey="action" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Dialogue / Action Ratio</CardTitle></CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pageMetricsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="page" />
                        <YAxis />
                        <RTooltip />
                        <Bar dataKey="dialogue" />
                        <Bar dataKey="action" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Tension Waveform</CardTitle></CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={pageMetricsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="page" />
                        <YAxis />
                        <RTooltip />
                        <Line dataKey="tension" type="monotone" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* FEASIBILITY */}
              <TabsContent value="feasibility" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Location & Category Counts</CardTitle>
                    <CardDescription>
                      INT/EXT · DAY/NIGHT · Stunts · VFX/SFX · Crowd · Minors/Animals · Weapons/Vehicles · Special Props
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { k: "INT", v: pct(scriptMetrics.intExtRatio.INT) + "%" },
                      { k: "EXT", v: pct(scriptMetrics.intExtRatio.EXT) + "%" },
                      { k: "DAY", v: pct(scriptMetrics.dayNightRatio.DAY) + "%" },
                      { k: "NIGHT", v: pct(scriptMetrics.dayNightRatio.NIGHT) + "%" },
                      { k: "Unique Locations", v: String(scriptMetrics.uniqueLocations) },
                      { k: "Complexity Index", v: String(scriptMetrics.complexityIndex) },
                    ].map((m) => (
                      <div key={m.k} className="rounded-2xl border p-3">
                        <div className="text-xs text-muted-foreground">{m.k}</div>
                        <div className="text-xl font-semibold">{m.v}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Complexity Heatmap</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-22 gap-1">
                      {Array.from({ length: scriptMetrics.pageCount }).slice(0, 120).map((_, i) => (
                        <div key={i} className="h-3 w-3 rounded bg-muted"/>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* NOTES */}
              <TabsContent value="notes" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle>Notes</CardTitle>
                      <CardDescription>
                        Filter by area and severity; click to jump to scene
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Area"/>
                        </SelectTrigger>
                        <SelectContent>
                          {"STRUCTURE CHARACTER DIALOGUE PACING THEME GENRE FORMATTING LOGIC REPRESENTATION LEGAL".split(" ").map((a)=> (
                            <SelectItem key={a} value={a.toLowerCase()}>{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Severity"/>
                        </SelectTrigger>
                        <SelectContent>
                          {"HIGH MEDIUM LOW".split(" ").map((s)=> (
                            <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4"/> Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Severity</TableHead>
                          <TableHead>Area</TableHead>
                          <TableHead>Scene</TableHead>
                          <TableHead>Page</TableHead>
                          <TableHead>Excerpt</TableHead>
                          <TableHead>Suggestion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {script.notes.map((note) => (
                          <TableRow key={note.id}>
                            <TableCell>
                              <Badge variant={note.severity === 'HIGH' ? 'destructive' : 'secondary'}>
                                {note.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>{note.area}</TableCell>
                            <TableCell>#{note.page}</TableCell>
                            <TableCell>{note.page}</TableCell>
                            <TableCell className="max-w-[240px] truncate">
                              {note.excerpt || 'No excerpt available'}
                            </TableCell>
                            <TableCell className="max-w-[280px] truncate">
                              {note.suggestion || 'No suggestion available'}
                            </TableCell>
                          </TableRow>
                        ))}
                        {script.notes.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              No notes available. Run analysis to generate feedback.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* EXPORTS */}
              <TabsContent value="exports" className="space-y-4 mt-4">
                <Card>
                  <CardHeader><CardTitle>Deliverables</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {["Coverage PDF","Notes PDF","Notes CSV","JSON Bundle","FDX Change List"].map((x)=> (
                      <div key={x} className="rounded-2xl border p-3 flex items-center justify-between">
                        <div className="text-sm">{x}</div>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="h-4 w-4"/> Download
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        </div>

        {/* FLOATING CHAT BUTTON (mobile quick access) */}
        <div className="fixed bottom-4 right-4 z-40 md:hidden">
          <Button onClick={()=>setChatOpen(true)} size="icon" className="rounded-full shadow-xl">
            <MessageSquare className="h-5 w-5"/>
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}

function ShieldAlertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-rose-600">
      <path fillRule="evenodd" d="M20.253 7.02a.75.75 0 0 1 .247.55V12a10.5 10.5 0 0 1-7.084 9.94.75.75 0 0 1-.502 0A10.5 10.5 0 0 1 5.83 12V7.57a.75.75 0 0 1 .247-.55l5.25-4.854a.75.75 0 0 1 1.02 0l5.906 5.354Zm-7.503 1.98a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0v-4.5ZM12 18a.999.999 0 1 0 0-1.998A.999.999 0 0 0 12 18Z" clipRule="evenodd"/>
    </svg>
  )
}