import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "ScriptyBoy - AI-Powered Screenplay Analysis",
  description: "Professional screenplay coverage and analysis powered by AI. Upload your script and receive detailed feedback in minutes.",
  keywords: ["screenplay", "analysis", "AI", "coverage", "script", "writing"],
  authors: [{ name: "ScriptyBoy" }],
  creator: "ScriptyBoy",
  publisher: "ScriptyBoy",
  robots: "index, follow",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.className
      )}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}