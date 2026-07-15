"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeftIcon } from "@/shared/ui/icons"
import { useRouter } from "next/navigation"
import { apiClient } from "@/shared/lib/api-client"
import { SUBTOPIC_STATUS_CONFIG, VERDICT_COLORS } from "@/entities/topic/config"
import type { Topic, TheoryExercise } from "@/entities/topic/model/types"
import { fadeInUp, staggerContainer } from "@/shared/lib/motion"
import { AppShell } from "@/widgets/app-shell/ui/app-shell"

type Props = { topicId: string; subtopicName: string }

type ExerciseResult = {
  verdict: "correct" | "partial" | "incorrect"
  score: number
  feedback: string
  betterApproach: string | null
}

type ExerciseState = {
  answer: string
  loading: boolean
  result: ExerciseResult | null
}

const DIFFICULTY_CONFIG = {
  easy:   { label: "Лёгкое",   bg: "var(--surface-2)",     border: "var(--border)" },
  medium: { label: "Среднее", bg: "var(--surface)",        border: "var(--border)" },
  hard:   { label: "Сложное", bg: "var(--surface-hover)",  border: "var(--border-strong)" },
}

const VERDICT_CONFIG = {
  correct:   { label: "Верно",     icon: "✓", ...VERDICT_COLORS.correct },
  partial:   { label: "Частично",  icon: "~", ...VERDICT_COLORS.partial },
  incorrect: { label: "Не верно",  icon: "✕", ...VERDICT_COLORS.incorrect },
}

function statusTheme(status: string) {
  const cfg = SUBTOPIC_STATUS_CONFIG[status as keyof typeof SUBTOPIC_STATUS_CONFIG] ?? SUBTOPIC_STATUS_CONFIG.needs_work
  return { bg: cfg.bg, border: cfg.border, text: cfg.color, label: cfg.label }
}

export const SubtopicPracticePage = ({ topicId, subtopicName }: Props) => {
  const router = useRouter()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [exercises, setExercises] = useState<TheoryExercise[]>([])
  const [loadingTheory, setLoadingTheory] = useState(true)
  const [states, setStates] = useState<ExerciseState[]>([])

  useEffect(() => {
    apiClient.getTopicById(topicId)
      .then(t => t ? setTopic(t) : router.push("/"))
      .catch(() => router.push("/"))
  }, [topicId, router])

  useEffect(() => {
    if (!topic) return
    const subtopic = topic.currentSubtopics.find(s => s.name === subtopicName)
    setLoadingTheory(true)
    fetch("/api/theory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicName: topic.name,
        subtopicName,
        userLevel: topic.overallLevel,
        recommendation: subtopic?.recommendation ?? "",
        allSubtopics: topic.currentSubtopics.map(s => s.name),
      }),
    })
      .then(r => r.json())
      .then(data => {
        const exs: TheoryExercise[] = data.exercises ?? []
        setExercises(exs)
        setStates(exs.map(() => ({ answer: "", loading: false, result: null })))
      })
      .finally(() => setLoadingTheory(false))
  }, [topic, subtopicName])

  const setAnswer = (i: number, val: string) =>
    setStates(prev => prev.map((s, idx) => idx === i ? { ...s, answer: val } : s))

  const submit = async (i: number) => {
    const ex = exercises[i]
    const userAnswer = states[i].answer.trim()
    if (!userAnswer || !topic) return

    setStates(prev => prev.map((s, idx) => idx === i ? { ...s, loading: true } : s))
    try {
      const res = await fetch("/api/subtopic-practice-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicName: topic.name,
          subtopicName,
          exerciseTitle: ex.title,
          exerciseDescription: ex.description,
          exerciseDifficulty: ex.difficulty,
          userAnswer,
        }),
      })
      const data: ExerciseResult = await res.json()
      setStates(prev => prev.map((s, idx) => idx === i ? { ...s, loading: false, result: data } : s))
    } catch {
      setStates(prev => prev.map((s, idx) => idx === i ? { ...s, loading: false } : s))
    }
  }

  const subtopic = topic?.currentSubtopics.find(s => s.name === subtopicName)
  const statusCfg = subtopic ? statusTheme(subtopic.status) : null
  const doneCount = states.filter(s => s.result !== null).length
  const allDone = doneCount === exercises.length && exercises.length > 0
  const avgScore = allDone ? Math.round(states.reduce((sum, s) => sum + (s.result?.score ?? 0), 0) / states.length) : 0

  return (
    <AppShell>
      <div style={{ position: "relative", flex: 1, background: "var(--bg)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "22px 24px 80px" }}>

          {/* HEADER */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 18, borderBottom: "1px solid var(--border)" }}>
            <button onClick={() => router.back()} style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeftIcon size={19} color="var(--text)" />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>{topic?.name} · {subtopicName}</div>
              <h1 className="font-display" style={{ fontWeight: 700, fontSize: 20, margin: "1px 0 0", color: "var(--text)" }}>Практика</h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {exercises.length > 0 && (
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>{doneCount}/{exercises.length}</span>
              )}
              {statusCfg && (
                <span style={{ padding: "6px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, background: statusCfg.bg, color: statusCfg.text, border: `1px solid ${statusCfg.border}` }}>{statusCfg.label}</span>
              )}
            </div>
          </div>

          {/* LOADING */}
          {loadingTheory && (
            <div style={{ paddingTop: 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2.5px solid var(--border)", borderTopColor: "var(--text)", animation: "spin 0.8s linear infinite" }} />
              <p style={{ margin: 0, fontSize: 14, color: "var(--text-2)", fontWeight: 500 }}>Загружаю задания…</p>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {/* SUMMARY when all done */}
          {allDone && (() => {
            const c = avgScore >= 80 ? VERDICT_COLORS.correct : avgScore >= 50 ? VERDICT_COLORS.partial : VERDICT_COLORS.incorrect
            return (
              <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 28 }} style={{ marginTop: 20, padding: "24px 26px", borderRadius: 18, background: c.bg, border: `1px solid ${c.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-3)", marginBottom: 8 }}>ИТОГ ПРАКТИКИ</div>
                <div className="font-display" style={{ fontSize: 42, fontWeight: 800, color: c.color, lineHeight: 1 }}>{avgScore}<span style={{ fontSize: 20, opacity: 0.6 }}>%</span></div>
                <p style={{ margin: "8px 0 0", fontSize: 14.5, color: "var(--text-2)" }}>
                  {avgScore >= 80 ? "Отличная работа — практические навыки сильные" : avgScore >= 50 ? "Базовое понимание есть, но стоит доработать детали" : "Нужно ещё поработать с материалом и попробовать снова"}
                </p>
              </motion.div>
            )
          })()}

          {/* EXERCISES */}
          {!loadingTheory && exercises.length > 0 && (
            <motion.div variants={staggerContainer(0.08)} initial="hidden" animate="show" style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              {exercises.map((ex, i) => {
                const d = DIFFICULTY_CONFIG[ex.difficulty] ?? DIFFICULTY_CONFIG.medium
                const s = states[i]
                const v = s?.result ? VERDICT_CONFIG[s.result.verdict] : null

                return (
                  <motion.div key={i} variants={fadeInUp} style={{ borderRadius: 18, background: "var(--surface)", border: "1px solid var(--border)", overflow: "hidden" }}>

                    {/* Exercise header */}
                    <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ width: 24, height: 24, borderRadius: 8, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "var(--text-2)", flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: d.bg, color: "var(--text-2)", border: `1px solid ${d.border}` }}>{d.label}</span>
                        {v && <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: v.bg, color: v.color, border: `1px solid ${v.border}`, marginLeft: "auto" }}>{v.icon} {v.label}</span>}
                      </div>
                      <h3 className="font-display" style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{ex.title}</h3>
                      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "var(--text-2)" }}>{ex.description}</p>
                    </div>

                    {/* Answer area */}
                    <div style={{ padding: "16px 22px 20px" }}>
                      {!s?.result ? (
                        <>
                          <textarea
                            value={s?.answer ?? ""}
                            onChange={e => setAnswer(i, e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && s?.answer.trim()) submit(i) }}
                            placeholder="Напиши решение — код, объяснение или оба…"
                            rows={6}
                            style={{ width: "100%", resize: "vertical", padding: "14px 16px", borderRadius: 14, background: "var(--surface-2)", border: `1.5px solid ${s?.answer ? "var(--border-strong)" : "var(--border)"}`, outline: "none", color: "var(--text)", fontSize: 13.5, lineHeight: 1.65, fontFamily: "var(--font-mono, monospace)", boxSizing: "border-box" }}
                          />
                          <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                            <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>⌘ Enter — отправить</span>
                            <motion.button
                              whileHover={(!s?.answer.trim() || s?.loading) ? undefined : { scale: 1.02 }}
                              whileTap={(!s?.answer.trim() || s?.loading) ? undefined : { scale: 0.96 }}
                              onClick={() => submit(i)}
                              disabled={!s?.answer.trim() || s?.loading}
                              style={{ padding: "12px 22px", borderRadius: 12, border: "none", cursor: (!s?.answer.trim() || s?.loading) ? "default" : "pointer", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 14, opacity: (!s?.answer.trim() || s?.loading) ? 0.5 : 1, fontFamily: "inherit" }}
                            >
                              {s?.loading ? "Проверяю…" : "Проверить →"}
                            </motion.button>
                          </div>
                        </>
                      ) : (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {/* User's answer recap */}
                          <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 6 }}>МОЁ РЕШЕНИЕ</div>
                            <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--text-2)", whiteSpace: "pre-wrap", fontFamily: "var(--font-mono, monospace)" }}>{s.answer}</pre>
                          </div>

                          {/* Verdict */}
                          {v && (
                            <div style={{ padding: "14px 16px", borderRadius: 14, background: v.bg, border: `1.5px solid ${v.border}` }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                                <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--surface)", border: `2px solid ${v.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: v.color, flexShrink: 0 }}>{v.icon}</span>
                                <span style={{ fontWeight: 700, fontSize: 14, color: v.color }}>{v.label}</span>
                                <span style={{ marginLeft: "auto", fontWeight: 800, fontSize: 16, color: v.color }}>{s.result.score}%</span>
                              </div>
                              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.62, color: "var(--text-2)" }}>{s.result.feedback}</p>
                            </div>
                          )}

                          {/* Better approach */}
                          {s.result.betterApproach && (
                            <div style={{ padding: "14px 16px", borderRadius: 14, background: "var(--surface-hover)", border: "1px solid var(--border-strong)" }}>
                              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text)", marginBottom: 8 }}>КАК ЛУЧШЕ</div>
                              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.62, color: "var(--text-2)" }}>{s.result.betterApproach}</p>
                            </div>
                          )}

                          {/* Retry */}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setStates(prev => prev.map((st, idx) => idx === i ? { ...st, result: null, answer: "" } : st))}
                            style={{ alignSelf: "flex-start", padding: "9px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-2)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                          >
                            Попробовать снова
                          </motion.button>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {/* BOTTOM NAV */}
          {!loadingTheory && (
            <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => router.back()} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 20px", borderRadius: 14, border: "1px solid var(--border)", cursor: "pointer", background: "var(--surface)", color: "var(--text)", fontWeight: 600, fontSize: 15, fontFamily: "inherit" }}>
                ← Вернуться
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => router.push(`/topic/${topicId}/subtopic/${encodeURIComponent(subtopicName)}/test`)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 20px", borderRadius: 14, border: "none", cursor: "pointer", background: "var(--accent)", color: "#fff", fontWeight: 600, fontSize: 15, fontFamily: "inherit" }}>
                Теоретический тест →
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
