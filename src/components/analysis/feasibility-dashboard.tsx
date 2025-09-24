"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DollarSign,
  MapPin,
  Clock,
  Users,
  Camera,
  Zap,
  Car,
  Shield,
  Sparkles,
  Home,
  Building
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
  ComposedChart,
  Line,
  LineChart
} from 'recharts'

interface FeasibilityDashboardProps {
  script: any
  dashboardData: any
}

export function FeasibilityDashboard({ script, dashboardData }: FeasibilityDashboardProps) {
  const {\n  feasibility = [],\n  scores = []\n} = dashboardData ?? {}

  // Calculate feasibility metrics
  const feasibilityScore = scores.find((s: any) => s.category === 'FEASIBILITY')?.value || 0

  // Location breakdown
  const locationBreakdown = React.useMemo(() => {
    const breakdown = {
      interior: 0,
      exterior: 0,
      intExt: 0,
      locations: new Map()
    }

    feasibility.forEach((f: any) => {
      if (f.int_ext === 'INT') breakdown.interior++
      else if (f.int_ext === 'EXT') breakdown.exterior++
      else if (f.int_ext === 'INT_EXT') breakdown.intExt++

      if (f.location) {
        const count = breakdown.locations.get(f.location) || 0
        breakdown.locations.set(f.location, count + 1)
      }
    })

    return {
      ...breakdown,
      locationList: Array.from(breakdown.locations.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    }
  }, [feasibility])

  // Production complexity analysis
  const complexityAnalysis = React.useMemo(() => {
    const categories = {
      stunts: 0,
      vfx: 0,
      sfx: 0,
      crowd: 0,
      minors: 0,
      animals: 0,
      weapons: 0,
      vehicles: 0,
      specialProps: 0
    }

    feasibility.forEach((f: any) => {
      if (f.has_stunts) categories.stunts++
      if (f.has_vfx) categories.vfx++
      if (f.has_sfx) categories.sfx++
      if (f.has_crowd) categories.crowd++
      if (f.has_minors) categories.minors++
      if (f.has_animals) categories.animals++
      if (f.has_weapons) categories.weapons++
      if (f.has_vehicles) categories.vehicles++
      if (f.has_special_props) categories.specialProps++
    })

    return Object.entries(categories).map(([key, value]) => ({
      category: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      count: value,
      percentage: (value / Math.max(feasibility.length, 1)) * 100
    }))
  }, [feasibility])

  // Complexity heatmap data
  const complexityHeatmap = React.useMemo(() => {
    return feasibility.map((f: any, index: number) => ({
      scene: `Scene ${index + 1}`,
      complexity: f.complexity_score || 0,
      location: f.location || 'Unknown',
      intExt: f.int_ext || 'Unknown'
    }))
  }, [feasibility])

  // Company move estimation
  const companyMoveEstimate = React.useMemo(() => {
    const uniqueLocations = new Set(feasibility.map((f: any) => f.location).filter(Boolean))
    const exteriorScenes = feasibility.filter((f: any) => f.int_ext === 'EXT').length
    const complexScenes = feasibility.filter((f: any) => f.complexity_score > 6).length

    const estimatedDays = Math.max(1, Math.ceil(
      uniqueLocations.size * 0.5 + // Location moves
      exteriorScenes * 0.2 + // Exterior complexity
      complexScenes * 0.3 // Complex scenes
    ))

    const baseCost = estimatedDays * 50000 // Base daily cost
    const complexityCost = complexScenes * 25000 // Complexity premium
    const totalCost = baseCost + complexityCost

    const complexityLevel =
      complexScenes > 10 ? 'extreme' :
      complexScenes > 5 ? 'high' :
      complexScenes > 2 ? 'medium' : 'low'

    return {
      days: estimatedDays,
      cost: totalCost,
      complexity: complexityLevel,
      uniqueLocations: uniqueLocations.size
    }
  }, [feasibility])

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  const locationTypeData = [
    { name: 'Interior', value: locationBreakdown.interior, color: '#8b5cf6' },
    { name: 'Exterior', value: locationBreakdown.exterior, color: '#06b6d4' },
    { name: 'Int/Ext', value: locationBreakdown.intExt, color: '#10b981' }
  ]

  return (
    <div className="space-y-6">
      {/* Feasibility Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-brand-600" />
            <div>
              <p className="text-sm text-gray-600">Feasibility Score</p>
              <p className="text-2xl font-bold text-gray-900">{feasibilityScore.toFixed(1)}/10</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-success-600" />
            <div>
              <p className="text-sm text-gray-600">Locations</p>
              <p className="text-2xl font-bold text-gray-900">{companyMoveEstimate.uniqueLocations}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-warning-600" />
            <div>
              <p className="text-sm text-gray-600">Est. Days</p>
              <p className="text-2xl font-bold text-gray-900">{companyMoveEstimate.days}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-danger-600" />
            <div>
              <p className="text-sm text-gray-600">Complexity</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">{companyMoveEstimate.complexity}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Production Cost Estimate */}
      <Card>
        <CardHeader>
          <CardTitle>Production Cost Estimate</CardTitle>
          <CardDescription>Estimated budget impact based on scene complexity and requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">
                ${(companyMoveEstimate.cost / 1000000).toFixed(1)}M
              </p>
              <p className="text-sm text-gray-600">Estimated Budget</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{companyMoveEstimate.days}</p>
              <p className="text-sm text-gray-600">Shooting Days</p>
            </div>
            <div className="text-center">
              <Badge
                className="text-base px-3 py-1"
                variant={
                  companyMoveEstimate.complexity === 'low' ? 'default' :
                  companyMoveEstimate.complexity === 'medium' ? 'secondary' :
                  companyMoveEstimate.complexity === 'high' ? 'destructive' : 'destructive'
                }
              >
                {companyMoveEstimate.complexity.toUpperCase()} COMPLEXITY
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Location Breakdown</CardTitle>
            <CardDescription>Interior vs exterior scenes distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={locationTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {locationTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
            <CardDescription>Most frequently used locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {locationBreakdown.locationList.slice(0, 8).map((location, index) => (
                <div key={location.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {location.name.includes('INT') || location.name.toLowerCase().includes('interior') ?
                        <Home className="w-4 h-4 text-brand-600" /> :
                        <Building className="w-4 h-4 text-success-600" />
                      }
                      <span className="text-sm font-medium text-gray-900">{location.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-brand-600 h-2 rounded-full"
                        style={{ width: `${(location.count / Math.max(...locationBreakdown.locationList.map(l => l.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{location.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Production Requirements</CardTitle>
          <CardDescription>Special requirements that impact budget and complexity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complexityAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Production Requirements Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Requirements</CardTitle>
          <CardDescription>Scene-by-scene production requirements breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {complexityAnalysis.map((item, index) => {
              const getIcon = (category: string) => {
                switch (category.toLowerCase()) {
                  case 'stunts': return <Shield className="w-5 h-5" />
                  case 'vfx': return <Sparkles className="w-5 h-5" />
                  case 'sfx': return <Zap className="w-5 h-5" />
                  case 'crowd': return <Users className="w-5 h-5" />
                  case 'vehicles': return <Car className="w-5 h-5" />
                  case 'weapons': return <Shield className="w-5 h-5" />
                  default: return <Camera className="w-5 h-5" />
                }
              }

              const getColor = (count: number) => {
                if (count === 0) return 'text-gray-400'
                if (count <= 2) return 'text-success-600'
                if (count <= 5) return 'text-warning-600'
                return 'text-danger-600'
              }

              return (
                <div key={index} className="p-4 border rounded-lg space-y-2">
                  <div className={`flex items-center gap-2 ${getColor(item.count)}`}>
                    {getIcon(item.category)}
                    <span className="font-medium text-gray-900">{item.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">{item.count}</span>
                    <span className="text-sm text-gray-600">{item.percentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={item.percentage} className="h-1" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Complexity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Complexity Heatmap</CardTitle>
          <CardDescription>Scene complexity across the script</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complexityHeatmap.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scene" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="complexity"
                  stroke="#ef4444"
                  strokeWidth={3}
                  name="Complexity Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Budget Impact Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Impact Analysis</CardTitle>
          <CardDescription>Cost drivers and optimization opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">High Impact Elements</h4>
              <div className="space-y-3">
                {complexityAnalysis
                  .filter(item => item.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{item.category}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.count > 5 ? 'destructive' : item.count > 2 ? 'default' : 'secondary'}>
                          {item.count} scenes
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Optimization Suggestions</h4>
              <div className="space-y-3 text-sm">
                {companyMoveEstimate.uniqueLocations > 8 && (
                  <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                    <p className="text-warning-800">
                      <strong>Location Consolidation:</strong> Consider combining scenes in similar locations
                      to reduce company moves and transportation costs.
                    </p>
                  </div>
                )}
                {complexityAnalysis.find(c => c.category.toLowerCase().includes('vfx'))?.count > 5 && (
                  <div className="p-3 bg-info-50 border border-info-200 rounded-lg">
                    <p className="text-info-800">
                      <strong>VFX Planning:</strong> High VFX scene count. Consider pre-visualization
                      and detailed planning to optimize post-production budget.
                    </p>
                  </div>
                )}
                {complexityAnalysis.find(c => c.category.toLowerCase().includes('crowd'))?.count > 0 && (
                  <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                    <p className="text-warning-800">
                      <strong>Crowd Scenes:</strong> Crowd scenes significantly impact budget.
                      Consider digital crowd extension or careful scheduling.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
