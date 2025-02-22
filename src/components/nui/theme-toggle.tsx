"use client"

import { RiContrast2Fill, RiMoonFill, RiSunFill } from "@remixicon/react"
import { useTheme } from "next-themes"
import { useId, useState } from "react"

export function ThemeToggle() {
  const id = useId()
  const { theme, setTheme } = useTheme()
  const [system, setSystem] = useState(false)

  const smartToggle = () => {
    /* The smart toggle by @nrjdalal */
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
    <>
      <input
        id={id}
        type="checkbox"
        name="theme-toggle"
        className="peer sr-only"
        checked={system}
        onChange={smartToggle}
        aria-label="Toggle dark mode"
      />
      <label
        htmlFor={id}
        className="hover:bg-border/50 hover:text-foreground text-foreground lg:text-muted-foreground flex aspect-square h-full cursor-pointer items-center justify-center border-t lg:border-0"
        aria-hidden="true"
      >
        {system ? (
          <RiContrast2Fill size={20} aria-hidden="true" />
        ) : (
          <>
            <RiSunFill className="dark:hidden" size={20} aria-hidden="true" />
            <RiMoonFill
              className="hidden dark:block"
              size={20}
              aria-hidden="true"
            />
          </>
        )}
        <span className="sr-only">Switch to light/dark version</span>
      </label>
    </>
  )
}
