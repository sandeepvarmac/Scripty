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

interface AnalysisControlsProps {
  scriptId: string
}

type AnalysisType = 'COMPREHENSIVE' | 'STORY_STRUCTURE' | 'CHARACTER_DEVELOPMENT' | 'DIALOGUE_QUALITY' | 'PACING_FLOW' | 'THEME_ANALYSIS'

const analysisOptions: { type: AnalysisType; label: string; description: string }[] = [
  {
    type: 'COMPREHENSIVE',
    label: 'Comprehensive Coverage',
    description: 'Full AI-powered screenplay analysis and professional coverage'
  },
  {
    type: 'STORY_STRUCTURE',
    label: 'Story Structure',
    description: 'Three-act structure, plot points, and story progression'
  },
  {
    type: 'CHARACTER_DEVELOPMENT',
    label: 'Character Development',
    description: 'Character arcs, dialogue authenticity, and relationships'
  },
  {
    type: 'DIALOGUE_QUALITY',
    label: 'Dialogue Quality',
    description: 'Dialogue authenticity, subtext, and voice differentiation'
  },
  {
    type: 'PACING_FLOW',
    label: 'Pacing & Flow',
    description: 'Scene transitions, rhythm, and momentum analysis'
  },
  {
    type: 'THEME_ANALYSIS',
    label: 'Theme Analysis',
    description: 'Central themes, symbolic elements, and emotional resonance'
  }
]

export function AnalysisControls({ scriptId }: AnalysisControlsProps) {
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

      alert(
        `🤖 AI Analysis Complete!\n\n` +
        `${successCount}/${analysisCount} AI-powered analyses completed successfully.\n` +
        `Professional screenplay coverage and insights are now available below.`
      )

      // Refresh the page to show new results
      router.refresh()

    } catch (error) {
      console.error('Analysis error:', error)
      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        onClick={() => runAnalysis(['COMPREHENSIVE'])}
        disabled={isAnalyzing}
        variant="brand"
        className="flex items-center space-x-2"
      >
        {isAnalyzing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        <span>{isAnalyzing ? 'AI Analyzing...' : 'Run AI Analysis'}</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isAnalyzing}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {analysisOptions.map((option) => (
            <DropdownMenuItem
              key={option.type}
              onClick={() => runAnalysis([option.type])}
              className="flex flex-col items-start space-y-1 p-3"
            >
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}