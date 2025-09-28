'use client'

import React, { useState, useEffect } from 'react'
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
import {
  ArrowLeft,
  FileText,
  Film,
  Clock,
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
  Share2,
  Layers,
  Link2,
  Eye,
  Zap,
  Brain,
  Globe,
  Target,
  BarChart4,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  ShieldAlert,
  Info,
  PieChart,
  Filter,
  RefreshCw,
  Calendar,
  Timer,
  Users2,
  Building,
  Lightbulb,
  FileType,
  Flag,
  Palette,
  Camera,
  Volume2,
  ShoppingCart,
  Car,
  Heart,
  Star,
  Award,
  Megaphone,
  Feather,
  Sparkles,
  ArrowUpDown,
  MoreHorizontal,
  ExternalLink,
  Lightbulb as InsightIcon,
  Network,
  HelpCircle,
  SlidersHorizontal
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart as RPieChart,
  Cell,
  ScatterChart,
  Scatter
} from "recharts"

// Enhanced Mock Data with complete structure
const mockScript = {
  id: "script-dark-echo",
  title: "Dark Echo",
  originalFilename: "dark_echo_v3.fdx",
  author: "Alex Thompson",
  format: "FDX",
  pageCount: 110,
  totalScenes: 45,
  totalCharacters: 8,
  fileSize: 1024 * 1024 * 3.2,
  logline: "A young woman trapped in her apartment discovers that the sounds from her neighbors aren't what they seem, leading to a terrifying revelation about the building's dark history.",
  synopsisShort: "Sarah moves into a seemingly perfect apartment building, but when she starts hearing disturbing sounds from neighboring units, she uncovers a supernatural conspiracy that threatens not just her sanity, but her life.",
  synopsisLong: "Sarah Chen, a graphic designer recovering from a difficult breakup, moves into what seems like the perfect apartment in downtown Portland. The rent is surprisingly affordable, the neighbors are quiet, and her unit has great natural light. However, as she settles in, she begins hearing strange sounds through the walls - muffled conversations, footsteps at odd hours, and what sounds like someone crying. When she tries to investigate, she discovers that several units appear to be empty, despite the sounds continuing. As Sarah digs deeper, she uncovers the building's dark history of mysterious disappearances and realizes that some residents may not be as alive as they appear. Racing against time before she becomes the next victim, Sarah must escape the building and expose the supernatural forces at work before they claim her soul.",
  project: { name: "Urban Horror Collection", type: "Feature" },
  genre: "Supernatural Thriller",
  qualityScore: 0.92,
  runtime: 108,
  complexity: 6.8,
  uniqueLocations: 12,
  intExtRatio: { INT: 0.75, EXT: 0.25 },
  dayNightRatio: { DAY: 0.45, NIGHT: 0.55 },
  comps: ["Rosemary's Baby", "The Shining", "Don't Breathe"],
  coverage: "CONSIDER",
  coverageNotes: "Strong atmospheric tension and contained setting work well. Character development needs strengthening in Act II.",
  scores: [
    { category: 'STRUCTURE', value: 8.2, description: 'Well-paced three-act structure with clear beats' },
    { category: 'CHARACTER', value: 7.5, description: 'Protagonist is compelling but supporting cast needs depth' },
    { category: 'DIALOGUE', value: 7.8, description: 'Natural conversations with good subtext' },
    { category: 'PACING', value: 8.0, description: 'Tension builds effectively throughout' },
    { category: 'THEME', value: 7.2, description: 'Isolation and trust themes could be stronger' },
    { category: 'GENRE_FIT', value: 8.5, description: 'Excellent horror conventions and atmosphere' },
    { category: 'ORIGINALITY', value: 7.0, description: 'Fresh take on haunted building concept' },
    { category: 'FEASIBILITY', value: 8.8, description: 'Very shootable with contained locations' }
  ],
  beats: [
    { id: 1, kind: 'OPENING_IMAGE', page: 1, confidence: 0.95, timingFlag: 'ON_TIME', description: 'Sarah arriving at the building' },
    { id: 2, kind: 'INCITING_INCIDENT', page: 15, confidence: 0.88, timingFlag: 'ON_TIME', description: 'First strange sounds from walls' },
    { id: 3, kind: 'PLOT_POINT_1', page: 28, confidence: 0.82, timingFlag: 'SLIGHTLY_LATE', description: 'Sarah discovers empty apartments' },
    { id: 4, kind: 'MIDPOINT', page: 55, confidence: 0.90, timingFlag: 'ON_TIME', description: 'Building history revelation' },
    { id: 5, kind: 'PLOT_POINT_2', page: 85, confidence: 0.85, timingFlag: 'ON_TIME', description: 'Sarah becomes target' },
    { id: 6, kind: 'CLIMAX', page: 102, confidence: 0.92, timingFlag: 'ON_TIME', description: 'Final confrontation and escape' }
  ],
  characters: [
    {
      id: 1,
      name: "SARAH",
      dialogueCount: 145,
      firstAppearance: 1,
      arcSummary: "Isolated protagonist who must overcome trust issues to survive",
      scenePresence: [1,1,1,0,1,1,1,0,0,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1]
    },
    {
      id: 2,
      name: "MIKE",
      dialogueCount: 28,
      firstAppearance: 8,
      arcSummary: "Concerned ex-boyfriend who provides outside perspective",
      scenePresence: [0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0]
    },
    {
      id: 3,
      name: "MRS. CHEN",
      dialogueCount: 35,
      firstAppearance: 12,
      arcSummary: "Elderly neighbor with knowledge of building's history",
      scenePresence: [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    },
    {
      id: 4,
      name: "BUILDING MANAGER",
      dialogueCount: 22,
      firstAppearance: 3,
      arcSummary: "Mysterious figure with hidden agenda",
      scenePresence: [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]
    }
  ],
  scenes: [
    {
      id: 1,
      number: "1",
      slug: "EXT. APARTMENT BUILDING - DAY",
      pageStart: 1,
      pageEnd: 3,
      characters: ["SARAH"],
      location: "Apartment Building Exterior",
      tod: "DAY",
      intExt: "EXT",
      preview: "Sarah arrives at her new apartment building with moving boxes...",
      hasNotes: false,
      hasBeat: true,
      complexity: 3.2,
      feasibility: { vfx: false, stunts: false, crowd: false, minors: false, animals: false, weapons: false, vehicles: true, specialProps: false }
    },
    {
      id: 2,
      number: "2",
      slug: "INT. APARTMENT 3B - DAY",
      pageStart: 3,
      pageEnd: 6,
      characters: ["SARAH"],
      location: "Sarah's Apartment",
      tod: "DAY",
      intExt: "INT",
      preview: "Sarah explores her new apartment, unpacking boxes...",
      hasNotes: false,
      hasBeat: false,
      complexity: 2.1,
      feasibility: { vfx: false, stunts: false, crowd: false, minors: false, animals: false, weapons: false, vehicles: false, specialProps: false }
    },
    {
      id: 3,
      number: "3",
      slug: "INT. APARTMENT BUILDING - LOBBY - DAY",
      pageStart: 6,
      pageEnd: 8,
      characters: ["SARAH", "BUILDING MANAGER"],
      location: "Building Lobby",
      tod: "DAY",
      intExt: "INT",
      preview: "Sarah meets the building manager and gets her keys...",
      hasNotes: false,
      hasBeat: false,
      complexity: 2.8,
      feasibility: { vfx: false, stunts: false, crowd: false, minors: false, animals: false, weapons: false, vehicles: false, specialProps: false }
    }
  ],
  notes: [
    {
      id: 1,
      severity: 'HIGH',
      area: 'STRUCTURE',
      sceneId: 3,
      page: 28,
      lineRef: 15,
      excerpt: 'Plot Point 1 occurs 3 pages late',
      suggestion: 'Consider moving Sarah\'s discovery to page 25 to maintain proper pacing',
      anchors: { sceneId: 3, startLine: 14, endLine: 18 }
    },
    {
      id: 2,
      severity: 'MEDIUM',
      area: 'CHARACTER',
      sceneId: 2,
      page: 45,
      lineRef: 8,
      excerpt: 'Sarah\'s motivation unclear in this sequence',
      suggestion: 'Add a beat showing why Sarah continues investigating despite fear',
      anchors: { sceneId: 2, startLine: 6, endLine: 12 }
    },
    {
      id: 3,
      severity: 'LOW',
      area: 'DIALOGUE',
      sceneId: 1,
      page: 67,
      lineRef: 22,
      excerpt: 'On-the-nose exposition about building history',
      suggestion: 'Show this information through visual discovery instead',
      anchors: { sceneId: 1, startLine: 20, endLine: 25 }
    }
  ],
  pageMetrics: [
    { page: 1, dialogueLines: 5, actionLines: 18, tensionScore: 0.3, complexityScore: 2.1 },
    { page: 15, dialogueLines: 12, actionLines: 12, tensionScore: 0.6, complexityScore: 3.2 },
    { page: 28, dialogueLines: 18, actionLines: 8, tensionScore: 0.8, complexityScore: 4.1 },
    { page: 45, dialogueLines: 22, actionLines: 6, tensionScore: 0.7, complexityScore: 3.8 },
    { page: 55, dialogueLines: 8, actionLines: 16, tensionScore: 0.9, complexityScore: 5.2 },
    { page: 67, dialogueLines: 15, actionLines: 11, tensionScore: 0.8, complexityScore: 4.3 },
    { page: 85, dialogueLines: 10, actionLines: 18, tensionScore: 0.95, complexityScore: 6.1 },
    { page: 102, dialogueLines: 6, actionLines: 22, tensionScore: 1.0, complexityScore: 7.8 },
    { page: 110, dialogueLines: 3, actionLines: 8, tensionScore: 0.4, complexityScore: 2.2 }
  ],
  themeStatements: [
    { id: 1, statement: "Isolation breeds paranoia and mistrust", confidence: 0.85, scenes: [1, 2, 5, 8, 12] },
    { id: 2, statement: "The past haunts the present in unexpected ways", confidence: 0.78, scenes: [15, 22, 28, 35, 42] },
    { id: 3, statement: "Trust must be earned, not assumed", confidence: 0.72, scenes: [8, 18, 25, 38, 44] }
  ],
  riskFlags: [
    { id: 1, kind: 'TRADEMARK_MENTION', page: 23, snippet: 'iPhone brand reference in dialogue', severity: 'LOW' },
    { id: 2, kind: 'REAL_PERSON', page: 67, snippet: 'Reference to Stephen King', severity: 'MEDIUM' },
    { id: 3, kind: 'LOCATION_RIGHTS', page: 89, snippet: 'Specific Portland building address', severity: 'HIGH' }
  ],
  feasibilityMetrics: {
    totalCost: 'LOW_BUDGET',
    shootingDays: 28,
    locationCount: 12,
    castSize: 8,
    vfxShots: 12,
    stuntSequences: 2,
    specialEquipment: ['Steadicam', 'Fog Machine'],
    timeOfDayBreakdown: { DAY: 18, NIGHT: 22, DAWN: 2, DUSK: 3 },
    seasonalRequirements: 'None',
    weatherDependency: 'Minimal'
  }
}

// Analysis status type
type AnalysisStatus = 'idle' | 'parsing' | 'analyzing' | 'ready' | 'blocked' | 'error'

// Data interfaces
interface Scene {
  id: number
  number: string
  slug: string
  pageStart: number
  pageEnd: number
  characters: string[]
  location: string
  tod: string
  intExt: string
  preview: string
  hasNotes: boolean
  hasBeat: boolean
  complexity: number
  feasibility: any
}

interface Beat {
  id: number
  kind: string
  page: number
  confidence: number
  timingFlag: 'ON_TIME' | 'SLIGHTLY_LATE' | 'LATE' | 'EARLY'
  description: string
}

interface Note {
  id: number
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  area: string
  sceneId: number
  page: number
  lineRef: number
  excerpt: string
  suggestion: string
  anchors: any
}

// Component interfaces
interface StatusBarProps {
  status: AnalysisStatus
  quality: number
  progress: number
  currentStep?: string
}

interface MetricTileProps {
  icon: React.ComponentType<any>
  label: string
  value: string | number
  description?: string
}

interface ScriptViewerProps {
  scenes: Scene[]
  onSceneClick: (scene: Scene) => void
  onViewFullScreenplay: () => void
  currentSceneIndex: number
  onNavigateScene: (direction: 'prev' | 'next') => void
}

export function EnhancedAnalysisPage() {
  const { toast } = useToast()

  // State management
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('ready')
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<string>()
  const [chatOpen, setChatOpen] = useState(false)
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
  const [showFullScreenplay, setShowFullScreenplay] = useState(false)
  const [sceneFilter, setSceneFilter] = useState<string>('all')
  const [sceneSearch, setSceneSearch] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [notesFilter, setNotesFilter] = useState<string>('all')
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  const [darkMode, setDarkMode] = useState(false)
  const [showQualityDialog, setShowQualityDialog] = useState(false)
  const [notesSort, setNotesSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: 'severity', direction: 'desc' })
  const [selectedNotesArea, setSelectedNotesArea] = useState<string>('all')
  const [showExportOptions, setShowExportOptions] = useState<string | null>(null)

  // Status Bar Component
  const StatusBar: React.FC<StatusBarProps> = ({ status, quality, progress, currentStep }) => {
    const getStatusDisplay = () => {
      switch (status) {
        case 'idle':
          return { color: 'text-muted-foreground', icon: Info, label: 'Ready to analyze' }
        case 'parsing':
          return { color: 'text-blue-600', icon: RefreshCw, label: 'Parsing screenplay...' }
        case 'analyzing':
          return { color: 'text-orange-600', icon: Activity, label: 'Running analysis...' }
        case 'ready':
          return { color: 'text-green-600', icon: CheckCircle2, label: 'Analysis complete' }
        case 'blocked':
          return { color: 'text-red-600', icon: XCircle, label: 'Blocked by quality gate' }
        case 'error':
          return { color: 'text-red-600', icon: AlertCircle, label: 'Analysis failed' }
        default:
          return { color: 'text-muted-foreground', icon: Info, label: 'Unknown status' }
      }
    }

    const statusDisplay = getStatusDisplay()
    const StatusIcon = statusDisplay.icon

    return (
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <StatusIcon className={`h-5 w-5 ${statusDisplay.color}`} />
              <div>
                <div className="font-medium">{statusDisplay.label}</div>
                {currentStep && (
                  <div className="text-sm text-muted-foreground">{currentStep}</div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-6">
              {/* Quality Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Quality:</span>
                <Badge
                  variant={quality >= 0.8 ? "default" : "destructive"}
                  className={quality >= 0.8 ? "bg-green-100 text-green-800" : ""}
                >
                  {Math.round(quality * 100)}%
                </Badge>
              </div>
              {/* Progress for active operations */}
              {(status === 'parsing' || status === 'analyzing') && (
                <div className="w-full sm:w-32">
                  <Progress value={progress} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">{Math.round(progress)}%</div>
                </div>
              )}
            </div>
          </div>

          {/* Quality Gate Warning */}
          {quality < 0.8 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <div className="font-medium text-red-800">Quality Gate Blocked</div>
                  <div className="text-sm text-red-700 mt-1">
                    This screenplay's formatting quality is below the 80% threshold required for analysis.
                    Please fix formatting issues and re-upload before proceeding.
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => setShowQualityDialog(true)}
                  >
                    Learn More About Formatting
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Metric Tile Component
  const MetricTile: React.FC<MetricTileProps> = ({ icon: Icon, label, value, description }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="hover:shadow-md transition-shadow cursor-help">
            <CardContent className="p-4 text-center">
              <Icon className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-lg font-semibold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        {description && (
          <TooltipContent>
            <p>{description}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )

  // Script Viewer Component
  const ScriptViewer: React.FC<ScriptViewerProps> = ({ scenes, onSceneClick, onViewFullScreenplay, currentSceneIndex, onNavigateScene }) => {
    const filteredScenes = scenes.filter(scene => {
      const matchesSearch = sceneSearch === '' ||
        scene.slug.toLowerCase().includes(sceneSearch.toLowerCase()) ||
        scene.characters.some((char: string) => char.toLowerCase().includes(sceneSearch.toLowerCase()))

      const matchesFilter = sceneFilter === 'all' ||
        (sceneFilter === 'issues' && scene.hasNotes) ||
        (sceneFilter === 'int' && scene.intExt === 'INT') ||
        (sceneFilter === 'ext' && scene.intExt === 'EXT') ||
        (sceneFilter === 'day' && scene.tod === 'DAY') ||
        (sceneFilter === 'night' && scene.tod === 'NIGHT')

      return matchesSearch && matchesFilter
    })

    const canNavigatePrev = currentSceneIndex > 0
    const canNavigateNext = currentSceneIndex < filteredScenes.length - 1

    return (
      <Card className="h-[600px]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Script Viewer</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                disabled={!canNavigatePrev}
                onClick={() => canNavigatePrev && onNavigateScene('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                disabled={!canNavigateNext}
                onClick={() => canNavigateNext && onNavigateScene('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scenes, characters..."
                value={sceneSearch}
                onChange={(e) => setSceneSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sceneFilter} onValueChange={setSceneFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scenes</SelectItem>
                <SelectItem value="issues">With Issues</SelectItem>
                <SelectItem value="int">INT Only</SelectItem>
                <SelectItem value="ext">EXT Only</SelectItem>
                <SelectItem value="day">DAY Only</SelectItem>
                <SelectItem value="night">NIGHT Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0 h-[480px]">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {/* View Full Screenplay Button */}
              <Button
                onClick={onViewFullScreenplay}
                variant="outline"
                className="w-full border-dashed border-primary text-primary hover:bg-primary/5"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Full Screenplay
              </Button>

              {/* Scene Cards */}
              {filteredScenes.map((scene, index) => (
                <Card
                  key={scene.id}
                  className={`p-4 hover:shadow-md transition-all cursor-pointer border-l-4 ${
                    index === currentSceneIndex
                      ? 'border-l-primary bg-primary/5'
                      : 'border-l-muted hover:border-l-primary'
                  }`}
                  onClick={() => onSceneClick(scene)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          #{scene.number}
                        </Badge>
                        <div className="font-medium text-sm">{scene.slug}</div>
                        <Badge variant="secondary" className="text-xs">
                          pp. {scene.pageStart}–{scene.pageEnd}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {scene.preview}
                      </p>

                      <div className="flex items-center gap-2 flex-wrap">
                        {scene.characters.map((char: string) => (
                          <Badge key={char} variant="outline" className="text-xs">
                            {char}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Scene Pins */}
                    <div className="flex items-center gap-1 ml-3">
                      {scene.hasNotes && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Has notes</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {scene.hasBeat && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Link2 className="h-4 w-4 text-blue-600" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Story beat anchor</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {filteredScenes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2" />
                  <p>No scenes match your search criteria</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  // Navigation handlers
  const handleNavigateScene = (direction: 'prev' | 'next') => {
    const filteredScenes = mockScript.scenes.filter(scene => {
      const matchesSearch = sceneSearch === '' ||
        scene.slug.toLowerCase().includes(sceneSearch.toLowerCase()) ||
        scene.characters.some((char: string) => char.toLowerCase().includes(sceneSearch.toLowerCase()))

      const matchesFilter = sceneFilter === 'all' ||
        (sceneFilter === 'issues' && scene.hasNotes) ||
        (sceneFilter === 'int' && scene.intExt === 'INT') ||
        (sceneFilter === 'ext' && scene.intExt === 'EXT') ||
        (sceneFilter === 'day' && scene.tod === 'DAY') ||
        (sceneFilter === 'night' && scene.tod === 'NIGHT')

      return matchesSearch && matchesFilter
    })

    if (direction === 'prev' && currentSceneIndex > 0) {
      setCurrentSceneIndex(currentSceneIndex - 1)
    } else if (direction === 'next' && currentSceneIndex < filteredScenes.length - 1) {
      setCurrentSceneIndex(currentSceneIndex + 1)
    }
  }

  // Analysis control handlers
  const handleStartAnalysis = async (type: 'QUICK' | 'COMPREHENSIVE' | 'CUSTOM') => {
    if (mockScript.qualityScore < 0.8) {
      setAnalysisStatus('blocked')
      return
    }

    setAnalysisStatus('analyzing')
    setAnalysisProgress(0)
    setCurrentStep('Initializing analysis...')

    // Simulate analysis progress
    const steps = [
      'Parsing screenplay structure...',
      'Detecting story beats...',
      'Analyzing character arcs...',
      'Evaluating dialogue quality...',
      'Checking pacing and flow...',
      'Generating insights...',
      'Finalizing results...'
    ]

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setCurrentStep(steps[i])
      setAnalysisProgress((i + 1) / steps.length * 100)
    }

    setAnalysisStatus('ready')
    setCurrentStep(undefined)

    toast({
      title: "Analysis Complete!",
      description: `${type} analysis completed successfully. Results are now available.`
    })
  }

  // Calculate derived metrics
  const metrics = [
    { icon: FileType, label: "Format", value: mockScript.format, description: "Original file format" },
    { icon: BookOpenText, label: "Pages", value: `${mockScript.pageCount}`, description: "Total page count" },
    { icon: Layers, label: "Scenes", value: `${mockScript.totalScenes}`, description: "Scene headings detected" },
    { icon: Users, label: "Characters", value: `${mockScript.totalCharacters}`, description: "Speaking characters" },
    { icon: Clock, label: "Runtime", value: `~${mockScript.runtime}m`, description: "Estimated screen time" },
    { icon: Building, label: "INT/EXT", value: `${Math.round(mockScript.intExtRatio.INT * 100)}/${Math.round(mockScript.intExtRatio.EXT * 100)}`, description: "Interior vs exterior ratio" },
    { icon: Sun, label: "DAY/NIGHT", value: `${Math.round(mockScript.dayNightRatio.DAY * 100)}/${Math.round(mockScript.dayNightRatio.NIGHT * 100)}`, description: "Time of day distribution" },
    { icon: MapPin, label: "Locations", value: `${mockScript.uniqueLocations}`, description: "Unique shooting locations" },
    { icon: BarChart4, label: "Complexity", value: `${mockScript.complexity}`, description: "Production complexity score" }
  ]

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        {/* HEADER SECTION */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Library
                  </Button>
                  <Film className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-3xl">{mockScript.title}</CardTitle>
                  <Badge variant="secondary">{mockScript.project.name}</Badge>
                  <Badge variant="outline">{mockScript.genre}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Analysis Dashboard / {mockScript.format} / {mockScript.pageCount} pages / by {mockScript.author}</span>
                  <Badge variant="outline" className="text-xs">
                    v3.2
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Last analyzed: 2 hours ago
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Dark Mode Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDarkMode(!darkMode)}
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                {/* Export Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Downloads</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <FileText className="h-4 w-4 mr-2" />
                      Coverage PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="h-4 w-4 mr-2" />
                      Notes PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Notes CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="h-4 w-4 mr-2" />
                      JSON Bundle
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Chat Button */}
                <Sheet open={chatOpen} onOpenChange={setChatOpen}>
                  <SheetTrigger asChild>
                    <Button>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[420px]">
                    <SheetHeader>
                      <SheetTitle>Script Assistant</SheetTitle>
                      <SheetDescription>
                        Ask context-aware questions about your screenplay. Answers link directly to scenes and evidence.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-4 space-y-4">
                      <div>
                        <Label htmlFor="question">Ask a question</Label>
                        <Textarea
                          id="question"
                          placeholder="e.g., Why is the midpoint flagged as late? What's the theme of Act II?"
                          className="mt-2"
                        />
                        <Button className="mt-3 w-full">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Ask Assistant
                        </Button>
                      </div>

                      {/* Suggested Prompts */}
                      <div>
                        <Label className="text-xs">Suggested prompts</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {[
                            "Why is Plot Point 1 late?",
                            "What's Sarah's character arc?",
                            "How can I improve pacing?",
                            "Show me tension spikes",
                            "What are the main themes?",
                            "Any production concerns?"
                          ].map((prompt) => (
                            <Button key={prompt} variant="outline" size="sm" className="text-xs">
                              {prompt}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Mock Conversation */}
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Conversation</div>
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">You asked:</div>
                          <div className="text-sm">"Why is the midpoint flagged as late?"</div>
                        </div>
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                          <div className="text-sm">
                            The midpoint occurs on page 55, which is ideal for a 110-page script. However, the
                            <Button variant="link" className="p-0 h-auto text-primary underline mx-1">
                              building history revelation (Scene 28)
                            </Button>
                            feels rushed. Consider moving Sarah's discovery to page 52-53 for better pacing.
                          </div>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Metric Strip */}
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-3 mt-6">
              {metrics.map((metric, i) => (
                <MetricTile key={i} {...metric} />
              ))}
            </div>

            {/* Control Panel */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => handleStartAnalysis('QUICK')}
                    disabled={analysisStatus === 'analyzing' || mockScript.qualityScore < 0.8}
                    variant="secondary"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Quick Analysis
                  </Button>
                  <Button
                    onClick={() => handleStartAnalysis('COMPREHENSIVE')}
                    disabled={analysisStatus === 'analyzing' || mockScript.qualityScore < 0.8}
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    Comprehensive
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={analysisStatus === 'analyzing' || mockScript.qualityScore < 0.8}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Custom
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Analysis Focus</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Story Structure</DropdownMenuItem>
                      <DropdownMenuItem>Character Development</DropdownMenuItem>
                      <DropdownMenuItem>Dialogue Quality</DropdownMenuItem>
                      <DropdownMenuItem>Pacing & Flow</DropdownMenuItem>
                      <DropdownMenuItem>Theme Analysis</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="text-sm text-muted-foreground">
                  Pipeline: Parse → Normalize → Detect → Score → Export
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* STATUS BAR */}
        <StatusBar
          status={analysisStatus}
          quality={mockScript.qualityScore}
          progress={analysisProgress}
          currentStep={currentStep}
        />

        {/* MAIN CONTENT - VERTICAL LAYOUT */}
        <div className="space-y-6">
          {/* SCRIPT VIEWER - FULL WIDTH */}
          <ScriptViewer
            scenes={mockScript.scenes}
            onSceneClick={setSelectedScene}
            onViewFullScreenplay={() => setShowFullScreenplay(true)}
            currentSceneIndex={currentSceneIndex}
            onNavigateScene={handleNavigateScene}
          />

          {/* ANALYSIS TABS - FULL WIDTH */}
          <Card className="min-h-[700px]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-6 pt-6 pb-0">
                <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-1 w-full">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="coverage" className="text-xs">Coverage</TabsTrigger>
                  <TabsTrigger value="craft" className="text-xs">Craft</TabsTrigger>
                  <TabsTrigger value="characters" className="text-xs">Characters</TabsTrigger>
                  <TabsTrigger value="pacing" className="text-xs">Pacing</TabsTrigger>
                  <TabsTrigger value="feasibility" className="text-xs">Feasibility</TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
                  <TabsTrigger value="exports" className="text-xs">Exports</TabsTrigger>
                </TabsList>
              </div>

                <div className="flex-1 overflow-hidden">
                  {/* OVERVIEW TAB */}
                  <TabsContent value="overview" className="h-full p-6 pt-4">
                    <ScrollArea className="h-full">
                      <div className="space-y-6">
                        {/* Logline */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Logline</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm leading-relaxed">{mockScript.logline}</p>
                          </CardContent>
                        </Card>

                        {/* Synopsis */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Synopsis</CardTitle>
                            <CardDescription>One-page and three-page summaries</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Short Synopsis</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {mockScript.synopsisShort}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Extended Synopsis</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {mockScript.synopsisLong}
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Strengths & Areas for Improvement */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="border-green-200 bg-green-50/50">
                            <CardHeader>
                              <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5" />
                                Strengths
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                  <Star className="h-4 w-4 text-green-600 mt-0.5" />
                                  Strong atmospheric tension building
                                </li>
                                <li className="flex items-start gap-2">
                                  <Star className="h-4 w-4 text-green-600 mt-0.5" />
                                  Effective use of confined setting
                                </li>
                                <li className="flex items-start gap-2">
                                  <Star className="h-4 w-4 text-green-600 mt-0.5" />
                                  Clear protagonist motivation and stakes
                                </li>
                                <li className="flex items-start gap-2">
                                  <Star className="h-4 w-4 text-green-600 mt-0.5" />
                                  Budget-friendly production requirements
                                </li>
                              </ul>
                            </CardContent>
                          </Card>

                          <Card className="border-orange-200 bg-orange-50/50">
                            <CardHeader>
                              <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Areas for Improvement
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                                  Supporting character development
                                </li>
                                <li className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                                  Some exposition-heavy dialogue
                                </li>
                                <li className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                                  Theme integration could be stronger
                                </li>
                                <li className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                                  Plot Point 1 timing needs adjustment
                                </li>
                              </ul>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Scorecard */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Scorecard</CardTitle>
                            <CardDescription>Studio-style rubric (1-10 scale)</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              {mockScript.scores.map((score) => (
                                <div key={score.category} className="text-center">
                                  <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg p-4 border">
                                    <div className="text-2xl font-bold text-primary mb-1">
                                      {score.value.toFixed(1)}
                                    </div>
                                    <div className="text-xs font-medium text-muted-foreground mb-2">
                                      {score.category.replace('_', ' ')}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {score.description}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Insights Strip */}
                        <Card className="bg-blue-50/50 border-blue-200">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <InsightIcon className="h-5 w-5 text-blue-600" />
                              Key Insights
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div className="bg-white p-3 rounded border">
                                <div className="text-sm font-medium text-red-700">Plot Point 1 late by 3 pages</div>
                                <div className="text-xs text-muted-foreground">Structure timing</div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <div className="text-sm font-medium text-green-700">High tension spike p.102</div>
                                <div className="text-xs text-muted-foreground">Climax buildup</div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <div className="text-sm font-medium text-amber-700">Supporting cast underdeveloped</div>
                                <div className="text-xs text-muted-foreground">Character depth</div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <div className="text-sm font-medium text-blue-700">Budget-friendly production</div>
                                <div className="text-xs text-muted-foreground">Feasibility</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Theme Statements & Risk Flags */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-amber-500" />
                                Theme Statements
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {mockScript.themeStatements.map((theme) => (
                                <div key={theme.id} className="border rounded-lg p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="text-sm font-medium">{theme.statement}</div>
                                    <Badge variant="outline" className="text-xs">
                                      {Math.round(theme.confidence * 100)}%
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Scenes: {theme.scenes.join(', ')}
                                  </div>
                                </div>
                              ))}
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-red-500" />
                                Risk Flags
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {mockScript.riskFlags.map((risk) => (
                                <div key={risk.id} className="border rounded-lg p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="text-sm font-medium">{risk.kind.replace('_', ' ')}</div>
                                    <Badge
                                      variant={risk.severity === 'HIGH' ? 'destructive' :
                                              risk.severity === 'MEDIUM' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {risk.severity}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Page {risk.page}
                                  </div>
                                  <div className="text-xs bg-muted/50 p-2 rounded">
                                    "{risk.snippet}"
                                  </div>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* COVERAGE TAB */}
                  <TabsContent value="coverage" className="h-full p-6 pt-4">
                    <ScrollArea className="h-full">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-lg">Coverage Assessment</CardTitle>
                                <CardDescription>Studio-style recommendation</CardDescription>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <Select defaultValue={mockScript.coverage.toLowerCase()}>
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pass">Pass</SelectItem>
                                    <SelectItem value="consider">Consider</SelectItem>
                                    <SelectItem value="recommend">Recommend</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button variant="outline">
                                  <Download className="h-4 w-4 mr-2" />
                                  Export PDF
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">Coverage Notes</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {mockScript.coverageNotes}
                                  </p>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2">Comparable Films</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {mockScript.comps.map((comp) => (
                                      <Badge key={comp} variant="secondary">{comp}</Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-3">Beat Timeline</h4>
                                <div className="h-48 mb-4">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={mockScript.beats.map(beat => ({
                                      page: beat.page,
                                      confidence: beat.confidence,
                                      kind: beat.kind
                                    }))}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="page" />
                                      <YAxis domain={[0, 1]} />
                                      <RTooltip />
                                      <Area
                                        type="monotone"
                                        dataKey="confidence"
                                        stroke="hsl(var(--primary))"
                                        fill="hsl(var(--primary))"
                                        fillOpacity={0.3}
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>

                                {/* Beat List */}
                                <div className="space-y-2">
                                  <h5 className="text-sm font-medium">Story Beats</h5>
                                  {mockScript.beats.map((beat) => (
                                    <div key={beat.id} className="flex items-center justify-between text-sm border rounded p-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                          p.{beat.page}
                                        </span>
                                        <span>{beat.kind.replace(/_/g, ' ')}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant={beat.timingFlag === 'ON_TIME' ? 'default' :
                                                  beat.timingFlag === 'SLIGHTLY_LATE' ? 'secondary' : 'destructive'}
                                          className="text-xs"
                                        >
                                          {beat.timingFlag.replace(/_/g, ' ')}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {Math.round(beat.confidence * 100)}%
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* CRAFT TAB */}
                  <TabsContent value="craft" className="h-full p-6 pt-4">
                    <ScrollArea className="h-full">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { title: "Structure & Beats", icon: BarChart4, description: "Story structure and beat placement analysis" },
                          { title: "Conflict & Theme", icon: Zap, description: "Conflict escalation and thematic development" },
                          { title: "Dialogue", icon: MessageSquare, description: "Dialogue quality and character voice" },
                          { title: "World & Logic", icon: Globe, description: "World-building and narrative consistency" },
                          { title: "Genre & Market", icon: Target, description: "Genre conventions and market fit" },
                          { title: "Formatting", icon: FileType, description: "Script formatting and standards" },
                          { title: "Sensitivity", icon: Heart, description: "Inclusive language and representation" },
                          { title: "Risk Flags", icon: ShieldAlert, description: "Legal and production risk assessment" }
                        ].map((card, i) => (
                          <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader className="pb-3">
                              <div className="flex items-center gap-2">
                                <card.icon className="h-5 w-5 text-primary" />
                                <CardTitle className="text-sm">{card.title}</CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-xs text-muted-foreground">{card.description}</p>
                              <div className="mt-3">
                                <Badge variant="outline" className="text-xs">
                                  {Math.floor(Math.random() * 10) + 1} issues
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* CHARACTERS TAB */}
                  <TabsContent value="characters" className="h-full p-6 pt-4">
                    <ScrollArea className="h-full">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Character Analysis</CardTitle>
                            <CardDescription>{mockScript.characters.length} speaking characters detected</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {mockScript.characters.map((character) => (
                                <Card key={character.id} className="p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium">{character.name}</h4>
                                    <Badge variant="outline">{character.dialogueCount} lines</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {character.arcSummary}
                                  </p>
                                  <div className="text-xs text-muted-foreground">
                                    First appears: Page {character.firstAppearance}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Character Relationships */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Network className="h-5 w-5" />
                              Character Relationships
                            </CardTitle>
                            <CardDescription>How characters connect and interact</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 p-3 border rounded-lg">
                                <div className="text-sm font-medium">SARAH ↔ MIKE</div>
                                <Badge variant="outline" className="text-xs">Ex-partners</Badge>
                                <span className="text-xs text-muted-foreground">8 shared scenes</span>
                              </div>
                              <div className="flex items-center gap-3 p-3 border rounded-lg">
                                <div className="text-sm font-medium">SARAH ↔ MRS. CHEN</div>
                                <Badge variant="outline" className="text-xs">Mentor/Guide</Badge>
                                <span className="text-xs text-muted-foreground">3 shared scenes</span>
                              </div>
                              <div className="flex items-center gap-3 p-3 border rounded-lg">
                                <div className="text-sm font-medium">SARAH ↔ BUILDING MANAGER</div>
                                <Badge variant="outline" className="text-xs">Antagonistic</Badge>
                                <span className="text-xs text-muted-foreground">4 shared scenes</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Character Presence Heatmap */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Scene Presence</CardTitle>
                            <CardDescription>Character appearance across scenes</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-muted-foreground">
                              Heatmap visualization would appear here showing character presence across all scenes.
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* PACING TAB */}
                  <TabsContent value="pacing" className="h-full p-6 pt-4">
                    <ScrollArea className="h-full">
                      <div className="space-y-6">
                        {/* Pacing Outliers */}
                        <Card className="bg-amber-50/50 border-amber-200">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <TrendingUp className="h-5 w-5 text-amber-600" />
                              Pacing Highlights
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="bg-white p-3 rounded border">
                                <div className="text-sm font-medium text-amber-700">Longest dialogue stretch</div>
                                <div className="text-xs text-muted-foreground">Pages 45-48 / 22 consecutive lines</div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <div className="text-sm font-medium text-green-700">Fastest action stretch</div>
                                <div className="text-xs text-muted-foreground">Pages 102-105 / High kinetic energy</div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <div className="text-sm font-medium text-red-700">Potential slow section</div>
                                <div className="text-xs text-muted-foreground">Pages 35-40 / Low tension valley</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Scene Length Distribution</CardTitle>
                          </CardHeader>
                          <CardContent className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={mockScript.pageMetrics}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="page" />
                                <YAxis />
                                <RTooltip />
                                <Bar dataKey="dialogueLines" stackId="a" fill="hsl(var(--primary))" />
                                <Bar dataKey="actionLines" stackId="a" fill="hsl(var(--muted))" />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Tension Curve</CardTitle>
                          </CardHeader>
                          <CardContent className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={mockScript.pageMetrics}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="page" />
                                <YAxis domain={[0, 1]} />
                                <RTooltip />
                                <Line
                                  type="monotone"
                                  dataKey="tensionScore"
                                  stroke="hsl(var(--primary))"
                                  strokeWidth={3}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* FEASIBILITY TAB */}
                  <TabsContent value="feasibility" className="h-full p-6 pt-4">
                    <ScrollArea className="h-full">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Production Overview</CardTitle>
                            <CardDescription>Budget and logistics assessment</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-4 border rounded-lg">
                                <div className="text-2xl font-bold text-green-600">LOW</div>
                                <div className="text-sm text-muted-foreground">Budget</div>
                              </div>
                              <div className="text-center p-4 border rounded-lg">
                                <div className="text-2xl font-bold">{mockScript.feasibilityMetrics.shootingDays}</div>
                                <div className="text-sm text-muted-foreground">Shoot Days</div>
                              </div>
                              <div className="text-center p-4 border rounded-lg">
                                <div className="text-2xl font-bold">{mockScript.feasibilityMetrics.locationCount}</div>
                                <div className="text-sm text-muted-foreground">Locations</div>
                              </div>
                              <div className="text-center p-4 border rounded-lg">
                                <div className="text-2xl font-bold">{mockScript.feasibilityMetrics.castSize}</div>
                                <div className="text-sm text-muted-foreground">Cast Size</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Special Requirements</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {[
                                { label: "VFX Shots", value: mockScript.feasibilityMetrics.vfxShots, icon: Sparkles },
                                { label: "Stunts", value: mockScript.feasibilityMetrics.stuntSequences, icon: Activity },
                                { label: "Special Equipment", value: mockScript.feasibilityMetrics.specialEquipment.length, icon: Camera }
                              ].map((item) => (
                                <div key={item.label} className="text-center p-4 border rounded-lg">
                                  <item.icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                                  <div className="text-lg font-semibold">{item.value}</div>
                                  <div className="text-sm text-muted-foreground">{item.label}</div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* NOTES TAB */}
                  <TabsContent value="notes" className="h-full p-6 pt-4">
                    <ScrollArea className="h-full">
                      <Card className="h-full flex flex-col">
                        <CardHeader className="pb-4">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-lg">Analysis Notes</CardTitle>
                                <CardDescription>{mockScript.notes.length} actionable notes found</CardDescription>
                              </div>
                              <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full sm:w-auto"
                                  onClick={() => setNotesSort({
                                    field: notesSort.field,
                                    direction: notesSort.direction === 'asc' ? 'desc' : 'asc'
                                  })}
                                >
                                  <ArrowUpDown className="h-4 w-4 mr-2" />
                                  Sort
                                </Button>
                                <div className="w-full sm:w-auto sm:min-w-[160px]">
                                  <Select value={notesFilter} onValueChange={setNotesFilter}>
                                    <SelectTrigger className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All Notes</SelectItem>
                                      <SelectItem value="high">High Priority</SelectItem>
                                      <SelectItem value="medium">Medium Priority</SelectItem>
                                      <SelectItem value="low">Low Priority</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                  <Download className="h-4 w-4 mr-2" />
                                  Export CSV
                                </Button>
                              </div>
                            </div>

                            {/* Area Filter Chips */}
                            <div className="flex flex-wrap gap-2">
                              <span className="text-sm text-muted-foreground shrink-0">Filter by area:</span>
                              {['all', 'STRUCTURE', 'CHARACTER', 'DIALOGUE', 'PACING', 'THEME'].map((area) => (
                                <Button
                                  key={area}
                                  variant={selectedNotesArea === area ? "default" : "outline"}
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => setSelectedNotesArea(area)}
                                >
                                  {area === 'all' ? 'All Areas' : area.toLowerCase()}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="flex-1 p-0">
                          <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                              <Table className="w-full table-fixed">
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[120px]">Priority</TableHead>
                                    <TableHead className="w-[140px]">Area</TableHead>
                                    <TableHead className="w-[120px]">Page</TableHead>
                                    <TableHead className="w-[300px]">Issue</TableHead>
                                    <TableHead className="w-[300px]">Suggestion</TableHead>
                                    <TableHead className="w-[100px]">Action</TableHead>
                                  </TableRow>
                                </TableHeader>
                              <TableBody>
                              {mockScript.notes
                                .filter(note => notesFilter === 'all' || note.severity.toLowerCase() === notesFilter)
                                .filter(note => selectedNotesArea === 'all' || note.area === selectedNotesArea)
                                .map((note) => (
                                <TableRow key={note.id} className="cursor-pointer hover:bg-muted/50">
                                  <TableCell>
                                    <Badge
                                      variant={note.severity === 'HIGH' ? 'destructive' :
                                              note.severity === 'MEDIUM' ? 'default' : 'secondary'}
                                    >
                                      {note.severity}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{note.area}</TableCell>
                                  <TableCell>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="outline" size="sm" className="font-mono text-xs">
                                            p.{note.page} / l.{note.lineRef}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Opens screenplay at anchor</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </TableCell>
                                  <TableCell className="align-top text-sm leading-snug break-words overflow-hidden">{note.excerpt}</TableCell>
                                  <TableCell className="align-top text-sm leading-snug break-words overflow-hidden">{note.suggestion}</TableCell>
                                  <TableCell>
                                    <Button size="sm" variant="ghost">
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                              </Table>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollArea>
                  </TabsContent>

                  {/* EXPORTS TAB */}
                  <TabsContent value="exports" className="h-full p-6 pt-4">
                    <ScrollArea className="h-full">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Export Center</CardTitle>
                          <CardDescription>Generate and download analysis artifacts</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { name: "Coverage PDF", description: "Studio-style coverage report", status: "ready" },
                              { name: "Notes CSV", description: "Actionable notes spreadsheet", status: "ready" },
                              { name: "Notes PDF", description: "Formatted notes document", status: "ready" },
                              { name: "JSON Bundle", description: "Complete analysis data", status: "ready" },
                              { name: "FDX Change List", description: "Suggested script edits", status: "processing" },
                              { name: "Charts Archive", description: "All visualizations as images", status: "pending" }
                            ].map((exportItem) => (
                              <Card key={exportItem.name} className="p-4">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                  <div className="space-y-1">
                                    <h4 className="font-medium">{exportItem.name}</h4>
                                    <p className="text-sm text-muted-foreground">{exportItem.description}</p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          <SlidersHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {exportItem.name === 'Coverage PDF' && (
                                          <>
                                            <DropdownMenuItem>Include comps</DropdownMenuItem>
                                            <DropdownMenuItem>Include scorecard</DropdownMenuItem>
                                            <DropdownMenuItem>Include beat map</DropdownMenuItem>
                                          </>
                                        )}
                                        {exportItem.name === 'Notes CSV' && (
                                          <>
                                            <DropdownMenuItem>High priority only</DropdownMenuItem>
                                            <DropdownMenuItem>Include anchors</DropdownMenuItem>
                                            <DropdownMenuItem>Group by area</DropdownMenuItem>
                                          </>
                                        )}
                                        {exportItem.name === 'JSON Bundle' && (
                                          <>
                                            <DropdownMenuItem>Include raw data</DropdownMenuItem>
                                            <DropdownMenuItem>Compressed format</DropdownMenuItem>
                                          </>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Badge
                                      variant={exportItem.status === 'ready' ? 'default' :
                                              exportItem.status === 'processing' ? 'secondary' : 'outline'}
                                    >
                                      {exportItem.status}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={exportItem.status !== 'ready'}
                                      className="w-full sm:w-auto"
                                    >
                                      <Download className="h-4 w-4 mr-1" />
                                      {exportItem.status === 'ready' ? 'Download' : 'Create'}
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollArea>
                  </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>

        {/* DIALOGS */}

        {/* Full Screenplay Dialog */}
        <Dialog open={showFullScreenplay} onOpenChange={setShowFullScreenplay}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>{mockScript.title} - Full Screenplay</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 font-mono text-sm">
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4" />
                  <p>Full screenplay content would be displayed here</p>
                  <p className="text-xs mt-2">{mockScript.pageCount} pages / {mockScript.format} format</p>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Scene Detail Dialog */}
        <Dialog open={!!selectedScene} onOpenChange={() => setSelectedScene(null)}>
          <DialogContent className="max-w-3xl h-[70vh]">
            <DialogHeader>
              <DialogTitle>
                {selectedScene?.slug}
                <Badge variant="outline" className="ml-2">
                  Pages {selectedScene?.pageStart}–{selectedScene?.pageEnd}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Scene Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Location:</span> {selectedScene?.location}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time:</span> {selectedScene?.tod}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span> {selectedScene?.intExt}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Complexity:</span> {selectedScene?.complexity}/10
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Characters Present</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedScene?.characters.map((char: string) => (
                      <Badge key={char} variant="outline">{char}</Badge>
                    ))}
                  </div>
                </div>

                <div className="font-mono text-sm bg-background border rounded-lg p-4">
                  <p className="whitespace-pre-wrap">{selectedScene?.preview}</p>
                  <div className="mt-4 text-muted-foreground text-center">
                    [Full scene content would be displayed here]
                  </div>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        {/* Quality Gate Dialog */}
        <Dialog open={showQualityDialog} onOpenChange={setShowQualityDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                Formatting Quality Requirements
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ScriptyBoy requires at least 80% formatting quality to ensure accurate analysis.
                Here's what we check for:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Scene Headings</div>
                    <div className="text-sm text-muted-foreground">
                      Proper format: INT./EXT. LOCATION - TIME
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Character Names</div>
                    <div className="text-sm text-muted-foreground">
                      ALL CAPS, centered above dialogue
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Action Lines</div>
                    <div className="text-sm text-muted-foreground">
                      Present tense, proper margin formatting
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Page Numbers</div>
                    <div className="text-sm text-muted-foreground">
                      Consistent numbering throughout
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Transitions</div>
                    <div className="text-sm text-muted-foreground">
                      FADE IN:, CUT TO:, FADE OUT. properly placed
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="font-medium text-blue-800 mb-2">Recommended Formats</div>
                <div className="text-sm text-blue-700">
                  For best results, upload Final Draft (.fdx) or Fountain (.fountain) files.
                  PDF uploads may have reduced accuracy due to OCR requirements.
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setShowQualityDialog(false)}>
                  Got it
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}