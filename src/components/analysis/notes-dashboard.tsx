"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  StickyNote,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  MapPin,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface NotesDashboardProps {
  script: any
  dashboardData: any
  onNotesUpdate: () => void
}

export function NotesDashboard({ script, dashboardData, onNotesUpdate }: NotesDashboardProps) {
  const { notes = [] } = dashboardData ?? {}
  const [filteredNotes, setFilteredNotes] = React.useState(notes)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedSeverity, setSelectedSeverity] = React.useState<string>("all")
  const [selectedArea, setSelectedArea] = React.useState<string>("all")
  const [showAddNote, setShowAddNote] = React.useState(false)

  // Filter notes based on search and filters
  React.useEffect(() => {
    let filtered = notes

    if (searchTerm) {
      filtered = filtered.filter((note: any) =>
        note.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.suggestion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.area?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedSeverity !== "all") {
      filtered = filtered.filter((note: any) => note.severity === selectedSeverity)
    }

    if (selectedArea !== "all") {
      filtered = filtered.filter((note: any) => note.area === selectedArea)
    }

    setFilteredNotes(filtered)
  }, [notes, searchTerm, selectedSeverity, selectedArea])

  // Notes statistics
  const noteStats = React.useMemo(() => {
    const stats = {
      total: notes.length,
      high: notes.filter((n: any) => n.severity === 'HIGH').length,
      medium: notes.filter((n: any) => n.severity === 'MEDIUM').length,
      low: notes.filter((n: any) => n.severity === 'LOW').length,
      byArea: {} as Record<string, number>
    }

    notes.forEach((note: any) => {
      stats.byArea[note.area] = (stats.byArea[note.area] || 0) + 1
    })

    return stats
  }, [notes])

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH': return <AlertTriangle className="w-4 h-4 text-danger-600" />
      case 'MEDIUM': return <Info className="w-4 h-4 text-warning-600" />
      case 'LOW': return <CheckCircle className="w-4 h-4 text-success-600" />
      default: return <Info className="w-4 h-4 text-gray-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'default'
      case 'LOW': return 'secondary'
      default: return 'outline'
    }
  }

  const formatArea = (area: string) => {
    return area.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="space-y-6">
      {/* Notes Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <StickyNote className="w-8 h-8 text-brand-600" />
            <div>
              <p className="text-sm text-gray-600">Total Notes</p>
              <p className="text-2xl font-bold text-gray-900">{noteStats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-danger-600" />
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">{noteStats.high}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Info className="w-8 h-8 text-warning-600" />
            <div>
              <p className="text-sm text-gray-600">Medium Priority</p>
              <p className="text-2xl font-bold text-gray-900">{noteStats.medium}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-success-600" />
            <div>
              <p className="text-sm text-gray-600">Low Priority</p>
              <p className="text-2xl font-bold text-gray-900">{noteStats.low}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Analysis Notes</CardTitle>
              <CardDescription>
                Actionable feedback and suggestions for script improvement
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Notes
              </Button>
              <Button size="sm" onClick={() => setShowAddNote(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="HIGH">High Priority</SelectItem>
                  <SelectItem value="MEDIUM">Medium Priority</SelectItem>
                  <SelectItem value="LOW">Low Priority</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  <SelectItem value="STRUCTURE">Structure</SelectItem>
                  <SelectItem value="CHARACTER">Character</SelectItem>
                  <SelectItem value="DIALOGUE">Dialogue</SelectItem>
                  <SelectItem value="PACING">Pacing</SelectItem>
                  <SelectItem value="THEME">Theme</SelectItem>
                  <SelectItem value="GENRE">Genre</SelectItem>
                  <SelectItem value="FORMATTING">Formatting</SelectItem>
                  <SelectItem value="LOGIC">Logic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Priority</TableHead>
                    <TableHead className="w-24">Area</TableHead>
                    <TableHead>Issue & Suggestion</TableHead>
                    <TableHead className="w-24">Location</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotes.length > 0 ? (
                    filteredNotes.map((note: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(note.severity)}
                            <Badge variant={getSeverityColor(note.severity) as any}>
                              {note.severity}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatArea(note.area)}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-y-2">
                          {note.excerpt && (
                            <div className="p-2 bg-gray-50 rounded text-sm italic">
                              "{note.excerpt}"
                            </div>
                          )}
                          {note.suggestion && (
                            <div className="text-sm text-gray-700">
                              <strong>Suggestion:</strong> {note.suggestion}
                            </div>
                          )}
                          {note.rule_code && (
                            <div className="text-xs text-gray-500">
                              Rule: {note.rule_code}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {note.page && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                Page {note.page}
                              </div>
                            )}
                            {note.line_ref && (
                              <div className="text-xs text-gray-500">
                                Line {note.line_ref}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        {notes.length === 0 ? "No notes found for this script" : "No notes match your filters"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination would go here */}
            {filteredNotes.length > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Showing {filteredNotes.length} of {notes.length} notes</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes by Area Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Notes by Area</CardTitle>
          <CardDescription>Distribution of feedback across different craft areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(noteStats.byArea).map(([area, count]) => (
              <div key={area} className="p-3 border rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">{formatArea(area)}</p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Note Modal/Form (simplified for demo) */}
      {showAddNote && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Note</CardTitle>
            <CardDescription>Create a custom analysis note</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="severity">Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High Priority</SelectItem>
                    <SelectItem value="MEDIUM">Medium Priority</SelectItem>
                    <SelectItem value="LOW">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="area">Area</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STRUCTURE">Structure</SelectItem>
                    <SelectItem value="CHARACTER">Character</SelectItem>
                    <SelectItem value="DIALOGUE">Dialogue</SelectItem>
                    <SelectItem value="PACING">Pacing</SelectItem>
                    <SelectItem value="THEME">Theme</SelectItem>
                    <SelectItem value="GENRE">Genre</SelectItem>
                    <SelectItem value="FORMATTING">Formatting</SelectItem>
                    <SelectItem value="LOGIC">Logic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="page">Page Number</Label>
                <Input type="number" placeholder="Page number" />
              </div>
              <div>
                <Label htmlFor="line">Line Reference</Label>
                <Input type="number" placeholder="Line number" />
              </div>
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea placeholder="Text that needs attention..." className="h-20" />
            </div>

            <div>
              <Label htmlFor="suggestion">Suggestion</Label>
              <Textarea placeholder="Actionable improvement suggestion..." className="h-24" />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddNote(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowAddNote(false)}>
                Add Note
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
