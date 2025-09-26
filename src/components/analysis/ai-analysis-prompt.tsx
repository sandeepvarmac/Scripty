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
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <div className="animate-spin mr-3">
              <Brain className="h-5 w-5" />
            </div>
            AI Analysis in Progress
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Analyzing your script with advanced AI models...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-foreground">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="bg-muted" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-foreground">Genre Classification</span>
            </div>
            <div className="flex items-center space-x-2">
              {progress > 30 ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <div className="animate-spin">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
              )}
              <span className="text-foreground">Story Structure</span>
            </div>
            <div className="flex items-center space-x-2">
              {progress > 60 ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-foreground">Character Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              {progress > 80 ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-foreground">Final Review</span>
            </div>
          </div>

          <div className="p-3 bg-muted border border-border rounded-md">
            <p className="text-xs text-muted-foreground">
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
      <Card className="border-success/20 bg-gradient-to-br from-success/5 to-success/10">
        <CardHeader>
          <CardTitle className="flex items-center text-success">
            <CheckCircle className="h-5 w-5 mr-3" />
            AI Analysis Complete
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Professional analysis available with insights and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-success text-success-foreground">Genre Identified</Badge>
            <Badge className="bg-success text-success-foreground">Structure Analyzed</Badge>
            <Badge className="bg-success text-success-foreground">Characters Reviewed</Badge>
            <Badge className="bg-success text-success-foreground">Recommendations Ready</Badge>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={() => onStartAnalysis('comprehensive')}
              variant="outline"
              size="sm"
              className="border-success/30 text-success hover:bg-success/10"
            >
              <Brain className="h-4 w-4 mr-2" />
              Re-analyze
            </Button>
            <Button
              onClick={() => onStartAnalysis('quick')}
              variant="outline"
              size="sm"
              className="border-success/30 text-success hover:bg-success/10"
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
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center text-primary">
          <Brain className="h-5 w-5 mr-3" />
          AI Analysis Available
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Get professional insights, genre classification, and improvement recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Analysis Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quick Analysis */}
          <div className="p-4 border-2 border-warning/30 rounded-lg bg-gradient-to-br from-warning/5 to-warning/10 cursor-pointer hover:border-warning/40 transition-colors">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-5 w-5 text-warning" />
              <h4 className="font-semibold text-warning">Quick Analysis</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Fast overview with key insights and genre detection
            </p>
            <div className="space-y-1 text-xs text-warning">
              <div>⏱️ 1-2 minutes</div>
              <div>🎯 High-level insights</div>
              <div>🏷️ Genre classification</div>
            </div>
            <Button
              onClick={() => onStartAnalysis('quick')}
              size="sm"
              className="w-full mt-3 bg-warning hover:bg-warning/90 text-warning-foreground"
            >
              <Zap className="h-4 w-4 mr-2" />
              Start Quick Analysis
            </Button>
          </div>

          {/* Comprehensive Analysis */}
          <div className="p-4 border-2 border-primary/30 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 cursor-pointer hover:border-primary/40 transition-colors">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-primary">Comprehensive</h4>
            </div>
            <p className="text-xs text-primary mb-3">
              Complete professional analysis with detailed recommendations
            </p>
            <div className="space-y-1 text-xs text-primary">
              <div>⏱️ {estimatedTime}</div>
              <div>📊 Full structure analysis</div>
              <div>👥 Character development</div>
              <div>💬 Dialogue quality</div>
            </div>
            <Button
              onClick={() => onStartAnalysis('comprehensive')}
              size="sm"
              className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Brain className="h-4 w-4 mr-2" />
              Start Full Analysis
            </Button>
          </div>

          {/* Custom Analysis */}
          <div className="p-4 border-2 border-primary/20 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 cursor-pointer hover:border-primary/30 transition-colors">
            <div className="flex items-center space-x-2 mb-2">
              <Settings className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-primary">Custom</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Choose specific areas to analyze based on your needs
            </p>
            <div className="space-y-1 text-xs text-primary">
              <div>⚙️ Customizable scope</div>
              <div>🎯 Focused insights</div>
              <div>⏱️ Variable time</div>
            </div>
            <Button
              onClick={() => setShowCustomOptions(!showCustomOptions)}
              variant="outline"
              size="sm"
              className="w-full mt-3 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Settings className="h-4 w-4 mr-2" />
              Customize Analysis
            </Button>
          </div>
        </div>

        {/* Custom Options */}
        {showCustomOptions && (
          <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
            <h4 className="font-semibold text-primary mb-3 flex items-center">
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
                        ? 'border-primary/40 bg-primary/10'
                        : 'border-primary/20 bg-background hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-primary">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                      {isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {selectedOptions.length} areas selected • Est. {Math.max(1, selectedOptions.length)} minutes
              </p>
              <Button
                onClick={() => onStartAnalysis('custom', selectedOptions)}
                disabled={selectedOptions.length === 0}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Custom Analysis
              </Button>
            </div>
          </div>
        )}

        {/* What You'll Get */}
        <div className="p-4 bg-muted border border-border rounded-lg">
          <h4 className="font-semibold text-foreground mb-3 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            What You'll Get
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Film className="h-4 w-4 text-primary" />
              <span className="text-foreground">Genre classification & accuracy</span>
            </div>
            <div className="flex items-center space-x-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-foreground">Story structure analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-foreground">Character development review</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-foreground">Dialogue quality assessment</span>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-foreground">Industry comparison & score</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-foreground">Actionable recommendations</span>
            </div>
          </div>
        </div>

        {/* Missing Analysis Indicator */}
        <div className="p-3 bg-warning/10 border border-warning/20 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-warning" />
            <p className="text-sm font-medium text-warning">Analysis Needed</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Run AI analysis to unlock genre detection, professional insights, and improvement recommendations.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}