import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import type { Analysis, Character, Evidence, Scene, Script } from '@prisma/client'
import { AppShell, AppHeader, AppContent, AppFooter } from '@/components/app-shell'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { BrandHeader } from '@/components/ui/brand-header'
import { RealAuthService } from '@/lib/auth/real-auth-service'
import { getScriptWithScenes } from '@/lib/evidence-store'
import { format } from 'date-fns'
import { AlertCircle, Film, MapPin, MessageSquare, User, FileText, Play, RefreshCw, CheckCircle, XCircle, Clock, ArrowLeft, Search, HelpCircle, Bell, CreditCard, Settings, LogOut } from 'lucide-react'
import { AnalysisControls } from './analysis-controls'
import { Button } from '@/components/ui/button'
import { TabbedAnalysis } from '@/components/analysis/tabbed-analysis'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

type SceneWithEvidence = Scene & { evidences: Evidence[] }
type ScriptAnalysis = Script & {
  scenes: SceneWithEvidence[]
  characters: Character[]
  analyses: Analysis[]
}

interface AnalysisPageProps {
  params: { id: string }
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  const cookieStore = cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) redirect('/auth')

  const payload = await RealAuthService.verifyToken(token)
  if (!payload) redirect('/auth')

  const [user, script] = await Promise.all([
    RealAuthService.getUserById(payload.userId),
    getScriptWithScenes(params.id, payload.userId)
  ])

  if (!user) redirect('/auth')
  if (!script) notFound()

  const sceneIssues = script.scenes.flatMap((scene) =>
    scene.evidences.map((evidence) => ({
      ...evidence,
      sceneNumber: scene.sceneNumber ?? `Scene ${scene.orderIndex + 1}`
    }))
  )

  const issuesByType = groupEvidenceByType(sceneIssues)

  const fullName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.name || user.email

  return (
    <AppShell
      footer={
        <AppFooter>
          <div className="flex items-center space-x-6">
            <span>© {new Date().getFullYear()} ScriptyBoy. All rights reserved.</span>
            <div className="flex items-center space-x-4">
              <button className="hover:text-foreground transition-colors">Privacy Policy</button>
              <button className="hover:text-foreground transition-colors">Terms of Service</button>
              <button className="hover:text-foreground transition-colors">Support</button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs">Status: All systems operational</span>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-xs">Online</span>
            </div>
          </div>
        </AppFooter>
      }
    >
      <AppHeader>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <BrandHeader size="md" />
          <div>
            <p className="font-semibold text-lg">{script.title ?? script.originalFilename}</p>
            <p className="text-sm text-muted-foreground">Analysis overview</p>
          </div>
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
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-none">{fullName}</p>
              <p className="text-xs text-muted-foreground">{user.plan} Plan</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/user.png" alt={fullName} />
                    <AvatarFallback>
                      {user.firstName && user.lastName
                        ? `${user.firstName[0]}${user.lastName[0]}`
                        : user.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || user.email[0].toUpperCase()
                      }
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{fullName}</p>
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
                <DropdownMenuItem asChild>
                  <Link href="/auth">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </AppHeader>

      <AppContent className="space-y-8 pb-16">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{script.title ?? script.originalFilename}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* New Tabbed Analysis Interface */}
        <TabbedAnalysis script={script} />
      </AppContent>
    </AppShell>
  )
}

function formatSceneType(type: Scene['type']) {
  return type.replace('_', ' ').toLowerCase()
}

function formatEvidenceType(type: Evidence['type']) {
  return type.replace('_', ' ').toLowerCase()
}

function formatAnalysisType(type: Analyse['type']) {
  return type.replace('_', ' ').toLowerCase()
}

function getAnalysisStatusIcon(status: Analyse['status']) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'FAILED':
      return <XCircle className="h-5 w-5 text-red-600" />
    case 'IN_PROGRESS':
      return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
    default:
      return <RefreshCw className="h-5 w-5 text-gray-600" />
  }
}

function getStatusBadgeClass(status: Analyse['status']) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 border border-green-200'
    case 'FAILED':
      return 'bg-red-100 text-red-800 border border-red-200'
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800 border border-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200'
  }
}

function groupEvidenceByType(evidence: (Evidence & { sceneNumber: string })[]) {
  const map = new Map<Evidence['type'], (Evidence & { sceneNumber: string })[]>()

  evidence.forEach((entry) => {
    const list = map.get(entry.type) ?? []
    list.push(entry)
    map.set(entry.type, list)
  })

  return Array.from(map.entries()).map(([type, entries]) => ({
    type,
    entries
  }))
}

function MetadataRow({
  label,
  value,
  icon
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center space-x-3 rounded border px-3 py-2">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs uppercase text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}