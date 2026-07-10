"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeftIcon } from "@/shared/ui/icons"
import { useRouter } from "next/navigation"
import { apiClient } from "@/shared/lib/api-client"
import { SUBTOPIC_STATUS_CONFIG } from "@/entities/topic/config"
import { RichText } from "@/features/theory-view/ui/rich-text"
import type { Topic } from "@/entities/topic/model/types"
import type { Message } from "@/entities/session/model/types"
import { fadeInUp, staggerContainer } from "@/shared/lib/motion"

type Props = { topicId: string; subtopicName: string; level: string }

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; desc: string }> = {
  basic:        { label: "Базовый",       color: "#5ee08a", bg: "rgba(94,224,138,0.12)",  border: "rgba(94,224,138,0.35)",  desc: "Определения и концепции" },
  intermediate: { label: "Средний",       color: "#ffbb5c", bg: "rgba(255,187,92,0.12)",  border: "rgba(255,187,92,0.35)",  desc: "Применение и нюансы" },
  advanced:     { label: "Продвинутый",   color: "#ff7e92", bg: "rgba(255,126,146,0.12)", border: "rgba(255,126,146,0.35)", desc: "Edge cases и детали" },
}

type LevelResponse = {
  evaluation: string | null
  correctAnswer: string | null
  explanation: string | null
  isCorrect: boolean | null
  question: string | null
  questionType: "text" | "choice"
  options: string[] | null
  shouldFinish: boolean
  isComplete: boolean | null
  finishSummary: string | null
  questionNumber: number
}

const BG = "radial-gradient(1200px 800px at 80% -10%, rgba(109,60,255,0.18), transparent 60%), radial-gradient(900px 700px at 0% 100%, rgba(43,217,227,0.1), transparent 55%), #08070f"

export const LevelSessionPage = ({ topicId, subtopicName, level }: Props) => {
  const router = useRouter()
  const lvl = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.basic
  const [topic, setTopic] = useState<Topic | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [current, setCurrent] = useState<LevelResponse | null>(null)
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedStatus, setSavedStatus] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [lastQuestion, setLastQuestion] = useState<string | null>(null)
  const [lastAnswer, setLastAnswer] = useState<string | null>(null)
  const [phase, setPhase] = useState<"session" | "feedback" | "done">("session")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const started = useRef(false)

  useEffect(() => { apiClient.getTopicById(topicId).then(setTopic) }, [topicId])

  useEffect(() => {
    if (started.current) return
    started.current = true
    ask([])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase === "session") textareaRef.current?.focus()
  }, [phase, current])

  const ask = async (msgs: Message[], num = 1) => {
    setLoading(true)
    try {
      const res = await fetch("/api/level-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicName: topic?.name ?? subtopicName, subtopicName, difficulty: level, messages: msgs, questionNumber: num }),
      })
      const data: LevelResponse = await res.json()
      setCurrent(data)
      if (data.question) {
        setMessages(prev => [...prev, { role: "assistant", content: data.question! }])
      }
      if (data.shouldFinish) {
        setPhase("done")
        saveResult(data.isComplete ?? false, data.finishSummary ?? "")
      }
    } finally {
      setLoading(false)
    }
  }

  const saveResult = async (isComplete: boolean, finishSummary: string) => {
    setSaving(true)
    try {
      const res = await fetch("/api/level-session-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, subtopicName, difficulty: level, isComplete, finishSummary }),
      })
      const data = await res.json()
      setSavedStatus(data.status)
    } finally {
      setSaving(false)
    }
  }

  const submit = async () => {
    if (!answer.trim() || loading) return
    const userMsg: Message = { role: "user", content: answer }
    const newMsgs = [...messages, userMsg]
    setLastQuestion(current?.question ?? null)
    setLastAnswer(answer)
    setAnswer("")
    setMessages(newMsgs)
    setPhase("feedback")

    const newCorrect = correctCount + (current?.isCorrect !== false ? 0 : 0)
    setQuestionCount(q => q + 1)

    setLoading(true)
    try {
      const res = await fetch("/api/level-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicName: topic?.name ?? subtopicName, subtopicName, difficulty: level, messages: newMsgs, questionNumber: questionCount + 2 }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error("Level session error:", err)
        setPhase("session")
        return
      }
      const data: LevelResponse = await res.json()
      setCurrent(data)
      if (data.isCorrect) setCorrectCount(c => c + 1)
      if (data.shouldFinish) {
        setPhase("done")
        saveResult(data.isComplete ?? false, data.finishSummary ?? "")
      }
    } finally {
      setLoading(false)
    }
  }

  const selectOption = (opt: string) => setAnswer(opt)

  const next = () => {
    if (!current || current.shouldFinish) return
    setPhase("session")
    setLastQuestion(null)
    setLastAnswer(null)
    if (current.question) {
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last?.role === "assistant" && last.content === current.question) return prev
        return [...prev, { role: "assistant", content: current.question! }]
      })
    }
  }

  const subtopic = topic?.currentSubtopics.find(s => s.name === subtopicName)
  const statusCfg = subtopic ? SUBTOPIC_STATUS_CONFIG[subtopic.status] : null
  const savedCfg = savedStatus ? SUBTOPIC_STATUS_CONFIG[savedStatus as keyof typeof SUBTOPIC_STATUS_CONFIG] : null

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: BG, overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", filter: "blur(70px)" }}>
        <div style={{ position: "absolute", top: "-8%", left: "8%", width: "38vw", height: "38vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #7c3cff, transparent 70%)", opacity: 0.42, animation: "drift1 26s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "24%", right: "-6%", width: "32vw", height: "32vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #2bd9e3, transparent 70%)", opacity: 0.22, animation: "drift2 30s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-12%", left: "34%", width: "40vw", height: "40vw", borderRadius: "50%", background: `radial-gradient(circle at 30% 30%, ${lvl.color}, transparent 70%)`, opacity: 0.16, animation: "drift3 34s ease-in-out infinite" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "22px 28px 80px" }}>

        {/* NAV */}
        <nav style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderRadius: 20, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 10px 40px rgba(0,0,0,0.45)", marginBottom: 22 }}>
          <button onClick={() => router.back()} style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.04)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeftIcon size={20} color="rgba(255,255,255,0.85)" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.42)" }}>{topic?.name} · {subtopicName}</div>
            <h1 className="font-display" style={{ fontWeight: 700, fontSize: 19, margin: "1px 0 0", color: "#fff" }}>Уровень: {lvl.label}</h1>
          </div>
          <span style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: lvl.bg, color: lvl.color, border: `1px solid ${lvl.border}`, flexShrink: 0 }}>{lvl.desc}</span>
          {statusCfg && (
            <span style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, flexShrink: 0 }}>{statusCfg.label}</span>
          )}
        </nav>

        {/* DONE / RESULT */}
        {phase === "done" && current && (
          <div style={{ borderRadius: 24, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 18px 60px rgba(0,0,0,0.5)", padding: "28px 30px" }}>
            {saving ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "40px 0" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2.5px solid transparent", borderTopColor: lvl.color, animation: "spin 0.8s linear infinite" }} />
                <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Сохраняю результат…</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : (
              <motion.div variants={staggerContainer(0.08)} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Hero */}
                <motion.div variants={fadeInUp} style={{ padding: "26px 24px", borderRadius: 20, background: current.isComplete ? "linear-gradient(135deg,rgba(94,224,138,0.15),rgba(43,217,227,0.06))" : "linear-gradient(135deg,rgba(255,126,146,0.12),rgba(255,80,80,0.04))", border: `1px solid ${current.isComplete ? "rgba(94,224,138,0.3)" : "rgba(255,126,146,0.3)"}`, textAlign: "center" }}>
                  <div style={{ fontSize: 40 }}>{current.isComplete ? "🎯" : "📚"}</div>
                  <div className="font-display" style={{ fontSize: 26, fontWeight: 800, color: current.isComplete ? "#5ee08a" : "#ff7e92", marginTop: 10, marginBottom: 6 }}>
                    {current.isComplete ? `${lvl.label} уровень освоен` : "Нужно больше практики"}
                  </div>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,0.72)" }}>{current.finishSummary}</p>
                </motion.div>

                {/* Stats */}
                <motion.div variants={staggerContainer(0.05)} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Вопросов", value: questionCount },
                    { label: "Правильно", value: correctCount },
                    { label: "Уровень", value: lvl.label },
                  ].map(s => (
                    <motion.div key={s.label} variants={fadeInUp} style={{ padding: "14px", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", textAlign: "center" }}>
                      <div className="font-display" style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{s.value}</div>
                      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", fontWeight: 600, marginTop: 3 }}>{s.label}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* New status */}
                {savedCfg && (
                  <motion.div variants={fadeInUp} style={{ padding: "14px 18px", borderRadius: 14, background: savedCfg.bg, border: `1px solid ${savedCfg.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>НОВЫЙ СТАТУС ПОДТЕМЫ</span>
                    <span style={{ fontWeight: 800, fontSize: 15, color: savedCfg.color }}>{savedCfg.label}</span>
                  </motion.div>
                )}

                {/* Actions */}
                <motion.div variants={fadeInUp} style={{ display: "flex", gap: 10 }}>
                  <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }} onClick={() => { started.current = false; setMessages([]); setCurrent(null); setQuestionCount(0); setCorrectCount(0); setPhase("session"); setLastQuestion(null); setLastAnswer(null); setSavedStatus(null); started.current = true; ask([]) }}
                    style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${lvl.color},${lvl.color}aa)`, color: "#08070f", fontWeight: 700, fontSize: 15, fontFamily: "inherit" }}>
                    Пройти снова →
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }} onClick={() => router.back()}
                    style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.16)", cursor: "pointer", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.82)", fontWeight: 600, fontSize: 15, fontFamily: "inherit" }}>
                    ← К теории
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </div>
        )}

        {/* SESSION / FEEDBACK */}
        {phase !== "done" && (
          <div style={{ borderRadius: 24, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 18px 60px rgba(0,0,0,0.5)", padding: "26px 30px 30px" }}>

            {/* Progress */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: lvl.color, boxShadow: `0 0 8px ${lvl.color}` }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Вопрос {questionCount + 1} · ИИ решает когда хватит</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: lvl.color }}>{correctCount} верных</span>
            </div>

            {/* INITIAL LOADING */}
            {loading && !current && (
              <div style={{ padding: "48px 0", display: "flex", justifyContent: "center" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid transparent`, borderTopColor: lvl.color, animation: "spin 0.8s linear infinite" }} />
              </div>
            )}

            <AnimatePresence mode="wait">
            {/* FEEDBACK PHASE */}
            {phase === "feedback" && current && (
              <motion.div key="feedback" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
                {lastQuestion && (
                  <div style={{ padding: "13px 16px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>ВОПРОС</div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "rgba(255,255,255,0.72)" }}>{lastQuestion}</p>
                  </div>
                )}
                {lastAnswer && (
                  <div style={{ padding: "13px 16px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>МОЙ ОТВЕТ</div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "rgba(255,255,255,0.72)", whiteSpace: "pre-wrap" }}>{lastAnswer}</p>
                  </div>
                )}

                {/* Loading eval */}
                {loading && (
                  <div style={{ padding: "32px 0", display: "flex", justifyContent: "center" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid transparent`, borderTopColor: lvl.color, animation: "spin 0.8s linear infinite" }} />
                  </div>
                )}

                {!loading && current.evaluation && (() => {
                  const isRight = current.isCorrect === true
                  const isWrong = current.isCorrect === false
                  const v = {
                    icon: isRight ? "✓" : isWrong ? "✗" : "~",
                    label: isRight ? "Верно" : isWrong ? "Не верно" : "Частично",
                    color: isRight ? "#5ee08a" : isWrong ? "#ff7e92" : "#ffbb5c",
                    bg: isRight ? "rgba(94,224,138,0.1)" : isWrong ? "rgba(255,126,146,0.1)" : "rgba(255,187,92,0.1)",
                    border: isRight ? "rgba(94,224,138,0.35)" : isWrong ? "rgba(255,126,146,0.35)" : "rgba(255,187,92,0.35)",
                  }
                  return (
                    <div>
                      <div style={{ padding: "16px 18px", borderRadius: 14, background: v.bg, border: `1.5px solid ${v.border}`, marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
                          <span style={{ width: 26, height: 26, borderRadius: "50%", background: v.bg, border: `2px solid ${v.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: v.color, flexShrink: 0 }}>{v.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: 14, color: v.color }}>{v.label}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.82)" }}>{current.evaluation}</p>
                      </div>

                      {isWrong && current.correctAnswer && (
                        <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(94,224,138,0.08)", border: "1px solid rgba(94,224,138,0.28)", marginBottom: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#5ee08a", marginBottom: 7 }}>ПРАВИЛЬНЫЙ ОТВЕТ</div>
                          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.62, color: "rgba(255,255,255,0.88)" }}>{current.correctAnswer}</p>
                        </div>
                      )}

                      {current.explanation && (
                        <div style={{ padding: "14px 18px", borderRadius: 14, background: "linear-gradient(135deg,rgba(155,107,255,0.1),rgba(43,217,227,0.05))", border: "1px solid rgba(155,107,255,0.22)", marginBottom: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#b69cff", marginBottom: 8 }}>ЧТО ВАЖНО</div>
                          <RichText text={current.explanation} className="[&_p]:!text-[rgba(255,255,255,0.78)] [&_p]:!text-sm" />
                        </div>
                      )}

                      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} onClick={next} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", cursor: "pointer", background: `linear-gradient(135deg,#9b6bff,#6d3cff)`, color: "#fff", fontWeight: 700, fontSize: 15, boxShadow: "0 8px 22px rgba(109,60,255,0.4)", fontFamily: "inherit" }}>
                        Следующий вопрос →
                      </motion.button>
                    </div>
                  )
                })()}
              </motion.div>
            )}

            {/* SESSION PHASE */}
            {phase === "session" && current?.question && !loading && (
              <motion.div key="session" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
                <p style={{ margin: "0 0 20px", fontSize: 18, lineHeight: 1.65, color: "rgba(255,255,255,0.92)" }}>{current.question}</p>

                {current.questionType === "choice" && current.options ? (
                  <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                    {current.options.map((opt, i) => {
                      const sel = answer === opt
                      return (
                        <motion.button key={i} variants={fadeInUp} whileHover={{ x: 2 }} whileTap={{ scale: 0.985 }} onClick={() => selectOption(opt)} style={{ textAlign: "left", padding: "14px 18px", borderRadius: 14, border: `1.5px solid ${sel ? lvl.border : "rgba(255,255,255,0.1)"}`, background: sel ? lvl.bg : "rgba(255,255,255,0.04)", color: sel ? "#fff" : "rgba(255,255,255,0.75)", fontWeight: sel ? 600 : 500, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, fontFamily: "inherit" }}>
                          <span style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: sel ? lvl.color : "rgba(255,255,255,0.08)", color: sel ? "#08070f" : "rgba(255,255,255,0.4)", border: `1px solid ${sel ? "transparent" : "rgba(255,255,255,0.12)"}` }}>{String.fromCharCode(65 + i)}</span>
                          {opt}
                        </motion.button>
                      )
                    })}
                  </motion.div>
                ) : (
                  <textarea
                    ref={textareaRef}
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && answer.trim()) submit() }}
                    placeholder="Напиши ответ…"
                    rows={4}
                    style={{ width: "100%", resize: "vertical", padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: `1.5px solid ${answer ? lvl.border : "rgba(255,255,255,0.12)"}`, outline: "none", color: "#fff", fontSize: 15, lineHeight: 1.6, fontFamily: "inherit", boxSizing: "border-box", marginBottom: 14 }}
                  />
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.35)" }}>⌘ Enter — отправить</span>
                  <motion.button whileHover={(!answer.trim() || loading) ? undefined : { scale: 1.02 }} whileTap={(!answer.trim() || loading) ? undefined : { scale: 0.96 }} onClick={submit} disabled={!answer.trim() || loading}
                    style={{ padding: "13px 26px", borderRadius: 14, border: "none", cursor: (!answer.trim() || loading) ? "default" : "pointer", background: `linear-gradient(135deg,${lvl.color},${lvl.color}cc)`, color: "#08070f", fontWeight: 700, fontSize: 15, boxShadow: `0 8px 20px ${lvl.color}44`, opacity: (!answer.trim() || loading) ? 0.5 : 1, fontFamily: "inherit" }}>
                    {loading ? "Проверяю…" : "Ответить →"}
                  </motion.button>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
