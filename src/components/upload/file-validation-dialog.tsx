'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertTriangle,
  FileX,
  FileText,
  Upload,
  CheckCircle2,
  XCircle
} from 'lucide-react'

interface FileValidationError {
  fileName: string
  error: string
  fileSize?: number
  fileExtension?: string
}

interface FileValidationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  errors: FileValidationError[]
  onTryAgain?: () => void
  onClose?: () => void
}

const supportedFormats = [
  {
    extension: '.fountain',
    description: 'Fountain format (recommended)',
    icon: <FileText className="h-4 w-4 text-green-600" />,
    color: 'text-green-600'
  },
  {
    extension: '.fdx',
    description: 'Final Draft format',
    icon: <FileText className="h-4 w-4 text-blue-600" />,
    color: 'text-blue-600'
  },
  {
    extension: '.pdf',
    description: 'PDF screenplay',
    icon: <FileText className="h-4 w-4 text-purple-600" />,
    color: 'text-purple-600'
  },
  {
    extension: '.txt',
    description: 'Plain text screenplay',
    icon: <FileText className="h-4 w-4 text-gray-600" />,
    color: 'text-gray-600'
  }
]

export default function FileValidationDialog({
  open,
  onOpenChange,
  errors,
  onTryAgain,
  onClose
}: FileValidationDialogProps) {
  const handleClose = () => {
    onOpenChange(false)
    onClose?.()
  }

  const handleTryAgain = () => {
    onOpenChange(false)
    onTryAgain?.()
  }

  const getErrorIcon = (error: string) => {
    if (error.toLowerCase().includes('size') || error.toLowerCase().includes('mb')) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    }
    if (error.toLowerCase().includes('type') || error.toLowerCase().includes('format')) {
      return <FileX className="h-5 w-5 text-red-500" />
    }
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  const getErrorSeverity = (error: string) => {
    if (error.toLowerCase().includes('size')) {
      return 'warning'
    }
    return 'error'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileX className="h-5 w-5 text-red-500" />
            File Upload Issues
          </DialogTitle>
          <DialogDescription>
            {errors.length === 1
              ? 'There was an issue with your file upload:'
              : `There were issues with ${errors.length} file(s):`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-60 overflow-y-auto">
          {errors.map((fileError, index) => (
            <Alert
              key={index}
              variant={getErrorSeverity(fileError.error) === 'warning' ? 'default' : 'destructive'}
            >
              {getErrorIcon(fileError.error)}
              <AlertDescription>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">{fileError.fileName}</span>
                    {fileError.fileSize && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {formatFileSize(fileError.fileSize)}
                      </Badge>
                    )}
                    {fileError.fileExtension && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {fileError.fileExtension}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">{fileError.error}</p>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>

        {/* Supported Formats Guide */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Supported File Formats
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {supportedFormats.map((format, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                {format.icon}
                <div>
                  <div className="font-medium text-sm">{format.extension}</div>
                  <div className="text-xs text-muted-foreground">{format.description}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-semibold">File Requirements:</p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• Maximum file size: 10 MB</li>
                  <li>• Must be properly formatted screenplay</li>
                  <li>• Final Draft (.fdx) and Fountain (.fountain) formats work best</li>
                  <li>• PDF files are processed with OCR technology</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          {onTryAgain && (
            <Button onClick={handleTryAgain} className="ml-2">
              <Upload className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}