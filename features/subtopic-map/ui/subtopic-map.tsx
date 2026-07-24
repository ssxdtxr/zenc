"use client"

import { useMemo } from "react"
import { SUBTOPIC_STATUS_CONFIG } from "@/entities/topic/config"
import type { Subtopic } from "@/entities/topic/model/types"

type Props = {
  subtopics: Subtopic[]
  onSelect: (name: string) => void
}

type Ordered = {
  subtopic: Subtopic
  order: number
  locked: boolean
  blockedBy: string[]
}

// Chronological order: a subtopic's level = 1 + the deepest level among its
// prerequisites (0 if it has none), then sort by level so foundational
// subtopics lead and what depends on them follows. Cycle-safe and tolerant
// of prerequisite names that don't match any known subtopic — those are
// silently ignored rather than breaking the ordering.
function chronological(subtopics: Subtopic[]): Ordered[] {
  const byName = new Map(subtopics.map(s => [s.name, s]))
  const levelCache = new Map<string, number>()
  const visiting = new Set<string>()

  function levelOf(name: string): number {
    if (levelCache.has(name)) return levelCache.get(name)!
    if (visiting.has(name)) return 0
    const s = byName.get(name)
    const validPrereqs = (s?.prerequisites ?? []).filter(p => p !== name && byName.has(p))
    if (validPrereqs.length === 0) { levelCache.set(name, 0); return 0 }
    visiting.add(name)
    const level = 1 + Math.max(...validPrereqs.map(levelOf))
    visiting.delete(name)
    levelCache.set(name, level)
    return level
  }

  return subtopics
    .map((s, i) => ({ s, i, level: levelOf(s.name) }))
    .sort((a, b) => a.level - b.level || a.i - b.i)
    .map(({ s }, orderIdx) => {
      const blockedBy = (s.prerequisites ?? []).filter(p => byName.get(p)?.status === "needs_work")
      return { subtopic: s, order: orderIdx + 1, locked: blockedBy.length > 0, blockedBy }
    })
}

export const SubtopicMap = ({ subtopics, onSelect }: Props) => {
  const ordered = useMemo(() => chronological(subtopics), [subtopics])
  const now = Date.now()

  if (!subtopics.length) return null

  return (
    <div>
      <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--text-3)", fontWeight: 500 }}>
        Порядок карточек — рекомендуемая последовательность изучения, от основ к сложному
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {ordered.map(({ subtopic: s, order, locked, blockedBy }) => {
          const cfg = SUBTOPIC_STATUS_CONFIG[s.status]
          const isDue = s.nextReviewAt && new Date(s.nextReviewAt).getTime() <= now
          return (
            <button
              key={s.name}
              onClick={() => onSelect(s.name)}
              title={locked ? `${s.name} — сначала пройди: ${blockedBy.join(", ")}` : s.name}
              style={{
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "inherit",
                background: "var(--surface)",
                border: `1.5px solid ${cfg.border}`,
                opacity: locked ? 0.6 : 1,
                borderRadius: 16,
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minHeight: 128,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span
                  className="font-display"
                  style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 7, background: "var(--surface-hover)", color: "var(--text-2)", fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {order}
                </span>
                <span className="font-display" style={{ fontWeight: 700, fontSize: 16.5, lineHeight: 1.3, color: "var(--text)" }}>
                  {s.name}
                </span>
              </div>
              {s.recommendation && (
                <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-2)", flex: 1 }}>
                  {s.recommendation}
                </span>
              )}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: cfg.color, marginTop: "auto" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
                {locked ? `🔒 сначала: ${blockedBy.join(", ")}` : isDue ? "пора повторить" : cfg.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
