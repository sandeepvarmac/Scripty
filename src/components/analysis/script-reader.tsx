'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  Search,
  Filter,
  ChevronRight,
  Info,
  Clock,
  MapPin,
  Users,
  MessageSquare,
  FileText,
  Eye,
  EyeOff,
  Book,
  Play,
  Settings,
  Home,
  Sun,
  Moon
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// Utility function to extract unique characters from scene elements
function extractCharactersFromScene(scene: any): string[] {
  if (Array.isArray(scene.characters)) {
    return scene.characters
  }

  if (Array.isArray(scene.elements)) {
    const characters = scene.elements
      .filter((element: any) => element.type === 'dialogue' && element.character)
      .map((element: any) => element.character)
    return [...new Set(characters)]
  }

  return []
}

interface Scene {
  id: string
  sceneNumber: number
  heading: string
  location: string
  timeOfDay: string
  intExt: string
  pageStart: number
  pageEnd: number
  content: string
  characters: string[]
  duration?: number
  description?: string
}

interface ScriptReaderProps {
  script: {
    id: string
    title: string
    scenes: Scene[]
    totalPages: number
    content?: string
  }
  user: {
    id: string
    name: string
    plan: string
  }
  selectedScene?: string | null
  viewMode?: string
}

export function ScriptReader({ script, user, selectedScene, viewMode = 'reader' }: ScriptReaderProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLocation, setFilterLocation] = useState('all')
  const [filterTimeOfDay, setFilterTimeOfDay] = useState('all')
  const [currentSceneId, setCurrentSceneId] = useState(selectedScene || script.scenes[0]?.id)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [readingMode, setReadingMode] = useState<'scene' | 'continuous'>('scene')

  const mockScenes: Scene[] = script.scenes?.length > 0 ? script.scenes as Scene[] : [
    {
      id: '1',
      sceneNumber: 1,
      heading: 'INT. COFFEE SHOP - MORNING',
      location: 'Coffee Shop',
      timeOfDay: 'Morning',
      intExt: 'INT',
      pageStart: 1,
      pageEnd: 3,
      characters: ['JANE', 'BARISTA'],
      content: `INT. COFFEE SHOP - MORNING

A bustling coffee shop in downtown. Steam rises from espresso machines. The morning crowd chatters over laptops and newspapers.

JANE (30s, determined) enters, scanning the room. She approaches the counter.

                    JANE
          Large coffee, black. And make it strong.

The BARISTA (20s, cheerful) smiles.

                    BARISTA
          Rough morning already?

                    JANE
          Something like that.

Jane pays and moves to wait for her order, checking her phone nervously.`,
      description: 'Opening scene establishing Jane\'s morning routine and setting up her character.'
    },
    {
      id: '2',
      sceneNumber: 2,
      heading: 'EXT. OFFICE BUILDING - CONTINUOUS',
      location: 'Office Building',
      timeOfDay: 'Morning',
      intExt: 'EXT',
      pageStart: 3,
      pageEnd: 4,
      characters: ['JANE'],
      content: `EXT. OFFICE BUILDING - CONTINUOUS

Jane exits the coffee shop, coffee in hand. She looks up at the imposing glass building before her.

She takes a deep breath, straightens her shoulders, and walks toward the entrance.`,
      description: 'Transition scene showing Jane\'s determination as she faces her workplace.'
    },
    {
      id: '3',
      sceneNumber: 3,
      heading: 'INT. OFFICE LOBBY - CONTINUOUS',
      location: 'Office Lobby',
      timeOfDay: 'Morning',
      intExt: 'INT',
      pageStart: 4,
      pageEnd: 7,
      characters: ['JANE', 'SECURITY GUARD', 'RECEPTIONIST'],
      content: `INT. OFFICE LOBBY - CONTINUOUS

The lobby is sleek and modern. A SECURITY GUARD nods as Jane passes through the turnstiles.

Jane approaches the RECEPTIONIST (40s, professional).

                    RECEPTIONIST
          Good morning, Jane. Mr. Harrison
          wants to see you in his office.

Jane's face falls slightly.

                    JANE
          Did he say what about?

                    RECEPTIONIST
          Just that it's urgent.

Jane nods, her coffee suddenly feeling cold in her hands.`,
      description: 'Building tension as Jane learns she\'s been summoned to her boss\'s office.'
    }
  ]

  const filteredScenes = useMemo(() => {
    return mockScenes.filter(scene => {
      const matchesSearch = searchTerm === '' ||
        scene.heading.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scene.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        extractCharactersFromScene(scene).some(char => char.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesLocation = filterLocation === 'all' || scene.location === filterLocation
      const matchesTimeOfDay = filterTimeOfDay === 'all' || scene.timeOfDay === filterTimeOfDay

      return matchesSearch && matchesLocation && matchesTimeOfDay
    })
  }, [searchTerm, filterLocation, filterTimeOfDay])

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(mockScenes.map(scene => scene.location)))
  }, [])

  const uniqueTimesOfDay = useMemo(() => {
    return Array.from(new Set(mockScenes.map(scene => scene.timeOfDay)))
  }, [])

  const currentScene = mockScenes.find(scene => scene.id === currentSceneId) || mockScenes[0]

  const handleSceneSelect = (sceneId: string) => {
    setCurrentSceneId(sceneId)
    window.history.replaceState(null, '', `?scene=${sceneId}`)
  }

  return (
    <div className="flex h-[calc(100vh-200px)] gap-6">
      {/* Scene Rail - Left Sidebar */}
      <div className="w-80 flex flex-col space-y-4 shrink-0">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Scene Navigator</CardTitle>
              <Badge variant="outline">{filteredScenes.length} scenes</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scenes, locations, characters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterLocation('all')}>
                    All Locations
                  </DropdownMenuItem>
                  {uniqueLocations.map(location => (
                    <DropdownMenuItem key={location} onClick={() => setFilterLocation(location)}>
                      {location}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Time
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterTimeOfDay('all')}>
                    All Times
                  </DropdownMenuItem>
                  {uniqueTimesOfDay.map(time => (
                    <DropdownMenuItem key={time} onClick={() => setFilterTimeOfDay(time)}>
                      {time}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Reading Mode Toggle */}
            <Tabs value={readingMode} onValueChange={(value) => setReadingMode(value as 'scene' | 'continuous')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scene" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Scene
                </TabsTrigger>
                <TabsTrigger value="continuous" className="gap-2">
                  <Book className="h-4 w-4" />
                  Flow
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Scene List */}
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Scenes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-1 p-4">
                {filteredScenes.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => handleSceneSelect(scene.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-colors hover:bg-muted/50",
                      currentSceneId === scene.id ? "bg-primary/10 border-primary" : "border-border"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {scene.sceneNumber}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {scene.intExt === 'INT' ? <Home className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {scene.timeOfDay === 'Morning' || scene.timeOfDay === 'Day' ?
                              <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium truncate mb-1">
                          {scene.heading}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {extractCharactersFromScene(scene).join(', ')}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Page {scene.pageStart}-{scene.pageEnd}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Content Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{currentScene.heading}</h2>
                <p className="text-sm text-muted-foreground">
                  Scene {currentScene.sceneNumber} • Page {currentScene.pageStart}-{currentScene.pageEnd}
                </p>
              </div>
              <div className="flex gap-2">
                <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Info className="h-4 w-4" />
                      Inspector
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-96">
                    <SheetHeader>
                      <SheetTitle>Scene Inspector</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      {/* Scene Details */}
                      <div>
                        <h4 className="font-medium mb-3">Scene Details</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Scene Number:</span>
                            <span>{currentScene.sceneNumber}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Location:</span>
                            <span>{currentScene.location}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Time:</span>
                            <span>{currentScene.timeOfDay}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Int/Ext:</span>
                            <span>{currentScene.intExt}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Pages:</span>
                            <span>{currentScene.pageStart}-{currentScene.pageEnd}</span>
                          </div>
                        </div>
                      </div>

                      {/* Characters */}
                      <div>
                        <h4 className="font-medium mb-3">Characters</h4>
                        <div className="flex flex-wrap gap-2">
                          {extractCharactersFromScene(currentScene).map((character, index) => (
                            <Badge key={`${character}-${index}`} variant="outline">
                              {character}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Description */}
                      {currentScene.description && (
                        <div>
                          <h4 className="font-medium mb-3">Description</h4>
                          <p className="text-sm text-muted-foreground">
                            {currentScene.description}
                          </p>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div>
                        <h4 className="font-medium mb-3">Actions</h4>
                        <div className="space-y-2">
                          <Button variant="outline" size="sm" className="w-full gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Add Note
                          </Button>
                          <Button variant="outline" size="sm" className="w-full gap-2">
                            <FileText className="h-4 w-4" />
                            Export Scene
                          </Button>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  View Options
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Script Content */}
        <Card className="flex-1">
          <CardContent className="p-0">
            <ScrollArea className="h-full p-6">
              {readingMode === 'scene' ? (
                <div className="max-w-4xl mx-auto">
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {currentScene.content}
                  </pre>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-8">
                  {filteredScenes.map((scene) => (
                    <div key={scene.id} className="border-b border-border pb-8 last:border-b-0">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge variant="outline">Scene {scene.sceneNumber}</Badge>
                        <h3 className="font-medium">{scene.heading}</h3>
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        {scene.content}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}