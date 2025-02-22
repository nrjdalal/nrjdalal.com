"use client"

import { Button } from "@/components/ui/button"
import { RiContrast2Fill, RiMoonFill, RiSunFill } from "@remixicon/react"
import { useTheme } from "next-themes"
import React, { useState } from "react"

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  const [system, setSystem] = useState(false)

  const smartToggle = () => {
    if (theme === "system") {
      const prefersDarkScheme = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches
      setTheme(prefersDarkScheme ? "light" : "dark")
      setSystem(false)
    } else {
      setTheme("system")
      setSystem(true)
    }
  }

  return (
    <Button
      variant="ghost"
      className="aspect-square size-full rounded-none [&_svg]:size-5"
      onClick={smartToggle}
      aria-label="Switch between system/light/dark version"
    >
      {system ? (
        <RiContrast2Fill aria-hidden="true" />
      ) : (
        <>
          <RiSunFill className="dark:hidden" aria-hidden="true" />
          <RiMoonFill className="hidden dark:block" aria-hidden="true" />
        </>
      )}
    </Button>
  )
}
