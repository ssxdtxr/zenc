"use client"

import { useMemo } from "react"
import { SUBTOPIC_STATUS_CONFIG } from "@/entities/topic/config"
import type { Subtopic } from "@/entities/topic/model/types"

type Props = {
  subtopics: Subtopic[]
  onSelect: (name: string) => void
}

const NODE_W = 180
const NODE_H = 78
const COL_GAP = 18
const ROW_GAP = 50
const PAD = 20

type LaidOutNode = {
  subtopic: Subtopic
  x: number
  y: number
  locked: boolean
}

type Layout = { nodes: LaidOutNode[]; width: number; height: number }

// Layered DAG layout: each node's row = 1 + the deepest row among its
// prerequisites, so foundational subtopics sit above what depends on them.
// Cycle-safe (a prerequisite loop just stops contributing extra depth) and
// tolerant of prerequisite names that don't match any known subtopic —
// those are silently ignored rather than crashing the layout.
function layout(subtopics: Subtopic[]): Layout {
  const byName = new Map(subtopics.map(s => [s.name, s]))
  const rowCache = new Map<string, number>()
  const visiting = new Set<string>()

  function rowOf(name: string): number {
    if (rowCache.has(name)) return rowCache.get(name)!
    if (visiting.has(name)) return 0
    const s = byName.get(name)
    const validPrereqs = (s?.prerequisites ?? []).filter(p => p !== name && byName.has(p))
    if (validPrereqs.length === 0) { rowCache.set(name, 0); return 0 }
    visiting.add(name)
    const row = 1 + Math.max(...validPrereqs.map(rowOf))
    visiting.delete(name)
    rowCache.set(name, row)
    return row
  }

  const rows = new Map<number, Subtopic[]>()
  for (const s of subtopics) {
    const r = rowOf(s.name)
    if (!rows.has(r)) rows.set(r, [])
    rows.get(r)!.push(s)
  }

  const sortedRows = Array.from(rows.keys()).sort((a, b) => a - b)
  const rowWidths = sortedRows.map(r => {
    const count = rows.get(r)!.length
    return count * NODE_W + (count - 1) * COL_GAP
  })
  const maxWidth = Math.max(...rowWidths, NODE_W)

  const nodes: LaidOutNode[] = []
  sortedRows.forEach((r, rowIdx) => {
    const rowSubs = rows.get(r)!
    const rowWidth = rowWidths[rowIdx]
    const startX = (maxWidth - rowWidth) / 2
    rowSubs.forEach((s, i) => {
      const locked = (s.prerequisites ?? []).some(p => byName.get(p)?.status === "needs_work")
      nodes.push({ subtopic: s, x: startX + i * (NODE_W + COL_GAP), y: rowIdx * (NODE_H + ROW_GAP), locked })
    })
  })

  return {
    nodes,
    width: maxWidth,
    height: sortedRows.length > 0 ? sortedRows.length * (NODE_H + ROW_GAP) - ROW_GAP : 0,
  }
}

export const SubtopicMap = ({ subtopics, onSelect }: Props) => {
  const { nodes, width, height } = useMemo(() => layout(subtopics), [subtopics])

  if (!subtopics.length) return null

  const posByName = new Map(nodes.map(n => [n.subtopic.name, n]))
  const now = Date.now()
  const edges: { x1: number; y1: number; x2: number; y2: number; key: string }[] = []
  for (const n of nodes) {
    for (const prereqName of n.subtopic.prerequisites ?? []) {
      const from = posByName.get(prereqName)
      if (!from || from === n) continue
      edges.push({
        x1: from.x + NODE_W / 2,
        y1: from.y + NODE_H,
        x2: n.x + NODE_W / 2,
        y2: n.y,
        key: `${prereqName}->${n.subtopic.name}`,
      })
    }
  }

  return (
    <div style={{ overflowX: "auto", paddingBottom: 4 }}>
      <div style={{ position: "relative", width: width + PAD * 2, height: height + PAD * 2 }}>
        <svg width={width + PAD * 2} height={height + PAD * 2} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(${PAD},${PAD})`}>
            {edges.map(e => {
              const midY = (e.y1 + e.y2) / 2
              return (
                <path
                  key={e.key}
                  d={`M ${e.x1} ${e.y1} C ${e.x1} ${midY}, ${e.x2} ${midY}, ${e.x2} ${e.y2}`}
                  fill="none"
                  stroke="var(--border-strong)"
                  strokeWidth={1.5}
                />
              )
            })}
          </g>
        </svg>

        {nodes.map(n => {
          const cfg = SUBTOPIC_STATUS_CONFIG[n.subtopic.status]
          const isDue = n.subtopic.nextReviewAt && new Date(n.subtopic.nextReviewAt).getTime() <= now
          return (
            <button
              key={n.subtopic.name}
              onClick={() => onSelect(n.subtopic.name)}
              title={n.locked ? `${n.subtopic.name} — сначала подтянуть пререквизиты` : n.subtopic.name}
              style={{
                position: "absolute",
                left: n.x + PAD,
                top: n.y + PAD,
                width: NODE_W,
                height: NODE_H,
                borderRadius: 14,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                background: "var(--surface)",
                border: `1.5px solid ${cfg.border}`,
                opacity: n.locked ? 0.55 : 1,
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 4,
              }}
            >
              <span
                className="font-display"
                style={{
                  fontWeight: 600,
                  fontSize: 13.5,
                  lineHeight: 1.28,
                  color: "var(--text)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {n.subtopic.name}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: cfg.color }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
                {n.locked ? "🔒 заблокировано" : isDue ? "пора повторить" : cfg.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
