import type { Transition, Variants } from "framer-motion"

export const springSnappy: Transition = { type: "spring", stiffness: 420, damping: 32 }
export const springSoft: Transition = { type: "spring", stiffness: 220, damping: 26 }

// Shared press/hover feedback tiers — one scale per weight class so every
// clickable element in the app compresses/lifts by the same amount as its peers.
export const TAP_SM = { scale: 0.93 }   // compact controls: icon buttons, filter chips, pills
export const TAP_MD = { scale: 0.97 }   // standard buttons and CTAs
export const TAP_LG = { scale: 0.985 }  // large rows, list items, answer/choice options
export const HOVER_MD = { scale: 1.02 } // standard button hover

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: springSoft },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: springSnappy },
}

export const staggerContainer = (staggerChildren = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
})

export const pageTransition: {
  initial: { opacity: number; y: number }
  animate: { opacity: number; y: number }
  exit: { opacity: number; y: number }
  transition: Transition
} = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] },
}
