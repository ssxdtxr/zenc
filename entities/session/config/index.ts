import type { Difficulty } from "../model/types"

export type DifficultyMeta = {
  label: string
  color: string
  bg: string
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyMeta> = {
  basic: { label: "Базовый", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  intermediate: { label: "Средний", color: "text-amber-400", bg: "bg-amber-400/10" },
  advanced: { label: "Продвинутый", color: "text-red-400", bg: "bg-red-400/10" },
}

export const EXAMPLE_TOPICS = [
  "История России",
  "DevOps-собеседование",
  "Алгоритмы и структуры данных",
  "Философия Ницше",
  "Машинное обучение",
  "Экономика",
] as const
