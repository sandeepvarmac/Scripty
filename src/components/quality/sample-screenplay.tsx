// Sample Screenplay Format Display Component
// Shows users proper screenplay formatting examples

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Download,
  Eye,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

const SAMPLE_SCREENPLAY = `FADE IN:

EXT. CENTRAL PARK - DAY

A beautiful autumn morning. Leaves crunch underfoot as people jog past. The sun filters through golden maple trees.

SARAH (30s, determined) sits on a park bench reading a script. She looks up as MIKE (40s, casual but intelligent) approaches with two coffee cups.

                    MIKE
            (nervous)
      Is this seat taken?

                    SARAH
            (looking up from script)
      It is now.

Mike sits down, offering her a coffee cup. She accepts it gratefully.

                    MIKE
      Screenplay?

                    SARAH
            (sighing)
      One that actually follows proper format.
      Scene headings, character names in caps,
      dialogue properly indented...

                    MIKE
            (grinning)
      The holy trinity of screenwriting.

                    SARAH
            (closing script)
      Exactly. Most people don't realize that
      AI analysis depends on this structure
      to understand the story.

She stands up, tucking the script under her arm.

                    SARAH (CONT'D)
      Want to grab a proper table? I can show
      you what separates amateur from
      professional formatting.

                    MIKE
      Lead the way, professor.

CUT TO:

INT. COFFEE SHOP - LATER

A cozy corner table. Sarah's script is open between them, her finger pointing to different elements.

                    SARAH
      See how every scene starts with location
      and time of day? That tells the AI - and
      readers - exactly where we are.

                    MIKE
            (studying the page)
      And the character names are always
      centered and in caps?

                    SARAH
      Always. Followed by dialogue that's
      indented and natural. No quotation marks
      needed in screenplays.

She flips to another page.

                    SARAH (CONT'D)
      Action lines are left-justified and
      describe what we see, not what characters
      think or feel.

                    MIKE
      It's like a blueprint for a movie.

                    SARAH
            (smiling)
      Now you're getting it.

FADE OUT.

THE END`

interface SampleScreenplayProps {
  onClose?: () => void
  downloadEnabled?: boolean
}

export default function SampleScreenplay({ onClose, downloadEnabled = true }: SampleScreenplayProps) {
  const handleDownload = () => {
    const element = document.createElement('a')
    const file = new Blob([SAMPLE_SCREENPLAY], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = 'sample-screenplay-format.fountain'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const formatPoints = [
    {
      element: 'Scene Headings',
      format: 'EXT./INT. LOCATION - TIME',
      example: 'EXT. CENTRAL PARK - DAY',
      icon: <FileText className="h-4 w-4" />,
      description: 'Always start with INT. or EXT., followed by location and time'
    },
    {
      element: 'Character Names',
      format: 'ALL CAPS, CENTERED',
      example: 'SARAH',
      icon: <CheckCircle2 className="h-4 w-4" />,
      description: 'Character names in all capitals, centered above dialogue'
    },
    {
      element: 'Dialogue',
      format: 'Indented, Natural',
      example: '"This is how characters speak."',
      icon: <Eye className="h-4 w-4" />,
      description: 'No quotation marks needed, indented under character names'
    },
    {
      element: 'Action Lines',
      format: 'Left-aligned, Present Tense',
      example: 'Sarah walks across the room.',
      icon: <AlertCircle className="h-4 w-4" />,
      description: 'Describe what we see, not what characters think'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Proper Screenplay Format
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Learn the industry-standard formatting that AI analysis requires
              </p>
            </div>
            <div className="flex gap-2">
              {downloadEnabled && (
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Sample
                </Button>
              )}
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Formatting Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Essential Elements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formatPoints.map((point, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="text-blue-600 mt-1">
                  {point.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{point.element}</h4>
                    <Badge variant="outline" className="text-xs">
                      {point.format}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {point.description}
                  </p>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {point.example}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sample Screenplay */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Complete Example</CardTitle>
          <p className="text-sm text-muted-foreground">
            A properly formatted screenplay excerpt showing all elements
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-gray-800 overflow-x-auto">
              {SAMPLE_SCREENPLAY}
            </pre>
          </div>

          {/* Key Points */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Why This Format Matters:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Scene headings</strong> tell AI where and when action occurs</li>
              <li>• <strong>Character names</strong> help identify speakers and relationships</li>
              <li>• <strong>Proper dialogue</strong> enables character voice analysis</li>
              <li>• <strong>Action lines</strong> describe visual storytelling elements</li>
              <li>• <strong>Transitions</strong> show pacing and story flow</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Export the sample text for use in other components
export { SAMPLE_SCREENPLAY }