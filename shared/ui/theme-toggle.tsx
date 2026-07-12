"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { SunIcon, MoonIcon } from "@/shared/ui/icons"
import { DEFAULT_THEME, THEME_STORAGE_KEY, type Theme } from "@/shared/lib/theme"

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME)

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme")
    if (current === "light" || current === "dark") setTheme(current)
  }, [])

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light"
    setTheme(next)
    document.documentElement.setAttribute("data-theme", next)
    try { localStorage.setItem(THEME_STORAGE_KEY, next) } catch {}
  }

  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={toggle}
      aria-label={theme === "light" ? "Включить тёмную тему" : "Включить светлую тему"}
      title={theme === "light" ? "Тёмная тема" : "Светлая тема"}
      style={{
        width: 40, height: 40, flexShrink: 0, borderRadius: 12,
        border: "1px solid var(--border)", background: "var(--surface-2)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {theme === "light" ? <MoonIcon size={17} color="var(--text-2)" /> : <SunIcon size={17} color="var(--text-2)" />}
    </motion.button>
  )
}
