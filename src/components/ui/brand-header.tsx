import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface BrandHeaderProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizes = {
  sm: {
    logo: "h-6 w-6",
    text: "text-lg font-bold"
  },
  md: {
    logo: "h-8 w-8",
    text: "text-xl font-bold"
  },
  lg: {
    logo: "h-12 w-12",
    text: "text-3xl font-bold"
  }
}

export function BrandHeader({ size = "md", className }: BrandHeaderProps) {
  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <div className={cn(sizes[size].logo, "relative")}>
        <Image
          src="/logo.png"
          alt="ScriptyBoy Logo"
          fill
          className="object-contain"
        />
      </div>
      <span className={cn(sizes[size].text, "text-gradient-brand")}>
        ScriptyBoy
      </span>
    </div>
  )
}