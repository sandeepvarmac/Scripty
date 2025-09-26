"use client"

import * as React from "react"
import { AppShell, AppHeader, AppContent, AppFooter } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BrandHeader } from "@/components/ui/brand-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Upload, FileText, BarChart3, Clock, Settings, LogOut, User, CreditCard, Bell, Search, HelpCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { ProjectsDashboard } from './projects-dashboard'

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
  averageScore: number | null
}


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
      // Call the sign out API endpoint
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        // Successful sign out - redirect to home
        router.push('/')
      } else {
        console.error('Sign out failed:', await response.text())
        // Still redirect on failure
        router.push('/')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      // Clear cookies manually as fallback
      document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      router.push('/')
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-danger-600 mb-4">{error || 'User data not found'}</p>
          <Button onClick={() => router.push('/auth')}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  // Create proper display name prioritizing firstName + lastName
  const fullName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.name
  const displayName = fullName || user.email

  // Create initials from firstName + lastName or fallback
  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || user.email[0].toUpperCase()

  // Get first name for welcome message
  const firstName = user.firstName || fullName?.split(' ')[0] || user.email.split('@')[0]

  const usagePercentage = (user.analysesUsed / user.analysesLimit) * 100

  const currentYear = new Date().getFullYear()

  return (
    <AppShell
      footer={
        <AppFooter>
          <div className="flex items-center space-x-6">
            <span>© {currentYear} ScriptyBoy. All rights reserved.</span>
            <div className="flex items-center space-x-4">
              <button className="hover:text-foreground transition-colors">Privacy Policy</button>
              <button className="hover:text-foreground transition-colors">Terms of Service</button>
              <button className="hover:text-foreground transition-colors">Support</button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs">Status: All systems operational</span>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 bg-success-500 rounded-full"></div>
              <span className="text-xs">Online</span>
            </div>
          </div>
        </AppFooter>
      }
    >
      <AppHeader>
        <div className="flex items-center space-x-4">
          <BrandHeader size="md" />
        </div>
        <div className="flex items-center space-x-4">
          {/* Modern header elements */}
          <div className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <HelpCircle className="h-4 w-4" />
              <span className="sr-only">Help</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground relative">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
              {/* Notification dot */}
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-danger-500 rounded-full"></span>
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-none">{fullName || user.email}</p>
              <p className="text-xs text-muted-foreground">{user.plan} Plan</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
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
            <h1 className="text-3xl font-bold">Welcome back, {firstName}!</h1>
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
                <div className="text-2xl font-bold">
                  {user.averageScore ? user.averageScore.toFixed(1) : '--'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user.averageScore ? 'Across all completed analyses' : 'No completed analyses yet'}
                </p>
              </CardContent>
            </Card>
          </div>


          {/* Projects Dashboard */}
          <ProjectsDashboard />
        </div>
      </AppContent>
    </AppShell>
  )
}