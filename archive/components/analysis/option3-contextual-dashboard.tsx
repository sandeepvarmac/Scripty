'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
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
  PanelRightOpen,
  Filter,
  Edit3,
  BookOpen,
  Clapperboard
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

export function Option3ContextualDashboard() {
  const [selectedFocus, setSelectedFocus] = useState('overview')
  const [selectedNote, setSelectedNote] = useState<string | null>(null)

  const focusAreas = [
    {
      key: 'overview',
      title: 'Overview',
      icon: BarChart4,
      color: 'blue',
      description: 'Complete script analysis summary'
    },
    {
      key: 'coverage',
      title: 'Coverage',
      icon: FileText,
      color: 'green',
      description: 'Studio-style coverage report'
    },
    {
      key: 'craft',
      title: 'Craft',
      icon: Brain,
      color: 'purple',
      description: 'Structure, dialogue, and craft analysis'
    },
    {
      key: 'characters',
      title: 'Characters',
      icon: Users,
      color: 'orange',
      description: 'Character development and arcs'
    },
    {
      key: 'production',
      title: 'Production',
      icon: Camera,
      color: 'red',
      description: 'Budget and feasibility analysis'
    },
    {
      key: 'notes',
      title: 'Notes',
      icon: MessageSquare,
      color: 'amber',
      description: 'Development feedback and suggestions'
    }
  ]

  const getContextualActions = () => {
    switch(selectedFocus) {
      case 'overview':
        return [
          { icon: Download, label: 'Export Summary PDF', variant: 'outline' as const },
          { icon: Share2, label: 'Share Analysis', variant: 'outline' as const },
          { icon: Play, label: 'Run Quick Analysis', variant: 'default' as const },
          { icon: Rocket, label: 'Deep Analysis', variant: 'default' as const }
        ]
      case 'coverage':
        return [
          { icon: Download, label: 'Export Coverage PDF', variant: 'default' as const },
          { icon: Edit3, label: 'Edit Recommendation', variant: 'outline' as const },
          { icon: Share2, label: 'Send to Producer', variant: 'outline' as const },
          { icon: BookOpen, label: 'Coverage Template', variant: 'outline' as const }
        ]
      case 'craft':
        return [
          { icon: Download, label: 'Export Craft Report', variant: 'outline' as const },
          { icon: Target, label: 'Focus on Structure', variant: 'outline' as const },
          { icon: MessageSquare, label: 'View All Notes', variant: 'outline' as const },
          { icon: Brain, label: 'Advanced Analysis', variant: 'default' as const }
        ]
      case 'characters':
        return [
          { icon: Download, label: 'Character Breakdown', variant: 'outline' as const },
          { icon: Users, label: 'Casting Suggestions', variant: 'outline' as const },
          { icon: Edit3, label: 'Character Notes', variant: 'outline' as const },
          { icon: BarChart4, label: 'Arc Analysis', variant: 'default' as const }
        ]
      case 'production':
        return [
          { icon: Download, label: 'Budget Breakdown', variant: 'default' as const },
          { icon: Camera, label: 'Location Report', variant: 'outline' as const },
          { icon: Calendar, label: 'Schedule Estimate', variant: 'outline' as const },
          { icon: ShieldAlert, label: 'Risk Assessment', variant: 'outline' as const }
        ]
      case 'notes':
        return [
          { icon: Download, label: 'Export Notes CSV', variant: 'default' as const },
          { icon: Filter, label: 'Filter by Priority', variant: 'outline' as const },
          { icon: Edit3, label: 'Add Custom Note', variant: 'outline' as const },
          { icon: CheckCircle2, label: 'Mark Addressed', variant: 'outline' as const }
        ]
      default:
        return []
    }
  }

  const renderLeftSidebar = () => (
    <div className="w-80 bg-gray-50 border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">{mockScript.title}</h2>
        <p className="text-sm text-muted-foreground">Contextual Analysis Dashboard</p>
      </div>

      {/* Key Insights */}
      <div className="p-4 border-b">
        <h3 className="font-medium mb-3 text-sm uppercase tracking-wide text-gray-600">Key Insights</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Overall Score</span>
            <Badge variant="secondary">8.2/10</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Coverage</span>
            <Badge variant="outline">CONSIDER</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">High Priority Issues</span>
            <Badge variant="destructive">1</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Production Complexity</span>
            <Badge variant="secondary">{mockScript.complexity}/10</Badge>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b">
        <h3 className="font-medium mb-3 text-sm uppercase tracking-wide text-gray-600">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center p-2 bg-white rounded border">
            <div className="font-semibold">{mockScript.pageCount}</div>
            <div className="text-muted-foreground">Pages</div>
          </div>
          <div className="text-center p-2 bg-white rounded border">
            <div className="font-semibold">{mockScript.totalScenes}</div>
            <div className="text-muted-foreground">Scenes</div>
          </div>
          <div className="text-center p-2 bg-white rounded border">
            <div className="font-semibold">{mockScript.runtime}m</div>
            <div className="text-muted-foreground">Runtime</div>
          </div>
          <div className="text-center p-2 bg-white rounded border">
            <div className="font-semibold">{pct(mockScript.intExtRatio.INT)}%</div>
            <div className="text-muted-foreground">Interior</div>
          </div>
        </div>
      </div>

      {/* Focus Areas Navigation */}
      <div className="p-4">
        <h3 className="font-medium mb-3 text-sm uppercase tracking-wide text-gray-600">Focus Areas</h3>
        <div className="space-y-1">
          {focusAreas.map((area) => (
            <Button
              key={area.key}
              variant={selectedFocus === area.key ? "default" : "ghost"}
              onClick={() => setSelectedFocus(area.key)}
              className="w-full justify-start gap-2 h-auto p-3"
            >
              <area.icon className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">{area.title}</div>
                <div className="text-xs text-muted-foreground">{area.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-4 border-t">
        <h3 className="font-medium mb-3 text-sm uppercase tracking-wide text-gray-600">Recent</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-muted-foreground">Analysis completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-muted-foreground">Coverage generated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span className="text-muted-foreground">3 notes flagged</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderMainContent = () => {
    const currentFocus = focusAreas.find(f => f.key === selectedFocus)
    if (!currentFocus) return null

    const IconComponent = currentFocus.icon

    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <IconComponent className="h-5 w-5" />
            <h1 className="text-2xl font-bold">{currentFocus.title} Analysis</h1>
          </div>
          <p className="text-muted-foreground">{currentFocus.description}</p>
        </div>

        {selectedFocus === 'overview' && renderOverviewContent()}
        {selectedFocus === 'coverage' && renderCoverageContent()}
        {selectedFocus === 'craft' && renderCraftContent()}
        {selectedFocus === 'characters' && renderCharactersContent()}
        {selectedFocus === 'production' && renderProductionContent()}
        {selectedFocus === 'notes' && renderNotesContent()}
      </div>
    )
  }

  const renderOverviewContent = () => (
    <div className="space-y-6">
      {/* Logline */}
      <Card>
        <CardHeader>
          <CardTitle>Logline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm italic">"{mockScript.logline}"</p>
        </CardContent>
      </Card>

      {/* Synopsis */}
      <Card>
        <CardHeader>
          <CardTitle>Synopsis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{mockScript.synopsisShort}</p>
        </CardContent>
      </Card>

      {/* Score Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Assessment</CardTitle>
          <CardDescription>Comprehensive scoring across key areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {mockScript.scores.map((score) => (
              <div key={score.category} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold mb-1">{score.value}</div>
                <div className="text-sm font-medium mb-1">{score.category}</div>
                <div className="text-xs text-muted-foreground">{score.description}</div>
                <div className="mt-2">
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{width: `${score.value * 10}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                Strong atmospheric tension throughout
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                Clear protagonist journey and motivation
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                Inventive sound-based horror concept
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                Practical single-location production
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-amber-700">Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                Supporting characters need more depth
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                Act II energy dip around page 60-70
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                Some dialogue feels expository
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                Antagonist presence could be stronger
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderCoverageContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Coverage Assessment</CardTitle>
          <CardDescription>Studio-style recommendation and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Recommendation</h4>
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
                <h4 className="font-semibold mb-2">Market Analysis</h4>
                <ul className="text-sm space-y-1">
                  <li>• Target: R-rated horror/thriller audience</li>
                  <li>• Budget Range: Low-to-mid ($2-8M)</li>
                  <li>• Platform: Theatrical release + streaming</li>
                  <li>• Demographics: Horror fans, thriller enthusiasts</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Story Structure</h4>
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
            <CardTitle>Coverage Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li>✓ Unique premise with strong hook</li>
              <li>✓ Cost-effective single location</li>
              <li>✓ Clear three-act structure</li>
              <li>✓ Commercial horror genre appeal</li>
              <li>✓ Practical production requirements</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Development Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li>• Expand supporting character roles</li>
              <li>• Strengthen Act II pacing</li>
              <li>• Enhance antagonist presence</li>
              <li>• Refine dialogue authenticity</li>
              <li>• Clarify stakes escalation</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderCraftContent = () => (
    <div className="space-y-6">
      <Tabs defaultValue="structure" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="dialogue">Dialogue</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Story Structure Analysis</CardTitle>
              <CardDescription>Beat timing and story development</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-3">Key Story Beats</h4>
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
                  <h4 className="font-semibold mb-3">Structure Health</h4>
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

        <TabsContent value="dialogue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dialogue Quality Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
              <CardTitle>Theme Analysis</CardTitle>
              <CardDescription>Thematic elements and development</CardDescription>
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
                  <p className="text-sm text-muted-foreground">
                    Strong exploration of urban isolation through the protagonist's confined apartment setting.
                    The script effectively uses sound as both threat and revelation, creating a unique thematic approach to horror.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="style" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Writing Style & Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Slugline formatting</span>
                  <Badge variant="secondary">Good</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Character introductions</span>
                  <Badge variant="secondary">Good</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Action line clarity</span>
                  <Badge variant="secondary">Good</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Parenthetical usage</span>
                  <Badge variant="outline">Review needed</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  const renderCharactersContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Character Development Overview</CardTitle>
          <CardDescription>{mockScript.characters.length} characters with speaking roles</CardDescription>
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
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Dialogue: {character.dialogueCount} lines</div>
                  <div>First: Page {character.firstAppearance}</div>
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

      <Card>
        <CardHeader>
          <CardTitle>Character Relationships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>Emma ↔ Mr. Chen:</strong> Neighbor relationship builds trust, he becomes mentor figure</p>
            <p><strong>Emma ↔ Detective Rivera:</strong> Professional relationship develops as investigation unfolds</p>
            <p><strong>Emma ↔ Landlord:</strong> Antagonistic relationship, conceals building's dark secrets</p>
            <p><strong>Mr. Chen ↔ Landlord:</strong> Historical conflict, Chen knows too much</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderProductionContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Production Overview</CardTitle>
          <CardDescription>Budget and feasibility analysis</CardDescription>
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
                Single primary location (apartment building)
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
                Practical horror effects
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
                {pct(mockScript.dayNightRatio.NIGHT)}% night shooting
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Building permits needed
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Sound equipment costs
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
                <TableHead>Action</TableHead>
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

  const renderNotesContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Development Notes Summary</CardTitle>
          <CardDescription>Prioritized feedback and suggestions</CardDescription>
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
          <CardDescription>Scene-specific notes and suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Scene</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Suggestion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockScript.notes.map((note) => (
                <TableRow key={note.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Badge variant={note.severity === 'HIGH' ? 'destructive' : note.severity === 'MEDIUM' ? 'default' : 'secondary'}>
                      {note.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{note.area}</Badge>
                  </TableCell>
                  <TableCell>#{note.scene} (p.{note.page})</TableCell>
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

  const renderRightPanel = () => (
    <div className="w-80 bg-gray-50 border-l border-gray-200 h-screen overflow-y-auto">
      <div className="p-4 border-b">
        <h3 className="font-medium">Actions</h3>
        <p className="text-sm text-muted-foreground">Context-aware tools and exports</p>
      </div>

      <div className="p-4 space-y-3">
        {getContextualActions().map((action, i) => (
          <Button
            key={i}
            variant={action.variant}
            className="w-full justify-start gap-2"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Button>
        ))}
      </div>

      <Separator className="my-4" />

      <div className="p-4">
        <h4 className="font-medium mb-3">Related</h4>
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <BookOpen className="h-4 w-4 mr-2" />
            Script Viewer
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Clapperboard className="h-4 w-4 mr-2" />
            Scene Breakdown
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <BarChart4 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="p-4">
        <h4 className="font-medium mb-3">Export Options</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Coverage PDF</span>
            <Button variant="outline" size="sm">
              <Download className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Notes CSV</span>
            <Button variant="outline" size="sm">
              <Download className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>JSON Bundle</span>
            <Button variant="outline" size="sm">
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col">
      <div className="mb-6 p-4 bg-purple-50 border border-purple-200 mx-6 mt-6 rounded-lg">
        <h2 className="text-lg font-semibold text-purple-900 mb-2">Option 3: Contextual Dashboard</h2>
        <p className="text-sm text-purple-700">
          Three-panel contextual interface. Left sidebar shows key insights and navigation, center displays
          focused content based on your selection, right panel provides contextual actions and tools.
        </p>
      </div>

      <div className="flex-1 flex">
        {renderLeftSidebar()}
        {renderMainContent()}
        {renderRightPanel()}
      </div>
    </div>
  )
}