'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle, FileText, Trash2, Users } from 'lucide-react'

interface Project {
  id: string
  name: string
  scripts: Array<{
    id: string
    title: string | null
    originalFilename: string
  }>
  _count: {
    scripts: number
  }
}

interface DeleteProjectDialogProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (projectId: string, scriptAction: 'delete' | 'unassign') => Promise<void>
  isDeleting?: boolean
}

export function DeleteProjectDialog({
  project,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false
}: DeleteProjectDialogProps) {
  const [confirmationText, setConfirmationText] = React.useState('')
  const [scriptAction, setScriptAction] = React.useState<'delete' | 'unassign'>('delete')
  const [acknowledged, setAcknowledged] = React.useState(false)

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setConfirmationText('')
      setScriptAction('delete')
      setAcknowledged(false)
    }
  }, [isOpen])

  if (!project) return null

  const isConfirmationValid = confirmationText === project.name && acknowledged
  const hasScripts = project._count.scripts > 0

  const handleConfirm = async () => {
    if (!isConfirmationValid) return

    try {
      await onConfirm(project.id, scriptAction)
      onClose()
    } catch (error) {
      console.error('Delete project error:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <DialogTitle className="text-red-600">Delete Project</DialogTitle>
          </div>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the project and affect associated content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Info */}
          <div className="p-4 bg-muted/50 rounded-lg border">
            <h4 className="font-semibold mb-2 flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Project: {project.name}</span>
            </h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center space-x-2">
                <FileText className="h-3 w-3" />
                <span>{project._count.scripts} {project._count.scripts === 1 ? 'script' : 'scripts'}</span>
              </div>
            </div>
          </div>

          {/* Scripts List (if any) */}
          {hasScripts && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Scripts that will be affected:</h4>
              <div className="max-h-32 overflow-y-auto space-y-2 p-3 bg-muted/30 rounded border">
                {project.scripts.map((script) => (
                  <div key={script.id} className="flex items-center space-x-2 text-sm">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span>{script.title || script.originalFilename}</span>
                  </div>
                ))}
              </div>

              {/* Script Action Selection */}
              <div className="space-y-3 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <Label className="text-sm font-medium">What should happen to the scripts?</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="delete-scripts"
                      name="scriptAction"
                      value="delete"
                      checked={scriptAction === 'delete'}
                      onChange={(e) => setScriptAction(e.target.value as 'delete')}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="delete-scripts" className="text-sm flex items-center space-x-2">
                      <Trash2 className="h-3 w-3 text-red-600" />
                      <span>Delete all scripts permanently</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="unassign-scripts"
                      name="scriptAction"
                      value="unassign"
                      checked={scriptAction === 'unassign'}
                      onChange={(e) => setScriptAction(e.target.value as 'unassign')}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="unassign-scripts" className="text-sm flex items-center space-x-2">
                      <FileText className="h-3 w-3 text-blue-600" />
                      <span>Keep scripts as unassigned</span>
                    </Label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {scriptAction === 'delete'
                    ? 'Scripts and all their analyses will be permanently deleted.'
                    : 'Scripts will be moved to the "Unassigned" section and can be reassigned later.'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirm-name" className="text-sm font-medium">
              Type <span className="font-mono bg-muted px-1 rounded">{project.name}</span> to confirm:
            </Label>
            <Input
              id="confirm-name"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={`Type "${project.name}" here`}
              disabled={isDeleting}
            />
          </div>

          {/* Final Acknowledgment */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="acknowledge"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
              disabled={isDeleting}
            />
            <Label htmlFor="acknowledge" className="text-sm leading-5">
              I understand this action is permanent and cannot be undone.
              {hasScripts && scriptAction === 'delete' && (
                <span className="text-red-600 font-medium">
                  {' '}All scripts and analyses will be permanently deleted.
                </span>
              )}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}