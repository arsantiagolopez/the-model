"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Monitor, Moon, Sun } from "lucide-react"

export function ThemeSwitch() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="flex h-8 w-8 cursor-pointer items-center justify-center">
        <Monitor className="h-4 w-4" />
        <span className="sr-only">System</span>
      </button>
    )
  }

  const mode = theme ?? "system"
  const nextMode = mode === "system" ? "light" : mode === "light" ? "dark" : "system"
  
  const modeLabel = {
    light: (
      <>
        <Sun className="h-4 w-4" />
        <span className="sr-only">Light</span>
      </>
    ),
    dark: (
      <>
        <Moon className="h-4 w-4" />
        <span className="sr-only">Dark</span>
      </>
    ),
    system: (
      <>
        <Monitor className="h-4 w-4" />
        <span className="sr-only">System</span>
      </>
    ),
  }

  return (
    <button
      onClick={() => setTheme(nextMode)}
      className="flex h-8 w-8 cursor-pointer items-center justify-center"
    >
      {modeLabel[mode as keyof typeof modeLabel]}
    </button>
  )
}