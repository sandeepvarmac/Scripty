"use client"

import * as React from "react"
import { AppShell, AppHeader, AppContent, AppFooter } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BrandHeader } from "@/components/ui/brand-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Upload, FileText, AlertCircle, CheckCircle, X, ArrowLeft, User, Settings, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserData {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
}

export default function UploadPage() {
  const router = useRouter()
  const [dragActive, setDragActive] = React.useState(false)
  const [files, setFiles] = React.useState<File[]>([])
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [user, setUser] = React.useState<UserData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetchUserData()
  }, [])

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

  // File validation
  const validateFile = (file: File) => {
    const allowedTypes = ['.fdx', '.fountain', '.pdf']
    const maxSize = 10 * 1024 * 1024 // 10MB
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedTypes.includes(extension)) {
      return { valid: false, error: `File type ${extension} not supported. Please upload .fdx, .fountain, or .pdf files.` }
    }

    if (file.size > maxSize) {
      return { valid: false, error: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds 10MB limit.` }
    }

    return { valid: true }
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

  // Handle drop
  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      const validFiles: File[] = []

      droppedFiles.forEach(file => {
        const validation = validateFile(file)
        if (validation.valid) {
          validFiles.push(file)
        } else {
          alert(validation.error)
        }
      })

      setFiles(validFiles)
    }
  }, [])

  // Handle file input change
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFiles = Array.from(e.target.files)
      const validFiles: File[] = []

      selectedFiles.forEach(file => {
        const validation = validateFile(file)
        if (validation.valid) {
          validFiles.push(file)
        } else {
          alert(validation.error)
        }
      })

      setFiles(validFiles)
    }
  }

  // Real upload function with parser integration
  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Update progress for current file
        setUploadProgress((i / files.length) * 100)

        // Create form data
        const formData = new FormData()
        formData.append('file', file)

        // Upload and parse the file
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Upload failed')
        }

        const {
          script: savedScript,
          parsed: parsedScript
        } = result.data

        alert(
          `Upload successful!\n\n` +
          `Title: ${parsedScript.title || savedScript.title || 'Unknown'}\n` +
          `Format: ${parsedScript.format.toUpperCase()}\n` +
          `Pages: ${parsedScript.pageCount}\n` +
          `Scenes: ${parsedScript.scenes.length}\n` +
          `Characters: ${parsedScript.characters.length}`
        )

        router.push(`/analysis/${savedScript.id}`)
      }

      setUploadProgress(100)

    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
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
    : user.email
  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.email[0].toUpperCase()

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
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
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
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-none">{fullName}</p>
              <p className="text-xs text-muted-foreground">Upload Script</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/user.png" alt={fullName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
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

          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Select Your Script File</CardTitle>
              <CardDescription>
                Supports Final Draft (.fdx), Fountain (.fountain), and PDF files up to 10MB
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
                    accept=".fdx,.fountain,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    variant="brand"
                    className="cursor-pointer"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Choose Files
                  </Button>

                  <div className="mt-6 text-sm text-muted-foreground">
                    <p>✓ Final Draft (.fdx) - Best for analysis</p>
                    <p>✓ Fountain (.fountain) - Plain text format</p>
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
                        <CheckCircle className="h-5 w-5 text-green-500" />
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
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="gradient-brand h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
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
                      {uploading ? 'Uploading...' : 'Start Analysis'}
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
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
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
      </AppContent>
    </AppShell>
  )
}