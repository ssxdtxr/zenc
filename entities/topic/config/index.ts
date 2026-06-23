import type { OverallLevel, SubtopicStatus } from "../model/types"

export type StatusMeta = {
  label: string
  color: string
  bg: string
  dot: string
  border: string
}

export const SUBTOPIC_STATUS_CONFIG: Record<SubtopicStatus, StatusMeta> = {
  needs_work: { label: "Нужно подтянуть", color: "#f87171", bg: "rgba(220,38,38,0.12)",  dot: "#f87171", border: "rgba(220,38,38,0.25)" },
  learning:   { label: "В процессе",      color: "#fbbf24", bg: "rgba(251,191,36,0.12)", dot: "#fbbf24", border: "rgba(251,191,36,0.25)" },
  good:       { label: "Хорошо",          color: "#4ade80", bg: "rgba(74,222,128,0.12)", dot: "#4ade80", border: "rgba(74,222,128,0.25)" },
  expert:     { label: "Экспертно",       color: "#a78bfa", bg: "rgba(155,107,255,0.15)", dot: "#a78bfa", border: "rgba(155,107,255,0.3)" },
}

export type LevelMeta = { label: string; color: string; bg: string; border: string }

export const OVERALL_LEVEL_CONFIG: Record<OverallLevel, LevelMeta> = {
  beginner:     { label: "Новичок",      color: "rgba(255,255,255,0.6)",  bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.18)" },
  intermediate: { label: "Средний",      color: "#fbbf24", bg: "rgba(251,191,36,0.15)", border: "rgba(251,191,36,0.3)"  },
  advanced:     { label: "Продвинутый",  color: "#4ade80", bg: "rgba(74,222,128,0.15)", border: "rgba(74,222,128,0.3)"  },
  expert:       { label: "Эксперт",      color: "#a78bfa", bg: "rgba(155,107,255,0.18)", border: "rgba(155,107,255,0.35)" },
}
