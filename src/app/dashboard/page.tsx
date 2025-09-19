"use client"

import * as React from "react"
import { AppShell, AppHeader, AppContent } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BrandHeader } from "@/components/ui/brand-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Upload, FileText, BarChart3, Clock, Settings, LogOut, User, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserData {
  id: string
  email: string
  name: string | null
  firstName: string | null
  lastName: string | null
  plan: string
  analysesUsed: number
  analysesLimit: number
  projectType: string
  privacyDoNotTrain: boolean
  createdAt: string
  lastLoginAt: string | null
}

// Mock recent analyses
const mockAnalyses = [
  {
    id: "1",
    title: "The Last Stand",
    type: "Feature Film",
    status: "Completed",
    score: 7.8,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    title: "Coffee Shop Chronicles",
    type: "Short Film",
    status: "Processing",
    score: null,
    createdAt: "2024-01-14",
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = React.useState<UserData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/me')

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, redirect to auth
          router.push('/auth')
          return
        }
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()
      setUser(data.user)
    } catch (err) {
      console.error('Error fetching user data:', err)
      setError('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      // Clear auth cookie and redirect
      document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
      router.push('/')
    }
  }

  const handleNewAnalysis = () => {
    // TODO: Navigate to upload page
    alert('Upload functionality coming soon!')
  }

  const handleViewAnalysis = (id: string) => {
    // TODO: Navigate to analysis detail page
    alert(`View analysis ${id} - coming soon!`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'User data not found'}</p>
          <Button onClick={() => router.push('/auth')}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.name?.split(' ').map(n => n[0]).join('') || user.email[0].toUpperCase()

  const usagePercentage = (user.analysesUsed / user.analysesLimit) * 100

  return (
    <AppShell>
      <AppHeader>
        <div className="flex items-center space-x-4">
          <BrandHeader size="md" />
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-none">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : displayName}</p>
              <p className="text-xs text-muted-foreground">{user.plan} Plan</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/user.png" alt={displayName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </AppHeader>

      <AppContent>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Welcome back, {user.firstName || displayName.split(' ')[0]}!</h1>
            <p className="text-muted-foreground">
              Ready to analyze your next screenplay? Upload a script to get started.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analyses This Month</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.analysesUsed}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="gradient-brand h-2 rounded-full transition-all"
                      style={{ width: `${usagePercentage}%` }}
                    />
                  </div>
                  <span>{user.analysesLimit - user.analysesUsed} remaining</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.plan}</div>
                <p className="text-xs text-muted-foreground">
                  {user.analysesLimit} analyses per month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7.8</div>
                <p className="text-xs text-muted-foreground">
                  Across all completed analyses
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* New Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Start New Analysis</CardTitle>
                <CardDescription>
                  Upload your screenplay for AI-powered coverage and feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/30">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Drop your script here</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports .fdx, .fountain, and .pdf files up to 10MB
                  </p>
                  <Button onClick={handleNewAnalysis} variant="brand">
                    <Plus className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Getting Better Results</CardTitle>
                <CardDescription>
                  Tips to maximize your screenplay analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-brand">1</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Use proper formatting</p>
                    <p className="text-xs text-muted-foreground">
                      Final Draft (.fdx) files provide the best analysis results
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-brand">2</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Complete first drafts work best</p>
                    <p className="text-xs text-muted-foreground">
                      Full scripts provide more comprehensive coverage
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-brand">3</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Review privacy settings</p>
                    <p className="text-xs text-muted-foreground">
                      Your script data is protected and never used for training
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Analyses */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Analyses</CardTitle>
              <CardDescription>
                Your latest screenplay analysis results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mockAnalyses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>No analyses yet. Upload your first script to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockAnalyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleViewAnalysis(analysis.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-brand" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{analysis.title}</h3>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{analysis.type}</span>
                            <span>•</span>
                            <span>{analysis.createdAt}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            {analysis.status === "Processing" ? (
                              <>
                                <Clock className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm text-yellow-600">Processing</span>
                              </>
                            ) : (
                              <>
                                <span className="text-lg font-bold">{analysis.score}</span>
                                <span className="text-sm text-muted-foreground">/10</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Report
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppContent>
    </AppShell>
  )
}