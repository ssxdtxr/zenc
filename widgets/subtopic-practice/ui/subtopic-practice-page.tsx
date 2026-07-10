"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeftIcon } from "@/shared/ui/icons"
import { useRouter } from "next/navigation"
import { apiClient } from "@/shared/lib/api-client"
import { SUBTOPIC_STATUS_CONFIG } from "@/entities/topic/config"
import type { Topic, TheoryExercise } from "@/entities/topic/model/types"
import { fadeInUp, staggerContainer } from "@/shared/lib/motion"

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
  easy:   { label: "Лёгкое",  color: "#5ee08a", bg: "rgba(94,224,138,0.12)",  border: "rgba(94,224,138,0.3)" },
  medium: { label: "Среднее", color: "#ffbb5c", bg: "rgba(255,187,92,0.12)",  border: "rgba(255,187,92,0.3)" },
  hard:   { label: "Сложное", color: "#ff7e92", bg: "rgba(255,126,146,0.12)", border: "rgba(255,126,146,0.3)" },
}

const VERDICT_CONFIG = {
  correct:   { label: "Верно",     icon: "✓", color: "#5ee08a", bg: "rgba(94,224,138,0.1)",  border: "rgba(94,224,138,0.3)" },
  partial:   { label: "Частично",  icon: "~", color: "#ffbb5c", bg: "rgba(255,187,92,0.1)",  border: "rgba(255,187,92,0.3)" },
  incorrect: { label: "Не верно",  icon: "✕", color: "#ff7e92", bg: "rgba(255,126,146,0.1)", border: "rgba(255,126,146,0.3)" },
}

const BG = "radial-gradient(1200px 800px at 80% -10%, rgba(109,60,255,0.18), transparent 60%), radial-gradient(900px 700px at 0% 100%, rgba(43,217,227,0.1), transparent 55%), #08070f"

export const SubtopicPracticePage = ({ topicId, subtopicName }: Props) => {
  const router = useRouter()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [exercises, setExercises] = useState<TheoryExercise[]>([])
  const [loadingTheory, setLoadingTheory] = useState(true)
  const [states, setStates] = useState<ExerciseState[]>([])

  useEffect(() => {
    apiClient.getTopicById(topicId).then(setTopic)
  }, [topicId])

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
  const statusCfg = subtopic ? SUBTOPIC_STATUS_CONFIG[subtopic.status] : null
  const doneCount = states.filter(s => s.result !== null).length
  const allDone = doneCount === exercises.length && exercises.length > 0
  const avgScore = allDone ? Math.round(states.reduce((sum, s) => sum + (s.result?.score ?? 0), 0) / states.length) : 0

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: BG, overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", filter: "blur(70px)" }}>
        <div style={{ position: "absolute", top: "-8%", left: "8%", width: "38vw", height: "38vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #7c3cff, transparent 70%)", opacity: 0.42, animation: "drift1 26s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "24%", right: "-6%", width: "32vw", height: "32vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #2bd9e3, transparent 70%)", opacity: 0.22, animation: "drift2 30s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-12%", left: "34%", width: "40vw", height: "40vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #ff4d8d, transparent 70%)", opacity: 0.18, animation: "drift3 34s ease-in-out infinite" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1040, margin: "0 auto", padding: "22px 28px 80px" }}>

        {/* NAV */}
        <nav style={{ display: "flex", alignItems: "center", gap: 16, padding: "11px 16px", borderRadius: 20, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px) saturate(150%)", WebkitBackdropFilter: "blur(24px) saturate(150%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 10px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)" }}>
          <button onClick={() => router.back()} style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.85)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeftIcon size={20} color="rgba(255,255,255,0.85)" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.42)" }}>{topic?.name} · {subtopicName}</div>
            <h1 className="font-display" style={{ fontWeight: 700, fontSize: 20, margin: "1px 0 0", color: "#fff" }}>Практика</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {exercises.length > 0 && (
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{doneCount}/{exercises.length}</span>
            )}
            {statusCfg && (
              <span style={{ padding: "6px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}>{statusCfg.label}</span>
            )}
          </div>
        </nav>

        {/* LOADING */}
        {loadingTheory && (
          <div style={{ paddingTop: 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2.5px solid transparent", borderTopColor: "#9b6bff", animation: "spin 0.8s linear infinite" }} />
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Загружаю задания…</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* SUMMARY when all done */}
        {allDone && (
          <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 28 }} style={{ marginTop: 20, padding: "24px 26px", borderRadius: 22, background: avgScore >= 80 ? "linear-gradient(135deg,rgba(94,224,138,0.15),rgba(43,217,227,0.06))" : avgScore >= 50 ? "linear-gradient(135deg,rgba(255,187,92,0.15),rgba(255,150,50,0.05))" : "linear-gradient(135deg,rgba(255,126,146,0.12),rgba(255,80,80,0.04))", border: `1px solid ${avgScore >= 80 ? "rgba(94,224,138,0.3)" : avgScore >= 50 ? "rgba(255,187,92,0.3)" : "rgba(255,126,146,0.3)"}`, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>ИТОГ ПРАКТИКИ</div>
            <div className="font-display" style={{ fontSize: 42, fontWeight: 800, color: avgScore >= 80 ? "#5ee08a" : avgScore >= 50 ? "#ffbb5c" : "#ff7e92", lineHeight: 1 }}>{avgScore}<span style={{ fontSize: 20, opacity: 0.6 }}>%</span></div>
            <p style={{ margin: "8px 0 0", fontSize: 14.5, color: "rgba(255,255,255,0.65)" }}>
              {avgScore >= 80 ? "Отличная работа — практические навыки сильные" : avgScore >= 50 ? "Базовое понимание есть, но стоит доработать детали" : "Нужно ещё поработать с материалом и попробовать снова"}
            </p>
          </motion.div>
        )}

        {/* EXERCISES */}
        {!loadingTheory && exercises.length > 0 && (
          <motion.div variants={staggerContainer(0.08)} initial="hidden" animate="show" style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {exercises.map((ex, i) => {
              const d = DIFFICULTY_CONFIG[ex.difficulty] ?? DIFFICULTY_CONFIG.medium
              const s = states[i]
              const v = s?.result ? VERDICT_CONFIG[s.result.verdict] : null

              return (
                <motion.div key={i} variants={fadeInUp} style={{ borderRadius: 22, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(26px)", WebkitBackdropFilter: "blur(26px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 12px 40px rgba(0,0,0,0.4)", overflow: "hidden" }}>

                  {/* Exercise header */}
                  <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: d.bg, color: d.color, border: `1px solid ${d.border}` }}>{d.label}</span>
                      {v && <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: v.bg, color: v.color, border: `1px solid ${v.border}`, marginLeft: "auto" }}>{v.icon} {v.label}</span>}
                    </div>
                    <h3 className="font-display" style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "#fff" }}>{ex.title}</h3>
                    <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "rgba(255,255,255,0.65)" }}>{ex.description}</p>
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
                          style={{ width: "100%", resize: "vertical", padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: `1.5px solid ${s?.answer ? "rgba(155,107,255,0.4)" : "rgba(255,255,255,0.1)"}`, outline: "none", color: "#fff", fontSize: 13.5, lineHeight: 1.65, fontFamily: "var(--font-mono, monospace)", boxSizing: "border-box" }}
                        />
                        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.35)" }}>⌘ Enter — отправить</span>
                          <motion.button
                            whileHover={(!s?.answer.trim() || s?.loading) ? undefined : { scale: 1.02 }}
                            whileTap={(!s?.answer.trim() || s?.loading) ? undefined : { scale: 0.96 }}
                            onClick={() => submit(i)}
                            disabled={!s?.answer.trim() || s?.loading}
                            style={{ padding: "12px 22px", borderRadius: 12, border: "none", cursor: (!s?.answer.trim() || s?.loading) ? "default" : "pointer", background: "linear-gradient(135deg,#9b6bff,#6d3cff)", color: "#fff", fontWeight: 700, fontSize: 14, boxShadow: "0 8px 20px rgba(109,60,255,0.35)", opacity: (!s?.answer.trim() || s?.loading) ? 0.5 : 1, fontFamily: "inherit" }}
                          >
                            {s?.loading ? "Проверяю…" : "Проверить →"}
                          </motion.button>
                        </div>
                      </>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {/* User's answer recap */}
                        <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>МОЁ РЕШЕНИЕ</div>
                          <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.7)", whiteSpace: "pre-wrap", fontFamily: "var(--font-mono, monospace)" }}>{s.answer}</pre>
                        </div>

                        {/* Verdict */}
                        {v && (
                          <div style={{ padding: "14px 16px", borderRadius: 14, background: v.bg, border: `1.5px solid ${v.border}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                              <span style={{ width: 26, height: 26, borderRadius: "50%", background: v.bg, border: `2px solid ${v.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: v.color, flexShrink: 0 }}>{v.icon}</span>
                              <span style={{ fontWeight: 700, fontSize: 14, color: v.color }}>{v.label}</span>
                              <span style={{ marginLeft: "auto", fontWeight: 800, fontSize: 16, color: v.color }}>{s.result.score}%</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.62, color: "rgba(255,255,255,0.82)" }}>{s.result.feedback}</p>
                          </div>
                        )}

                        {/* Better approach */}
                        {s.result.betterApproach && (
                          <div style={{ padding: "14px 16px", borderRadius: 14, background: "linear-gradient(135deg,rgba(155,107,255,0.1),rgba(43,217,227,0.05))", border: "1px solid rgba(155,107,255,0.22)" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#b69cff", marginBottom: 8 }}>КАК ЛУЧШЕ</div>
                            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.62, color: "rgba(255,255,255,0.78)" }}>{s.result.betterApproach}</p>
                          </div>
                        )}

                        {/* Retry */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setStates(prev => prev.map((st, idx) => idx === i ? { ...st, result: null, answer: "" } : st))}
                          style={{ alignSelf: "flex-start", padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
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
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => router.back()} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.16)", cursor: "pointer", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: 15, fontFamily: "inherit" }}>
              ← Вернуться
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => router.push(`/topic/${topicId}/subtopic/${encodeURIComponent(subtopicName)}/test`)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 20px", borderRadius: 14, border: "1px solid rgba(155,107,255,0.35)", cursor: "pointer", background: "rgba(155,107,255,0.08)", color: "#c4adff", fontWeight: 600, fontSize: 15, fontFamily: "inherit" }}>
              Теоретический тест →
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}
