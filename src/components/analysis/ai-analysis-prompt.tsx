'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  Clock,
  Zap,
  Brain,
  Settings,
  Play,
  Sparkles,
  BarChart3,
  Users,
  MessageSquare,
  Film,
  Layers,
  AlertCircle,
  Info
} from 'lucide-react'

export interface AIAnalysisPromptProps {
  scriptId: string
  hasAnalysis: boolean
  onStartAnalysis: (analysisType: 'quick' | 'comprehensive' | 'custom', options?: string[]) => void
  estimatedTime?: string
  isAnalyzing?: boolean
  progress?: number
}

const analysisOptions = [
  {
    id: 'genre',
    label: 'Genre Classification',
    icon: Film,
    description: 'Identify primary and secondary genres based on story elements'
  },
  {
    id: 'structure',
    label: 'Story Structure',
    icon: Layers,
    description: 'Analyze three-act structure, pacing, and plot points'
  },
  {
    id: 'characters',
    label: 'Character Development',
    icon: Users,
    description: 'Evaluate character arcs, motivations, and relationships'
  },
  {
    id: 'dialogue',
    label: 'Dialogue Quality',
    icon: MessageSquare,
    description: 'Assess authenticity, voice, and subtext in conversations'
  },
  {
    id: 'pacing',
    label: 'Pacing & Flow',
    icon: BarChart3,
    description: 'Review scene transitions, rhythm, and momentum'
  },
  {
    id: 'themes',
    label: 'Theme Analysis',
    icon: Sparkles,
    description: 'Explore central themes and symbolic elements'
  }
]

export function AIAnalysisPrompt({
  scriptId,
  hasAnalysis,
  onStartAnalysis,
  estimatedTime = "2-3 minutes",
  isAnalyzing = false,
  progress = 0
}: AIAnalysisPromptProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [showCustomOptions, setShowCustomOptions] = useState(false)

  const handleOptionToggle = (optionId: string) => {
    setSelectedOptions(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    )
  }

  if (isAnalyzing) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <div className="animate-spin mr-3">
              <Brain className="h-5 w-5" />
            </div>
            AI Analysis in Progress
          </CardTitle>
          <CardDescription className="text-blue-700">
            Analyzing your script with advanced AI models...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-blue-800">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="bg-blue-200" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-blue-800">Genre Classification</span>
            </div>
            <div className="flex items-center space-x-2">
              {progress > 30 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <div className="animate-spin">
                  <Brain className="h-4 w-4 text-blue-600" />
                </div>
              )}
              <span className="text-blue-800">Story Structure</span>
            </div>
            <div className="flex items-center space-x-2">
              {progress > 60 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Clock className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-blue-800">Character Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              {progress > 80 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Clock className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-blue-800">Final Review</span>
            </div>
          </div>

          <div className="p-3 bg-blue-100 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-700">
              You can explore the parsed script data while the analysis completes.
              Results will appear automatically as they become available.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (hasAnalysis) {
    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
        <CardHeader>
          <CardTitle className="flex items-center text-green-900">
            <CheckCircle className="h-5 w-5 mr-3" />
            AI Analysis Complete
          </CardTitle>
          <CardDescription className="text-green-700">
            Professional analysis available with insights and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-green-600 text-white">Genre Identified</Badge>
            <Badge className="bg-green-600 text-white">Structure Analyzed</Badge>
            <Badge className="bg-green-600 text-white">Characters Reviewed</Badge>
            <Badge className="bg-green-600 text-white">Recommendations Ready</Badge>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={() => onStartAnalysis('comprehensive')}
              variant="outline"
              size="sm"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <Brain className="h-4 w-4 mr-2" />
              Re-analyze
            </Button>
            <Button
              onClick={() => onStartAnalysis('quick')}
              variant="outline"
              size="sm"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <Zap className="h-4 w-4 mr-2" />
              Quick Update
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-900">
          <Brain className="h-5 w-5 mr-3" />
          AI Analysis Available
        </CardTitle>
        <CardDescription className="text-blue-700">
          Get professional insights, genre classification, and improvement recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Analysis Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quick Analysis */}
          <div className="p-4 border-2 border-yellow-200 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 cursor-pointer hover:border-yellow-300 transition-colors">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <h4 className="font-semibold text-yellow-900">Quick Analysis</h4>
            </div>
            <p className="text-xs text-yellow-700 mb-3">
              Fast overview with key insights and genre detection
            </p>
            <div className="space-y-1 text-xs text-yellow-600">
              <div>⏱️ 1-2 minutes</div>
              <div>🎯 High-level insights</div>
              <div>🏷️ Genre classification</div>
            </div>
            <Button
              onClick={() => onStartAnalysis('quick')}
              size="sm"
              className="w-full mt-3 bg-yellow-600 hover:bg-yellow-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Start Quick Analysis
            </Button>
          </div>

          {/* Comprehensive Analysis */}
          <div className="p-4 border-2 border-blue-300 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 cursor-pointer hover:border-blue-400 transition-colors">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="h-5 w-5 text-blue-700" />
              <h4 className="font-semibold text-blue-900">Comprehensive</h4>
            </div>
            <p className="text-xs text-blue-700 mb-3">
              Complete professional analysis with detailed recommendations
            </p>
            <div className="space-y-1 text-xs text-blue-600">
              <div>⏱️ {estimatedTime}</div>
              <div>📊 Full structure analysis</div>
              <div>👥 Character development</div>
              <div>💬 Dialogue quality</div>
            </div>
            <Button
              onClick={() => onStartAnalysis('comprehensive')}
              size="sm"
              className="w-full mt-3"
            >
              <Brain className="h-4 w-4 mr-2" />
              Start Full Analysis
            </Button>
          </div>

          {/* Custom Analysis */}
          <div className="p-4 border-2 border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 cursor-pointer hover:border-purple-300 transition-colors">
            <div className="flex items-center space-x-2 mb-2">
              <Settings className="h-5 w-5 text-purple-600" />
              <h4 className="font-semibold text-purple-900">Custom</h4>
            </div>
            <p className="text-xs text-purple-700 mb-3">
              Choose specific areas to analyze based on your needs
            </p>
            <div className="space-y-1 text-xs text-purple-600">
              <div>⚙️ Customizable scope</div>
              <div>🎯 Focused insights</div>
              <div>⏱️ Variable time</div>
            </div>
            <Button
              onClick={() => setShowCustomOptions(!showCustomOptions)}
              variant="outline"
              size="sm"
              className="w-full mt-3 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Settings className="h-4 w-4 mr-2" />
              Customize Analysis
            </Button>
          </div>
        </div>

        {/* Custom Options */}
        {showCustomOptions && (
          <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
            <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Choose Analysis Areas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {analysisOptions.map((option) => {
                const Icon = option.icon
                const isSelected = selectedOptions.includes(option.id)
                return (
                  <div
                    key={option.id}
                    onClick={() => handleOptionToggle(option.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-purple-400 bg-purple-100'
                        : 'border-purple-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded ${isSelected ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-purple-900">{option.label}</div>
                        <div className="text-xs text-purple-600">{option.description}</div>
                      </div>
                      {isSelected && <CheckCircle className="h-4 w-4 text-purple-600" />}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-purple-600">
                {selectedOptions.length} areas selected • Est. {Math.max(1, selectedOptions.length)} minutes
              </p>
              <Button
                onClick={() => onStartAnalysis('custom', selectedOptions)}
                disabled={selectedOptions.length === 0}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Custom Analysis
              </Button>
            </div>
          </div>
        )}

        {/* What You'll Get */}
        <div className="p-4 bg-blue-100 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            What You'll Get
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Film className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800">Genre classification & accuracy</span>
            </div>
            <div className="flex items-center space-x-2">
              <Layers className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800">Story structure analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800">Character development review</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800">Dialogue quality assessment</span>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800">Industry comparison & score</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800">Actionable recommendations</span>
            </div>
          </div>
        </div>

        {/* Missing Analysis Indicator */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">Analysis Needed</p>
          </div>
          <p className="text-xs text-amber-700 mt-1">
            Run AI analysis to unlock genre detection, professional insights, and improvement recommendations.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}