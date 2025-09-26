'use client'

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  FileText,
  Film,
  Clock,
  UploadCloud,
  Play,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  MessageSquare,
  AlertTriangle,
  Users,
  MapPin,
  Sun,
  Moon,
  Rocket,
  Download,
  BookOpenText,
  ListChecks,
  Share2,
  PanelRightOpen,
  ArrowRightLeft,
  BarChart4,
  Layers,
  Link2,
  Eye,
  Zap,
  Brain,
  Globe,
  Target,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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

// Mock data with comprehensive structure
const mockScript = {
  id: "script-1",
  title: "Dark Echo",
  originalFilename: "dark_echo.pdf",
  author: "Alex Thompson",
  format: "PDF",
  pageCount: 6,
  totalScenes: 5,
  totalCharacters: 6,
  fileSize: 1024 * 1024 * 2.5, // 2.5MB
  logline: "A young woman trapped in her apartment discovers that the sounds from her neighbors aren't what they seem.",
  synopsisShort: "Sarah, isolated in her new apartment, begins hearing disturbing sounds from neighboring units. As she investigates, she realizes the building harbors dark secrets that threaten her sanity and safety.",
  project: { name: "Thriller Collection", type: "Feature" },
  scenes: [],
  characters: [
    { id: 1, name: "SARAH", dialogueCount: 15, firstAppearance: 1 },
    { id: 2, name: "MIKE", dialogueCount: 8, firstAppearance: 5 },
    { id: 3, name: "VOICE", dialogueCount: 3, firstAppearance: 12 }
  ],
  analyses: [],
  beats: [
    { id: 1, kind: "INCITING_INCIDENT", page: 2, confidence: 0.85 },
    { id: 2, kind: "FIRST_PLOT_POINT", page: 3, confidence: 0.72 },
    { id: 3, kind: "MIDPOINT", page: 4, confidence: 0.68 }
  ],
  notes: [
    { id: 1, severity: 'HIGH', area: 'STRUCTURE', page: 2, excerpt: 'FADE OUT. appears in middle', suggestion: 'Move transition to scene end' },
    { id: 2, severity: 'MEDIUM', area: 'DIALOGUE', page: 3, excerpt: 'On-the-nose exposition', suggestion: 'Show through action instead' }
  ],
  scores: [
    { id: 1, category: 'STRUCTURE', value: 7.5 },
    { id: 2, category: 'CHARACTER', value: 8.2 },
    { id: 3, category: 'DIALOGUE', value: 6.8 },
    { id: 4, category: 'PACING', value: 7.1 }
  ],
  pageMetrics: [
    { id: 1, page: 1, dialogueLines: 8, actionLines: 12, tensionScore: 0.3 },
    { id: 2, page: 2, dialogueLines: 15, actionLines: 8, tensionScore: 0.7 },
    { id: 3, page: 3, dialogueLines: 12, actionLines: 10, tensionScore: 0.9 }
  ],
  themeStatements: [
    { id: 1, statement: "Isolation breeds paranoia", confidence: 0.82 },
    { id: 2, statement: "Truth is subjective in crisis", confidence: 0.75 }
  ],
  riskFlags: [
    { id: 1, kind: 'TRADEMARK_MENTION', page: 2, snippet: 'iPhone brand reference' }
  ],
  subplots: [
    { id: 1, label: "Sarah's Isolation", spans: [] },
    { id: 2, label: "Building Mystery", spans: [] }
  ]
}

const mockScenes = [
  {
    id: 1,
    number: "1",
    sceneNumber: "1",
    slug: "INT. APARTMENT 3B - DAY",
    pageStart: 1,
    pageEnd: 2,
    characters: ["SARAH", "MIKE"],
    evidences: [{ id: 1, type: "structure", content: "Pacing issue" }],
    pins: { note: true, beat: false, pacing: false, feasibility: false, risk: false },
    preview: "SARAH sits alone at a small kitchen table, staring at her phone...",
    content: `INT. APARTMENT 3B - DAY

SARAH (20s) sits alone at a small kitchen table, staring at her phone. The apartment is sparse, with unpacked boxes scattered around.

SARAH
(into phone)
I know you're worried, but I'm fine. Really.

MIKE (O.S.)
(filtered, concerned)
Sarah, you haven't left that place in three days. This isn't healthy.

Sarah moves to the window, peeks through the blinds at the empty street below.

SARAH
I just... I need time to adjust. It's a big change.

The sound of FOOTSTEPS echoes from the apartment above. Sarah glances up, listening.

MIKE (O.S.)
(filtered)
What was that?

SARAH
Just neighbors. Look, I should go. I'll call you later.

She hangs up before Mike can respond. The footsteps continue, rhythmic and deliberate.`
  },
  {
    id: 2,
    number: "2",
    sceneNumber: "2",
    slug: "INT. APARTMENT 3B - KITCHEN - DAY",
    pageStart: 2,
    pageEnd: 3,
    characters: ["SARAH"],
    evidences: [],
    pins: { note: false, beat: true, pacing: false, feasibility: false, risk: false },
    preview: "Sarah moves to the kitchen, opens the refrigerator...",
    content: `INT. APARTMENT 3B - KITCHEN - DAY (CONTINUOUS)

Sarah moves to the kitchen, opens the refrigerator. It's nearly empty. She grabs a bottle of water.

As she drinks, a VOICE echoes faintly from somewhere in the building. Indistinct, but urgent.

Sarah freezes, listening. The voice stops.

She walks to the front door, places her ear against it. Silence.

VOICE (O.S.)
(muffled, distant)
Help... please...

Sarah's eyes widen. She backs away from the door.`
  }
]

const pct = (n: number) => Math.round(n * 100)

export function ComprehensiveAnalysisUpdated() {
  const { toast } = useToast()
  const [chatOpen, setChatOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [showFullScreenplay, setShowFullScreenplay] = useState(false)
  const [selectedScene, setSelectedScene] = useState<any>(null)

  // Calculate metrics
  const scriptMetrics = {
    title: mockScript.title,
    format: mockScript.format,
    pageCount: mockScript.pageCount,
    totalScenes: mockScript.totalScenes,
    totalCharacters: mockScript.totalCharacters,
    fileSizeMB: Number((mockScript.fileSize / (1024 * 1024)).toFixed(1)),
    runtimeMin: 15,
    runtimeConfidence: 0.85,
    intExtRatio: { INT: 0.8, EXT: 0.2 },
    dayNightRatio: { DAY: 0.7, NIGHT: 0.3 },
    uniqueLocations: 3,
    complexityIndex: 6.2
  }

  const handleStartAnalysis = async (type: string) => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    const interval = setInterval(() => {
      setAnalysisProgress(prev => prev < 95 ? prev + Math.random() * 10 : 95)
    }, 500)

    setTimeout(() => {
      clearInterval(interval)
      setAnalysisProgress(100)
      setIsAnalyzing(false)
      toast({
        title: "Analysis Complete",
        description: `${type} analysis has been completed successfully.`
      })
    }, 3000)
  }

  const fullScreenplay = mockScenes.map(scene => scene.content).join('\n\n')

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* HEADER */}
        <Card className="shadow-lg bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <CardTitle className="text-2xl md:text-3xl text-foreground">{mockScript.title}</CardTitle>
                  <Badge variant="secondary" className="text-xs bg-secondary/50 text-secondary-foreground border-secondary">
                    {mockScript.project.name}
                  </Badge>
                </div>
                <CardDescription className="text-muted-foreground">
                  Analysis dashboard · {mockScript.format} · {mockScript.pageCount} pages
                </CardDescription>
              </div>

              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 border-border hover:bg-accent">
                      <Download className="h-4 w-4"/> Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-border">
                    <DropdownMenuLabel>Downloads</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Coverage PDF</DropdownMenuItem>
                    <DropdownMenuItem>Notes CSV</DropdownMenuItem>
                    <DropdownMenuItem>JSON Bundle</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>FDX Change List</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Sheet open={chatOpen} onOpenChange={setChatOpen}>
                  <SheetTrigger asChild>
                    <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      <MessageSquare className="h-4 w-4"/> Chat
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[420px] sm:w-[540px] bg-background border-border">
                    <SheetHeader>
                      <SheetTitle className="text-foreground">Script Assistant</SheetTitle>
                      <SheetDescription className="text-muted-foreground">
                        Ask context-aware questions. Replies link to scenes & notes.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-4 space-y-3">
                      <Label htmlFor="q" className="text-foreground">Question</Label>
                      <Textarea
                        id="q"
                        placeholder="e.g., Why is the midpoint flagged late?"
                        className="bg-background border-border text-foreground"
                      />
                      <div className="flex justify-end">
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Ask</Button>
                      </div>
                      <Separator className="border-border" />
                      <div className="text-sm text-muted-foreground">
                        Responses appear here…
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* METRIC CARDS */}
            <div className="mt-6 grid grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
              {[
                { icon: FileText, label: "Format", value: scriptMetrics.format },
                { icon: BookOpenText, label: "Pages", value: `${scriptMetrics.pageCount}p` },
                { icon: Layers, label: "Scenes", value: `${scriptMetrics.totalScenes}` },
                { icon: Users, label: "Characters", value: `${scriptMetrics.totalCharacters}` },
                { icon: Clock, label: "Runtime", value: `~${scriptMetrics.runtimeMin}m` },
                { icon: Film, label: "INT/EXT", value: `${pct(scriptMetrics.intExtRatio.INT)}/${pct(scriptMetrics.intExtRatio.EXT)}` },
                { icon: Sun, label: "Day/Night", value: `${pct(scriptMetrics.dayNightRatio.DAY)}/${pct(scriptMetrics.dayNightRatio.NIGHT)}` },
                { icon: MapPin, label: "Locations", value: `${scriptMetrics.uniqueLocations}` },
                { icon: BarChart4, label: "Complexity", value: `${scriptMetrics.complexityIndex}` }
              ].map((metric, i) => (
                <Card key={i} className="bg-muted/30 border-muted hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4 text-center">
                    <metric.icon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-lg font-semibold text-foreground">{metric.value}</div>
                    <div className="text-xs text-muted-foreground">{metric.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardHeader>

          {/* CONTROL PANEL */}
          <CardContent className="pb-6 pt-0">
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  variant="secondary"
                  onClick={() => handleStartAnalysis('quick')}
                  disabled={isAnalyzing}
                >
                  <Play className="h-4 w-4"/> Quick
                </Button>
                <Button
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => handleStartAnalysis('comprehensive')}
                  disabled={isAnalyzing}
                >
                  <Rocket className="h-4 w-4"/> Comprehensive
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 border-border hover:bg-accent" disabled={isAnalyzing}>
                      <Settings className="h-4 w-4"/> Custom <ChevronDown className="h-4 w-4"/>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover border-border">
                    <DropdownMenuLabel>Analysis Types</DropdownMenuLabel>
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem>Genre Classification</DropdownMenuItem>
                    <DropdownMenuItem>Story Structure</DropdownMenuItem>
                    <DropdownMenuItem>Character Development</DropdownMenuItem>
                    <DropdownMenuItem>Dialogue Quality</DropdownMenuItem>
                    <DropdownMenuItem>Pacing & Flow</DropdownMenuItem>
                    <DropdownMenuItem>Theme Analysis</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="w-full md:w-1/2">
                <div className="text-xs mb-2 text-muted-foreground">
                  Parse → Normalize → Taggers → Cross-scene → Escalations → Scoring → Assets
                </div>
                <Progress value={isAnalyzing ? analysisProgress : 100} className="bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MAIN GRID */}
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT: SCRIPT VIEWER */}
          <div className="col-span-12 xl:col-span-5">
            <Card className="h-[700px] shadow-lg bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg text-foreground">Script Viewer</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                      <Input className="pl-8 w-48 bg-background border-border text-foreground" placeholder="Search scenes…"/>
                    </div>
                    <Select>
                      <SelectTrigger className="w-[140px] bg-background border-border">
                        <SelectValue placeholder="Filter"/>
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="issues">Only with issues</SelectItem>
                        <SelectItem value="int">INT</SelectItem>
                        <SelectItem value="ext">EXT</SelectItem>
                        <SelectItem value="day">DAY</SelectItem>
                        <SelectItem value="night">NIGHT</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="outline" className="border-border hover:bg-accent">
                      <ChevronLeft className="h-4 w-4"/>
                    </Button>
                    <Button size="icon" variant="outline" className="border-border hover:bg-accent">
                      <ChevronRight className="h-4 w-4"/>
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-muted-foreground">
                  {mockScript.totalScenes} scenes · {mockScript.pageCount} pages
                </CardDescription>
              </CardHeader>
              <Separator className="border-border"/>
              <CardContent className="p-0 h-[580px]">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3">
                    <Button
                      onClick={() => setShowFullScreenplay(true)}
                      className="w-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Screenplay
                    </Button>

                    <div className="space-y-2">
                      {mockScenes.map((scene) => (
                        <motion.div
                          key={scene.id}
                          whileHover={{ scale: 1.01 }}
                          className="p-4 rounded-lg bg-muted/20 border border-muted hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => setSelectedScene(scene)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                  #{scene.number}
                                </span>
                                <span className="font-semibold text-foreground text-sm">{scene.slug}</span>
                                <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                                  pp. {scene.pageStart}–{scene.pageEnd}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {scene.preview}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                {scene.characters.map((c) => (
                                  <Badge key={c} variant="outline" className="text-xs bg-accent/50 text-accent-foreground border-accent">
                                    {c}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {scene.pins.note && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="hover:bg-accent">
                                      <AlertTriangle className="h-4 w-4 text-amber-600"/>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Notes present</TooltipContent>
                                </Tooltip>
                              )}
                              {scene.pins.beat && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="hover:bg-accent">
                                      <Link2 className="h-4 w-4 text-sky-600"/>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Beat anchor</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: ANALYZER TABS */}
          <div className="col-span-12 xl:col-span-7">
            <Card className="h-[700px] shadow-lg bg-card border-border">
              <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
                <div className="px-6 pt-6 pb-0">
                  <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2 bg-muted/30">
                    <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">Overview</TabsTrigger>
                    <TabsTrigger value="coverage" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">Coverage</TabsTrigger>
                    <TabsTrigger value="craft" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">Craft</TabsTrigger>
                    <TabsTrigger value="characters" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">Characters</TabsTrigger>
                    <TabsTrigger value="pacing" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">Pacing</TabsTrigger>
                    <TabsTrigger value="feasibility" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">Feasibility</TabsTrigger>
                    <TabsTrigger value="notes" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">Notes</TabsTrigger>
                    <TabsTrigger value="exports" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">Exports</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-hidden">
                  {/* OVERVIEW */}
                  <TabsContent value="overview" className="h-full p-6 pt-4">
                    <ScrollArea className="h-full">
                      <div className="space-y-4">
                        <Card className="bg-muted/20 border-muted">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-foreground">Logline</CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm text-muted-foreground">
                            {mockScript.logline}
                          </CardContent>
                        </Card>

                        <Card className="bg-muted/20 border-muted">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-foreground">Synopsis</CardTitle>
                            <CardDescription className="text-muted-foreground">1-pager and 3-pager</CardDescription>
                          </CardHeader>
                          <CardContent className="text-sm text-muted-foreground">
                            {mockScript.synopsisShort}
                          </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <Card className="bg-accent/20 border-accent">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-foreground">Strengths</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2 text-foreground">
                              <li>Strong atmospheric tension building</li>
                              <li>Effective use of confined space</li>
                              <li>Clear protagonist motivation</li>
                            </CardContent>
                          </Card>
                          <Card className="bg-destructive/10 border-destructive/30">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-foreground">Areas for Improvement</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2 text-foreground">
                              <li>Limited character development time</li>
                              <li>Some dialogue feels exposition-heavy</li>
                              <li>Unclear antagonist motivation</li>
                            </CardContent>
                          </Card>
                        </div>

                        {mockScript.scores.length > 0 && (
                          <Card className="bg-primary/5 border-primary/20">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-foreground">Scorecard</CardTitle>
                              <CardDescription className="text-muted-foreground">Studio-style rubric (1–10)</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {mockScript.scores.map((score) => (
                                  <div key={score.id} className="rounded-lg border border-border bg-background p-3">
                                    <div className="text-xs text-muted-foreground">{score.category.replace('_', ' ')}</div>
                                    <div className="text-xl font-semibold text-foreground">{score.value.toFixed(1)}</div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* COVERAGE */}
                  <TabsContent value="coverage" className="h-full p-6 pt-4">
                    <ScrollArea className="h-full">
                      <Card className="bg-muted/20 border-muted">
                        <CardHeader className="flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-foreground">Coverage</CardTitle>
                            <CardDescription className="text-muted-foreground">Pass / Consider / Recommend</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select>
                              <SelectTrigger className="w-[180px] bg-background border-border">
                                <SelectValue placeholder="Select rating"/>
                              </SelectTrigger>
                              <SelectContent className="bg-popover border-border">
                                <SelectItem value="pass">Pass</SelectItem>
                                <SelectItem value="consider">Consider</SelectItem>
                                <SelectItem value="recommend">Recommend</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="outline" className="gap-2 border-border hover:bg-accent">
                              <Share2 className="h-4 w-4"/> Export PDF
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="text-sm font-semibold text-foreground">Comps</div>
                              <div className="flex flex-wrap gap-2 text-sm">
                                <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground">Rear Window</Badge>
                                <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground">Rosemary's Baby</Badge>
                              </div>
                              <Separator className="my-2 border-border"/>
                              <div className="text-sm font-semibold text-foreground">Strengths</div>
                              <ul className="text-sm list-disc pl-5 space-y-1 text-muted-foreground">
                                <li>Builds tension effectively</li>
                                <li>Strong central premise</li>
                              </ul>
                            </div>
                            <div className="rounded-lg border border-border bg-background p-3">
                              <div className="text-sm font-medium mb-2 text-foreground">Beat Map</div>
                              <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={mockScript.beats.map((b) => ({ x: b.page, y: b.confidence }))}>
                                    <defs>
                                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="x" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                                    <YAxis domain={[0, 1]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                                    <RTooltip />
                                    <Area type="monotone" dataKey="y" stroke="hsl(var(--primary))" fill="url(#grad)" />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollArea>
                  </TabsContent>

                  {/* CRAFT */}
                  <TabsContent value="craft" className="h-full p-6 pt-4">
                    <ScrollArea className="h-full">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { title: "Structure & Beats", icon: BarChart4, content: "Story structure analysis and beat identification" },
                          { title: "Conflict & Theme", icon: Zap, content: "Conflict escalation and thematic elements" },
                          { title: "Dialogue", icon: MessageSquare, content: "Dialogue quality and character voice" },
                          { title: "World & Logic", icon: Globe, content: "World-building and narrative consistency" },
                          { title: "Genre & Market", icon: Target, content: "Genre conventions and market positioning" },
                          { title: "Formatting", icon: FileText, content: "Script formatting and industry standards" },
                          { title: "Sensitivity", icon: Users, content: "Inclusive language and representation" },
                          { title: "Risk Flags", icon: AlertTriangle, content: "Legal and production risk assessment" }
                        ].map((card, i) => (
                          <Card key={i} className="bg-muted/20 border-muted hover:bg-muted/30 transition-colors cursor-pointer">
                            <CardHeader className="pb-2">
                              <div className="flex items-center gap-2">
                                <card.icon className="h-4 w-4 text-primary" />
                                <CardTitle className="text-sm text-foreground">{card.title}</CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-xs text-muted-foreground">{card.content}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* CHARACTERS */}
                  <TabsContent value="characters" className="h-full p-6 pt-4">
                    <ScrollArea className="h-full">
                      <Card className="bg-muted/20 border-muted">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-foreground">Character Analysis</CardTitle>
                          <CardDescription className="text-muted-foreground">{mockScript.characters.length} characters detected</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {mockScript.characters.map((character) => (
                              <div key={character.id} className="rounded-lg border border-border bg-background p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium text-foreground">{character.name}</div>
                                  <Badge variant="outline" className="bg-accent/50 text-accent-foreground border-accent">{character.dialogueCount} lines</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Character arc analysis pending...
                                </div>
                                {character.firstAppearance && (
                                  <div className="text-xs text-muted-foreground">
                                    First appearance: Page {character.firstAppearance}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollArea>
                  </TabsContent>

                  {/* PACING */}
                  <TabsContent value="pacing" className="h-full p-6 pt-4">
                    <ScrollArea className="h-full">
                      <div className="space-y-4">
                        <Card className="bg-muted/20 border-muted">
                          <CardHeader>
                            <CardTitle className="text-foreground">Scene Length Distribution</CardTitle>
                          </CardHeader>
                          <CardContent className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={mockScript.pageMetrics.map(pm => ({ page: pm.page, length: pm.actionLines + pm.dialogueLines }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="page" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                                <RTooltip />
                                <Bar dataKey="length" fill="hsl(var(--primary))" />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                        <Card className="bg-muted/20 border-muted">
                          <CardHeader>
                            <CardTitle className="text-foreground">Tension Curve</CardTitle>
                          </CardHeader>
                          <CardContent className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={mockScript.pageMetrics}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="page" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                                <RTooltip />
                                <Line dataKey="tensionScore" type="monotone" stroke="hsl(var(--primary))" strokeWidth={2} />
                              </LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* FEASIBILITY */}
                  <TabsContent value="feasibility" className="h-full p-6 pt-4">
                    <ScrollArea className="h-full">
                      <Card className="bg-muted/20 border-muted">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-foreground">Production Feasibility</CardTitle>
                          <CardDescription className="text-muted-foreground">
                            Location requirements and production complexity analysis
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            { k: "INT", v: pct(scriptMetrics.intExtRatio.INT) + "%" },
                            { k: "EXT", v: pct(scriptMetrics.intExtRatio.EXT) + "%" },
                            { k: "DAY", v: pct(scriptMetrics.dayNightRatio.DAY) + "%" },
                            { k: "NIGHT", v: pct(scriptMetrics.dayNightRatio.NIGHT) + "%" },
                            { k: "Locations", v: String(scriptMetrics.uniqueLocations) },
                            { k: "Complexity", v: String(scriptMetrics.complexityIndex) },
                          ].map((m) => (
                            <div key={m.k} className="rounded-lg border border-border bg-background p-3">
                              <div className="text-xs text-muted-foreground">{m.k}</div>
                              <div className="text-xl font-semibold text-foreground">{m.v}</div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </ScrollArea>
                  </TabsContent>

                  {/* NOTES */}
                  <TabsContent value="notes" className="h-full p-6 pt-4">
                    <ScrollArea className="h-full">
                      <Card className="bg-muted/20 border-muted">
                        <CardHeader className="flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-foreground">Analysis Notes</CardTitle>
                            <CardDescription className="text-muted-foreground">
                              Detailed feedback and suggestions
                            </CardDescription>
                          </div>
                          <Button variant="outline" className="gap-2 border-border hover:bg-accent">
                            <Download className="h-4 w-4"/> Export CSV
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow className="border-border">
                                <TableHead className="text-muted-foreground">Severity</TableHead>
                                <TableHead className="text-muted-foreground">Area</TableHead>
                                <TableHead className="text-muted-foreground">Page</TableHead>
                                <TableHead className="text-muted-foreground">Issue</TableHead>
                                <TableHead className="text-muted-foreground">Suggestion</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {mockScript.notes.map((note) => (
                                <TableRow key={note.id} className="border-border">
                                  <TableCell>
                                    <Badge variant={note.severity === 'HIGH' ? 'destructive' : 'secondary'}>
                                      {note.severity}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-foreground">{note.area}</TableCell>
                                  <TableCell className="text-foreground">{note.page}</TableCell>
                                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                    {note.excerpt}
                                  </TableCell>
                                  <TableCell className="max-w-[250px] truncate text-muted-foreground">
                                    {note.suggestion}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </ScrollArea>
                  </TabsContent>

                  {/* EXPORTS */}
                  <TabsContent value="exports" className="h-full p-6 pt-4">
                    <ScrollArea className="h-full">
                      <Card className="bg-muted/20 border-muted">
                        <CardHeader>
                          <CardTitle className="text-foreground">Export Options</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {["Coverage PDF","Notes PDF","Notes CSV","JSON Bundle","FDX Change List"].map((exportType) => (
                            <div key={exportType} className="rounded-lg border border-border bg-background p-3 flex items-center justify-between">
                              <div className="text-sm text-foreground">{exportType}</div>
                              <Button variant="outline" size="sm" className="gap-2 border-border hover:bg-accent">
                                <Download className="h-4 w-4"/> Download
                              </Button>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </ScrollArea>
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </div>
        </div>

        {/* Full Screenplay Dialog */}
        <Dialog open={showFullScreenplay} onOpenChange={setShowFullScreenplay}>
          <DialogContent className="max-w-4xl h-[80vh] bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">{mockScript.title} - Full Screenplay</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 p-4">
              <pre className="whitespace-pre-wrap text-sm font-mono text-foreground leading-relaxed">
                {fullScreenplay}
              </pre>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Individual Scene Dialog */}
        <Dialog open={!!selectedScene} onOpenChange={() => setSelectedScene(null)}>
          <DialogContent className="max-w-3xl h-[70vh] bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">{selectedScene?.slug}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 p-4">
              <pre className="whitespace-pre-wrap text-sm font-mono text-foreground leading-relaxed">
                {selectedScene?.content}
              </pre>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}