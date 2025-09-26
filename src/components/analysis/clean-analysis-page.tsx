'use client'

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  FileText,
  Clock,
  Users,
  MapPin,
  Film,
  Sun,
  Moon,
  Play,
  ChevronDown,
  Download,
  MessageSquare,
  Search,
  BarChart4,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Settings,
  Eye,
  Zap,
  RefreshCw,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// Mock data for demonstration
const mockScript = {
  title: "Dark Echo",
  author: "Alex Thompson",
  format: "PDF",
  pages: 6,
  scenes: 5,
  characters: 6,
  runtime: 15,
  project: "Thriller Collection"
}

const mockScenes = [
  { id: 1, number: "1", title: "INT. APARTMENT 3B - DAY", pages: "1-2", characters: ["SARAH", "MIKE"], issues: 1 },
  { id: 2, number: "2", title: "INT. APARTMENT 3B - DAY", pages: "2-3", characters: ["SARAH", "VOICE"], issues: 0 },
  { id: 3, number: "3", title: "INT. BACK ALLEY - DAY", pages: "3-4", characters: ["SARAH", "STRANGER"], issues: 2 },
  { id: 4, number: "4", title: "INT. STAIRWELL - DAY", pages: "4-5", characters: ["SARAH"], issues: 0 },
  { id: 5, number: "5", title: "EXT. ROOFTOP - DAY", pages: "5-6", characters: ["SARAH", "MIKE"], issues: 1 },
]

const mockAnalyses = [
  { type: "Structure", status: "completed", score: 7.2 },
  { type: "Characters", status: "completed", score: 6.8 },
  { type: "Dialogue", status: "pending", score: null },
]

const pieData = [
  { name: 'Interior', value: 60, color: '#3b82f6' },
  { name: 'Exterior', value: 40, color: '#10b981' },
]

const paceData = [
  { scene: 1, pages: 2, tension: 3 },
  { scene: 2, pages: 1, tension: 5 },
  { scene: 3, pages: 2, tension: 8 },
  { scene: 4, pages: 1, tension: 6 },
  { scene: 5, pages: 2, tension: 9 },
]

export function CleanAnalysisPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const runAnalysis = (type: string) => {
    setIsAnalyzing(true)
    // Simulate analysis
    setTimeout(() => setIsAnalyzing(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simplified Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="font-semibold">ScriptyBoy</div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-7xl">
        {/* Clean Script Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{mockScript.title}</h1>
              <p className="text-muted-foreground">
                by {mockScript.author} • {mockScript.project}
              </p>
            </div>

            {/* Consolidated Actions */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => runAnalysis('quick')}
                  disabled={isAnalyzing}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isAnalyzing ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : 'Quick Analysis'}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => runAnalysis('comprehensive')}>
                      <BarChart4 className="h-4 w-4 mr-2" />
                      Full Coverage
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => runAnalysis('structure')}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Structure Only
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => runAnalysis('characters')}>
                      <Users className="h-4 w-4 mr-2" />
                      Character Analysis
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>

              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </div>
          </div>

          {/* Consolidated Script Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <Card className="p-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-lg font-semibold">{mockScript.pages}</div>
                  <div className="text-xs text-muted-foreground">Pages</div>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center space-x-2">
                <Film className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-lg font-semibold">{mockScript.scenes}</div>
                  <div className="text-xs text-muted-foreground">Scenes</div>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-lg font-semibold">{mockScript.characters}</div>
                  <div className="text-xs text-muted-foreground">Characters</div>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-lg font-semibold">~{mockScript.runtime}m</div>
                  <div className="text-xs text-muted-foreground">Runtime</div>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-lg font-semibold">80%</div>
                  <div className="text-xs text-muted-foreground">Day</div>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-lg font-semibold">60% INT</div>
                  <div className="text-xs text-muted-foreground">Location</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Analysis Status */}
          <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">2 analyses complete</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-muted-foreground">1 pending</span>
            </div>
            <div className="flex-1">
              <Progress value={67} className="h-2" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Simplified Scene Sidebar */}
          <div className="col-span-12 lg:col-span-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Scenes</CardTitle>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search scenes..."
                    className="h-8"
                  />
                  <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2 p-4">
                    {mockScenes.map((scene) => (
                      <div
                        key={scene.id}
                        className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                #{scene.number}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                pp. {scene.pages}
                              </span>
                            </div>
                            <div className="font-medium text-sm">{scene.title}</div>
                            <div className="flex flex-wrap gap-1">
                              {scene.characters.map((char) => (
                                <Badge key={char} variant="secondary" className="text-xs">
                                  {char}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {scene.issues > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {scene.issues}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Streamlined Main Content */}
          <div className="col-span-12 lg:col-span-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Story Structure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Setup</span>
                          <span className="font-medium">Scenes 1-2</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Conflict</span>
                          <span className="font-medium">Scene 3</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Resolution</span>
                          <span className="font-medium">Scenes 4-5</span>
                        </div>
                        <Progress value={75} className="mt-4" />
                        <p className="text-xs text-muted-foreground">Structure analysis: 75% complete</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Location Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              outerRadius={60}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Pacing & Tension</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={paceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="scene" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="tension" stroke="#3b82f6" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-6 mt-6">
                <div className="space-y-4">
                  {mockAnalyses.map((analysis) => (
                    <Card key={analysis.type}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`h-2 w-2 rounded-full ${
                              analysis.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'
                            }`} />
                            <div>
                              <h3 className="font-medium">{analysis.type} Analysis</h3>
                              <p className="text-sm text-muted-foreground">
                                {analysis.status === 'completed' ? 'Complete' : 'In Progress'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            {analysis.score && (
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                  {analysis.score}
                                </div>
                                <div className="text-xs text-muted-foreground">Score</div>
                              </div>
                            )}
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Scene Notes</CardTitle>
                    <CardDescription>
                      AI-generated insights and recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Scene 3: Pacing Issue</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              The confrontation scene feels rushed. Consider adding more buildup.
                            </p>
                            <Badge variant="outline" className="mt-2 text-xs">Scene 3</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Strong Opening</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Scene 1 effectively establishes character and conflict.
                            </p>
                            <Badge variant="outline" className="mt-2 text-xs">Scene 1</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="export" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Export Options</CardTitle>
                    <CardDescription>
                      Download your analysis in various formats
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button className="h-20 flex-col">
                        <FileText className="h-6 w-6 mb-2" />
                        Coverage Report (PDF)
                      </Button>
                      <Button variant="outline" className="h-20 flex-col">
                        <BarChart4 className="h-6 w-6 mb-2" />
                        Analytics Dashboard
                      </Button>
                      <Button variant="outline" className="h-20 flex-col">
                        <Download className="h-6 w-6 mb-2" />
                        Raw Data (JSON)
                      </Button>
                      <Button variant="outline" className="h-20 flex-col">
                        <MessageSquare className="h-6 w-6 mb-2" />
                        Notes Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}