import type { OverallLevel, SubtopicStatus } from "../model/types"

export type StatusMeta = {
  label: string
  color: string
  bg: string
  dot: string
  border: string
}

export const SUBTOPIC_STATUS_CONFIG: Record<SubtopicStatus, StatusMeta> = {
  needs_work: { label: "Нужно подтянуть", color: "#dc2626", bg: "#fef2f2", dot: "#f87171", border: "rgba(220,38,38,0.15)" },
  learning:   { label: "В процессе",      color: "#d97706", bg: "#fffbeb", dot: "#fbbf24", border: "rgba(217,119,6,0.15)"  },
  good:       { label: "Хорошо",          color: "#059669", bg: "#f0fdf4", dot: "#34d399", border: "rgba(5,150,105,0.15)"  },
  expert:     { label: "Экспертно",       color: "#7c3aed", bg: "#f5f3ff", dot: "#a78bfa", border: "rgba(124,58,237,0.15)" },
}

export type LevelMeta = { label: string; color: string; bg: string; border: string }

export const OVERALL_LEVEL_CONFIG: Record<OverallLevel, LevelMeta> = {
  beginner:     { label: "Новичок",      color: "#6b6485", bg: "#f5f3ff", border: "rgba(107,100,133,0.2)"  },
  intermediate: { label: "Средний",      color: "#d97706", bg: "#fffbeb", border: "rgba(217,119,6,0.2)"    },
  advanced:     { label: "Продвинутый",  color: "#059669", bg: "#f0fdf4", border: "rgba(5,150,105,0.2)"    },
  expert:       { label: "Эксперт",      color: "#7c3aed", bg: "#f5f3ff", border: "rgba(124,58,237,0.2)"   },
}
