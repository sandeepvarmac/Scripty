'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Play, ChevronDown, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface AnalysisControlsProps {
  scriptId: string
}

type AnalysisType = 'QUICK_OVERVIEW' | 'COMPREHENSIVE' | 'STORY_STRUCTURE' | 'CHARACTER_DEVELOPMENT' | 'DIALOGUE_QUALITY' | 'PACING_FLOW' | 'THEME_ANALYSIS'

const quickOptions: { type: AnalysisType; label: string; description: string; duration: string }[] = [
  {
    type: 'QUICK_OVERVIEW',
    label: '⚡ Quick Overview',
    description: 'Fast high-level insights across all screenplay elements',
    duration: '1-2 min'
  }
]

const detailedOptions: { type: AnalysisType; label: string; description: string; duration: string }[] = [
  {
    type: 'STORY_STRUCTURE',
    label: 'Story Structure',
    description: 'Three-act structure, plot points, and story progression',
    duration: '3-5 min'
  },
  {
    type: 'CHARACTER_DEVELOPMENT',
    label: 'Character Development',
    description: 'Character arcs, dialogue authenticity, and relationships',
    duration: '3-5 min'
  },
  {
    type: 'DIALOGUE_QUALITY',
    label: 'Dialogue Quality',
    description: 'Dialogue authenticity, subtext, and voice differentiation',
    duration: '3-5 min'
  },
  {
    type: 'PACING_FLOW',
    label: 'Pacing & Flow',
    description: 'Scene transitions, rhythm, and momentum analysis',
    duration: '3-5 min'
  },
  {
    type: 'THEME_ANALYSIS',
    label: 'Theme Analysis',
    description: 'Central themes, symbolic elements, and emotional resonance',
    duration: '3-5 min'
  }
]

const comprehensiveOptions: { type: AnalysisType; label: string; description: string; duration: string }[] = [
  {
    type: 'COMPREHENSIVE',
    label: '🎬 Full Professional Coverage',
    description: 'Complete AI-powered screenplay analysis with all elements',
    duration: '5-10 min'
  }
]

export function AnalysisControls({ scriptId }: AnalysisControlsProps) {
  const { toast } = useToast()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const router = useRouter()

  const runAnalysis = async (analysisTypes: AnalysisType[]) => {
    setIsAnalyzing(true)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scriptId,
          analysisTypes
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed')
      }

      // Show success message
      const analysisCount = result.data.analyses.length
      const successCount = result.data.analyses.filter((a: any) => a.status === 'COMPLETED').length

      toast({
        title: "🤖 AI Analysis Complete!",
        description: `${successCount}/${analysisCount} AI-powered analyses completed successfully. Professional screenplay coverage and insights are now available below.`
      })

      // Refresh the page to show new results
      router.refresh()

    } catch (error) {
      console.error('Analysis error:', error)
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        onClick={() => runAnalysis(['QUICK_OVERVIEW'])}
        disabled={isAnalyzing}
        variant="brand"
        className="flex items-center space-x-2"
      >
        {isAnalyzing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        <span>{isAnalyzing ? 'AI Analyzing...' : '⚡ Quick Overview'}</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isAnalyzing}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          {/* Quick Analysis */}
          <div className="px-2 py-1.5">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Start</h4>
          </div>
          {quickOptions.map((option) => (
            <DropdownMenuItem
              key={option.type}
              onClick={() => runAnalysis([option.type])}
              className="flex flex-col items-start space-y-1 p-3"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-brand font-medium">{option.duration}</span>
              </div>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </DropdownMenuItem>
          ))}

          {/* Detailed Analysis */}
          <div className="px-2 py-1.5 border-t mt-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Detailed Analysis</h4>
          </div>
          {detailedOptions.map((option) => (
            <DropdownMenuItem
              key={option.type}
              onClick={() => runAnalysis([option.type])}
              className="flex flex-col items-start space-y-1 p-3"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-brand font-medium">{option.duration}</span>
              </div>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </DropdownMenuItem>
          ))}

          {/* Comprehensive Analysis */}
          <div className="px-2 py-1.5 border-t mt-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Complete Coverage</h4>
          </div>
          {comprehensiveOptions.map((option) => (
            <DropdownMenuItem
              key={option.type}
              onClick={() => runAnalysis([option.type])}
              className="flex flex-col items-start space-y-1 p-3"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-brand font-medium">{option.duration}</span>
              </div>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}