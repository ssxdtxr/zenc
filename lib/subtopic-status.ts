import type { SubtopicStatus } from "@/entities/topic/model/types"

export const STATUS_ORDER: SubtopicStatus[] = ["needs_work", "learning", "good", "expert"]

export function statusFromScore(score: number, total: number): SubtopicStatus {
  const ratio = total > 0 ? score / total : 0
  if (ratio >= 0.9) return "expert"
  if (ratio >= 0.7) return "good"
  if (ratio >= 0.4) return "learning"
  return "needs_work"
}

export function upgradeOnly(oldStatus: string | null | undefined, newStatus: SubtopicStatus): SubtopicStatus {
  const oldIdx = STATUS_ORDER.indexOf((oldStatus as SubtopicStatus) ?? "needs_work")
  const newIdx = STATUS_ORDER.indexOf(newStatus)
  return newIdx > oldIdx ? newStatus : ((oldStatus as SubtopicStatus) ?? newStatus)
}

export function nextReviewAt(status: string): Date {
  const days: Record<string, number> = { needs_work: 1, learning: 3, good: 7, expert: 21 }
  const d = new Date()
  d.setDate(d.getDate() + (days[status] ?? 3))
  return d
}
