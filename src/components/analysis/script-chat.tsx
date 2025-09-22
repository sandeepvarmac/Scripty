'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MessageCircle,
  Send,
  Bot,
  User,
  ExternalLink,
  FileText,
  Lightbulb,
  ChevronUp,
  ChevronDown,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import type { Analysis, Character, Evidence, Scene, Script } from '@prisma/client'

type SceneWithEvidence = Scene & { evidences: Evidence[] }
type ScriptWithData = Script & {
  scenes: SceneWithEvidence[]
  characters: Character[]
  analyses: Analysis[]
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  references?: {
    sceneId?: string
    sceneNumber?: string
    lineNumber?: number
    analysisId?: string
    analysisType?: string
  }[]
}

interface ScriptChatProps {
  script: ScriptWithData
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

const suggestedQuestions = [
  "Why did the AI say my dialogue feels stiff?",
  "How can I improve the pacing in Act II?",
  "What makes my genre classification unclear?",
  "Which characters need more development?",
  "What are the main structural issues?",
  "How does my script compare to genre conventions?",
  "What's working well in my script?",
  "Which scenes have the most issues?"
]

export function ScriptChat({
  script,
  isCollapsed = false,
  onToggleCollapse
}: ScriptChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your script assistant. I've analyzed "${script.title || script.originalFilename}" and I'm here to answer any questions about the analysis results, recommendations, or specific aspects of your script. What would you like to know?`,
      timestamp: new Date(),
      references: []
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      references: []
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Simulate API call to script-aware chatbot
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Mock AI response with contextual information
      const aiResponse = generateContextualResponse(message, script)

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        references: aiResponse.references
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
        references: []
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputValue)
    }
  }

  const handleViewReference = (reference: ChatMessage['references'][0]) => {
    if (reference?.sceneId) {
      // This would typically scroll to or highlight the referenced scene
      console.log('Viewing scene reference:', reference)
      alert(`Would navigate to Scene ${reference.sceneNumber || 'N/A'}, Line ${reference.lineNumber || 'N/A'}`)
    } else if (reference?.analysisId) {
      // This would typically show the referenced analysis
      console.log('Viewing analysis reference:', reference)
      alert(`Would show ${reference.analysisType || 'analysis'} results`)
    }
  }

  if (isCollapsed) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-lg text-blue-900">Script Assistant</CardTitle>
                <CardDescription className="text-blue-700">
                  Ask questions about your analysis
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={onToggleCollapse}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <ChevronUp className="h-4 w-4" />
              Expand Chat
            </Button>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">Script Assistant</CardTitle>
              <CardDescription>
                Ask anything about your script analysis, recommendations, or specific scenes
              </CardDescription>
            </div>
          </div>
          {onToggleCollapse && (
            <Button
              onClick={onToggleCollapse}
              variant="outline"
              size="sm"
            >
              <ChevronDown className="h-4 w-4" />
              Minimize
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <div className={`p-1 rounded-full ${
                    message.role === 'user' ? 'bg-blue-500' : 'bg-gray-100'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-3 w-3 text-white" />
                    ) : (
                      <Bot className="h-3 w-3 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${
                      message.role === 'user' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {message.content}
                    </p>

                    {/* References */}
                    {message.references && message.references.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.references.map((ref, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 text-xs"
                          >
                            <Badge
                              variant="outline"
                              className="cursor-pointer hover:bg-gray-100"
                              onClick={() => handleViewReference(ref)}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              {ref.sceneNumber ? `Scene ${ref.sceneNumber}` :
                               ref.analysisType ? `${ref.analysisType} Analysis` :
                               'Reference'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {format(message.timestamp, 'HH:mm')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                  <span className="text-sm text-gray-600">Assistant is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Suggested questions:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestedQuestions.slice(0, 6).map((question, index) => (
                <Button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  variant="outline"
                  size="sm"
                  className="text-left justify-start h-auto py-2 px-3 whitespace-normal"
                >
                  <Lightbulb className="h-3 w-3 mr-2 shrink-0" />
                  <span className="text-xs">{question}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t pt-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your script analysis, specific scenes, or recommendations..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                rows={2}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Mock function to generate contextual responses
function generateContextualResponse(
  question: string,
  script: ScriptWithData
): { content: string; references: ChatMessage['references'] } {
  const latestAnalysis = script.analyses
    .filter(a => a.status === 'COMPLETED')
    .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())[0]

  const questionLower = question.toLowerCase()

  // Mock responses based on question content
  if (questionLower.includes('dialogue') && questionLower.includes('stiff')) {
    return {
      content: `Looking at your script, I notice 3 patterns that create stiff dialogue:

1. **Over-exposition**: Characters often state exactly what they're thinking instead of showing it through subtext
2. **Lack of interruptions**: Real conversations have overlaps, interruptions, and incomplete thoughts
3. **Formal language**: Your characters speak too formally for their situations and relationships

**Specific examples I found:**
- Scene 3, lines 45-52: The conversation between Sarah and Mike feels like they're delivering information rather than having a natural exchange
- Scene 7: Characters use full names when they would typically use nicknames or no names at all

**Quick fixes:**
- Add more contractions and casual language
- Let characters talk around what they really mean
- Include more interruptions and overlapping dialogue`,
      references: [
        { sceneId: 'scene-3', sceneNumber: '3', lineNumber: 45 },
        { sceneId: 'scene-7', sceneNumber: '7', lineNumber: 78 },
        { analysisId: latestAnalysis?.id, analysisType: 'Dialogue Quality' }
      ]
    }
  }

  if (questionLower.includes('pacing') && questionLower.includes('act ii')) {
    return {
      content: `Act II pacing issues are common, and I see several in your script:

**The main problem**: Your second act lacks escalating tension. The conflict plateaus around page 45 and doesn't build until page 85.

**Specific issues:**
- Pages 45-65: Too many scenes of characters discussing the problem without taking action
- Missing midpoint crisis: There's no major reversal or revelation around page 60
- Subplot overwhelms: The romantic subplot takes focus away from the main conflict

**Recommended fixes:**
1. Add a major setback or revelation at the midpoint (around Scene 12)
2. Cut or consolidate the discussion scenes between pages 45-65
3. Raise the stakes progressively - each scene should make things worse for your protagonist`,
      references: [
        { sceneId: 'scene-12', sceneNumber: '12', lineNumber: 450 },
        { analysisId: latestAnalysis?.id, analysisType: 'Story Structure' }
      ]
    }
  }

  if (questionLower.includes('genre')) {
    const analysisResults = latestAnalysis?.results as any || {}
    const genre = analysisResults.genre || 'Unknown'

    return {
      content: `I classified your script as **${genre}** based on several factors:

**Why this classification:**
- Your central conflict revolves around family relationships and personal growth
- The tone is dramatic but includes moments of levity typical of family dramas
- The resolution focuses on emotional healing rather than external plot resolution

**Potential confusion factors:**
- Some thriller elements in the middle act might muddy the genre waters
- The pacing occasionally feels more like an action script than a character drama

**To strengthen genre clarity:**
- Emphasize the family dynamics more consistently
- Reduce the thriller elements or integrate them more naturally into the family story
- Focus on character emotional journeys over plot mechanics`,
      references: [
        { analysisId: latestAnalysis?.id, analysisType: 'Genre Analysis' }
      ]
    }
  }

  // Default response
  return {
    content: `That's a great question about your script! Based on my analysis of "${script.title || script.originalFilename}", I can help you with specific insights.

Could you be more specific about what aspect you'd like me to focus on? For example:
- A particular scene or character
- A specific recommendation from the analysis
- A structural or pacing concern
- Dialogue in a certain section

The more specific you are, the better I can reference exact scenes and provide actionable advice.`,
    references: []
  }
}