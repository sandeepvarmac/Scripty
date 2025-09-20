import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import type { Analysis, Character, Evidence, Scene, Script } from '@prisma/client'
import { AppShell, AppHeader, AppContent, AppFooter } from '@/components/app-shell'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { BrandHeader } from '@/components/ui/brand-header'
import { RealAuthService } from '@/lib/auth/real-auth-service'
import { getScriptWithScenes } from '@/lib/evidence-store'
import { format } from 'date-fns'
import { AlertCircle, Film, MapPin, MessageSquare, User, FileText, Play, RefreshCw, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react'
import { AnalysisControls } from './analysis-controls'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

  const fullName = user.name ?? user.email

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
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-none">{fullName}</p>
              <p className="text-xs text-muted-foreground">Analysis View</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/user.png" alt={fullName} />
                    <AvatarFallback>{fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/upload">Upload Script</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/auth">Sign Out</Link>
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

        <section className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Script Metadata</CardTitle>
              <CardDescription>Core details from the upload</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <MetadataRow label="Title" value={script.title ?? 'Unknown'} icon={<Film className="h-4 w-4" />} />
              <MetadataRow label="Format" value={script.format} icon={<FileText className="h-4 w-4" />} />
              <MetadataRow label="Page Count" value={script.pageCount.toString()} icon={<MapPin className="h-4 w-4" />} />
              <MetadataRow label="Scenes" value={script.totalScenes.toString()} icon={<Film className="h-4 w-4" />} />
              <MetadataRow label="Characters" value={script.totalCharacters.toString()} icon={<User className="h-4 w-4" />} />
              <MetadataRow label="Uploaded" value={format(script.uploadedAt, 'MMM d, yyyy h:mm a')} icon={<AlertCircle className="h-4 w-4" />} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span>🤖</span>
                    AI Analysis Dashboard
                  </CardTitle>
                  <CardDescription>Run new AI-powered analyses or view previous coverage results</CardDescription>
                </div>
                <AnalysisControls scriptId={script.id} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {script.analyses.length === 0 ? (
                <div className="rounded-md border border-dashed p-8 text-center">
                  <div className="flex justify-center items-center mb-4">
                    <Play className="h-8 w-8 text-muted-foreground mr-2" />
                    <span className="text-2xl">🤖</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">No AI analyses have been run yet.</p>
                  <p className="text-xs text-muted-foreground">Click "Run AI Analysis" above to get professional screenplay coverage powered by GPT-4.</p>
                </div>
              ) : (
                script.analyses.map((analysis) => (
                  <div key={analysis.id} className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getAnalysisStatusIcon(analysis.status)}
                        <div>
                          <p className="font-semibold">{formatAnalysisType(analysis.type)}</p>
                          <p className="text-xs text-muted-foreground">
                            Started {format(analysis.startedAt, 'MMM d, yyyy h:mm a')}
                            {analysis.completedAt ? ` • Completed ${format(analysis.completedAt, 'MMM d, yyyy h:mm a')}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-medium px-2 py-1 rounded ${getStatusBadgeClass(analysis.status)}`}>
                        {analysis.status}
                      </span>
                    </div>
                    {analysis.summary && (
                      <p className="mt-2 text-sm text-muted-foreground">{analysis.summary}</p>
                    )}
                    {analysis.score && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">AI Score:</span>
                        <span className="text-lg font-bold text-brand">{analysis.score.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">/10</span>
                      </div>
                    )}
                    {analysis.insights && Array.isArray(analysis.insights) && analysis.insights.length > 0 && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <div className="text-center p-2 rounded bg-red-50 border border-red-200">
                          <p className="text-xs text-red-600 font-medium">High Priority</p>
                          <p className="text-lg font-bold text-red-700">
                            {analysis.insights.filter((i: any) => i.severity === 'HIGH').length}
                          </p>
                        </div>
                        <div className="text-center p-2 rounded bg-yellow-50 border border-yellow-200">
                          <p className="text-xs text-yellow-600 font-medium">Medium Priority</p>
                          <p className="text-lg font-bold text-yellow-700">
                            {analysis.insights.filter((i: any) => i.severity === 'MEDIUM').length}
                          </p>
                        </div>
                        <div className="text-center p-2 rounded bg-blue-50 border border-blue-200">
                          <p className="text-xs text-blue-600 font-medium">Low Priority</p>
                          <p className="text-lg font-bold text-blue-700">
                            {analysis.insights.filter((i: any) => i.severity === 'LOW').length}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Scene Breakdown</CardTitle>
              <CardDescription>Evidence grouped by scene order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {script.scenes.length === 0 ? (
                <EmptyState message="No scene data was captured for this script." />
              ) : (
                script.scenes.map((scene) => (
                  <div key={scene.id} className="space-y-3 rounded-md border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">
                          {scene.sceneNumber ?? `Scene ${scene.orderIndex + 1}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatSceneType(scene.type)} • Page {scene.pageNumber} • Line {scene.lineNumber}
                        </p>
                      </div>
                      {scene.character && (
                        <span className="text-xs uppercase text-muted-foreground">
                          {scene.character}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{scene.content}</p>

                    {scene.evidences.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold">Evidence</p>
                        <ul className="space-y-2">
                          {scene.evidences.map((evidence) => (
                            <li key={evidence.id} className="rounded bg-muted/60 p-3 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{formatEvidenceType(evidence.type)}</span>
                                <span className="text-xs text-muted-foreground">
                                  Confidence {(evidence.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                              <p className="text-muted-foreground">{evidence.content}</p>
                              {evidence.tags.length > 0 && (
                                <p className="mt-1 text-xs uppercase text-muted-foreground">
                                  Tags: {evidence.tags.join(', ')}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Characters</CardTitle>
              <CardDescription>Dialogue distribution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {script.characters.length === 0 ? (
                <EmptyState message="No character records were generated." />
              ) : (
                script.characters.map((character) => (
                  <div key={character.id} className="rounded border p-3 text-sm">
                    <p className="font-semibold">{character.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Dialogue entries: {character.dialogueCount}
                      {character.firstAppearance ? ` • First seen at line ${character.firstAppearance}` : ''}
                    </p>
                    {character.analysisData && (
                      <pre className="mt-2 whitespace-pre-wrap rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                        {JSON.stringify(character.analysisData, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Issue Summary</CardTitle>
            <CardDescription>Aggregated evidence by category</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {issuesByType.length === 0 ? (
              <EmptyState message="No evidence-driven issues detected yet." />
            ) : (
              issuesByType.map(({ type, entries }) => (
                <div key={type} className="rounded-md border p-3 text-sm">
                  <p className="font-semibold">{formatEvidenceType(type)}</p>
                  <p className="text-xs text-muted-foreground">
                    {entries.length} item{entries.length === 1 ? '' : 's'}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {entries.slice(0, 3).map((entry) => (
                      <li key={entry.id}>
                        {entry.sceneNumber}: {entry.content.slice(0, 64).trim()}
                        {entry.content.length > 64 ? '…' : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </CardContent>
        </Card>
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