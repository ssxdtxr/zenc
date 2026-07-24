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
  locked: boolean
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
    .map(({ s }) => ({
      subtopic: s,
      locked: (s.prerequisites ?? []).some(p => byName.get(p)?.status === "needs_work"),
    }))
}

export const SubtopicMap = ({ subtopics, onSelect }: Props) => {
  const ordered = useMemo(() => chronological(subtopics), [subtopics])
  const now = Date.now()

  if (!subtopics.length) return null

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
      {ordered.map(({ subtopic: s, locked }) => {
        const cfg = SUBTOPIC_STATUS_CONFIG[s.status]
        const isDue = s.nextReviewAt && new Date(s.nextReviewAt).getTime() <= now
        return (
          <button
            key={s.name}
            onClick={() => onSelect(s.name)}
            title={locked ? `${s.name} — сначала подтянуть пререквизиты` : s.name}
            style={{
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "inherit",
              background: "var(--surface)",
              border: `1.5px solid ${cfg.border}`,
              opacity: locked ? 0.55 : 1,
              borderRadius: 16,
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minHeight: 128,
            }}
          >
            <span className="font-display" style={{ fontWeight: 700, fontSize: 16.5, lineHeight: 1.3, color: "var(--text)" }}>
              {s.name}
            </span>
            {s.recommendation && (
              <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-2)", flex: 1 }}>
                {s.recommendation}
              </span>
            )}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: cfg.color, marginTop: "auto" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
              {locked ? "🔒 заблокировано" : isDue ? "пора повторить" : cfg.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
