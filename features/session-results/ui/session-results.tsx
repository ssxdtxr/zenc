import type { SessionRecord } from "@/entities/topic/model/types"
import { OVERALL_LEVEL_CONFIG, SUBTOPIC_STATUS_CONFIG } from "@/entities/topic/config"
import { Button } from "@/shared/ui/button"

type Props = {
  topicName: string
  results: Omit<SessionRecord, "id" | "date">
  onNewSession: () => void
  onBack: () => void
}

export const SessionResults = ({ topicName, results, onNewSession, onBack }: Props) => {
  const levelCfg = OVERALL_LEVEL_CONFIG[results.overallLevel]
  const pct = Math.round((results.score / results.total) * 100)

  return (
    <div className="space-y-4">
      {/* Score hero */}
      <div
        className="p-5 rounded-3xl space-y-3"
        style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)", border: "1.5px solid rgba(124,58,237,0.2)" }}
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-5xl font-bold tabular-nums" style={{ color: "var(--violet)" }}>
              {results.score}<span className="text-2xl font-normal" style={{ color: "var(--violet-mid)" }}>/{results.total}</span>
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>{pct}% правильно</p>
          </div>
          <span
            className="text-sm font-bold px-3 py-1.5 rounded-full mb-1"
            style={{ color: levelCfg.color, background: levelCfg.bg, border: `1.5px solid ${levelCfg.border}` }}
          >
            {levelCfg.label}
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(124,58,237,0.15)" }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #7c3aed, #a855f7)" }} />
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{results.summary}</p>
      </div>

      {/* Strengths */}
      {results.strengths.length > 0 && (
        <div className="p-4 rounded-3xl space-y-2" style={{ background: "#f0fdf4", border: "1.5px solid rgba(5,150,105,0.2)" }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#059669" }}>Сильные стороны</p>
          {results.strengths.map((s, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: "#065f46" }}>✓ {s}</p>
          ))}
        </div>
      )}

      {/* Subtopics */}
      {results.subtopics.length > 0 && (
        <div className="p-4 rounded-3xl space-y-3" style={{ background: "var(--surface)", border: "1.5px solid var(--border)", boxShadow: "var(--shadow)" }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Карта знаний — {topicName}
          </p>
          <div className="space-y-2">
            {results.subtopics.map((s) => {
              const cfg = SUBTOPIC_STATUS_CONFIG[s.status]
              return (
                <div
                  key={s.name}
                  className="p-3 rounded-2xl flex items-start justify-between gap-3"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: cfg.color }}>{s.name}</p>
                    {s.recommendation && (
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-2)" }}>{s.recommendation}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold shrink-0" style={{ color: cfg.color }}>{cfg.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Study more */}
      {results.toStudyMore.length > 0 && (
        <div className="p-4 rounded-3xl space-y-2" style={{ background: "#fffbeb", border: "1.5px solid rgba(217,119,6,0.2)" }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#d97706" }}>Изучить дополнительно</p>
          {results.toStudyMore.map((s, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>— {s}</p>
          ))}
        </div>
      )}

      {results.toStudyDeeper.length > 0 && (
        <div className="p-4 rounded-3xl space-y-2" style={{ background: "var(--violet-light)", border: "1.5px solid rgba(124,58,237,0.2)" }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--violet)" }}>Углубить до эксперта</p>
          {results.toStudyDeeper.map((s, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>— {s}</p>
          ))}
        </div>
      )}

      <div className="space-y-3 pt-2">
        <Button size="lg" onClick={onNewSession}>Пройти ещё раз →</Button>
        <Button size="lg" variant="ghost" onClick={onBack}>← Все темы</Button>
      </div>
    </div>
  )
}
