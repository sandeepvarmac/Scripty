import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showWordmark?: boolean
  className?: string
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12"
}

export function ScriptyBoyLogo({ size = "md", showWordmark = false, className }: LogoProps) {
  if (showWordmark) {
    return (
      <div className={cn("flex items-center space-x-3", className)}>
        <div className={cn(sizeClasses[size], "relative")}>
          <Image
            src="/logo.png"
            alt="ScriptyBoy"
            fill
            className="object-contain"
          />
        </div>
        <div className="relative h-6 w-24">
          <Image
            src="/wordmark.png"
            alt="ScriptyBoy"
            fill
            className="object-contain"
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn(sizeClasses[size], "relative", className)}>
      <Image
        src="/logo.png"
        alt="ScriptyBoy"
        fill
        className="object-contain"
      />
    </div>
  )
}

// Text-only logo with gradient for fallback
export function ScriptyBoyTextLogo({ className }: { className?: string }) {
  return (
    <span className={cn("font-bold text-xl text-gradient-brand", className)}>
      ScriptyBoy
    </span>
  )
}