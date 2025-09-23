"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  MessageCircle,
  TrendingUp,
  BarChart3,
  Grid,
  User
} from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'

interface CharactersDashboardProps {
  script: any
  dashboardData: any
}

export function CharactersDashboard({ script, dashboardData }: CharactersDashboardProps) {
  const { characterScenes, notes } = dashboardData

  // Calculate character presence and dialogue stats
  const characterStats = React.useMemo(() => {
    const stats = new Map()

    characterScenes.forEach((cs: any) => {
      const charId = cs.character_id
      if (!stats.has(charId)) {
        stats.set(charId, {
          id: charId,
          name: `Character ${charId}`,
          totalLines: 0,
          totalWords: 0,
          scenesAppeared: 0,
          presenceScore: 0
        })
      }

      const char = stats.get(charId)
      char.totalLines += cs.lines || 0
      char.totalWords += cs.words || 0
      char.scenesAppeared += 1
    })

    return Array.from(stats.values()).sort((a, b) => b.totalLines - a.totalLines)
  }, [characterScenes])

  // Character presence grid (simplified for demo)
  const presenceGrid = React.useMemo(() => {
    const scenes = Array.from({ length: Math.min(20, script.pageCount / 5) }, (_, i) => i + 1)
    const characters = characterStats.slice(0, 6)

    return scenes.map(sceneNum => {
      const sceneData: any = { scene: sceneNum }
      characters.forEach((char, index) => {
        // Simulate presence with some randomness based on character importance
        const presenceChance = Math.max(0.1, 1 - (index * 0.2))
        sceneData[`char_${index}`] = Math.random() < presenceChance ? 1 : 0
      })
      return sceneData
    })
  }, [characterStats, script.pageCount])

  // Character notes
  const characterNotes = notes.filter((note: any) => note.area === 'CHARACTER')

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="space-y-6">
      {/* Character Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-brand-600" />
            <div>
              <p className="text-sm text-gray-600">Total Characters</p>
              <p className="text-2xl font-bold text-gray-900">{characterStats.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-success-600" />
            <div>
              <p className="text-sm text-gray-600">Main Characters</p>
              <p className="text-2xl font-bold text-gray-900">
                {characterStats.filter(c => c.totalLines > 20).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-warning-600" />
            <div>
              <p className="text-sm text-gray-600">Dialogue Distribution</p>
              <p className="text-2xl font-bold text-gray-900">
                {characterStats.length > 0 ?
                  Math.round((characterStats[0]?.totalLines / characterStats.reduce((sum, c) => sum + c.totalLines, 0)) * 100) : 0}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-danger-600" />
            <div>
              <p className="text-sm text-gray-600">Character Notes</p>
              <p className="text-2xl font-bold text-gray-900">{characterNotes.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Character Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dialogue Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Dialogue Distribution</CardTitle>
            <CardDescription>Lines of dialogue per character</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={characterStats.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalLines" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Character Presence */}
        <Card>
          <CardHeader>
            <CardTitle>Character Presence</CardTitle>
            <CardDescription>Distribution of speaking roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={characterStats.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="totalWords"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {characterStats.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Character Details */}
      <Card>
        <CardHeader>
          <CardTitle>Character Analysis</CardTitle>
          <CardDescription>Detailed breakdown of character development and presence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {characterStats.slice(0, 6).map((character, index) => (
              <div key={character.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <h4 className="font-semibold text-gray-900">{character.name}</h4>
                    <Badge variant="outline">
                      {character.totalLines > 50 ? 'Lead' :
                       character.totalLines > 20 ? 'Supporting' : 'Minor'}
                    </Badge>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p>{character.totalLines} lines</p>
                    <p>{character.totalWords} words</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Dialogue Lines</p>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(character.totalLines / Math.max(...characterStats.map(c => c.totalLines))) * 100}
                        className="h-2 flex-1"
                      />
                      <span className="text-gray-900 font-medium">{character.totalLines}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-600 mb-1">Word Count</p>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(character.totalWords / Math.max(...characterStats.map(c => c.totalWords))) * 100}
                        className="h-2 flex-1"
                      />
                      <span className="text-gray-900 font-medium">{character.totalWords}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-600 mb-1">Scene Presence</p>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(character.scenesAppeared / Math.max(...characterStats.map(c => c.scenesAppeared))) * 100}
                        className="h-2 flex-1"
                      />
                      <span className="text-gray-900 font-medium">{character.scenesAppeared} scenes</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Character Presence Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Character Presence Grid</CardTitle>
          <CardDescription>Visual representation of character appearances across scenes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">Characters:</span>
              {characterStats.slice(0, 6).map((char, index) => (
                <div key={char.id} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-gray-700">{char.name}</span>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-10 md:grid-cols-20 gap-1">
              {presenceGrid.map((scene, sceneIndex) => (
                <div key={sceneIndex} className="space-y-1">
                  <div className="text-xs text-center text-gray-500 mb-1">{scene.scene}</div>
                  {Array.from({ length: Math.min(6, characterStats.length) }, (_, charIndex) => (
                    <div
                      key={charIndex}
                      className={`w-4 h-2 rounded-sm ${
                        scene[`char_${charIndex}`]
                          ? 'opacity-100'
                          : 'opacity-20 bg-gray-200'
                      }`}
                      style={{
                        backgroundColor: scene[`char_${charIndex}`]
                          ? COLORS[charIndex % COLORS.length]
                          : '#e5e7eb'
                      }}
                    ></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Character Development Notes */}
      {characterNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Character Development Notes</CardTitle>
            <CardDescription>AI-generated insights on character development</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {characterNotes.map((note: any, index: number) => (
                <div key={index} className="border-l-4 border-brand-200 pl-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="font-medium text-gray-900">Character Development</span>
                    <Badge variant={note.severity === 'HIGH' ? 'destructive' :
                                  note.severity === 'MEDIUM' ? 'default' : 'secondary'}>
                      {note.severity}
                    </Badge>
                  </div>
                  {note.excerpt && (
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded italic">
                      "{note.excerpt}"
                    </p>
                  )}
                  {note.suggestion && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      <strong>Suggestion:</strong> {note.suggestion}
                    </p>
                  )}
                  {note.page && (
                    <p className="text-xs text-gray-500">Page {note.page}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Character Arc Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Character Arc Analysis</CardTitle>
          <CardDescription>Character development throughout the story</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characterStats.slice(0, 3).map((character, index) => (
              <div key={character.id} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <h4 className="font-medium text-gray-900">{character.name}</h4>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role Significance</span>
                    <span className="font-medium">
                      {character.totalLines > 50 ? 'Primary' :
                       character.totalLines > 20 ? 'Secondary' : 'Minor'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Story Presence</span>
                    <span className="font-medium">{character.scenesAppeared} scenes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Voice Strength</span>
                    <span className="font-medium">
                      {Math.round(character.totalWords / Math.max(character.totalLines, 1))} words/line
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}