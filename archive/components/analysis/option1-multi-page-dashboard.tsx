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
  Rocket
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

export function Option1MultiPageDashboard() {
  const [currentPage, setCurrentPage] = useState('overview')
  const [craftSubPage, setCraftSubPage] = useState('structure')

  const pages = [
    {
      key: 'overview',
      title: 'Overview',
      icon: BarChart4,
      description: 'Key insights and overall assessment',
      url: '/scripts/dark-echo'
    },
    {
      key: 'coverage',
      title: 'Coverage',
      icon: FileText,
      description: 'Studio-style coverage and recommendations',
      url: '/scripts/dark-echo/coverage'
    },
    {
      key: 'craft',
      title: 'Craft Analysis',
      icon: Brain,
      description: 'Structure, dialogue, theme analysis',
      url: '/scripts/dark-echo/craft'
    },
    {
      key: 'characters',
      title: 'Characters',
      icon: Users,
      description: 'Character development and arcs',
      url: '/scripts/dark-echo/characters'
    },
    {
      key: 'pacing',
      title: 'Pacing',
      icon: Activity,
      description: 'Scene length and tension analysis',
      url: '/scripts/dark-echo/pacing'
    },
    {
      key: 'feasibility',
      title: 'Production',
      icon: Camera,
      description: 'Location, budget, and complexity analysis',
      url: '/scripts/dark-echo/production'
    },
    {
      key: 'notes',
      title: 'Notes',
      icon: MessageSquare,
      description: 'Detailed feedback and suggestions',
      url: '/scripts/dark-echo/notes'
    },
    {
      key: 'exports',
      title: 'Exports',
      icon: Download,
      description: 'Download reports and data',
      url: '/scripts/dark-echo/exports'
    }
  ]

  const currentPageData = pages.find(p => p.key === currentPage)
  const currentIndex = pages.findIndex(p => p.key === currentPage)

  const renderBreadcrumb = () => (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      <Home className="h-4 w-4" />
      <span>Scripts</span>
      <ChevronRight className="h-4 w-4" />
      <span>{mockScript.title}</span>
      {currentPageData && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{currentPageData.title}</span>
        </>
      )}
    </div>
  )

  const renderPageHeader = () => (
    <Card className="shadow-sm mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-2xl md:text-3xl">{mockScript.title}</CardTitle>
              {mockScript.project && (
                <Badge variant="secondary" className="text-xs">{mockScript.project.name}</Badge>
              )}
            </div>
            <CardDescription>
              {currentPageData?.description} · {mockScript.format} · {mockScript.pageCount} pages
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4"/> Export
            </Button>
            <Button className="gap-2">
              <MessageSquare className="h-4 w-4"/> Chat
            </Button>
          </div>
        </div>

        {/* Status chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <FileText className="h-3.5 w-3.5"/> {mockScript.format}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <BookOpenText className="h-3.5 w-3.5"/> {mockScript.pageCount}p
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Layers className="h-3.5 w-3.5"/> {mockScript.totalScenes} scenes
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3.5 w-3.5"/> {mockScript.totalCharacters} characters
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3.5 w-3.5"/> ~{mockScript.runtime}m
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Film className="h-3.5 w-3.5"/> {pct(mockScript.intExtRatio.INT)}% INT / {pct(mockScript.intExtRatio.EXT)}% EXT
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Sun className="h-3.5 w-3.5"/> {pct(mockScript.dayNightRatio.DAY)}% DAY / {pct(mockScript.dayNightRatio.NIGHT)}% NIGHT
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <MapPin className="h-3.5 w-3.5"/> {mockScript.uniqueLocations} locations
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <BarChart4 className="h-3.5 w-3.5"/> complexity {mockScript.complexity}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button className="gap-2" variant="secondary">
              <Play className="h-4 w-4"/> Quick
            </Button>
            <Button className="gap-2">
              <Rocket className="h-4 w-4"/> Comprehensive
            </Button>
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4"/> Custom
            </Button>
          </div>
          <div className="w-full md:w-1/2">
            <div className="text-xs mb-1 text-muted-foreground">
              Parse → Normalize → Taggers → Cross-scene → Escalations → Scoring → Assets
            </div>
            <Progress value={100} />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderNavigation = () => (
    <Card className="shadow-sm mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              const prevIndex = currentIndex > 0 ? currentIndex - 1 : pages.length - 1
              setCurrentPage(pages[prevIndex].key)
            }}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentIndex > 0 ? pages[currentIndex - 1].title : pages[pages.length - 1].title}
          </Button>

          <div className="flex items-center gap-2 flex-wrap">
            {pages.map((page) => (
              <Button
                key={page.key}
                variant={currentPage === page.key ? "default" : "ghost"}
                onClick={() => setCurrentPage(page.key)}
                className="gap-2"
                size="sm"
              >
                <page.icon className="h-4 w-4" />
                {page.title}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => {
              const nextIndex = currentIndex < pages.length - 1 ? currentIndex + 1 : 0
              setCurrentPage(pages[nextIndex].key)
            }}
            className="gap-2"
          >
            {currentIndex < pages.length - 1 ? pages[currentIndex + 1].title : pages[0].title}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 text-xs text-muted-foreground text-center">
          URL: {currentPageData?.url}
        </div>
      </CardContent>
    </Card>
  )

  const renderOverviewPage = () => (
    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>Logline</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {mockScript.logline}
        </CardContent>
      </Card>

      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>Synopsis</CardTitle>
          <CardDescription>1-pager and 3-pager</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">{mockScript.synopsisShort}</p>
        </CardContent>
      </Card>

      <Card className="col-span-12 lg:col-span-6">
        <CardHeader><CardTitle>Strengths</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>Tight third act momentum</li>
            <li>Distinct prop-driven set pieces</li>
            <li>Clear emotional stakes</li>
            <li>Atmospheric world-building</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="col-span-12 lg:col-span-6">
        <CardHeader><CardTitle>Areas for Improvement</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>Act II flat spot around pp. 60–70</li>
            <li>Antagonist presence dips in mid-act</li>
            <li>Some on-the-nose lines in early scenes</li>
            <li>Supporting characters need more depth</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>Scorecard</CardTitle>
          <CardDescription>Studio-style rubric (1–10)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {mockScript.scores.map((score) => (
              <div key={score.category} className="rounded-2xl border p-3">
                <div className="text-xs text-muted-foreground">{score.category}</div>
                <div className="text-xl font-semibold">{score.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{score.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderCoveragePage = () => (
    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-12">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Coverage Assessment</CardTitle>
            <CardDescription>Pass / Consider / Recommend</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select rating"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="consider">Consider</SelectItem>
                <SelectItem value="recommend">Recommend</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4"/> Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold mb-2">Recommendation</div>
                <Badge variant="secondary" className="text-lg px-3 py-1">CONSIDER</Badge>
              </div>

              <div>
                <div className="text-sm font-semibold mb-2">Comps</div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary">The Shining (isolation)</Badge>
                  <Badge variant="secondary">Rear Window (confined space)</Badge>
                  <Badge variant="secondary">Rosemary's Baby (apartment horror)</Badge>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-semibold mb-2">Strengths</div>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  <li>Strong atmospheric tension</li>
                  <li>Clear protagonist journey</li>
                  <li>Inventive sound-based horror</li>
                  <li>Practical location constraints</li>
                </ul>
              </div>

              <div>
                <div className="text-sm font-semibold mb-2">Risks</div>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  <li>Limited location may feel claustrophobic</li>
                  <li>Sound design budget requirements</li>
                  <li>Supporting cast underdeveloped</li>
                </ul>
              </div>
            </div>

            <div className="rounded-xl border p-3">
              <div className="text-sm font-medium mb-2">Beat Map</div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockScript.beatsData.map((b) => ({ x: b.page, y: b.conf }))}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="currentColor" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="currentColor" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                    <RTooltip />
                    <Area type="monotone" dataKey="y" stroke="currentColor" fill="url(#grad)" />
                    {mockScript.beatsData.map((b, i) => (
                      <ReferenceDot key={i} x={b.page} y={b.conf} r={4} isFront />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderCraftPage = () => (
    <div className="space-y-4">
      <Tabs value={craftSubPage} onValueChange={setCraftSubPage} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="conflict">Conflict</TabsTrigger>
          <TabsTrigger value="dialogue">Dialogue</TabsTrigger>
          <TabsTrigger value="world">World</TabsTrigger>
          <TabsTrigger value="genre">Genre</TabsTrigger>
          <TabsTrigger value="formatting">Format</TabsTrigger>
          <TabsTrigger value="sensitivity">Sensitivity</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Beat Timeline</CardTitle>
              <CardDescription>Story structure markers with confidence scores</CardDescription>
            </CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockScript.beatsData.map((b) => ({ page: b.page, conf: b.conf, label: b.label }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="page" />
                  <YAxis domain={[0,1]} />
                  <RTooltip labelFormatter={(value) => `Page ${value}`} formatter={(value, name) => [value, 'Confidence']} />
                  <Line type="monotone" dataKey="conf" stroke="currentColor" dot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflict" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stakes Escalation</CardTitle>
              <CardDescription>Tension curve with flat spots flagged</CardDescription>
            </CardHeader>
            <CardContent className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockScript.pageMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="page" />
                  <YAxis />
                  <RTooltip />
                  <Area type="monotone" dataKey="tension" stroke="currentColor" fill="currentColor" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dialogue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dialogue Quality Analysis</CardTitle>
              <CardDescription>Issues flagged with suggested improvements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {["On-the-nose dialogue", "Exposition dumps", "Repetitive phrasing"].map((issue, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border p-3">
                  <div className="text-sm font-medium">{issue}</div>
                  <Button variant="outline" size="sm">View notes</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="world" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>World Building & Logic</CardTitle>
              <CardDescription>Continuity and internal consistency check</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Continuity tracking: Timeline, character motivations, and world rules consistency will appear here after comprehensive analysis.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="genre" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Genre Conventions</CardTitle>
              <CardDescription>Horror/Thriller genre requirements coverage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3">
                  <div className="text-sm font-medium">Genre: {mockScript.genre}</div>
                  <div className="text-xs text-muted-foreground mt-1">AI-detected primary genre</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-sm font-medium">Convention Score: 8.2/10</div>
                  <div className="text-xs text-muted-foreground mt-1">Meets most horror expectations</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formatting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Formatting Analysis</CardTitle>
              <CardDescription>Industry standard compliance check</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Slugline formatting</span>
                <Badge variant="secondary">Good</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Character introductions</span>
                <Badge variant="secondary">Good</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Parenthetical usage</span>
                <Badge variant="outline">Review needed</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sensitivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sensitivity Review</CardTitle>
              <CardDescription>Inclusive language and representation analysis</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Sensitivity analysis available with comprehensive review. Check for inclusive language, stereotype avoidance, and authentic representation.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Flags</CardTitle>
              <CardDescription>Legal and production risk assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>Issue</TableHead>
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
        </TabsContent>
      </Tabs>
    </div>
  )

  const renderCharactersPage = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Character Analysis</CardTitle>
          <CardDescription>{mockScript.characters.length} characters detected with dialogue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockScript.characters.map((character) => (
              <div key={character.name} className="rounded-2xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{character.name}</div>
                  <Badge variant="outline">{character.dialogueCount} lines</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div><strong>Role:</strong> {character.role}</div>
                  <div><strong>Description:</strong> {character.description}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  First appearance: Page {character.firstAppearance}
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium">Character Arc</div>
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
    </div>
  )

  const renderPacingPage = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Scene Length Distribution</CardTitle>
          <CardDescription>Page count per scene with outliers flagged</CardDescription>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockScript.pageMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="page" />
              <YAxis />
              <RTooltip />
              <Bar dataKey="action" fill="currentColor" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dialogue vs Action Balance</CardTitle>
          <CardDescription>Content type distribution across pages</CardDescription>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockScript.pageMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="page" />
              <YAxis />
              <RTooltip />
              <Bar dataKey="dialogue" fill="#8884d8" />
              <Bar dataKey="action" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tension Curve</CardTitle>
          <CardDescription>Emotional intensity throughout the script</CardDescription>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockScript.pageMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="page" />
              <YAxis />
              <RTooltip />
              <Line dataKey="tension" type="monotone" stroke="currentColor" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )

  const renderFeasibilityPage = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Production Metrics</CardTitle>
          <CardDescription>Location breakdown and complexity analysis</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { k: "INT Scenes", v: pct(mockScript.intExtRatio.INT) + "%" },
            { k: "EXT Scenes", v: pct(mockScript.intExtRatio.EXT) + "%" },
            { k: "DAY Scenes", v: pct(mockScript.dayNightRatio.DAY) + "%" },
            { k: "NIGHT Scenes", v: pct(mockScript.dayNightRatio.NIGHT) + "%" },
            { k: "Unique Locations", v: String(mockScript.uniqueLocations) },
            { k: "Complexity Index", v: String(mockScript.complexity) },
          ].map((metric) => (
            <div key={metric.k} className="rounded-2xl border p-3">
              <div className="text-xs text-muted-foreground">{metric.k}</div>
              <div className="text-xl font-semibold">{metric.v}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget Considerations</CardTitle>
          <CardDescription>Production requirements and cost factors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold mb-2">Low Cost Elements</div>
              <ul className="text-sm list-disc pl-5 space-y-1">
                <li>Single primary location (apartment building)</li>
                <li>Limited cast size (8 characters)</li>
                <li>Minimal special effects</li>
                <li>Contemporary setting</li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold mb-2">Budget Considerations</div>
              <ul className="text-sm list-disc pl-5 space-y-1">
                <li>Professional sound design required</li>
                <li>Night shooting (55% of scenes)</li>
                <li>Building permits and location fees</li>
                <li>Practical effects for horror elements</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderNotesPage = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Development Notes</CardTitle>
            <CardDescription>
              Detailed feedback organized by area and priority
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by area"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                <SelectItem value="structure">Structure</SelectItem>
                <SelectItem value="character">Character</SelectItem>
                <SelectItem value="dialogue">Dialogue</SelectItem>
                <SelectItem value="pacing">Pacing</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Severity"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4"/> Export CSV
            </Button>
          </div>
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

  const renderExportsPage = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Available Downloads</CardTitle>
          <CardDescription>Export analysis data in various formats</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: "Coverage Report PDF", desc: "Professional coverage document" },
            { name: "Development Notes PDF", desc: "All feedback and suggestions" },
            { name: "Notes & Comments CSV", desc: "Spreadsheet-friendly format" },
            { name: "Analysis Data JSON", desc: "Complete data bundle" },
            { name: "FDX Change List", desc: "Final Draft compatible notes" },
            { name: "Character Breakdown", desc: "Cast and crew reference" }
          ].map((export_item, i) => (
            <div key={i} className="rounded-2xl border p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{export_item.name}</div>
                <div className="text-xs text-muted-foreground">{export_item.desc}</div>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4"/> Download
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )

  const renderPageContent = () => {
    switch (currentPage) {
      case 'overview':
        return renderOverviewPage()
      case 'coverage':
        return renderCoveragePage()
      case 'craft':
        return renderCraftPage()
      case 'characters':
        return renderCharactersPage()
      case 'pacing':
        return renderPacingPage()
      case 'feasibility':
        return renderFeasibilityPage()
      case 'notes':
        return renderNotesPage()
      case 'exports':
        return renderExportsPage()
      default:
        return renderOverviewPage()
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Option 1: Multi-Page Dashboard</h2>
        <p className="text-sm text-blue-700">
          Analysis content is organized into separate pages, each focused on a specific aspect of the screenplay.
          Navigate between pages using the tab navigation or arrow buttons.
        </p>
      </div>

      {renderBreadcrumb()}
      {renderPageHeader()}
      {renderNavigation()}
      {renderPageContent()}
    </div>
  )
}