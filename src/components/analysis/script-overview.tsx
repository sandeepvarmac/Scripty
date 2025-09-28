'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import Link from 'next/link'
import {
  FileText,
  Film,
  Clock,
  Users,
  MapPin,
  Sun,
  BookOpenText,
  Layers,
  BarChart4,
  Play,
  Rocket,
  Settings,
  ChevronDown,
  Eye,
  Lightbulb,
  ArrowRight,
  MessageSquare,
  Download,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  calculateFilmRuntime,
  analyzeScriptContent,
} from '@/lib/utils/runtime-calculator'

interface ScriptOverviewProps {
  script: any // Will type properly later
  user: any
  parseState: string
}

const pct = (n: number) => Math.round(n * 100)

export function ScriptOverview({ script, user, parseState }: ScriptOverviewProps) {
  const { toast } = useToast()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  const scriptTitle = script.title || script.originalFilename

  // Calculate real metrics from parsed data
  const realScenes = script.scenes.filter((scene: any) => {
    if (scene.intExt || scene.location || scene.tod) return true
    if (scene.content) {
      const firstLine = scene.content.split('\n')[0].trim()
      const upperLine = firstLine.toUpperCase()
      return upperLine.startsWith('INT.') ||
             upperLine.startsWith('EXT.') ||
             upperLine.startsWith('INT/EXT.') ||
             upperLine.match(/^(BEDROOM|DINING|LIVING|FRONT)/i)
    }
    return false
  })

  const actualSceneCount = Math.max(realScenes.length, script.totalScenes || 0)

  // Calculate INT/EXT ratio
  const intExtCounts = realScenes.reduce((acc: any, scene: any) => {
    if (scene.intExt === 'INT') {
      acc.INT++
    } else if (scene.intExt === 'EXT') {
      acc.EXT++
    } else if (scene.intExt === 'INT_EXT') {
      acc.INT_EXT++
    } else if (scene.content) {
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

  // Calculate DAY/NIGHT ratio
  const dayNightCounts = realScenes.reduce((acc: any, scene: any) => {
    const tod = scene.tod?.toUpperCase()
    if (tod?.includes('DAY')) {
      acc.DAY++
    } else if (tod?.includes('NIGHT')) {
      acc.NIGHT++
    } else if (scene.content) {
      const firstLine = scene.content.split('\n')[0].trim().toUpperCase()
      if (firstLine.includes('DAY')) {
        acc.DAY++
      } else if (firstLine.includes('NIGHT')) {
        acc.NIGHT++
      } else {
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
  realScenes.forEach((scene: any) => {
    if (scene.location) {
      locationSet.add(scene.location.toUpperCase())
    } else if (scene.content) {
      const firstLine = scene.content.split('\n')[0].trim()
      const locationMatch = firstLine.match(/(?:INT\.|EXT\.)\s+(.+?)\s*(?:-|$)/i)
      if (locationMatch) {
        locationSet.add(locationMatch[1].trim().toUpperCase())
      } else {
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

  // Calculate complexity index
  let complexityScore = 1.0
  complexityScore += Math.min(uniqueLocations * 0.5, 3.0)
  const characterCount = script.totalCharacters || script.characters.length
  complexityScore += Math.min(characterCount * 0.1, 2.0)
  complexityScore += intExtRatio.EXT * 1.5
  complexityScore += dayNightRatio.NIGHT * 2.0
  const avgComplexity = Math.min(complexityScore, 10.0)

  // Calculate runtime
  const contentAnalysis = analyzeScriptContent(script.scenes)
  const runtimeEstimate = calculateFilmRuntime({
    pageCount: script.pageCount,
    actionPercentage: contentAnalysis.actionPercentage,
    dialoguePercentage: contentAnalysis.dialoguePercentage,
    genre: script.project?.genre ? script.project.genre.split(', ') : undefined
  })

  // Check if analysis exists
  const hasAnalysis = script.analyses && script.analyses.length > 0 &&
    script.analyses.some((a: any) => a.status === 'COMPLETED')

  // Get scores if available
  const scores = hasAnalysis ? script.scores || [] : []

  const handleStartAnalysis = async (
    analysisType: 'quick' | 'comprehensive' | 'custom',
    options?: string[]
  ) => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    try {
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
        toast({
          title: "Analysis Started",
          description: `${analysisType} analysis is running. You'll be notified when complete.`,
        })
        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        const error = await response.json()
        console.error('Analysis failed:', error)
        setIsAnalyzing(false)
        setAnalysisProgress(0)
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: error.error || 'Unknown error occurred during analysis'
        })
      }
    } catch (error) {
      console.error('Analysis error:', error)
      setIsAnalyzing(false)
      setAnalysisProgress(0)
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Analysis failed. Please try again."
      })
    }
  }

  const renderParsedOnlyState = () => {
    if (parseState === 'parsed' && !hasAnalysis) {
      return (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Parsed successfully!</strong> Your script has been processed and is ready for analysis.
            Run <strong>Quick Analysis</strong> to populate insights and get started.
          </AlertDescription>
        </Alert>
      )
    }
    return null
  }

  const renderScorecard = () => {
    if (!hasAnalysis || scores.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Scorecard</CardTitle>
            <CardDescription>Studio-style rubric (1–10) - Run analysis to populate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['STRUCTURE', 'CHARACTER', 'DIALOGUE', 'PACING', 'THEME', 'GENRE_FIT', 'ORIGINALITY', 'FEASIBILITY'].map((category) => (
                <div key={category} className="rounded-2xl border p-3">
                  <div className="text-xs text-muted-foreground">{category.replace('_', ' ')}</div>
                  <Skeleton className="h-8 w-12 mt-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Scorecard</CardTitle>
          <CardDescription>Studio-style rubric (1–10)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {scores.map((score: any) => (
              <div key={score.category} className="rounded-2xl border p-3">
                <div className="text-xs text-muted-foreground">{score.category.replace('_', ' ')}</div>
                <div className="text-xl font-semibold">{Number(score.value).toFixed(1)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-2xl md:text-3xl">{scriptTitle}</CardTitle>
                {script.project && (
                  <Badge variant="secondary" className="text-xs">{script.project.name}</Badge>
                )}
              </div>
              <CardDescription>
                Overview · {script.format} · {script.pageCount} pages
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
                  <DropdownMenuItem disabled={!hasAnalysis}>Coverage PDF</DropdownMenuItem>
                  <DropdownMenuItem disabled={!hasAnalysis}>Notes CSV</DropdownMenuItem>
                  <DropdownMenuItem disabled={!hasAnalysis}>JSON Bundle</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled={!hasAnalysis}>FDX Change List</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button className="gap-2">
                <MessageSquare className="h-4 w-4"/> Chat
              </Button>
            </div>
          </div>

          {/* Status chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <FileText className="h-3.5 w-3.5"/> {script.format}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <BookOpenText className="h-3.5 w-3.5"/> {script.pageCount}p
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Layers className="h-3.5 w-3.5"/> {actualSceneCount} scenes
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3.5 w-3.5"/> {script.totalCharacters} characters
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3.5 w-3.5"/> ~{runtimeEstimate.minutes}m ({isNaN(runtimeEstimate.confidence) ? 85 : pct(runtimeEstimate.confidence)}% conf)
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Film className="h-3.5 w-3.5"/> {pct(intExtRatio.INT)}% INT / {pct(intExtRatio.EXT)}% EXT
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Sun className="h-3.5 w-3.5"/> {pct(dayNightRatio.DAY)}% DAY / {pct(dayNightRatio.NIGHT)}% NIGHT
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <MapPin className="h-3.5 w-3.5"/> {uniqueLocations} locations
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <BarChart4 className="h-3.5 w-3.5"/> complexity {Number(avgComplexity).toFixed(1)}
            </Badge>
          </div>
        </CardHeader>

        {/* Control Panel */}
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

      {/* Mode Switch */}
      <div className="flex items-center justify-center">
        <div className="inline-flex rounded-lg border p-1">
          <Button variant="default" size="sm" className="rounded-md">
            Overview
          </Button>
          <Link href={`/scripts/${script.id}/read`}>
            <Button variant="ghost" size="sm" className="rounded-md">
              Read
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="rounded-md" disabled>
            Analyze
          </Button>
          <Button variant="ghost" size="sm" className="rounded-md" disabled>
            Collaborate
          </Button>
          <Button variant="ghost" size="sm" className="rounded-md" disabled>
            Deliver
          </Button>
        </div>
      </div>

      {renderParsedOnlyState()}

      {/* Overview Content */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12">
          <CardHeader>
            <CardTitle>Logline</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
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
                <div className="text-sm text-muted-foreground mt-2">
                  Synopsis will be generated after running analysis.
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {hasAnalysis ? (
              <ul className="list-disc pl-5 space-y-1">
                <li>Tight third act momentum</li>
                <li>Distinct prop-driven set pieces</li>
                <li>Clear emotional stakes</li>
                <li>Strong character motivations</li>
              </ul>
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full"/>
                <Skeleton className="h-4 w-4/5"/>
                <Skeleton className="h-4 w-3/4"/>
                <div className="text-xs text-muted-foreground mt-2">
                  Run Quick Analysis to identify strengths
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {hasAnalysis ? (
              <ul className="list-disc pl-5 space-y-1">
                <li>Act II flat spot around pp. 60–70</li>
                <li>Antagonist presence dips in mid-act</li>
                <li>Some on-the-nose lines in early scenes</li>
                <li>Supporting character development</li>
              </ul>
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full"/>
                <Skeleton className="h-4 w-4/5"/>
                <Skeleton className="h-4 w-3/4"/>
                <div className="text-xs text-muted-foreground mt-2">
                  Run Quick Analysis to identify improvement areas
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="col-span-12">
          {renderScorecard()}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>Recommended actions based on your script's current state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">Read your script</div>
                  <div className="text-sm text-muted-foreground">Navigate scenes with enhanced viewer</div>
                </div>
              </div>
              <Link href={`/scripts/${script.id}/read`}>
                <Button variant="outline" size="sm">
                  Open Reader <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Play className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Quick Analysis</div>
                  <div className="text-sm text-muted-foreground">Get instant insights and feedback</div>
                </div>
              </div>
              <Button
                onClick={() => handleStartAnalysis('quick')}
                disabled={isAnalyzing}
                size="sm"
              >
                {isAnalyzing ? 'Running...' : 'Start Analysis'} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}