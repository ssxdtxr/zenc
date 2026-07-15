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
import { AppShell } from "@/widgets/app-shell/ui/app-shell"

type Props = { topicId: string; subtopicName: string; level: string }

const LEVEL_CONFIG: Record<string, { label: string; desc: string; dot: string; bg: string; border: string }> = {
  basic:        { label: "Базовый",     desc: "Определения и концепции", dot: "rgba(var(--fg-rgb),0.3)", bg: "var(--surface-2)",    border: "var(--border)" },
  intermediate: { label: "Средний",     desc: "Применение и нюансы",     dot: "rgba(var(--fg-rgb),0.6)", bg: "var(--surface)",       border: "var(--border)" },
  advanced:     { label: "Продвинутый", desc: "Edge cases и детали",     dot: "var(--text)",             bg: "var(--surface-hover)", border: "var(--border-strong)" },
}

function statusTheme(status: string) {
  const cfg = SUBTOPIC_STATUS_CONFIG[status as keyof typeof SUBTOPIC_STATUS_CONFIG] ?? SUBTOPIC_STATUS_CONFIG.needs_work
  return { bg: cfg.bg, border: cfg.border, text: cfg.color, label: cfg.label }
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

  useEffect(() => {
    apiClient.getTopicById(topicId)
      .then(t => t ? setTopic(t) : router.push("/"))
      .catch(() => router.push("/"))
  }, [topicId, router])

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
  const statusCfg = subtopic ? statusTheme(subtopic.status) : null
  const savedCfg = savedStatus ? statusTheme(savedStatus) : null

  return (
    <AppShell>
      <div style={{ position: "relative", flex: 1, background: "var(--bg)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "22px 24px 80px" }}>

          {/* HEADER */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 18, borderBottom: "1px solid var(--border)", marginBottom: 22, flexWrap: "wrap" }}>
            <button onClick={() => router.back()} style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeftIcon size={19} color="var(--text)" />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>{topic?.name} · {subtopicName}</div>
              <h1 className="font-display" style={{ fontWeight: 700, fontSize: 19, margin: "1px 0 0", color: "var(--text)" }}>Уровень: {lvl.label}</h1>
            </div>
            <span style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: lvl.bg, color: "var(--text-2)", border: `1px solid ${lvl.border}`, flexShrink: 0 }}>{lvl.desc}</span>
            {statusCfg && (
              <span style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: statusCfg.bg, color: statusCfg.text, border: `1px solid ${statusCfg.border}`, flexShrink: 0 }}>{statusCfg.label}</span>
            )}
          </div>

          {/* DONE / RESULT */}
          {phase === "done" && current && (
            <div style={{ borderRadius: 20, background: "var(--surface)", border: "1px solid var(--border)", padding: "28px 30px" }}>
              {saving ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "40px 0" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2.5px solid var(--border)", borderTopColor: "var(--text)", animation: "spin 0.8s linear infinite" }} />
                  <p style={{ margin: 0, fontSize: 14, color: "var(--text-2)" }}>Сохраняю результат…</p>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              ) : (
                <motion.div variants={staggerContainer(0.08)} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Hero */}
                  <motion.div variants={fadeInUp} style={{ padding: "26px 24px", borderRadius: 18, background: current.isComplete ? "var(--surface-2)" : "var(--surface-hover)", border: `1px solid ${current.isComplete ? "var(--border)" : "var(--border-strong)"}`, textAlign: "center" }}>
                    <div style={{ fontSize: 40 }}>{current.isComplete ? "🎯" : "📚"}</div>
                    <div className="font-display" style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", marginTop: 10, marginBottom: 6 }}>
                      {current.isComplete ? `${lvl.label} уровень освоен` : "Нужно больше практики"}
                    </div>
                    <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--text-2)" }}>{current.finishSummary}</p>
                  </motion.div>

                  {/* Stats */}
                  <motion.div variants={staggerContainer(0.05)} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Вопросов", value: questionCount },
                      { label: "Правильно", value: correctCount },
                      { label: "Уровень", value: lvl.label },
                    ].map(s => (
                      <motion.div key={s.label} variants={fadeInUp} style={{ padding: "14px", borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--border)", textAlign: "center" }}>
                        <div className="font-display" style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{s.value}</div>
                        <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600, marginTop: 3 }}>{s.label}</div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* New status */}
                  {savedCfg && (
                    <motion.div variants={fadeInUp} style={{ padding: "14px 18px", borderRadius: 14, background: savedCfg.bg, border: `1px solid ${savedCfg.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)" }}>НОВЫЙ СТАТУС ПОДТЕМЫ</span>
                      <span style={{ fontWeight: 800, fontSize: 15, color: savedCfg.text }}>{savedCfg.label}</span>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <motion.div variants={fadeInUp} style={{ display: "flex", gap: 10 }}>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => { started.current = false; setMessages([]); setCurrent(null); setQuestionCount(0); setCorrectCount(0); setPhase("session"); setLastQuestion(null); setLastAnswer(null); setSavedStatus(null); started.current = true; ask([]) }}
                      style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", cursor: "pointer", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "inherit" }}>
                      Пройти снова →
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => router.back()}
                      style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1px solid var(--border)", cursor: "pointer", background: "var(--surface-2)", color: "var(--text)", fontWeight: 600, fontSize: 15, fontFamily: "inherit" }}>
                      ← К теории
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </div>
          )}

          {/* SESSION / FEEDBACK */}
          {phase !== "done" && (
            <div style={{ borderRadius: 20, background: "var(--surface)", border: "1px solid var(--border)", padding: "26px 30px 30px" }}>

              {/* Progress */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: lvl.dot }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>Вопрос {questionCount + 1} · ИИ решает когда хватит</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{correctCount} верных</span>
              </div>

              {/* INITIAL LOADING */}
              {loading && !current && (
                <div style={{ padding: "48px 0", display: "flex", justifyContent: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--text)", animation: "spin 0.8s linear infinite" }} />
                </div>
              )}

              <AnimatePresence mode="wait">
              {/* FEEDBACK PHASE */}
              {phase === "feedback" && current && (
                <motion.div key="feedback" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
                  {lastQuestion && (
                    <div style={{ padding: "13px 16px", borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--border)", marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 5 }}>ВОПРОС</div>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-2)" }}>{lastQuestion}</p>
                    </div>
                  )}
                  {lastAnswer && (
                    <div style={{ padding: "13px 16px", borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--border)", marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 5 }}>МОЙ ОТВЕТ</div>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-2)", whiteSpace: "pre-wrap" }}>{lastAnswer}</p>
                    </div>
                  )}

                  {/* Loading eval */}
                  {loading && (
                    <div style={{ padding: "32px 0", display: "flex", justifyContent: "center" }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--text)", animation: "spin 0.8s linear infinite" }} />
                    </div>
                  )}

                  {!loading && current.evaluation && (() => {
                    const isRight = current.isCorrect === true
                    const isWrong = current.isCorrect === false
                    const v = {
                      icon: isRight ? "✓" : isWrong ? "✗" : "~",
                      label: isRight ? "Верно" : isWrong ? "Не верно" : "Частично",
                      bg: isWrong ? "var(--surface-hover)" : "var(--surface-2)",
                      border: isWrong ? "var(--border-strong)" : "var(--border)",
                    }
                    return (
                      <div>
                        <div style={{ padding: "16px 18px", borderRadius: 14, background: v.bg, border: `1.5px solid ${v.border}`, marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
                            <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--surface)", border: "2px solid var(--text)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "var(--text)", flexShrink: 0 }}>{v.icon}</span>
                            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{v.label}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--text-2)" }}>{current.evaluation}</p>
                        </div>

                        {isWrong && current.correctAnswer && (
                          <div style={{ padding: "14px 18px", borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--border)", marginBottom: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text)", marginBottom: 7 }}>ПРАВИЛЬНЫЙ ОТВЕТ</div>
                            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.62, color: "var(--text)" }}>{current.correctAnswer}</p>
                          </div>
                        )}

                        {current.explanation && (
                          <div style={{ padding: "14px 18px", borderRadius: 14, background: "var(--surface-hover)", border: "1px solid var(--border-strong)", marginBottom: 14 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text)", marginBottom: 8 }}>ЧТО ВАЖНО</div>
                            <RichText text={current.explanation} className="[&_p]:!text-[var(--text-2)] [&_p]:!text-sm" />
                          </div>
                        )}

                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={next} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", cursor: "pointer", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "inherit" }}>
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
                  <p style={{ margin: "0 0 20px", fontSize: 18, lineHeight: 1.65, color: "var(--text)" }}>{current.question}</p>

                  {current.questionType === "choice" && current.options ? (
                    <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                      {current.options.map((opt, i) => {
                        const sel = answer === opt
                        return (
                          <motion.button key={i} variants={fadeInUp} whileHover={{ x: 2 }} whileTap={{ scale: 0.985 }} onClick={() => selectOption(opt)} style={{ textAlign: "left", padding: "14px 18px", borderRadius: 14, border: `1.5px solid ${sel ? "var(--border-strong)" : "var(--border)"}`, background: sel ? "var(--surface-hover)" : "var(--surface-2)", color: sel ? "var(--text)" : "var(--text-2)", fontWeight: sel ? 600 : 500, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, fontFamily: "inherit" }}>
                            <span style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: sel ? "var(--accent)" : "var(--surface)", color: sel ? "#fff" : "var(--text-3)", border: `1px solid ${sel ? "transparent" : "var(--border)"}` }}>{String.fromCharCode(65 + i)}</span>
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
                      style={{ width: "100%", resize: "vertical", padding: "14px 16px", borderRadius: 14, background: "var(--surface-2)", border: `1.5px solid ${answer ? "var(--border-strong)" : "var(--border)"}`, outline: "none", color: "var(--text)", fontSize: 15, lineHeight: 1.6, fontFamily: "inherit", boxSizing: "border-box", marginBottom: 14 }}
                    />
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>⌘ Enter — отправить</span>
                    <motion.button whileHover={(!answer.trim() || loading) ? undefined : { scale: 1.02 }} whileTap={(!answer.trim() || loading) ? undefined : { scale: 0.96 }} onClick={submit} disabled={!answer.trim() || loading}
                      style={{ padding: "13px 26px", borderRadius: 14, border: "none", cursor: (!answer.trim() || loading) ? "default" : "pointer", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 15, opacity: (!answer.trim() || loading) ? 0.5 : 1, fontFamily: "inherit" }}>
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
    </AppShell>
  )
}
