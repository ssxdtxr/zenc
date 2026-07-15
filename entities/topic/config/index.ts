import type { OverallLevel, SubtopicStatus } from "../model/types"

export type StatusMeta = {
  label: string
  color: string
  bg: string
  dot: string
  border: string
}

// macOS traffic-light palette: close (red) / minimize (yellow) / zoom (green).
// "expert" reuses the green hue at a deeper shade — mastery beyond "good", no fourth light needed.
export const SUBTOPIC_STATUS_CONFIG: Record<SubtopicStatus, StatusMeta> = {
  needs_work: { label: "Нужно подтянуть", color: "#ff5f57", bg: "rgba(255,95,87,0.14)",  dot: "#ff5f57", border: "rgba(255,95,87,0.32)" },
  learning:   { label: "В процессе",      color: "#ffbd2e", bg: "rgba(255,189,46,0.14)", dot: "#ffbd2e", border: "rgba(255,189,46,0.32)" },
  good:       { label: "Хорошо",          color: "#28c840", bg: "rgba(40,200,64,0.14)",  dot: "#28c840", border: "rgba(40,200,64,0.32)" },
  expert:     { label: "Экспертно",       color: "#149330", bg: "rgba(20,147,48,0.16)",  dot: "#149330", border: "rgba(20,147,48,0.35)" },
}

export type LevelMeta = { label: string; color: string; bg: string; border: string }

export const OVERALL_LEVEL_CONFIG: Record<OverallLevel, LevelMeta> = {
  beginner:     { label: "Новичок",      color: "rgba(255,255,255,0.6)",  bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.18)" },
  intermediate: { label: "Средний",      color: "#fbbf24", bg: "rgba(251,191,36,0.15)", border: "rgba(251,191,36,0.3)"  },
  advanced:     { label: "Продвинутый",  color: "#4ade80", bg: "rgba(74,222,128,0.15)", border: "rgba(74,222,128,0.3)"  },
  expert:       { label: "Эксперт",      color: "#a78bfa", bg: "rgba(155,107,255,0.18)", border: "rgba(155,107,255,0.35)" },
}
