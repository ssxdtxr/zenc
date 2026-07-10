"use client"

import { AnimatePresence, motion } from "framer-motion"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { pageTransition } from "@/shared/lib/motion"

export const PageTransition = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={pathname} {...pageTransition}>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
