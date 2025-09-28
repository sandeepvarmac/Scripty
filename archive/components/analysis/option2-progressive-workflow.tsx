'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Film,
  Clock,
  Users,
  MapPin,
  Sun,
  Moon,
  Download,
  BookOpenText,
  Layers,
  Building,
  BarChart4,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  ShieldAlert,
  Info,
  Search,
  AlertTriangle,
  Star,
  MessageSquare,
  Eye,
  Link2,
  ExternalLink,
  Settings,
  Target,
  Brain,
  Lightbulb,
  Network,
  Globe,
  Heart,
  Zap,
  Sparkles,
  Camera,
  PieChart,
  Calendar,
  Timer,
  Award,
  Share2,
  Home,
  ChevronRight,
  Play,
  Rocket,
  ChevronDown,
  UploadCloud
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

// Mock data
const mockScript = {
  id: "script-dark-echo",
  title: "Dark Echo",
  author: "Alex Thompson",
  format: "FDX",
  pageCount: 110,
  totalScenes: 45,
  totalCharacters: 8,
  logline: "A young woman trapped in her apartment discovers that the sounds from her neighbors aren't what they seem, leading to a terrifying revelation about the building's dark history.",
  synopsisShort: "Emma moves into a seemingly quiet apartment building, but strange sounds from neighboring units reveal a supernatural conspiracy that threatens her sanity and survival.",
  project: { name: "Urban Horror Collection", type: "Feature" },
  genre: "Supernatural Thriller",
  qualityScore: 0.92,
  runtime: 108,
  complexity: 6.8,
  uniqueLocations: 12,
  intExtRatio: { INT: 0.75, EXT: 0.25 },
  dayNightRatio: { DAY: 0.45, NIGHT: 0.55 },
  coverage: "CONSIDER",
  scores: [
    { category: 'STRUCTURE', value: 8.2, description: 'Well-paced three-act structure' },
    { category: 'CHARACTER', value: 7.5, description: 'Protagonist compelling but supporting cast needs depth' },
    { category: 'DIALOGUE', value: 7.8, description: 'Natural conversations with good subtext' },
    { category: 'PACING', value: 8.0, description: 'Tension builds effectively' },
    { category: 'THEME', value: 7.2, description: 'Strong isolation themes, could explore deeper' },
    { category: 'WORLD', value: 8.5, description: 'Atmospheric setting effectively realized' }
  ],
  characters: [
    { name: "EMMA TORRES", role: "Protagonist", dialogueCount: 152, firstAppearance: 3, description: "24, graduate student, observant but isolated" },
    { name: "MR. CHEN", role: "Supporting", dialogueCount: 34, firstAppearance: 12, description: "Elderly neighbor, knows building's secrets" },
    { name: "DETECTIVE RIVERA", role: "Supporting", dialogueCount: 28, firstAppearance: 45, description: "Investigates disappearances" },
    { name: "LANDLORD", role: "Antagonist", dialogueCount: 19, firstAppearance: 8, description: "Conceals building's dark history" }
  ],
  notes: [
    {
      id: "note-1",
      severity: "HIGH",
      area: "STRUCTURE",
      page: 62,
      scene: 28,
      excerpt: "Midpoint revelation feels rushed",
      suggestion: "Extend the discovery sequence to build more tension"
    },
    {
      id: "note-2",
      severity: "MEDIUM",
      area: "CHARACTER",
      page: 78,
      scene: 35,
      excerpt: "Detective's motivation unclear",
      suggestion: "Add personal stake or backstory connection"
    },
    {
      id: "note-3",
      severity: "LOW",
      area: "DIALOGUE",
      page: 91,
      scene: 42,
      excerpt: "Exposition heavy in apartment manager scene",
      suggestion: "Weave information more naturally through action"
    }
  ],
  riskFlags: [
    {
      id: "risk-1",
      kind: "TRADEMARK",
      page: 34,
      snippet: "Reference to specific apartment security system brand"
    },
    {
      id: "risk-2",
      kind: "LOCATION",
      page: 67,
      snippet: "Filming in actual apartment building may require permits"
    }
  ],
  beatsData: [
    { page: 8, conf: 0.9, label: "Inciting Incident" },
    { page: 25, conf: 0.8, label: "Plot Point 1" },
    { page: 55, conf: 0.7, label: "Midpoint" },
    { page: 82, conf: 0.85, label: "Plot Point 2" },
    { page: 105, conf: 0.95, label: "Climax" }
  ],
  pageMetrics: [
    { page: 10, dialogue: 8, action: 12, tension: 6 },
    { page: 20, dialogue: 15, action: 8, tension: 7 },
    { page: 30, dialogue: 12, action: 10, tension: 8 },
    { page: 40, dialogue: 9, action: 14, tension: 9 },
    { page: 50, dialogue: 11, action: 11, tension: 7 },
    { page: 60, dialogue: 13, action: 9, tension: 8 },
    { page: 70, dialogue: 10, action: 13, tension: 9 },
    { page: 80, dialogue: 8, action: 15, tension: 10 },
    { page: 90, dialogue: 7, action: 16, tension: 12 },
    { page: 100, dialogue: 5, action: 18, tension: 15 }
  ]
}

const pct = (n: number) => Math.round(n * 100)

export function Option2ProgressiveWorkflow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [deepDiveArea, setDeepDiveArea] = useState<string | null>(null)

  const steps = [
    {
      number: 1,
      title: "Quick Overview",
      description: "Get instant insights about your script",
      icon: Eye,
      status: currentStep >= 1 ? "completed" : "pending"
    },
    {
      number: 2,
      title: "Choose Your Path",
      description: "Select your analysis focus",
      icon: Target,
      status: currentStep >= 2 ? "completed" : currentStep === 2 ? "active" : "pending"
    },
    {
      number: 3,
      title: "Deep Dive",
      description: "Comprehensive analysis in your chosen area",
      icon: Brain,
      status: currentStep >= 3 ? "completed" : currentStep === 3 ? "active" : "pending"
    },
    {
      number: 4,
      title: "Actions & Exports",
      description: "Get deliverables and next steps",
      icon: Download,
      status: currentStep >= 4 ? "completed" : currentStep === 4 ? "active" : "pending"
    }
  ]

  const analysisPathOptions = [
    {
      key: 'coverage',
      title: 'Coverage Analysis',
      description: 'Studio-style coverage and recommendations',
      icon: FileText,
      badge: 'CONSIDER',
      areas: ['Overview', 'Strengths/Weaknesses', 'Comparisons', 'Recommendation']
    },
    {
      key: 'craft',
      title: 'Creative Development',
      description: 'Structure, character, dialogue, and craft analysis',
      icon: Brain,
      badge: 'COMPREHENSIVE',
      areas: ['Structure & Beats', 'Character Arcs', 'Dialogue Quality', 'Theme Analysis']
    },
    {
      key: 'production',
      title: 'Production Planning',
      description: 'Budget, locations, and feasibility assessment',
      icon: Camera,
      badge: 'PRACTICAL',
      areas: ['Location Breakdown', 'Budget Factors', 'Complexity Analysis', 'Risk Assessment']
    },
    {
      key: 'notes',
      title: 'Development Notes',
      description: 'Detailed feedback and actionable suggestions',
      icon: MessageSquare,
      badge: 'DETAILED',
      areas: ['High Priority Issues', 'Medium Priority', 'Low Priority', 'Scene-by-Scene']
    }
  ]

  const renderStepIndicator = () => (
    <Card className="shadow-sm mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{mockScript.title}</h2>
            <p className="text-muted-foreground">Progressive Analysis Workflow</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{mockScript.format}</Badge>
            <Badge variant="secondary">{mockScript.pageCount} pages</Badge>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 mb-2
                    ${step.status === 'completed' ? 'bg-green-100 border-green-500 text-green-700' :
                      step.status === 'active' ? 'bg-blue-100 border-blue-500 text-blue-700' :
                      'bg-gray-100 border-gray-300 text-gray-500'}
                  `}
                >
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-6 w-6" />
                  )}
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">{step.title}</div>
                  <div className="text-xs text-muted-foreground max-w-[120px]">
                    {step.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                    w-16 h-0.5 mx-4 mt-[-30px]
                    ${step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}
                  `}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between">
          <Button
            variant="outline"
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            onClick={() => currentStep < 4 && setCurrentStep(currentStep + 1)}
            disabled={currentStep === 4}
            className="gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderStep1Overview = () => (
    <div className="grid grid-cols-12 gap-4">
      {/* Quick Stats */}
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Quick Insights
          </CardTitle>
          <CardDescription>Key metrics and immediate takeaways</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">8.2</div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{mockScript.totalScenes}</div>
              <div className="text-sm text-muted-foreground">Scenes</div>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">{mockScript.runtime}m</div>
              <div className="text-sm text-muted-foreground">Runtime</div>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">{mockScript.complexity}</div>
              <div className="text-sm text-muted-foreground">Complexity</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2 text-green-700">✓ Strengths</h4>
              <ul className="text-sm space-y-1">
                <li>• Strong atmospheric tension</li>
                <li>• Clear protagonist journey</li>
                <li>• Effective third act momentum</li>
                <li>• Practical location constraints</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-amber-700">⚠ Areas to Improve</h4>
              <ul className="text-sm space-y-1">
                <li>• Act II pacing dip around page 60</li>
                <li>• Supporting characters need depth</li>
                <li>• Some exposition-heavy dialogue</li>
                <li>• Antagonist presence could be stronger</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logline */}
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>Logline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm italic">"{mockScript.logline}"</p>
        </CardContent>
      </Card>

      {/* Quick Scorecard */}
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>Quality Scorecard</CardTitle>
          <CardDescription>Initial assessment across key areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {mockScript.scores.map((score) => (
              <div key={score.category} className="rounded-xl border p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-muted-foreground">{score.category}</div>
                  <div className="text-lg font-semibold">{score.value}</div>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{width: `${score.value * 10}%`}}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{score.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderStep2PathSelection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Choose Your Analysis Path
          </CardTitle>
          <CardDescription>
            Select the area you want to focus on for comprehensive analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysisPathOptions.map((path) => (
              <Card
                key={path.key}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPath === path.key ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedPath(path.key)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <path.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{path.title}</h3>
                        <p className="text-sm text-muted-foreground">{path.description}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">{path.badge}</Badge>
                  </div>

                  <div className="text-sm">
                    <div className="font-medium mb-2">Focus Areas:</div>
                    <div className="flex flex-wrap gap-1">
                      {path.areas.map((area, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {selectedPath === path.key && (
                    <div className="mt-3 p-2 bg-blue-100 rounded text-sm text-blue-800">
                      ✓ Selected - Click Next to proceed with {path.title}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderStep3DeepDive = () => {
    if (!selectedPath) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-semibold mb-2">No Analysis Path Selected</h3>
            <p className="text-muted-foreground mb-4">Please go back to Step 2 and select an analysis path.</p>
            <Button onClick={() => setCurrentStep(2)} variant="outline">
              Go Back to Path Selection
            </Button>
          </CardContent>
        </Card>
      )
    }

    const selectedPathData = analysisPathOptions.find(p => p.key === selectedPath)

    switch(selectedPath) {
      case 'coverage':
        return renderCoverageDeepDive()
      case 'craft':
        return renderCraftDeepDive()
      case 'production':
        return renderProductionDeepDive()
      case 'notes':
        return renderNotesDeepDive()
      default:
        return renderCoverageDeepDive()
    }
  }

  const renderCoverageDeepDive = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Coverage Analysis Deep Dive
          </CardTitle>
          <CardDescription>Studio-style coverage assessment and recommendation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Final Recommendation</h4>
                <Badge variant="secondary" className="text-lg px-4 py-2">CONSIDER</Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Strong atmospheric horror with solid protagonist journey, but needs supporting character development.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Comparable Films</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">The Shining (isolation)</Badge>
                  <Badge variant="outline">Rear Window (confined space)</Badge>
                  <Badge variant="outline">Rosemary's Baby (apartment horror)</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Market Positioning</h4>
                <ul className="text-sm space-y-1">
                  <li>• Target: R-rated horror/thriller</li>
                  <li>• Budget Range: Low-mid ($2-8M)</li>
                  <li>• Platform: Theatrical + streaming</li>
                  <li>• Audience: Horror fans, psychological thriller enthusiasts</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Beat Structure Analysis</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockScript.beatsData.map((b) => ({ x: b.page, y: b.conf }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                    <RTooltip />
                    <Area type="monotone" dataKey="y" stroke="currentColor" fill="currentColor" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li>✓ Compelling atmospheric tension throughout</li>
              <li>✓ Strong protagonist with clear motivation</li>
              <li>✓ Inventive sound-based horror concept</li>
              <li>✓ Practical single-location production</li>
              <li>✓ Effective use of confined space</li>
              <li>✓ Clear three-act structure</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li>⚠ Supporting characters lack depth</li>
              <li>⚠ Act II energy dip around page 60-70</li>
              <li>⚠ Antagonist presence inconsistent</li>
              <li>⚠ Some dialogue feels expository</li>
              <li>⚠ Thriller elements could be sharper</li>
              <li>⚠ Stakes escalation needs refinement</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderCraftDeepDive = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Creative Development Analysis
          </CardTitle>
          <CardDescription>In-depth craft analysis across structure, character, and style</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="structure" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="character">Characters</TabsTrigger>
          <TabsTrigger value="dialogue">Dialogue</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Story Structure Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Beat Timeline</h4>
                  <div className="space-y-2">
                    {mockScript.beatsData.map((beat, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded border">
                        <span className="text-sm font-medium">{beat.label}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Page {beat.page}</Badge>
                          <div className="text-xs text-green-600">
                            {Math.round(beat.conf * 100)}% conf
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Structure Health</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockScript.beatsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="page" />
                        <YAxis domain={[0,1]} />
                        <RTooltip />
                        <Line type="monotone" dataKey="conf" stroke="currentColor" dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="character" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Character Development</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockScript.characters.map((character) => (
                  <div key={character.name} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{character.name}</h4>
                      <Badge variant="outline">{character.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{character.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span>Dialogue: {character.dialogueCount} lines</span>
                      <span>First: Page {character.firstAppearance}</span>
                    </div>
                    <div>
                      <div className="text-xs mb-1">Character Arc Development</div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{width: character.role === 'Protagonist' ? '85%' : character.role === 'Supporting' ? '60%' : '40%'}}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dialogue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dialogue Quality Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Quality Metrics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 border rounded">
                      <div className="text-lg font-bold text-green-600">7.8</div>
                      <div className="text-sm text-muted-foreground">Overall Score</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-lg font-bold text-blue-600">85%</div>
                      <div className="text-sm text-muted-foreground">Subtext Quality</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-lg font-bold text-amber-600">12</div>
                      <div className="text-sm text-muted-foreground">Issues Flagged</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Common Issues</h4>
                  <div className="space-y-2">
                    {["On-the-nose dialogue", "Exposition dumps", "Repetitive phrasing"].map((issue, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm">{issue}</span>
                        <Button variant="outline" size="sm">View Examples</Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme & Meaning Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Primary Themes</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Isolation</Badge>
                    <Badge>Urban Paranoia</Badge>
                    <Badge>Sound vs Silence</Badge>
                    <Badge>Trust</Badge>
                    <Badge>Reality vs Perception</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Theme Development</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Strong exploration of urban isolation through the protagonist's confined apartment setting.
                    The script effectively uses sound as both threat and revelation, creating a unique thematic approach to horror.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Strengths</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Consistent thematic focus on isolation</li>
                        <li>• Creative use of sound-based fear</li>
                        <li>• Strong environmental storytelling</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Opportunities</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Deepen exploration of trust themes</li>
                        <li>• Stronger thematic resolution</li>
                        <li>• More subtle thematic integration</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  const renderProductionDeepDive = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Production Planning Analysis
          </CardTitle>
          <CardDescription>Budget, locations, and feasibility assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded">
              <div className="text-lg font-bold">{pct(mockScript.intExtRatio.INT)}%</div>
              <div className="text-sm text-muted-foreground">Interior</div>
            </div>
            <div className="text-center p-3 border rounded">
              <div className="text-lg font-bold">{pct(mockScript.dayNightRatio.NIGHT)}%</div>
              <div className="text-sm text-muted-foreground">Night Shoots</div>
            </div>
            <div className="text-center p-3 border rounded">
              <div className="text-lg font-bold">{mockScript.uniqueLocations}</div>
              <div className="text-sm text-muted-foreground">Locations</div>
            </div>
            <div className="text-center p-3 border rounded">
              <div className="text-lg font-bold">{mockScript.complexity}</div>
              <div className="text-sm text-muted-foreground">Complexity</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Budget Advantages</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Primary location: Single apartment building
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Limited cast size ({mockScript.totalCharacters} characters)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Contemporary setting (no period costs)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Minimal special effects requirements
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Practical horror (no CGI creatures)
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Considerations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Professional sound design required
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                {pct(mockScript.dayNightRatio.NIGHT)}% night shooting (overtime costs)
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Building permits and location fees
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Practical effects for horror elements
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Sound equipment and mixing
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Risk Type</TableHead>
                <TableHead>Page</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Mitigation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockScript.riskFlags.map((risk) => (
                <TableRow key={risk.id}>
                  <TableCell>
                    <Badge variant="outline">{risk.kind}</Badge>
                  </TableCell>
                  <TableCell>{risk.page}</TableCell>
                  <TableCell className="text-sm">{risk.snippet}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">Review</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  const renderNotesDeepDive = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Development Notes Analysis
          </CardTitle>
          <CardDescription>Comprehensive feedback organized by priority and area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 border rounded">
              <div className="text-lg font-bold text-red-600">1</div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
            <div className="text-center p-3 border rounded">
              <div className="text-lg font-bold text-amber-600">1</div>
              <div className="text-sm text-muted-foreground">Medium Priority</div>
            </div>
            <div className="text-center p-3 border rounded">
              <div className="text-lg font-bold text-green-600">1</div>
              <div className="text-sm text-muted-foreground">Low Priority</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Feedback</CardTitle>
          <CardDescription>All notes with actionable suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Scene</TableHead>
                <TableHead>Page</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Suggestion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockScript.notes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell>
                    <Badge variant={note.severity === 'HIGH' ? 'destructive' : note.severity === 'MEDIUM' ? 'default' : 'secondary'}>
                      {note.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{note.area}</Badge>
                  </TableCell>
                  <TableCell>#{note.scene}</TableCell>
                  <TableCell>{note.page}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="truncate">{note.excerpt}</div>
                  </TableCell>
                  <TableCell className="max-w-[250px]">
                    <div className="truncate">{note.suggestion}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  const renderStep4Actions = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Actions & Deliverables
          </CardTitle>
          <CardDescription>Export your analysis and plan next steps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Available Downloads</h4>
              <div className="space-y-2">
                {[
                  { name: "Coverage Report PDF", desc: "Professional coverage document" },
                  { name: "Development Notes PDF", desc: "All feedback and suggestions" },
                  { name: "Notes & Comments CSV", desc: "Spreadsheet-friendly format" },
                  { name: "Analysis Data JSON", desc: "Complete data bundle" },
                  { name: "FDX Change List", desc: "Final Draft compatible notes" },
                ].map((export_item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium text-sm">{export_item.name}</div>
                      <div className="text-xs text-muted-foreground">{export_item.desc}</div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4"/> Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Recommended Next Steps</h4>
              <div className="space-y-3">
                <div className="p-3 border rounded bg-blue-50">
                  <div className="font-medium text-sm text-blue-900">1. Address High Priority Issues</div>
                  <div className="text-xs text-blue-700">Focus on the midpoint pacing issue first</div>
                </div>
                <div className="p-3 border rounded bg-amber-50">
                  <div className="font-medium text-sm text-amber-900">2. Develop Supporting Characters</div>
                  <div className="text-xs text-amber-700">Add depth to Mr. Chen and Detective Rivera</div>
                </div>
                <div className="p-3 border rounded bg-green-50">
                  <div className="font-medium text-sm text-green-900">3. Revise and Re-analyze</div>
                  <div className="text-xs text-green-700">Upload revised draft for comparison</div>
                </div>
              </div>

              <div className="mt-4">
                <h5 className="font-medium mb-2">Continue Analysis</h5>
                <div className="flex gap-2">
                  <Button onClick={() => setCurrentStep(1)} variant="outline" size="sm">
                    Restart Workflow
                  </Button>
                  <Button onClick={() => setSelectedPath(null)} variant="outline" size="sm">
                    Try Different Path
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return renderStep1Overview()
      case 2:
        return renderStep2PathSelection()
      case 3:
        return renderStep3DeepDive()
      case 4:
        return renderStep4Actions()
      default:
        return renderStep1Overview()
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h2 className="text-lg font-semibold text-green-900 mb-2">Option 2: Progressive Workflow</h2>
        <p className="text-sm text-green-700">
          Guided step-by-step analysis workflow. Start with quick insights, choose your focus area,
          dive deep into comprehensive analysis, then export deliverables.
        </p>
      </div>

      {renderStepIndicator()}
      {renderStepContent()}
    </div>
  )
}