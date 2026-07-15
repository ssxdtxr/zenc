"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { ChevronLeftIcon } from "@/shared/ui/icons"
import { useRouter } from "next/navigation"
import { apiClient } from "@/shared/lib/api-client"
import { SUBTOPIC_STATUS_CONFIG, VERDICT_COLORS } from "@/entities/topic/config"
import type { Topic } from "@/entities/topic/model/types"
import type { Message } from "@/entities/session/model/types"
import { useTutorSession, MAX_QUESTIONS } from "@/widgets/tutor-session/model/use-tutor-session"
import { RichText } from "@/features/theory-view/ui/rich-text"
import type { ConfidenceLevel } from "@/features/confidence-picker/ui/confidence-picker"
import { fadeInUp, staggerContainer, springSnappy } from "@/shared/lib/motion"
import { AppShell } from "@/widgets/app-shell/ui/app-shell"

type Props = { topicId: string; subtopicName: string }

const CONFIDENCE_OPTIONS: { level: ConfidenceLevel; label: string; icon: string }[] = [
  { level: 1, label: "Не уверен", icon: "?" },
  { level: 2, label: "Частично",  icon: "~" },
  { level: 3, label: "Уверен",    icon: "✓" },
]

type EvalResult = { status: string; summary: string; recommendation: string }

function statusTheme(status: string) {
  const cfg = SUBTOPIC_STATUS_CONFIG[status as keyof typeof SUBTOPIC_STATUS_CONFIG] ?? SUBTOPIC_STATUS_CONFIG.needs_work
  return { bg: cfg.bg, border: cfg.border, text: cfg.color, label: cfg.label }
}

function StatusResult({ prev, next, summary, recommendation, onRetry, onBack }: {
  prev: string | null; next: string; summary: string; recommendation: string
  onRetry: () => void; onBack: () => void
}) {
  const cfg = statusTheme(next)
  const prevCfg = prev ? statusTheme(prev) : null
  const improved = prev && prev !== next && (
    ["needs_work", "learning", "good", "expert"].indexOf(next) >
    ["needs_work", "learning", "good", "expert"].indexOf(prev)
  )

  return (
    <motion.div variants={staggerContainer(0.08)} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Status hero */}
      <div style={{ padding: "28px 26px", borderRadius: 18, background: cfg.bg, border: `1.5px solid ${cfg.border}`, textAlign: "center" }}>
        {prevCfg && prev !== next && (
          <div style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 12 }}>
            {improved ? "↑ УЛУЧШИЛСЯ: " : "↓ ИЗМЕНИЛСЯ: "}
            <span style={{ color: "var(--text-2)" }}>{prevCfg.label}</span>
            {" → "}
            <span style={{ color: "var(--text)" }}>{cfg.label}</span>
          </div>
        )}
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.07em", color: "var(--text-3)", marginBottom: 8 }}>ТВОЙ УРОВЕНЬ ПО ПОДТЕМЕ</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", marginBottom: 6 }} className="font-display">{cfg.label}</div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--text-2)" }}>{summary}</p>
      </div>

      {/* Recommendation */}
      <div style={{ padding: "16px 18px", borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 8 }}>ЧТО ДАЛЬШЕ</div>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "var(--text-2)" }}>{recommendation}</p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onRetry} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", cursor: "pointer", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "inherit" }}>
          Пройти снова →
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onBack} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1px solid var(--border)", cursor: "pointer", background: "var(--surface-2)", color: "var(--text)", fontWeight: 600, fontSize: 15, fontFamily: "inherit" }}>
          ← К теории
        </motion.button>
      </div>
    </motion.div>
  )
}

export const SubtopicTestPage = ({ topicId, subtopicName }: Props) => {
  const router = useRouter()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [sessionKey, setSessionKey] = useState(0)
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null)
  const [evaluating, setEvaluating] = useState(false)
  const [prevStatus, setPrevStatus] = useState<string | null>(null)

  useEffect(() => {
    apiClient.getTopicById(topicId).then(t => {
      if (!t) { router.push("/"); return }
      setTopic(t)
      const sub = t.currentSubtopics.find(s => s.name === subtopicName)
      if (sub) setPrevStatus(sub.status)
    }).catch(() => router.push("/"))
  }, [topicId, subtopicName, router])

  const handleComplete = useCallback(async (results: { score: number; total: number }, msgs: Message[]) => {
    setEvaluating(true)
    try {
      const res = await fetch("/api/subtopic-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          topicName: topic?.name ?? "",
          subtopicName,
          messages: msgs,
          score: results.score,
          total: results.total,
        }),
      })
      const data = await res.json()
      if (res.ok) setEvalResult(data)
    } finally {
      setEvaluating(false)
    }
  }, [topicId, subtopicName, topic])

  const retry = () => {
    setEvalResult(null)
    setSessionKey(k => k + 1)
  }

  const subtopic = topic?.currentSubtopics.find(s => s.name === subtopicName)
  const statusCfg = subtopic ? statusTheme(subtopic.status) : null

  return (
    <AppShell>
      <div style={{ position: "relative", flex: 1, background: "var(--bg)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "22px 24px 80px" }}>
          {/* HEADER */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 18, borderBottom: "1px solid var(--border)" }}>
            <button onClick={() => router.back()} style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeftIcon size={19} color="var(--text)" /></button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600 }}>{topic?.name}</div>
              <h1 className="font-display" style={{ margin: "1px 0 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtopicName}</h1>
            </div>
            {statusCfg && (
              <span style={{ padding: "6px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, background: statusCfg.bg, color: statusCfg.text, border: `1px solid ${statusCfg.border}`, flexShrink: 0 }}>
                {statusCfg.label}
              </span>
            )}
          </div>

          {/* SESSION CARD */}
          <div style={{ marginTop: 18, borderRadius: 20, background: "var(--surface)", border: "1px solid var(--border)", padding: "26px 30px 30px" }}>

            {evaluating && (
              <div style={{ padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2.5px solid var(--border)", borderTopColor: "var(--text)", animation: "spin 0.8s linear infinite" }} />
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>Оцениваю твои знания по подтеме…</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            {!evaluating && evalResult && (
              <StatusResult
                prev={prevStatus}
                next={evalResult.status}
                summary={evalResult.summary}
                recommendation={evalResult.recommendation}
                onRetry={retry}
                onBack={() => router.back()}
              />
            )}

            {!evaluating && !evalResult && (
              <SubtopicSession
                key={sessionKey}
                topicId={topicId}
                topicName={topic?.name ?? ""}
                subtopicName={subtopicName}
                onComplete={handleComplete}
              />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// Inner session component
function SubtopicSession({ topicId, topicName, subtopicName, onComplete }: {
  topicId: string; topicName: string; subtopicName: string
  onComplete: (results: { score: number; total: number }, messages: Message[]) => void
}) {
  const [selectedConfidence, setSelectedConfidence] = useState<ConfidenceLevel | null>(null)
  const [collectedMessages, setCollectedMessages] = useState<Message[]>([])
  const [followUpInput, setFollowUpInput] = useState("")

  const {
    sessionState, answer, loading, error,
    questionCount, correctCount, currentResponse, textareaRef,
    followUpMessages, followUpLoading, lastQuestion, lastAnswer,
    setAnswer, setConfidence, submitAnswer, submitDontKnow, askFollowUp, nextQuestion,
  } = useTutorSession({
    topicId,
    topicName,
    focusSubtopics: [subtopicName],
    onComplete: (results) => {
      // Intercept: call parent with messages
      onComplete({ score: results.score, total: results.total }, collectedMessages)
    },
  })

  // Track messages for eval
  useEffect(() => {
    if (currentResponse?.assistantMessage) {
      setCollectedMessages(prev => {
        const last = prev[prev.length - 1]
        if (last?.content === currentResponse.assistantMessage) return prev
        return [...prev, { role: "assistant" as const, content: currentResponse.assistantMessage }]
      })
    }
  }, [currentResponse])

  const handleAnswer = async () => {
    if (answer.trim()) {
      setCollectedMessages(prev => [...prev, { role: "user" as const, content: answer }])
    }
    await submitAnswer()
  }

  const handleDontKnow = async () => {
    setCollectedMessages(prev => [...prev, { role: "user" as const, content: "Не знаю ответа." }])
    await submitDontKnow()
  }

  const handleConfidence = (v: ConfidenceLevel) => {
    setSelectedConfidence(v)
    setConfidence(v)
  }

  const isLastQuestion = questionCount >= MAX_QUESTIONS
  const progressPct = (questionCount / MAX_QUESTIONS) * 100

  if (sessionState === "analyzing") {
    return (
      <div style={{ padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2.5px solid var(--border)", borderTopColor: "var(--text)", animation: "spin 0.8s linear infinite" }} />
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>Анализирую результаты…</p>
      </div>
    )
  }

  return (
    <div>
      {/* Focus label */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, background: "var(--surface-2)", border: "1px solid var(--border)", marginBottom: 20 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--text)" }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>Тест по подтеме · {subtopicName}</span>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-2)" }}>
          <strong style={{ color: "var(--text)", fontWeight: 700 }}>{correctCount}</strong> правильно
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-2)" }}>{questionCount}/{MAX_QUESTIONS}</span>
      </div>
      <div style={{ height: 9, borderRadius: 999, background: "var(--border)", overflow: "hidden", marginBottom: 26 }}>
        <div style={{ height: "100%", borderRadius: 999, background: "var(--accent)", width: `${progressPct}%`, transition: "width .5s ease" }} />
      </div>

      {/* Loading */}
      {loading && !currentResponse && (
        <div style={{ padding: "32px 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--text)", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* Question */}
      {currentResponse && sessionState === "session" && (
        <motion.div key={`q-${questionCount}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)", fontFamily: "inherit" }}>{questionCount}</span>
            <span style={{ fontWeight: 700, fontSize: 14.5, color: "var(--text)" }}>
              {currentResponse.difficulty === "basic" ? "Базовый" : currentResponse.difficulty === "intermediate" ? "Средний" : "Продвинутый"}
            </span>
          </div>

          {currentResponse.questionType === "choice" && currentResponse.options ? (
            <>
              <p style={{ margin: "0 0 20px", fontSize: 18, lineHeight: 1.6, color: "var(--text)" }}>{currentResponse.question}</p>
              <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {currentResponse.options.map((opt, i) => {
                  const isSelected = answer === opt
                  return (
                    <motion.button key={i} variants={fadeInUp} whileHover={{ x: 2 }} whileTap={{ scale: 0.985 }} onClick={() => setAnswer(opt)} style={{ textAlign: "left", padding: "14px 18px", borderRadius: 14, border: `1.5px solid ${isSelected ? "var(--border-strong)" : "var(--border)"}`, background: isSelected ? "var(--surface-hover)" : "var(--surface-2)", color: isSelected ? "var(--text)" : "var(--text-2)", fontWeight: isSelected ? 600 : 500, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, fontFamily: "inherit" }}>
                      <span style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: isSelected ? "var(--accent)" : "var(--surface)", color: isSelected ? "#fff" : "var(--text-3)", border: `1px solid ${isSelected ? "transparent" : "var(--border)"}` }}>{String.fromCharCode(65 + i)}</span>
                      {opt}
                    </motion.button>
                  )
                })}
              </motion.div>
            </>
          ) : (
            <p style={{ margin: "0 0 0", fontSize: 18, lineHeight: 1.6, color: "var(--text)" }}>{currentResponse.question}</p>
          )}

          {/* Confidence */}
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 12, marginTop: 24 }}>НАСКОЛЬКО УВЕРЕН В ОТВЕТЕ?</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 11, marginBottom: 16 }}>
            {CONFIDENCE_OPTIONS.map(c => {
              const isSel = selectedConfidence === c.level
              return (
                <motion.button key={c.level} whileHover={{ y: -2 }} whileTap={{ scale: 0.93 }} animate={{ scale: isSel ? 1.05 : 1 }} transition={springSnappy} onClick={() => handleConfidence(c.level)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "14px 10px", borderRadius: 14, cursor: "pointer", background: isSel ? "var(--surface-hover)" : "var(--surface-2)", border: `1.5px solid ${isSel ? "var(--border-strong)" : "var(--border)"}`, fontFamily: "inherit" }}>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, background: "var(--surface)", color: "var(--text)" }}>{c.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: 13, color: isSel ? "var(--text)" : "var(--text-2)" }}>{c.label}</span>
                </motion.button>
              )
            })}
          </div>

          {currentResponse.questionType === "text" && (
            <textarea ref={textareaRef} value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAnswer() }} placeholder="Напиши свой ответ…" style={{ width: "100%", minHeight: 140, resize: "vertical", padding: "16px 18px", borderRadius: 15, background: "var(--surface-2)", border: `1.5px solid ${answer ? "var(--border-strong)" : "var(--border)"}`, outline: "none", color: "var(--text)", fontSize: 15, lineHeight: 1.6, fontFamily: "inherit", boxSizing: "border-box" }} />
          )}

          {error && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#dc2626", fontSize: 13 }}>{error}</div>}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleDontKnow} disabled={loading} style={{ marginTop: 12, width: "100%", padding: "11px", borderRadius: 12, border: "1px dashed var(--border)", background: "transparent", color: "var(--text-3)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Не знаю / Пропустить
          </motion.button>

          <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ padding: "3px 8px", borderRadius: 7, background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 12 }}>⌘ Enter</span>
            </span>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleAnswer} disabled={(!answer.trim() && currentResponse.questionType === "text") || loading} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 26px", borderRadius: 14, border: "none", cursor: "pointer", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 15, opacity: ((!answer.trim() && currentResponse.questionType === "text") || loading) ? 0.5 : 1, fontFamily: "inherit" }}>
              {loading ? "Проверяю…" : "Ответить →"}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Feedback */}
      {currentResponse && sessionState === "feedback" && (
        <motion.div key={`f-${questionCount}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
          {/* Question */}
          {lastQuestion && (
            <div style={{ padding: "14px 18px", borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--border)", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", fontFamily: "inherit" }}>{questionCount}</span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-3)" }}>ВОПРОС</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-2)" }}>{lastQuestion}</p>
            </div>
          )}

          {/* User's answer */}
          <div style={{ padding: "14px 18px", borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--border)", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 6 }}>МОЙ ОТВЕТ</div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-2)", whiteSpace: "pre-wrap" }}>{lastAnswer}</p>
          </div>

          {currentResponse.evaluation && (() => {
            const isWrong = currentResponse.isCorrect === false
            const c = currentResponse.isCorrect === true ? VERDICT_COLORS.correct : isWrong ? VERDICT_COLORS.incorrect : VERDICT_COLORS.partial
            const v = { icon: currentResponse.isCorrect === true ? "✓" : isWrong ? "✗" : "~", label: currentResponse.isCorrect === true ? "Верно" : isWrong ? "Не верно" : "Частично", ...c }
            return (
              <div style={{ padding: "16px 18px", borderRadius: 14, background: v.bg, border: `1.5px solid ${v.border}`, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--surface)", border: `2px solid ${v.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: v.color, flexShrink: 0 }}>{v.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: v.color }}>{v.label}</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--text-2)" }}>{currentResponse.evaluation}</p>
              </div>
            )
          })()}

          {currentResponse.isCorrect === false && currentResponse.correctAnswer && (
            <div style={{ padding: "14px 18px", borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--border)", marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text)", marginBottom: 8 }}>ПРАВИЛЬНЫЙ ОТВЕТ</div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.62, color: "var(--text)" }}>{currentResponse.correctAnswer}</p>
            </div>
          )}

          {currentResponse.explanation && (
            <div style={{ padding: "16px 18px", borderRadius: 14, background: "var(--surface-hover)", border: "1px solid var(--border-strong)", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text)", marginBottom: 10 }}>ЧТО ВАЖНО</div>
              <RichText text={currentResponse.explanation} className="[&_p]:!text-[var(--text-2)] [&_p]:!text-sm" />
            </div>
          )}

          {/* Follow-up chat */}
          <div style={{ marginTop: 6 }}>
            {followUpMessages.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                {followUpMessages.map((m, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ alignSelf: "flex-end", maxWidth: "85%", padding: "10px 14px", borderRadius: "14px 14px 4px 14px", background: "var(--surface-hover)", border: "1px solid var(--border-strong)", fontSize: 13.5, color: "var(--text)", fontWeight: 500 }}>
                      {m.question}
                    </div>
                    <div style={{ alignSelf: "flex-start", maxWidth: "92%", padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      <RichText text={m.answer} className="[&_p]:!text-sm [&_p]:!text-[var(--text-2)]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 14 }}>
              <textarea
                value={followUpInput}
                onChange={e => setFollowUpInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && followUpInput.trim()) {
                    askFollowUp(followUpInput); setFollowUpInput("")
                  }
                }}
                placeholder="Задай уточняющий вопрос…"
                rows={2}
                style={{ flex: 1, resize: "none", padding: "10px 14px", borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border)", outline: "none", color: "var(--text)", fontSize: 13.5, lineHeight: 1.5, fontFamily: "inherit" }}
              />
              <button
                onClick={() => { if (followUpInput.trim()) { askFollowUp(followUpInput); setFollowUpInput("") } }}
                disabled={!followUpInput.trim() || followUpLoading}
                style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid var(--border)", cursor: "pointer", background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 13, fontFamily: "inherit", flexShrink: 0, opacity: (!followUpInput.trim() || followUpLoading) ? 0.5 : 1 }}
              >
                {followUpLoading ? "…" : "Спросить"}
              </button>
            </div>
          </div>

          {!isLastQuestion ? (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={nextQuestion} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", cursor: "pointer", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "inherit" }}>
              Следующий вопрос →
            </motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={nextQuestion} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", cursor: "pointer", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "inherit" }}>
              Завершить тест →
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  )
}
