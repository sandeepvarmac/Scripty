'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Folder, AlertCircle } from 'lucide-react'

interface ProjectFormData {
  name: string
  type: string
  genre: string
  description: string
  targetBudget: string
  targetAudience: string
  developmentStage: string
}

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onProjectCreated: (project: any) => void
  existingProjects: Array<{ name: string }>
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreated,
  existingProjects
}: CreateProjectModalProps) {
  const [formData, setFormData] = React.useState<ProjectFormData>({
    name: '',
    type: '',
    genre: '',
    description: '',
    targetBudget: 'LOW',
    targetAudience: 'General',
    developmentStage: 'FIRST_DRAFT'
  })
  const [isCreating, setIsCreating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        type: '',
        genre: '',
        description: '',
        targetBudget: 'LOW',
        targetAudience: 'General',
        developmentStage: 'FIRST_DRAFT'
      })
      setError(null)
    }
  }, [isOpen])

  const updateFormData = (updates: Partial<ProjectFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setError(null) // Clear error when user makes changes
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Project name is required')
      return false
    }
    if (!formData.type) {
      setError('Project type is required')
      return false
    }

    // Check for duplicate project names
    const duplicateProject = existingProjects.find(p =>
      p.name.toLowerCase().trim() === formData.name.toLowerCase().trim()
    )
    if (duplicateProject) {
      setError(`A project named "${formData.name}" already exists. Please choose a different name.`)
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        onProjectCreated(data.project)
        onClose()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to create project')
      }
    } catch (err) {
      console.error('Error creating project:', err)
      setError('Failed to create project. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const isFormValid = formData.name.trim() && formData.type

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Folder className="h-5 w-5 text-brand" />
            <DialogTitle>Create New Project</DialogTitle>
          </div>
          <DialogDescription>
            Set up a new project to organize your screenplays and track your progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modal-project-name">Project Name *</Label>
              <Input
                id="modal-project-name"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="Enter project name..."
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-project-type">Project Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => updateFormData({ type: value })}
                disabled={isCreating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SHORT_FILM">Short Film</SelectItem>
                  <SelectItem value="FEATURE_INDEPENDENT">Feature (Independent)</SelectItem>
                  <SelectItem value="FEATURE_MAINSTREAM">Feature (Mainstream)</SelectItem>
                  <SelectItem value="WEB_SERIES">Web Series</SelectItem>
                  <SelectItem value="TV_SERIES">TV Series</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-project-genre">Genre</Label>
            <Input
              id="modal-project-genre"
              value={formData.genre}
              onChange={(e) => updateFormData({ genre: e.target.value })}
              placeholder="e.g., Drama, Comedy, Thriller..."
              disabled={isCreating}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modal-project-budget">Target Budget</Label>
              <Select
                value={formData.targetBudget}
                onValueChange={(value) => updateFormData({ targetBudget: value })}
                disabled={isCreating}
              >
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
              <Label htmlFor="modal-project-stage">Development Stage</Label>
              <Select
                value={formData.developmentStage}
                onValueChange={(value) => updateFormData({ developmentStage: value })}
                disabled={isCreating}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-project-audience">Target Audience</Label>
            <Input
              id="modal-project-audience"
              value={formData.targetAudience}
              onChange={(e) => updateFormData({ targetAudience: e.target.value })}
              placeholder="e.g., Young Adults, Family, General"
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-project-description">Description</Label>
            <Textarea
              id="modal-project-description"
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="Brief description of your project..."
              rows={3}
              disabled={isCreating}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isCreating}
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}