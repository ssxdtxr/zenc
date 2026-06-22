"use client"

import type { Topic } from "@/entities/topic/model/types"
import { OVERALL_LEVEL_CONFIG, SUBTOPIC_STATUS_CONFIG } from "@/entities/topic/config"

type Props = {
  topic: Topic
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}

const formatDate = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (diff === 0) return "сегодня"
  if (diff === 1) return "вчера"
  if (diff < 7) return `${diff} дн. назад`
  return new Date(iso).toLocaleDateString("ru", { day: "numeric", month: "short" })
}

export const TopicCard = ({ topic, onClick, onDelete }: Props) => {
  const levelCfg = topic.overallLevel ? OVERALL_LEVEL_CONFIG[topic.overallLevel] : null
  const hasSession = topic.sessions.length > 0

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="w-full text-left p-4 rounded-3xl transition-all active:scale-[0.98] cursor-pointer"
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow)",
        border: "1.5px solid var(--border)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-lg)"; e.currentTarget.style.borderColor = "var(--border-strong)" }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow)"; e.currentTarget.style.borderColor = "var(--border)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-base truncate" style={{ color: "var(--text)" }}>{topic.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            {hasSession ? `${topic.sessions.length} сессий · ${formatDate(topic.lastSessionAt!)}` : "Ещё не начато"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {levelCfg && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ color: levelCfg.color, background: levelCfg.bg, border: `1px solid ${levelCfg.border}` }}
            >
              {levelCfg.label}
            </span>
          )}
          <button
            onClick={onDelete}
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors"
            style={{ color: "var(--text-3)", background: "var(--surface-2)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "#fef2f2" }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "var(--surface-2)" }}
          >
            ✕
          </button>
        </div>
      </div>

      {topic.currentSubtopics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topic.currentSubtopics.slice(0, 6).map((s) => {
            const cfg = SUBTOPIC_STATUS_CONFIG[s.status]
            return (
              <span
                key={s.name}
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                {s.name}
              </span>
            )
          })}
          {topic.currentSubtopics.length > 6 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: "var(--text-3)", background: "var(--surface-2)" }}>
              +{topic.currentSubtopics.length - 6}
            </span>
          )}
        </div>
      )}

      {!hasSession && (
        <p className="text-sm font-medium mt-2" style={{ color: "var(--violet)" }}>Начать →</p>
      )}
    </div>
  )
}
