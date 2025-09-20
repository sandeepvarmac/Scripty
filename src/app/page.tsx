"use client"

import { AppShell, AppHeader, AppContent, AppFooter } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScriptyBoyLogo } from "@/components/ui/logo"
import { BrandHeader } from "@/components/ui/brand-header"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  const handleSignIn = () => {
    console.log('Sign In button clicked')
    router.push('/auth')
  }

  const handleGetStarted = () => {
    console.log('Get Started button clicked')
    router.push('/auth')
  }

  const handleStartAnalysis = () => {
    console.log('Start Analysis button clicked')
    router.push('/auth')
  }

  const handleViewSample = () => {
    console.log('View Sample button clicked')
    // TODO: Navigate to sample report when available
    alert('Sample report coming soon!')
  }

  const handleChooseFile = () => {
    console.log('Choose File button clicked')
    router.push('/auth')
  }

  const currentYear = new Date().getFullYear()

  return (
    <AppShell
      footer={
        <AppFooter>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <span>© {currentYear} ScriptyBoy. All rights reserved.</span>
              <div className="flex items-center gap-4 text-sm">
                <button className="hover:text-foreground transition-colors">Privacy Policy</button>
                <button className="hover:text-foreground transition-colors">Terms of Service</button>
                <button className="hover:text-foreground transition-colors">Support</button>
                <button className="hover:text-foreground transition-colors">Contact</button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span>Professional AI-powered screenplay analysis</span>
            </div>
          </div>
        </AppFooter>
      }
    >
      <AppHeader>
        <div className="flex items-center space-x-4">
          <BrandHeader size="md" />
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleSignIn}>Sign In</Button>
          <Button variant="brand" onClick={handleGetStarted}>Get Started</Button>
        </div>
      </AppHeader>

      <AppContent>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center py-16">
            <div className="flex justify-center mb-8">
              <ScriptyBoyLogo size="lg" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Your AI-Powered{" "}
              <span className="text-gradient-brand">
                Screenplay Analyst
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Professional screenplay coverage and analysis powered by AI. Upload your script and receive detailed feedback in minutes, not weeks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="brand" className="min-w-[160px]" onClick={handleStartAnalysis}>
                Start Free Analysis
              </Button>
              <Button size="lg" variant="outline" className="min-w-[160px]" onClick={handleViewSample}>
                View Sample Report
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Professional Coverage</CardTitle>
                <CardDescription>
                  Industry-standard analysis with loglines, synopsis, and detailed notes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Scene-anchored diagnostics</li>
                  <li>• Character development analysis</li>
                  <li>• Production budget heuristics</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actionable Rewrite Cards</CardTitle>
                <CardDescription>
                  Specific suggestions with before/after examples
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Evidence-linked feedback</li>
                  <li>• One-click accept/reject</li>
                  <li>• Craft-focused improvements</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Multiple Formats</CardTitle>
                <CardDescription>
                  Support for FDX, Fountain, and PDF uploads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Export to PDF reports</li>
                  <li>• FDX with inline comments</li>
                  <li>• CSV data for analysis</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Demo/Preview Section */}
          <div className="py-16 text-center">
            <h2 className="text-3xl font-bold mb-4">See It In Action</h2>
            <p className="text-muted-foreground mb-8">
              Upload a sample script or view our demo analysis
            </p>
            <div className="border-2 border-dashed border-border rounded-2xl p-12 bg-muted/30">
              <div className="space-y-4">
                <div className="text-4xl">📄</div>
                <h3 className="text-lg font-semibold">Drop your screenplay here</h3>
                <p className="text-muted-foreground">Supports .fdx, .fountain, and .pdf files up to 10MB</p>
                <Button variant="brand" onClick={handleChooseFile}>
                  Choose File
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AppContent>
    </AppShell>
  )
}