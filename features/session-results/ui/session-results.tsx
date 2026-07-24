import { useState } from "react"
import { motion } from "framer-motion"
import type { SessionRecord } from "@/entities/topic/model/types"
import { OVERALL_LEVEL_CONFIG, SUBTOPIC_STATUS_CONFIG } from "@/entities/topic/config"
import { Button } from "@/shared/ui/button"
import { CheckIcon, PlusIcon } from "@/shared/ui/icons"
import { fadeInUp, scaleIn, staggerContainer } from "@/shared/lib/motion"
import { apiClient } from "@/shared/lib/api-client"

function statusTheme(status: keyof typeof SUBTOPIC_STATUS_CONFIG) {
  const cfg = SUBTOPIC_STATUS_CONFIG[status]
  return { bg: cfg.bg, border: cfg.border, text: cfg.color, label: cfg.label }
}

type Props = {
  topicId: string
  topicName: string
  results: Omit<SessionRecord, "id" | "date">
  onNewSession: () => void
  onBack: () => void
}

export const SessionResults = ({ topicId, topicName, results, onNewSession, onBack }: Props) => {
  const levelLabel = OVERALL_LEVEL_CONFIG[results.overallLevel].label
  const pct = Math.round((results.score / results.total) * 100)

  const [addedNames, setAddedNames] = useState<Set<string>>(new Set())
  const [addingName, setAddingName] = useState<string | null>(null)

  const acceptSuggestion = async (name: string) => {
    if (addingName) return
    setAddingName(name)
    try {
      await apiClient.addSubtopic(topicId, name)
      setAddedNames(prev => new Set(prev).add(name))
    } catch {
      // Most likely already exists or was added elsewhere — no need to surface an error for a "nice to have" suggestion.
    } finally {
      setAddingName(null)
    }
  }

  return (
    <motion.div className="space-y-4" variants={staggerContainer(0.08)} initial="hidden" animate="show">
      {/* Score hero */}
      <motion.div
        variants={scaleIn}
        className="p-5 rounded-3xl space-y-3"
        style={{ background: "var(--surface)", backdropFilter: "var(--glass)", WebkitBackdropFilter: "var(--glass)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-5xl font-bold tabular-nums" style={{ color: "var(--accent)" }}>
              {results.score}<span className="text-2xl font-normal" style={{ color: "var(--accent-mid)" }}>/{results.total}</span>
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>{pct}% правильно</p>
          </div>
          <span
            className="text-sm font-bold px-3 py-1.5 rounded-full mb-1"
            style={{ color: "var(--text-2)", background: "var(--surface-2)", border: "1.5px solid var(--border)" }}
          >
            {levelLabel}
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
          <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay: 0.15 }} style={{ background: "var(--accent)" }} />
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{results.summary}</p>
      </motion.div>

      {/* Strengths */}
      {results.strengths.length > 0 && (
        <motion.div variants={fadeInUp} className="p-4 rounded-3xl space-y-2" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Сильные стороны</p>
          {results.strengths.map((s, i) => (
            <p key={i} className="text-sm leading-relaxed flex items-start gap-1.5" style={{ color: "var(--text-2)" }}>
              <CheckIcon size={13} color="var(--text)" />{s}
            </p>
          ))}
        </motion.div>
      )}

      {/* Subtopics */}
      {results.subtopics.length > 0 && (
        <motion.div variants={fadeInUp} className="p-4 rounded-3xl space-y-3" style={{ background: "var(--surface)", border: "1.5px solid var(--border)", boxShadow: "var(--shadow)" }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Карта знаний — {topicName}
          </p>
          <motion.div className="space-y-2" variants={staggerContainer(0.04)} initial="hidden" animate="show">
            {results.subtopics.map((s) => {
              const cfg = statusTheme(s.status)
              return (
                <motion.div
                  key={s.name}
                  variants={fadeInUp}
                  className="p-3 rounded-2xl flex items-start justify-between gap-3"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{s.name}</p>
                    {s.recommendation && (
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-2)" }}>{s.recommendation}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold shrink-0" style={{ color: cfg.text }}>{cfg.label}</span>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>
      )}

      {/* Suggested new subtopics — not part of the map yet, user decides */}
      {results.suggestedNewSubtopics && results.suggestedNewSubtopics.length > 0 && (
        <motion.div variants={fadeInUp} className="p-4 rounded-3xl space-y-3" style={{ background: "var(--accent-light)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Кстати, всплыло в разговоре</p>
          <motion.div className="space-y-2" variants={staggerContainer(0.04)} initial="hidden" animate="show">
            {results.suggestedNewSubtopics.map((s) => {
              const added = addedNames.has(s.name)
              return (
                <motion.div
                  key={s.name}
                  variants={fadeInUp}
                  className="p-3 rounded-2xl flex items-start justify-between gap-3"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{s.name}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-2)" }}>{s.reason}</p>
                  </div>
                  <button
                    onClick={() => acceptSuggestion(s.name)}
                    disabled={added || addingName === s.name}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{
                      background: added ? "var(--surface-2)" : "var(--accent)",
                      color: added ? "var(--text-2)" : "#fff",
                      border: "none",
                      cursor: added || addingName === s.name ? "default" : "pointer",
                      opacity: addingName === s.name ? 0.6 : 1,
                      fontFamily: "inherit",
                    }}
                  >
                    {added ? <><CheckIcon size={12} color="var(--text-2)" />Добавлено</> : <><PlusIcon size={12} color="#fff" />{addingName === s.name ? "Добавляем…" : "Добавить"}</>}
                  </button>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>
      )}

      {/* Study more */}
      {results.toStudyMore.length > 0 && (
        <motion.div variants={fadeInUp} className="p-4 rounded-3xl space-y-2" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Изучить дополнительно</p>
          {results.toStudyMore.map((s, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>— {s}</p>
          ))}
        </motion.div>
      )}

      {results.toStudyDeeper.length > 0 && (
        <motion.div variants={fadeInUp} className="p-4 rounded-3xl space-y-2" style={{ background: "var(--accent-light)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Углубить до эксперта</p>
          {results.toStudyDeeper.map((s, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>— {s}</p>
          ))}
        </motion.div>
      )}

      <motion.div variants={fadeInUp} className="space-y-3 pt-2">
        <Button size="lg" onClick={onNewSession}>Пройти ещё раз →</Button>
        <Button size="lg" variant="ghost" onClick={onBack}>← Все темы</Button>
      </motion.div>
    </motion.div>
  )
}
