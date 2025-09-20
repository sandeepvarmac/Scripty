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

type AnalysisType = 'COMPREHENSIVE' | 'STRUCTURE' | 'PACING' | 'CHARACTER' | 'DIALOGUE' | 'FORMAT'

const analysisOptions: { type: AnalysisType; label: string; description: string }[] = [
  {
    type: 'COMPREHENSIVE',
    label: 'Comprehensive Analysis',
    description: 'Complete screenplay analysis covering all areas'
  },
  {
    type: 'STRUCTURE',
    label: 'Structure Analysis',
    description: 'Scene distribution and three-act structure'
  },
  {
    type: 'PACING',
    label: 'Pacing Analysis',
    description: 'Dialogue density and action flow'
  },
  {
    type: 'CHARACTER',
    label: 'Character Analysis',
    description: 'Character distribution and development'
  },
  {
    type: 'DIALOGUE',
    label: 'Dialogue Analysis',
    description: 'Dialogue quality and exposition detection'
  },
  {
    type: 'FORMAT',
    label: 'Format Analysis',
    description: 'Screenplay formatting compliance'
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
        `Analysis completed!\n\n` +
        `${successCount}/${analysisCount} analyses completed successfully.\n` +
        `Check the Analysis Dashboard below for detailed results.`
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
        <span>{isAnalyzing ? 'Analyzing...' : 'Run Analysis'}</span>
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