import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
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
} from "lucide-react";
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
} from "recharts";

// ------------------------------------------------------------
// MOCK DATA (replace with API wiring)
// ------------------------------------------------------------
const mockScript = {
  id: 101,
  title: "The Clockmaker",
  originalFilename: "clockmaker.fdx",
  project: { name: "Project Alpha", type: "FEATURE_INDEPENDENT" },
  format: "FDX",
  pageCount: 110,
  totalScenes: 58,
  totalCharacters: 22,
  fileSizeMB: 2.4,
  runtimeMin: 107,
  runtimeConfidence: 0.78,
  intExtRatio: { INT: 0.62, EXT: 0.38 },
  dayNightRatio: { DAY: 0.35, NIGHT: 0.65 },
  uniqueLocations: 18,
  complexityIndex: 6.3,
};

const mockBeats = [
  { label: "Inciting", page: 12, conf: 0.82 },
  { label: "Act I Break", page: 25, conf: 0.78 },
  { label: "Midpoint", page: 55, conf: 0.74 },
  { label: "Low Point", page: 75, conf: 0.69 },
  { label: "Act II Break", page: 90, conf: 0.71 },
  { label: "Climax", page: 104, conf: 0.77 },
  { label: "Resolution", page: 110, conf: 0.76 },
];

const mockPageMetrics = Array.from({ length: 12 }).map((_, i) => ({
  page: i * 10,
  dialogue: Math.round(Math.random() * 50 + 10),
  action: Math.round(Math.random() * 50 + 10),
  tension: Math.round(Math.random() * 10),
}));

const mockScenes = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  number: i + 1,
  slug: `${i % 2 ? "EXT" : "INT"}. LOCATION ${i + 1} - ${i % 3 ? "DAY" : "NIGHT"}`,
  pageStart: i + 1,
  pageEnd: i + 2,
  characters: ["OLIN", i % 2 ? "MAYA" : "ARCHIVIST"].slice(0, (i % 3) + 1),
  hasIssues: Math.random() > 0.6,
  pins: {
    note: Math.random() > 0.7,
    beat: [12, 25, 55, 75, 90, 104, 110].includes(i + 1),
    pacing: Math.random() > 0.8,
    feasibility: Math.random() > 0.75,
    risk: Math.random() > 0.85,
  },
  preview: "A brisk exchange reveals the plan's first flaw...",
}));

const rubric = [
  { k: "Structure", v: 7.5 },
  { k: "Character", v: 7.0 },
  { k: "Dialogue", v: 6.5 },
  { k: "Pacing", v: 7.2 },
  { k: "Theme", v: 7.0 },
  { k: "Genre Fit", v: 7.8 },
  { k: "Originality", v: 6.8 },
  { k: "Feasibility", v: 6.9 },
];

// Utility
const pct = (n: number) => Math.round(n * 100);

// ------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------
export default function AnalysisPageStub() {
  const [chatOpen, setChatOpen] = React.useState(false);
  const scriptTitle = mockScript.title || mockScript.originalFilename;

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 md:p-6 space-y-4">
        {/* HEADER */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-2xl md:text-3xl">{scriptTitle}</CardTitle>
                  <Badge variant="secondary" className="text-xs">{mockScript.project.name}</Badge>
                </div>
                <CardDescription>
                  Analysis dashboard · {mockScript.format} · {mockScript.pageCount} pages
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2"><Download className="h-4 w-4"/> Export</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
                    <Button className="gap-2"><MessageSquare className="h-4 w-4"/> Chat</Button>
                  </SheetTrigger>
                  <SheetContent className="w-[420px] sm:w-[540px]">
                    <SheetHeader>
                      <SheetTitle>Script Assistant</SheetTitle>
                      <SheetDescription>
                        Ask context-aware questions. Replies link to scenes & notes.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-4 space-y-3">
                      <Label htmlFor="q">Question</Label>
                      <Textarea id="q" placeholder="e.g., Why is the midpoint flagged late?"/>
                      <div className="flex justify-end"><Button>Ask</Button></div>
                      <Separator />
                      <div className="text-sm text-muted-foreground">Responses appear here…</div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* STATUS CHIPS */}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1"><FileText className="h-3.5 w-3.5"/> {mockScript.format}</Badge>
              <Badge variant="secondary" className="gap-1"><BookOpenText className="h-3.5 w-3.5"/> {mockScript.pageCount}p</Badge>
              <Badge variant="secondary" className="gap-1"><Layers className="h-3.5 w-3.5"/> {mockScript.totalScenes} scenes</Badge>
              <Badge variant="secondary" className="gap-1"><Users className="h-3.5 w-3.5"/> {mockScript.totalCharacters} characters</Badge>
              <Badge variant="secondary" className="gap-1"><Clock className="h-3.5 w-3.5"/> ~{mockScript.runtimeMin}m ({pct(mockScript.runtimeConfidence)}% conf)</Badge>
              <Badge variant="secondary" className="gap-1"><Film className="h-3.5 w-3.5"/> {pct(mockScript.intExtRatio.INT)}% INT / {pct(mockScript.intExtRatio.EXT)}% EXT</Badge>
              <Badge variant="secondary" className="gap-1"><Sun className="h-3.5 w-3.5"/> {pct(mockScript.dayNightRatio.DAY)}% DAY / {pct(mockScript.dayNightRatio.NIGHT)}% NIGHT</Badge>
              <Badge variant="secondary" className="gap-1"><MapPin className="h-3.5 w-3.5"/> {mockScript.uniqueLocations} locations</Badge>
              <Badge variant="secondary" className="gap-1"><BarChart4 className="h-3.5 w-3.5"/> complexity {mockScript.complexityIndex}</Badge>
            </div>
          </CardHeader>

          {/* CONTROL PANEL */}
          <CardContent className="pb-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Button className="gap-2" variant="secondary"><Play className="h-4 w-4"/> Quick</Button>
                <Button className="gap-2"><Rocket className="h-4 w-4"/> Comprehensive</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2"><Settings className="h-4 w-4"/> Custom <ChevronDown className="h-4 w-4"/></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
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
                <div className="text-xs mb-1 text-muted-foreground">Parse → Normalize → Taggers → Cross-scene → Escalations → Scoring → Assets</div>
                <Progress value={34} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MAIN GRID */}
        <div className="grid grid-cols-12 gap-4">
          {/* LEFT: SCRIPT VIEWER */}
          <div className="col-span-12 xl:col-span-5 space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">Script Viewer</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                      <Input className="pl-8 w-48" placeholder="Search scenes…"/>
                    </div>
                    <Select>
                      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Filter"/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="issues">Only with issues</SelectItem>
                        <SelectItem value="int">INT</SelectItem>
                        <SelectItem value="ext">EXT</SelectItem>
                        <SelectItem value="day">DAY</SelectItem>
                        <SelectItem value="night">NIGHT</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="outline"><ChevronLeft className="h-4 w-4"/></Button>
                    <Button size="icon" variant="outline"><ChevronRight className="h-4 w-4"/></Button>
                  </div>
                </div>
                <CardDescription>{mockScript.totalScenes} scenes · {mockScript.pageCount} pages</CardDescription>
              </CardHeader>
              <Separator/>
              <CardContent className="p-0">
                <ScrollArea className="h-[540px]">
                  <ul className="divide-y">
                    {mockScenes.map((s) => (
                      <li key={s.id} className="p-4 hover:bg-muted/40 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-muted-foreground">#{s.number}</span>
                              <span className="font-semibold">{s.slug}</span>
                              <span className="text-xs text-muted-foreground">pp. {s.pageStart}–{s.pageEnd}</span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.preview}</p>
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                              {s.characters.map((c) => (
                                <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {s.pins.note && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost"><AlertTriangle className="h-4 w-4 text-amber-600"/></Button>
                                </TooltipTrigger>
                                <TooltipContent>Notes present</TooltipContent>
                              </Tooltip>
                            )}
                            {s.pins.beat && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost"><Link2 className="h-4 w-4 text-sky-600"/></Button>
                                </TooltipTrigger>
                                <TooltipContent>Beat anchor</TooltipContent>
                              </Tooltip>
                            )}
                            {s.pins.pacing && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost"><Clock className="h-4 w-4 text-purple-600"/></Button>
                                </TooltipTrigger>
                                <TooltipContent>Pacing outlier</TooltipContent>
                              </Tooltip>
                            )}
                            {s.pins.feasibility && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost"><Layers className="h-4 w-4 text-emerald-600"/></Button>
                                </TooltipTrigger>
                                <TooltipContent>Feasibility flag</TooltipContent>
                              </Tooltip>
                            )}
                            {s.pins.risk && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost"><ShieldAlertIcon/></Button>
                                </TooltipTrigger>
                                <TooltipContent>Risk flag</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: ANALYZER TABS */}
          <div className="col-span-12 xl:col-span-7">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="coverage">Coverage</TabsTrigger>
                <TabsTrigger value="craft">Craft</TabsTrigger>
                <TabsTrigger value="characters">Characters</TabsTrigger>
                <TabsTrigger value="pacing">Pacing</TabsTrigger>
                <TabsTrigger value="feasibility">Feasibility</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="exports">Exports</TabsTrigger>
              </TabsList>

              {/* OVERVIEW */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-12 gap-4">
                  <Card className="col-span-12">
                    <CardHeader>
                      <CardTitle>Logline</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      A meticulous clockmaker must pull one last heist to stop time running out on his daughter’s life.
                    </CardContent>
                  </Card>

                  <Card className="col-span-12">
                    <CardHeader>
                      <CardTitle>Synopsis</CardTitle>
                      <CardDescription>1-pager and 3-pager (collapsible in final impl)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-4 w-2/3"/>
                      <Skeleton className="h-4 w-3/4"/>
                      <Skeleton className="h-4 w-1/2"/>
                    </CardContent>
                  </Card>

                  <Card className="col-span-12 lg:col-span-6">
                    <CardHeader><CardTitle>Strengths</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <li>Tight third act momentum</li>
                      <li>Distinct prop-driven set pieces</li>
                      <li>Clear emotional stakes</li>
                    </CardContent>
                  </Card>
                  <Card className="col-span-12 lg:col-span-6">
                    <CardHeader><CardTitle>Areas for Improvement</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <li>Act II flat spot around pp. 60–70</li>
                      <li>Antagonist presence dips in mid-act</li>
                      <li>Some on-the-nose lines in early scenes</li>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Scorecard</CardTitle>
                    <CardDescription>Studio-style rubric (1–10)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {rubric.map((r) => (
                        <div key={r.k} className="rounded-2xl border p-3">
                          <div className="text-xs text-muted-foreground">{r.k}</div>
                          <div className="text-xl font-semibold">{r.v.toFixed(1)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* COVERAGE */}
              <TabsContent value="coverage" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle>Coverage</CardTitle>
                      <CardDescription>Pass / Consider / Recommend</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select rating"/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pass">Pass</SelectItem>
                          <SelectItem value="consider">Consider</SelectItem>
                          <SelectItem value="recommend">Recommend</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" className="gap-2"><Share2 className="h-4 w-4"/> Export PDF</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-semibold">Comps</div>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <Badge variant="secondary">Sicario</Badge>
                          <Badge variant="secondary">Heat (tone)</Badge>
                        </div>
                        <Separator className="my-2"/>
                        <div className="text-sm font-semibold">Strengths</div>
                        <ul className="text-sm list-disc pl-5 space-y-1">
                          <li>Inventive mechanical tension</li>
                          <li>Clear father–daughter core</li>
                        </ul>
                        <div className="text-sm font-semibold mt-3">Risks</div>
                        <ul className="text-sm list-disc pl-5 space-y-1">
                          <li>Location density may strain budget</li>
                          <li>Trademark mentions need clearance</li>
                        </ul>
                      </div>
                      <div className="rounded-xl border p-3">
                        <div className="text-sm font-medium mb-2">Beat Map</div>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockBeats.map((b, i) => ({ x: b.page, y: b.conf }))}>
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
                              {mockBeats.map((b, i) => (
                                <ReferenceDot key={i} x={b.page} y={b.conf} r={4} isFront />
                              ))}
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* CRAFT (subtabs) */}
              <TabsContent value="craft" className="space-y-4 mt-4">
                <Tabs defaultValue="structure" className="w-full">
                  <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                    <TabsTrigger value="structure">Structure & Beats</TabsTrigger>
                    <TabsTrigger value="conflict">Conflict & Theme</TabsTrigger>
                    <TabsTrigger value="dialogue">Dialogue</TabsTrigger>
                    <TabsTrigger value="world">World & Logic</TabsTrigger>
                    <TabsTrigger value="genre">Genre & Market</TabsTrigger>
                    <TabsTrigger value="formatting">Formatting</TabsTrigger>
                    <TabsTrigger value="sensitivity">Sensitivity</TabsTrigger>
                    <TabsTrigger value="risk">Risk Flags</TabsTrigger>
                  </TabsList>

                  <TabsContent value="structure" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Beat Timeline</CardTitle>
                        <CardDescription>Markers with timing flags and confidence</CardDescription>
                      </CardHeader>
                      <CardContent className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={mockBeats.map((b)=>({ page: b.page, conf: b.conf }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="page" />
                            <YAxis domain={[0,1]} />
                            <RTooltip />
                            <Line type="monotone" dataKey="conf" stroke="currentColor" dot />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Subplot Swimlanes</CardTitle>
                        <CardDescription>Intro / Develop / Converge / Resolve</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { label: "Father–Daughter Trust", stages: ["INTRO","DEVELOP","RESOLVE"] },
                            { label: "Heist Team Friction", stages: ["INTRO","DEVELOP","CONVERGE","RESOLVE"] },
                          ].map((sp) => (
                            <div key={sp.label} className="rounded-xl border p-3">
                              <div className="text-sm font-medium mb-2">{sp.label}</div>
                              <div className="flex items-center gap-2">
                                {sp.stages.map((st,i)=> (
                                  <Badge key={i} variant="outline" className="rounded-full">{st}</Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="conflict" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Objective / Obstacle / Outcome</CardTitle>
                        <CardDescription>Scene-level tagging</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Scene</TableHead>
                              <TableHead>Objective</TableHead>
                              <TableHead>Obstacle</TableHead>
                              <TableHead>Outcome</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[1,2,3,4].map((n)=> (
                              <TableRow key={n}>
                                <TableCell>#{n}</TableCell>
                                <TableCell>Create diversion</TableCell>
                                <TableCell>Security patrol</TableCell>
                                <TableCell>Partial success</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Stakes Escalation</CardTitle>
                        <CardDescription>Flat spots flagged</CardDescription>
                      </CardHeader>
                      <CardContent className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={mockPageMetrics}>
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

                  <TabsContent value="dialogue" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Dialogue Quality</CardTitle>
                        <CardDescription>On-the-nose & exposition flags; suggested alts</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {["On-the-nose", "Exposition dump", "Repetition"].map((k)=> (
                          <div key={k} className="flex items-center justify-between rounded-xl border p-3">
                            <div className="text-sm font-medium">{k}</div>
                            <Button variant="outline" size="sm">View notes</Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="world" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Continuity Tracker</CardTitle>
                        <CardDescription>Time / Place / Props / Tech / Jargon</CardDescription>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">Continuity issues will appear here…</CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle>Setup ↔ Payoff Matrix</CardTitle></CardHeader>
                      <CardContent className="text-sm text-muted-foreground">Matrix placeholder…</CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="genre" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader><CardTitle>Genre Conventions</CardTitle></CardHeader>
                      <CardContent className="text-sm text-muted-foreground">Convention coverage meter…</CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="formatting" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader><CardTitle>Formatting Lints</CardTitle></CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="flex items-center justify-between"><span>Slugline shape</span><Button size="sm" variant="outline">Add note</Button></div>
                        <div className="flex items-center justify-between"><span>ALL-CAPS intros</span><Button size="sm" variant="outline">Add note</Button></div>
                        <div className="flex items-center justify-between"><span>Parenthetical overuse</span><Button size="sm" variant="outline">Add note</Button></div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="sensitivity" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader><CardTitle>Sensitivity (opt-in)</CardTitle></CardHeader>
                      <CardContent className="text-sm text-muted-foreground">Inclusive language flags and heuristics appear here if enabled.</CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="risk" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Risk Flags</CardTitle>
                        <CardDescription>Non-legal advice; review with counsel</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Kind</TableHead>
                              <TableHead>Scene</TableHead>
                              <TableHead>Page</TableHead>
                              <TableHead>Excerpt</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>TRADEMARK</TableCell>
                              <TableCell>#58</TableCell>
                              <TableCell>104</TableCell>
                              <TableCell className="truncate max-w-[240px]">Brand-name security panel reference…</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* CHARACTERS */}
              <TabsContent value="characters" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Presence Heatmap</CardTitle>
                    <CardDescription>Scenes × Characters</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-8 gap-1">
                      {Array.from({ length: 8 * 12 }).map((_, i) => (
                        <div key={i} className="h-6 rounded bg-muted"/>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Character Sheets</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {["OLIN","MAYA"].map((c)=> (
                      <div key={c} className="rounded-2xl border p-3 space-y-2">
                        <div className="flex items-center justify-between"><div className="font-medium">{c}</div><Badge variant="outline">Lead</Badge></div>
                        <div className="text-sm text-muted-foreground">Goal, stakes, agency, flaw…</div>
                        <div className="text-xs text-muted-foreground">First appearance: Scene 1</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* PACING */}
              <TabsContent value="pacing" className="space-y-4 mt-4">
                <Card>
                  <CardHeader><CardTitle>Scene Length Histogram</CardTitle></CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockPageMetrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="page" />
                        <YAxis />
                        <RTooltip />
                        <Bar dataKey="action" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Dialogue / Action Ratio</CardTitle></CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockPageMetrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="page" />
                        <YAxis />
                        <RTooltip />
                        <Bar dataKey="dialogue" />
                        <Bar dataKey="action" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Tension Waveform</CardTitle></CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockPageMetrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="page" />
                        <YAxis />
                        <RTooltip />
                        <Line dataKey="tension" type="monotone" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* FEASIBILITY */}
              <TabsContent value="feasibility" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Location & Category Counts</CardTitle>
                    <CardDescription>INT/EXT · DAY/NIGHT · Stunts · VFX/SFX · Crowd · Minors/Animals · Weapons/Vehicles · Special Props</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { k: "INT", v: pct(mockScript.intExtRatio.INT) + "%" },
                      { k: "EXT", v: pct(mockScript.intExtRatio.EXT) + "%" },
                      { k: "DAY", v: pct(mockScript.dayNightRatio.DAY) + "%" },
                      { k: "NIGHT", v: pct(mockScript.dayNightRatio.NIGHT) + "%" },
                      { k: "Unique Locations", v: String(mockScript.uniqueLocations) },
                      { k: "Complexity Index", v: String(mockScript.complexityIndex) },
                    ].map((m) => (
                      <div key={m.k} className="rounded-2xl border p-3">
                        <div className="text-xs text-muted-foreground">{m.k}</div>
                        <div className="text-xl font-semibold">{m.v}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Complexity Heatmap</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-22 gap-1">
                      {Array.from({ length: mockScript.pageCount }).slice(0, 120).map((_, i) => (
                        <div key={i} className="h-3 w-3 rounded bg-muted"/>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* NOTES */}
              <TabsContent value="notes" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle>Notes</CardTitle>
                      <CardDescription>Filter by area and severity; click to jump to scene</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select>
                        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Area"/></SelectTrigger>
                        <SelectContent>
                          {"STRUCTURE CHARACTER DIALOGUE PACING THEME GENRE FORMATTING LOGIC REPRESENTATION LEGAL".split(" ").map((a)=> (
                            <SelectItem key={a} value={a.toLowerCase()}>{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Severity"/></SelectTrigger>
                        <SelectContent>
                          {"HIGH MEDIUM LOW".split(" ").map((s)=> (
                            <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" className="gap-2"><Download className="h-4 w-4"/> Export CSV</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Severity</TableHead>
                          <TableHead>Area</TableHead>
                          <TableHead>Scene</TableHead>
                          <TableHead>Page</TableHead>
                          <TableHead>Excerpt</TableHead>
                          <TableHead>Suggestion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell><Badge variant="destructive">HIGH</Badge></TableCell>
                          <TableCell>STRUCTURE</TableCell>
                          <TableCell>#25</TableCell>
                          <TableCell>25</TableCell>
                          <TableCell className="max-w-[240px] truncate">Team accepts the heist too quickly…</TableCell>
                          <TableCell className="max-w-[280px] truncate">Add a refusal beat and consequence…</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><Badge>MEDIUM</Badge></TableCell>
                          <TableCell>DIALOGUE</TableCell>
                          <TableCell>#1</TableCell>
                          <TableCell>2</TableCell>
                          <TableCell className="max-w-[240px] truncate">On-the-nose line about time…</TableCell>
                          <TableCell className="max-w-[280px] truncate">Replace with visual action…</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* EXPORTS */}
              <TabsContent value="exports" className="space-y-4 mt-4">
                <Card>
                  <CardHeader><CardTitle>Deliverables</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {["Coverage PDF","Notes PDF","Notes CSV","JSON Bundle","FDX Change List"].map((x)=> (
                      <div key={x} className="rounded-2xl border p-3 flex items-center justify-between">
                        <div className="text-sm">{x}</div>
                        <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4"/> Download</Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* FLOATING CHAT BUTTON (mobile quick access) */}
        <div className="fixed bottom-4 right-4 z-40 md:hidden">
          <Button onClick={()=>setChatOpen(true)} size="icon" className="rounded-full shadow-xl"><MessageSquare className="h-5 w-5"/></Button>
        </div>
      </div>
    </TooltipProvider>
  );
}

function ShieldAlertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-rose-600"><path fillRule="evenodd" d="M20.253 7.02a.75.75 0 0 1 .247.55V12a10.5 10.5 0 0 1-7.084 9.94.75.75 0 0 1-.502 0A10.5 10.5 0 0 1 5.83 12V7.57a.75.75 0 0 1 .247-.55l5.25-4.854a.75.75 0 0 1 1.02 0l5.906 5.354Zm-7.503 1.98a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0v-4.5ZM12 18a.999.999 0 1 0 0-1.998A.999.999 0 0 0 12 18Z" clipRule="evenodd"/></svg>
  );
}
