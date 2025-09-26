"use client"

import * as React from "react"
import { AppShell, AppHeader, AppContent, AppFooter } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BrandHeader } from "@/components/ui/brand-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MultiSelect, type Option } from "@/components/ui/multi-select"
import { Upload, FileText, AlertCircle, CheckCircle, X, ArrowLeft, User, Settings, LogOut, Search, HelpCircle, Bell, CreditCard, Plus, Folder } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import FileValidationDialog from '@/components/upload/file-validation-dialog'
import QualityCheckResults from '@/components/quality/quality-check-results'

// Common screenplay genres
const GENRE_OPTIONS: Option[] = [
  { label: 'Action', value: 'Action' },
  { label: 'Adventure', value: 'Adventure' },
  { label: 'Animation', value: 'Animation' },
  { label: 'Biography', value: 'Biography' },
  { label: 'Comedy', value: 'Comedy' },
  { label: 'Crime', value: 'Crime' },
  { label: 'Documentary', value: 'Documentary' },
  { label: 'Drama', value: 'Drama' },
  { label: 'Family', value: 'Family' },
  { label: 'Fantasy', value: 'Fantasy' },
  { label: 'History', value: 'History' },
  { label: 'Horror', value: 'Horror' },
  { label: 'Musical', value: 'Musical' },
  { label: 'Mystery', value: 'Mystery' },
  { label: 'Romance', value: 'Romance' },
  { label: 'Sci-Fi', value: 'Sci-Fi' },
  { label: 'Sport', value: 'Sport' },
  { label: 'Thriller', value: 'Thriller' },
  { label: 'War', value: 'War' },
  { label: 'Western', value: 'Western' },
]

// Target audience options
const TARGET_AUDIENCE_OPTIONS = [
  { label: 'General Audiences', value: 'General Audiences' },
  { label: 'Children (Under 13)', value: 'Children (Under 13)' },
  { label: 'Teens (13-17)', value: 'Teens (13-17)' },
  { label: 'Young Adults (18-24)', value: 'Young Adults (18-24)' },
  { label: 'Adults (25-54)', value: 'Adults (25-54)' },
  { label: 'Mature Adults (55+)', value: 'Mature Adults (55+)' },
  { label: 'Family', value: 'Family' },
  { label: 'Art House', value: 'Art House' },
  { label: 'Niche/Specialty', value: 'Niche/Specialty' },
]

interface UserData {
  id: string
  email: string
  name: string | null
  firstName: string | null
  lastName: string | null
  plan: string
}

interface Project {
  id: string
  name: string
  type: string
  genre?: string
  description?: string
  createdAt: string
}

interface ProjectFormData {
  name: string
  type: string
  genres: string[]
  description: string
  targetBudget: string
  targetAudience: string
  developmentStage: string
}

interface FileValidationError {
  fileName: string
  error: string
  fileSize?: number
  fileExtension?: string
}
type UploadResponsePayload = {
  error?: string
  warnings?: string[]
  data?: {
    script: {
      id: string
      title?: string | null
      format: string
      pageCount: number
      totalScenes: number
      totalCharacters: number
    }
    parsed: {
      title?: string | null
      format: string
      pageCount: number
      scenes: unknown[]
      characters: unknown[]
    }
  }
}


export default function UploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [dragActive, setDragActive] = React.useState(false)
  const [files, setFiles] = React.useState<File[]>([])
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [currentStage, setCurrentStage] = React.useState('')
  const [user, setUser] = React.useState<UserData | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Project-related state
  const [projects, setProjects] = React.useState<Project[]>([])
  const [selectedProject, setSelectedProject] = React.useState<string>('')
  const [showNewProjectForm, setShowNewProjectForm] = React.useState(false)
  const [projectsLoading, setProjectsLoading] = React.useState(true)
  const [projectsError, setProjectsError] = React.useState<string | null>(null)
  const [creatingProject, setCreatingProject] = React.useState(false)
  const [projectForm, setProjectForm] = React.useState<ProjectFormData>({
    name: '',
    type: '',
    genres: [],
    description: '',
    targetBudget: 'LOW',
    targetAudience: 'General Audiences',
    developmentStage: 'FIRST_DRAFT'
  })

  // File validation dialog state
  const [validationDialogOpen, setValidationDialogOpen] = React.useState(false)
  const [validationErrors, setValidationErrors] = React.useState<FileValidationError[]>([])

  // Quality validation state
  const [qualityCheckOpen, setQualityCheckOpen] = React.useState(false)
  const [qualityAssessment, setQualityAssessment] = React.useState<any>(null)
  const [validatedFile, setValidatedFile] = React.useState<File | null>(null)
  const [validating, setValidating] = React.useState(false)

  React.useEffect(() => {
    fetchUserData()
    fetchProjects()
  }, [])

  // Handle projectId from URL params
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const projectId = urlParams.get('projectId')
    if (projectId && projects.length > 0) {
      const projectExists = projects.find(p => p.id === projectId)
      if (projectExists) {
        setSelectedProject(projectId)
      }
    }
  }, [projects])

  // Get pre-selected project info for display
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const preSelectedProjectId = urlParams?.get('projectId')
  const preSelectedProject = preSelectedProjectId ? projects.find(p => p.id === preSelectedProjectId) : null

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/me')

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth')
          return
        }
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()
      setUser(data.user)
    } catch (err) {
      console.error('Error fetching user data:', err)
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true)
      setProjectsError(null)
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      } else {
        throw new Error('Failed to fetch projects')
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjectsError('Failed to load projects')
    } finally {
      setProjectsLoading(false)
    }
  }

  const handleCreateProject = async () => {
    // Validate required fields
    if (!projectForm.name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Project name is required"
      })
      return
    }
    if (!projectForm.type) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Project type is required"
      })
      return
    }

    // Check for duplicate project names
    const duplicateProject = projects.find(p =>
      p.name.toLowerCase().trim() === projectForm.name.toLowerCase().trim()
    )
    if (duplicateProject) {
      toast({
        variant: "destructive",
        title: "Duplicate Project",
        description: `A project named "${projectForm.name}" already exists. Please choose a different name.`
      })
      return
    }

    try {
      setCreatingProject(true)

      // Convert genres array to comma-separated string for storage
      const submitData = {
        ...projectForm,
        genre: projectForm.genres.join(', ')
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        const data = await response.json()
        const newProject = data.project
        setProjects([...projects, newProject])
        setSelectedProject(newProject.id)
        setShowNewProjectForm(false)
        // Reset form
        setProjectForm({
          name: '',
          type: '',
          genres: [],
          description: '',
          targetBudget: 'LOW',
          targetAudience: 'General Audiences',
          developmentStage: 'FIRST_DRAFT'
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Project Creation Failed",
          description: `Failed to create project: ${error.error}`
        })
      }
    } catch (error) {
      console.error('Error creating project:', error)
      toast({
        variant: "destructive",
        title: "Project Creation Failed",
        description: "Failed to create project. Please try again."
      })
    } finally {
      setCreatingProject(false)
    }
  }

  // File validation
  const validateFile = (file: File) => {
    const allowedTypes = ['.fdx', '.fountain', '.pdf', '.txt']
    const maxSize = 10 * 1024 * 1024 // 10MB
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedTypes.includes(extension)) {
      return {
        valid: false,
        error: `File type ${extension} is not supported. Please upload a screenplay in one of the supported formats.`,
        fileExtension: extension
      }
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the 10MB limit.`,
        fileSize: file.size
      }
    }

    return { valid: true }
  }

  // Show validation errors in dialog
  const showValidationErrors = (errors: FileValidationError[]) => {
    setValidationErrors(errors)
    setValidationDialogOpen(true)
  }

  // Convert compliance object to QualityAssessment format
  const convertComplianceToQualityAssessment = (compliance: any) => {
    const score = compliance.score || 0
    const reasons = compliance.reasons || []
    const threshold = 0.8 // 80% threshold

    // Map compliance reasons to quality issues
    const issues = reasons.map((reason: string) => {
      let category: 'structure' | 'characters' | 'dialogue' | 'formatting' | 'content' = 'formatting'
      let severity: 'critical' | 'major' | 'minor' = 'major'

      if (reason.includes('scene headings')) category = 'structure'
      else if (reason.includes('character') || reason.includes('dialogue')) category = 'characters'
      else if (reason.includes('margins') || reason.includes('formatting')) category = 'formatting'

      if (reason.includes('No scene headings') || reason.includes('Missing character cues')) {
        severity = 'critical'
      }

      return {
        category,
        severity,
        issue: reason,
        impact: `This affects the AI's ability to analyze your screenplay structure and content.`
      }
    })

    // Generate some basic strengths and recommendations
    const strengths: string[] = []
    const recommendations: string[] = []

    if (compliance.metrics?.sceneHeadings > 0) {
      strengths.push('Document contains scene headings')
    }
    if (compliance.metrics?.characterCues > 0) {
      strengths.push('Character names are present')
    }
    if (compliance.metrics?.dialogueLines > 0) {
      strengths.push('Dialogue content detected')
    }

    recommendations.push('Ensure proper screenplay formatting with scene headings (INT./EXT.)')
    recommendations.push('Include character names in ALL CAPS before dialogue')
    recommendations.push('Follow standard screenplay structure and formatting')

    return {
      overallScore: score,
      passesThreshold: score >= threshold,
      threshold,
      issues,
      strengths,
      recommendations
    }
  }

  // Validate file quality using the validation endpoint
  const validateFileQuality = async (file: File) => {
    console.log('Starting file validation:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })
    setValidating(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/validate', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        // API-level error (format issues, etc.)
        const errorMessage = result.error || `Server error (${response.status}): Failed to validate file`
        showValidationErrors([{
          fileName: file.name,
          error: errorMessage,
          fileSize: file.size,
          fileExtension: '.' + file.name.split('.').pop()?.toLowerCase()
        }])
        return false
      }

      if (result.blocked) {
        // Quality compliance issue - convert and show quality check results
        const qualityAssessment = convertComplianceToQualityAssessment(result.compliance)
        setQualityAssessment(qualityAssessment)
        setValidatedFile(file)
        setQualityCheckOpen(true)
        return false
      }

      // File passed all validations
      return true
    } catch (error) {
      console.error('Quality validation error:', error)
      showValidationErrors([{
        fileName: file.name,
        error: 'Failed to validate file quality. Please try again.',
        fileSize: file.size
      }])
      return false
    } finally {
      setValidating(false)
    }
  }

  // Handle drag events
  const handleDrag = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  // Handle drop with quality validation
  const handleDrop = React.useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files)

      // Only handle single file for now (first file)
      const file = droppedFiles[0]

      // Step 1: Basic validation (format + size)
      const basicValidation = validateFile(file)
      if (!basicValidation.valid) {
        showValidationErrors([{
          fileName: file.name,
          error: basicValidation.error,
          fileSize: file.size,
          fileExtension: basicValidation.fileExtension
        }])
        return
      }

      // Step 2: Quality validation (parsing + compliance)
      const qualityValid = await validateFileQuality(file)
      if (qualityValid) {
        setFiles([file])
      }
    }
  }, [])

  // Handle file input change with quality validation
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Only handle single file for now (first file)
      const file = e.target.files[0]

      // Step 1: Basic validation (format + size)
      const basicValidation = validateFile(file)
      if (!basicValidation.valid) {
        showValidationErrors([{
          fileName: file.name,
          error: basicValidation.error,
          fileSize: file.size,
          fileExtension: basicValidation.fileExtension
        }])
        return
      }

      // Step 2: Quality validation (parsing + compliance)
      const qualityValid = await validateFileQuality(file)
      if (qualityValid) {
        setFiles([file])
      }
    }
  }

  const extractErrorMessage = (text: string, fallback: string) => {
    if (!text) {
      return fallback
    }

    const titleMatch = text.match(/<title>([^<]+)<\/title>/i)
    if (titleMatch?.[1]) {
      return titleMatch[1].trim()
    }

    const plain = text
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (plain) {
      return plain.length > 200 ? `${plain.slice(0, 200)}...` : plain
    }

    return fallback
  }

  // Real upload function with comprehensive progress tracking
  const handleUpload = async () => {
    if (files.length === 0) return

    if (!selectedProject) {
      toast({
        variant: "destructive",
        title: "Project Required",
        description: "Please select a project or create a new one before uploading."
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setCurrentStage('Uploading screenplay...')

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Stage 1: File Upload (0-25%)
        setUploadProgress(0)
        setCurrentStage(`Uploading "${file.name}"...`)

        // Create form data
        const formData = new FormData()
        formData.append('file', file)
        if (selectedProject) {
          formData.append('projectId', selectedProject)
        }

        // Simulate upload progress tracking
        const uploadPromise = fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        // Simulate upload progress for visual feedback
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev < 25) {
              return Math.min(prev + 2, 25)
            }
            return prev
          })
        }, 100)

        const response = await uploadPromise
        clearInterval(progressInterval)

        // Stage 2: Script Parsing (25-50%)
        setUploadProgress(25)
        setCurrentStage('Parsing screenplay format...')

        // Simulate parsing progress
        await new Promise(resolve => {
          let progress = 25
          const parseInterval = setInterval(() => {
            progress += 5
            setUploadProgress(Math.min(progress, 50))
            if (progress >= 50) {
              clearInterval(parseInterval)
              resolve(undefined)
            }
          }, 200)
        })

        const contentType = response.headers.get('content-type') || ''
        let result: UploadResponsePayload | null = null
        let rawText = ''

        if (contentType.includes('application/json')) {
          result = await response.json()
        } else {
          rawText = await response.text()
          result = { error: extractErrorMessage(rawText, 'Unexpected server response') }
        }

        if (!response.ok) {
          const fallbackMessage = `Request failed with status ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`.trim()
          throw new Error(result?.error || extractErrorMessage(rawText, fallbackMessage))
        }

        // Stage 3: Saving to Database (50-75%)
        setUploadProgress(50)
        setCurrentStage('Saving to database...')

        // Simulate save progress
        await new Promise(resolve => {
          let progress = 50
          const saveInterval = setInterval(() => {
            progress += 5
            setUploadProgress(Math.min(progress, 75))
            if (progress >= 75) {
              clearInterval(saveInterval)
              resolve(undefined)
            }
          }, 150)
        })

        // Stage 4: Finalizing (75-100%)
        setUploadProgress(75)
        setCurrentStage('Preparing analysis dashboard...')

        if (!result?.data) {
          throw new Error('Upload succeeded but response payload was empty')
        }

        const {
          script: savedScript,
          parsed: parsedScript
        } = result.data

        // Complete progress
        setUploadProgress(100)
        setCurrentStage('Complete! Redirecting to analysis...')

        // Brief pause to show completion
        await new Promise(resolve => setTimeout(resolve, 1000))

        toast({
          variant: "default",
          title: "🎬 Upload Complete!",
          description: `${parsedScript.title || savedScript.title || 'Unknown'} successfully uploaded with ${parsedScript.scenes.length} scenes and ${parsedScript.characters.length} characters. Redirecting to analysis dashboard...`
        })

        router.push(`/analysis/${savedScript.id}`)
      }

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setUploading(false)
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const getFileIcon = () => {
    return <FileText className="h-8 w-8 text-brand" />
  }

  const getFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return bytes + ' B'
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB'
    } else {
      return (bytes / 1024 / 1024).toFixed(1) + ' MB'
    }
  }

  const getFileType = (fileName: string, mimeType: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()

    switch (extension) {
      case 'fdx':
        return 'Final Draft Script'
      case 'fountain':
        return 'Fountain Script'
      case 'pdf':
        return 'PDF Document'
      default:
        return mimeType || 'Unknown type'
    }
  }

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        router.push('/')
      } else {
        console.error('Sign out failed:', await response.text())
        router.push('/')
      }
    } catch (error) {
      console.error('Sign out error:', error)
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
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to auth
  }

  // Create proper display name and initials
  const fullName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.name || user.email
  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || user.email[0].toUpperCase()

  return (
    <AppShell
      footer={
        <AppFooter>
          <div className="flex items-center space-x-6">
            <span>© 2024 ScriptyBoy. All rights reserved.</span>
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
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
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
              <p className="text-sm font-medium leading-none">{fullName}</p>
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
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Upload Your Screenplay</h1>
            <p className="text-muted-foreground">
              Upload your script to get professional AI-powered analysis and feedback
            </p>
          </div>

          {/* Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Project</CardTitle>
              <CardDescription>
                Choose an existing project or create a new one for this screenplay
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showNewProjectForm ? (
                <div className="space-y-4">
                  {preSelectedProject && (
                    <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-brand-800">
                        <Folder className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Adding script to: {preSelectedProject.name}
                        </span>
                      </div>
                      <p className="text-xs text-brand-600 mt-1">
                        This project was automatically selected from your dashboard
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="project-select">Choose Project</Label>
                    {projectsLoading ? (
                      <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/50">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
                        <span className="text-sm text-muted-foreground">Loading projects...</span>
                      </div>
                    ) : projectsError ? (
                      <div className="p-3 border rounded-md bg-danger-50 border-danger-200">
                        <div className="flex items-center space-x-2 text-danger-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">{projectsError}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchProjects}
                          className="mt-2"
                        >
                          Try Again
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                projects.length === 0
                                  ? "No projects yet - Create your first project"
                                  : "Select a project..."
                              }
                            />
                          </SelectTrigger>
                        <SelectContent>
                          {projects.length === 0 ? (
                            <div className="p-3 text-center text-muted-foreground">
                              <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No projects yet</p>
                              <p className="text-xs">Create your first project to get started</p>
                            </div>
                          ) : (
                            projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                <div className="flex items-center space-x-2">
                                  <Folder className="h-4 w-4" />
                                  <span>{project.name}</span>
                                  <span className="text-sm text-muted-foreground">({project.type})</span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                        </Select>
                        {selectedProject && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProject('')}
                            className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                            title="Clear selection"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewProjectForm(true)}
                      className="w-full"
                      disabled={selectedProject !== ''}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Project
                    </Button>
                    {selectedProject !== '' && (
                      <p className="text-xs text-muted-foreground text-center">
                        Disabled: A project is already selected. Clear selection to create new project.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-name">Project Name</Label>
                      <Input
                        id="project-name"
                        value={projectForm.name}
                        onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                        placeholder="Enter project name..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project-type">Project Type</Label>
                      <Select value={projectForm.type} onValueChange={(value) => setProjectForm({...projectForm, type: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SHORT_FILM">Short Film</SelectItem>
                          <SelectItem value="FEATURE_INDEPENDENT">Feature Film - Independent</SelectItem>
                          <SelectItem value="FEATURE_MAINSTREAM">Feature Film - Mainstream</SelectItem>
                          <SelectItem value="WEB_SERIES">Web Series/OTT Platform</SelectItem>
                          <SelectItem value="TV_SERIES">TV Series</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-genres">Genres</Label>
                      <MultiSelect
                        options={GENRE_OPTIONS}
                        selected={projectForm.genres}
                        onChange={(genres) => setProjectForm({...projectForm, genres})}
                        placeholder="Select genres..."
                        disabled={creatingProject}
                      />
                      <p className="text-xs text-muted-foreground">
                        Select the primary genres for your project. This helps with audience targeting and analysis.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="project-budget">Target Budget</Label>
                        <Select value={projectForm.targetBudget} onValueChange={(value) => setProjectForm({...projectForm, targetBudget: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MICRO">Micro (Under $500K)</SelectItem>
                            <SelectItem value="LOW">Low ($500K - $2M)</SelectItem>
                            <SelectItem value="MEDIUM">Medium ($2M - $20M)</SelectItem>
                            <SelectItem value="HIGH">High ($20M+)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="project-audience">Target Audience</Label>
                        <Select
                          value={projectForm.targetAudience}
                          onValueChange={(value) => setProjectForm({...projectForm, targetAudience: value})}
                          disabled={creatingProject}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select target audience..." />
                          </SelectTrigger>
                          <SelectContent>
                            {TARGET_AUDIENCE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project-stage">Development Stage</Label>
                    <Select
                      value={projectForm.developmentStage}
                      onValueChange={(value) => setProjectForm({...projectForm, developmentStage: value})}
                      disabled={creatingProject}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIRST_DRAFT">First Draft</SelectItem>
                        <SelectItem value="REVISION">Revision</SelectItem>
                        <SelectItem value="POLISH">Polish</SelectItem>
                        <SelectItem value="PRODUCTION_READY">Production Ready</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project-description">Description (Optional)</Label>
                    <Textarea
                      id="project-description"
                      value={projectForm.description}
                      onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                      placeholder="Brief description of your project..."
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleCreateProject}
                      disabled={!projectForm.name.trim() || !projectForm.type || creatingProject}
                    >
                      {creatingProject ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Creating...
                        </>
                      ) : (
                        'Create Project'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewProjectForm(false)}
                      disabled={creatingProject}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Select Your Script File</CardTitle>
              <CardDescription>
                Supports Final Draft (.fdx), Fountain (.fountain), Plain Text (.txt), and PDF files up to 10MB
              </CardDescription>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    dragActive
                      ? "border-brand bg-brand/5"
                      : "border-muted-foreground/25 hover:border-brand/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Drag and drop your script here
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    or click to browse your files
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".fdx,.fountain,.pdf,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    variant="brand"
                    className="cursor-pointer"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={!selectedProject && projects.length >= 0}
                  >
                    Choose Files
                  </Button>
                  {!selectedProject && projects.length >= 0 && (
                    <p className="text-sm text-muted-foreground mt-3 text-center">
                      Please select or create a project before uploading files
                    </p>
                  )}

                  <div className="mt-6 text-sm text-muted-foreground">
                    <p>✓ Final Draft (.fdx) - Best for analysis</p>
                    <p>✓ Fountain (.fountain) - Plain text format</p>
                    <p>✓ Plain Text (.txt) - Screenplay format</p>
                    <p>✓ PDF - Will be processed with OCR</p>
                    <p>✓ Maximum file size: 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File List */}
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getFileIcon()}
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {getFileSize(file.size)} • {getFileType(file.name, file.type)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-success-500" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Upload Progress */}
                  {uploading && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{currentStage}</span>
                        <span className="font-mono text-brand">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className="gradient-brand h-3 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className={uploadProgress >= 25 ? 'text-brand font-medium' : ''}>Upload</span>
                        <span className={uploadProgress >= 50 ? 'text-brand font-medium' : ''}>Parse</span>
                        <span className={uploadProgress >= 75 ? 'text-brand font-medium' : ''}>Save</span>
                        <span className={uploadProgress >= 100 ? 'text-brand font-medium' : ''}>Complete</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setFiles([])}
                      disabled={uploading}
                    >
                      Clear All
                    </Button>
                    <Button
                      variant="brand"
                      onClick={handleUpload}
                      disabled={uploading || files.length === 0}
                    >
{uploading ? 'Processing...' : 'Parse & Extract Metadata'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy Reminder */}
          <Card className="border-muted">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-brand-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">Privacy Protection</p>
                  <p className="text-sm text-muted-foreground">
                    Your scripts are never used for AI training. All uploads are processed securely
                    and automatically deleted according to your retention settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* File Validation Dialog */}
        <FileValidationDialog
          open={validationDialogOpen}
          onOpenChange={setValidationDialogOpen}
          errors={validationErrors}
          onTryAgain={() => {
            // Clear current files and reset file input
            setFiles([])
            const fileInput = document.getElementById('file-upload') as HTMLInputElement
            if (fileInput) {
              fileInput.value = ''
              fileInput.click()
            }
          }}
        />

        {/* Quality Check Results Dialog */}
        {qualityCheckOpen && qualityAssessment && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
            <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg max-h-[90vh] overflow-y-auto">
              <QualityCheckResults
                qualityAssessment={qualityAssessment}
                onNewUpload={() => {
                  setQualityCheckOpen(false)
                  setQualityAssessment(null)
                  setValidatedFile(null)
                  setFiles([])
                  const fileInput = document.getElementById('file-upload') as HTMLInputElement
                  if (fileInput) {
                    fileInput.value = ''
                    fileInput.click()
                  }
                }}
                showProceedOption={false}
              />
            </div>
          </div>
        )}
      </AppContent>
    </AppShell>
  )
}