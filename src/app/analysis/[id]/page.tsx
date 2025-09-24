import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { AppShell, AppHeader, AppContent, AppFooter } from '@/components/app-shell'
import { BrandHeader } from '@/components/ui/brand-header'
import { RealAuthService } from '@/lib/auth/real-auth-service'
import { getScriptWithEnhancedData } from '@/lib/evidence-store'
import { format } from 'date-fns'
import { ArrowLeft, Search, HelpCircle, Bell, CreditCard, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EnhancedTabbedAnalysis } from '@/components/analysis/enhanced-tabbed-analysis'
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

interface AnalysisPageProps {
  params: { id: string }
}

function groupEvidenceByType(evidence: any[]) {
  const grouped = evidence.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = []
    }
    acc[item.type].push(item)
    return acc
  }, {})

  return Object.keys(grouped).map(type => ({
    type,
    count: grouped[type].length,
    items: grouped[type]
  }))
}

async function handleSignOut() {
  'use server'
  const cookieStore = cookies()
  cookieStore.delete('auth-token')
  redirect('/auth')
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  const cookieStore = cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) redirect('/auth')

  const payload = await RealAuthService.verifyToken(token)
  if (!payload) redirect('/auth')

  const [user, script] = await Promise.all([
    RealAuthService.getUserById(payload.userId),
    getScriptWithEnhancedData(params.id, payload.userId)
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
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Terms of Service
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Support
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Status: All systems operational</span>
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <span>Online</span>
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
        </div>
        <div className="flex items-center space-x-4">
          {/* Modern header elements */}
          <div className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>

          {/* Notification bell with red dot */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
          </Button>

          {/* User dropdown */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden md:block">
              <div className="text-sm font-medium text-foreground">{fullName}</div>
              <div className="text-xs text-muted-foreground">{user.plan} Plan</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || ''} alt={fullName} />
                    <AvatarFallback>
                      {fullName.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <div className="mr-2 h-4 w-4" />
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
                <form action={handleSignOut}>
                  <button type="submit" className="w-full">
                    <DropdownMenuItem>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </AppHeader>

      <AppContent>
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Breadcrumb */}
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

          {/* Enhanced Analysis Component */}
          <EnhancedTabbedAnalysis script={script} />
        </div>
      </AppContent>
    </AppShell>
  )
}