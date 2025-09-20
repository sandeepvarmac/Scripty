"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AppShellProps {
  sidebar?: React.ReactNode
  rightDrawer?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function AppShell({ sidebar, rightDrawer, footer, children, className }: AppShellProps) {
  return (
    <div className={cn("flex h-screen overflow-hidden", className)}>
      {/* Sidebar */}
      {sidebar && (
        <aside className="hidden md:flex w-64 flex-col border-r bg-background">
          {sidebar}
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {footer}
          </footer>
        )}
      </main>

      {/* Right Drawer */}
      {rightDrawer && (
        <aside className="hidden lg:flex w-80 flex-col border-l bg-background">
          {rightDrawer}
        </aside>
      )}
    </div>
  )
}

interface AppHeaderProps {
  children: React.ReactNode
  className?: string
}

export function AppHeader({ children, className }: AppHeaderProps) {
  return (
    <header className={cn(
      "flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      {children}
    </header>
  )
}

interface AppContentProps {
  children: React.ReactNode
  className?: string
}

export function AppContent({ children, className }: AppContentProps) {
  return (
    <div className={cn("flex-1 overflow-auto p-4 pb-6", className)}>
      {children}
    </div>
  )
}

interface AppFooterProps {
  children: React.ReactNode
  className?: string
}

export function AppFooter({ children, className }: AppFooterProps) {
  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-3 text-sm text-muted-foreground",
      className
    )}>
      {children}
    </div>
  )
}