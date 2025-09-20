import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import type { Analyse, Character, Evidence, Scene, Script } from '@prisma/client'
import { AppShell, AppHeader, AppContent, AppFooter } from '@/components/app-shell'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { BrandHeader } from '@/components/ui/brand-header'
import { RealAuthService } from '@/lib/auth/real-auth-service'
import { getScriptWithScenes } from '@/lib/evidence-store'
import { format } from 'date-fns'
import { AlertCircle, Film, MapPin, MessageSquare, User, FileText } from 'lucide-react'

type SceneWithEvidence = Scene & { evidences: Evidence[] }
type ScriptAnalysis = Script & {
  scenes: SceneWithEvidence[]
  characters: Character[]
  analyses: Analyse[]
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

  return (
    <AppShell
      footer={
        <AppFooter>
          <span>Analysis generated {format(script.processedAt ?? script.uploadedAt, 'MMM d, yyyy')}</span>
          <span>{user.email}</span>
        </AppFooter>
      }
    >
      <AppHeader>
        <div className="flex items-center space-x-4">
          <BrandHeader size="md" />
          <div>
            <p className="font-semibold text-lg">{script.title ?? script.originalFilename}</p>
            <p className="text-sm text-muted-foreground">Analysis overview</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Logged in as</p>
          <p className="font-medium">{user.name ?? user.email}</p>
        </div>
      </AppHeader>

      <AppContent className="space-y-8 pb-16">
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
              <CardTitle>Latest Analyses</CardTitle>
              <CardDescription>History of generated reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {script.analyses.length === 0 ? (
                <EmptyState message="No analyses recorded yet." />
              ) : (
                script.analyses.map((analysis) => (
                  <div key={analysis.id} className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{formatAnalysisType(analysis.type)}</p>
                        <p className="text-xs text-muted-foreground">
                          Started {format(analysis.startedAt, 'MMM d, yyyy h:mm a')}
                          {analysis.completedAt ? ` • Completed ${format(analysis.completedAt, 'MMM d, yyyy h:mm a')}` : ''}
                        </p>
                      </div>
                      <span className="text-sm font-medium">{analysis.status}</span>
                    </div>
                    {analysis.summary && (
                      <p className="mt-2 text-sm text-muted-foreground">{analysis.summary}</p>
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