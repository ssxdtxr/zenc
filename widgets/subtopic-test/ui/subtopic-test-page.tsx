"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { ChevronLeftIcon } from "@/shared/ui/icons"
import { useRouter } from "next/navigation"
import { apiClient } from "@/shared/lib/api-client"
import { SUBTOPIC_STATUS_CONFIG, OVERALL_LEVEL_CONFIG } from "@/entities/topic/config"
import type { Topic } from "@/entities/topic/model/types"
import type { Message } from "@/entities/session/model/types"
import { useTutorSession, MAX_QUESTIONS } from "@/widgets/tutor-session/model/use-tutor-session"
import { AnswerForm } from "@/features/answer-question/ui/answer-form"
import { RichText } from "@/features/theory-view/ui/rich-text"
import { CheckIcon, CrossIcon } from "@/shared/ui/icons"
import type { ConfidenceLevel } from "@/features/confidence-picker/ui/confidence-picker"
import { fadeInUp, staggerContainer, springSnappy } from "@/shared/lib/motion"

type Props = { topicId: string; subtopicName: string }

const LEVEL_THEME: Record<string, { color: string; bg: string; border: string }> = {
  basic:        { color: "#86efac", bg: "rgba(74,222,128,0.14)",   border: "rgba(74,222,128,0.3)" },
  intermediate: { color: "#fbbf24", bg: "rgba(251,191,36,0.14)",   border: "rgba(251,191,36,0.3)" },
  advanced:     { color: "#f87171", bg: "rgba(248,113,113,0.14)",   border: "rgba(248,113,113,0.3)" },
}

const CONFIDENCE_OPTIONS: { level: ConfidenceLevel; label: string; icon: string; iconBg: string; iconColor: string }[] = [
  { level: 1, label: "Не уверен",  icon: "?", iconBg: "rgba(251,191,36,0.2)",  iconColor: "#fbbf24" },
  { level: 2, label: "Частично",   icon: "~", iconBg: "rgba(96,165,250,0.2)",   iconColor: "#60a5fa" },
  { level: 3, label: "Уверен",     icon: "✓", iconBg: "rgba(74,222,128,0.2)",   iconColor: "#4ade80" },
]

type EvalResult = { status: string; summary: string; recommendation: string }

function StatusResult({ prev, next, summary, recommendation, onRetry, onBack }: {
  prev: string | null; next: string; summary: string; recommendation: string
  onRetry: () => void; onBack: () => void
}) {
  const cfg = SUBTOPIC_STATUS_CONFIG[next as keyof typeof SUBTOPIC_STATUS_CONFIG]
  const prevCfg = prev ? SUBTOPIC_STATUS_CONFIG[prev as keyof typeof SUBTOPIC_STATUS_CONFIG] : null
  const improved = prev && prev !== next && (
    ["needs_work", "learning", "good", "expert"].indexOf(next) >
    ["needs_work", "learning", "good", "expert"].indexOf(prev)
  )

  return (
    <motion.div variants={staggerContainer(0.08)} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Status hero */}
      <div style={{ padding: "28px 26px", borderRadius: 20, background: cfg?.bg ?? "rgba(255,255,255,0.08)", border: `1.5px solid ${cfg?.border ?? "rgba(255,255,255,0.2)"}`, textAlign: "center" }}>
        {prevCfg && prev !== next && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 12 }}>
            {improved ? "↑ УЛУЧШИЛСЯ: " : "↓ ИЗМЕНИЛСЯ: "}
            <span style={{ color: prevCfg.color }}>{prevCfg.label}</span>
            {" → "}
            <span style={{ color: cfg?.color }}>{cfg?.label}</span>
          </div>
        )}
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.07em", color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>ТВОЙ УРОВЕНЬ ПО ПОДТЕМЕ</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: cfg?.color ?? "#fff", marginBottom: 6 }} className="font-display">{cfg?.label ?? next}</div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,0.75)" }}>{summary}</p>
      </div>

      {/* Recommendation */}
      <div style={{ padding: "16px 18px", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>ЧТО ДАЛЬШЕ</div>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "rgba(255,255,255,0.8)" }}>{recommendation}</p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onRetry} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#9b6bff,#6d3cff)", color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "inherit", boxShadow: "0 8px 22px rgba(109,60,255,0.4)" }}>
          Пройти снова →
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onBack} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.16)", cursor: "pointer", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: 15, fontFamily: "inherit" }}>
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
  const [finalMessages, setFinalMessages] = useState<Message[]>([])
  const [finalScore, setFinalScore] = useState(0)
  const [selectedConfidence, setSelectedConfidence] = useState<ConfidenceLevel | null>(null)

  useEffect(() => {
    apiClient.getTopicById(topicId).then(t => {
      setTopic(t)
      if (t) {
        const sub = t.currentSubtopics.find(s => s.name === subtopicName)
        if (sub) setPrevStatus(sub.status)
      }
    })
  }, [topicId, subtopicName])

  const handleComplete = useCallback(async (results: { score: number; total: number }, msgs: Message[]) => {
    setFinalMessages(msgs)
    setFinalScore(results.score)
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
  const statusCfg = subtopic ? SUBTOPIC_STATUS_CONFIG[subtopic.status] : null
  const BG = "radial-gradient(1200px 800px at 80% -10%, rgba(109,60,255,0.18), transparent 60%), radial-gradient(900px 700px at 0% 100%, rgba(240,82,156,0.13), transparent 55%), #08070f"

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: BG, overflow: "hidden" }}>
      {/* Blobs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", filter: "blur(70px)" }}>
        <div style={{ position: "absolute", top: "-8%", left: "8%", width: "38vw", height: "38vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #7c3cff, transparent 70%)", opacity: 0.46, animation: "drift1 26s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "22%", right: "-6%", width: "34vw", height: "34vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #2bd9e3, transparent 70%)", opacity: 0.26, animation: "drift2 30s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-12%", left: "34%", width: "40vw", height: "40vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #9b6bff, transparent 70%)", opacity: 0.22, animation: "drift3 34s ease-in-out infinite" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1040, margin: "0 auto", padding: "22px 28px 80px" }}>
        {/* NAV */}
        <nav style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 18px", borderRadius: 20, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px) saturate(150%)", WebkitBackdropFilter: "blur(24px) saturate(150%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 10px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)" }}>
          <button onClick={() => router.back()} style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.85)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeftIcon size={20} color="rgba(255,255,255,0.85)" /></button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{topic?.name}</div>
            <h1 className="font-display" style={{ margin: "1px 0 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtopicName}</h1>
          </div>
          {statusCfg && (
            <span style={{ padding: "6px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, flexShrink: 0 }}>
              {statusCfg.label}
            </span>
          )}
        </nav>

        {/* SESSION CARD */}
        <div style={{ marginTop: 18, borderRadius: 26, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(28px) saturate(150%)", WebkitBackdropFilter: "blur(28px) saturate(150%)", border: "1px solid rgba(255,255,255,0.13)", boxShadow: "0 18px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)", padding: "26px 30px 30px" }}>

          {evaluating && (
            <div style={{ padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2.5px solid transparent", borderTopColor: "#9b6bff", animation: "spin 0.8s linear infinite" }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Оцениваю твои знания по подтеме…</p>
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
    sessionState, answer, confidence, loading, error,
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

  const levelTheme = LEVEL_THEME[currentResponse?.difficulty ?? "basic"] ?? LEVEL_THEME.basic
  const isLastQuestion = questionCount >= MAX_QUESTIONS
  const progressPct = (questionCount / MAX_QUESTIONS) * 100

  if (sessionState === "analyzing") {
    return (
      <div style={{ padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2.5px solid transparent", borderTopColor: "#9b6bff", animation: "spin 0.8s linear infinite" }} />
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Анализирую результаты…</p>
      </div>
    )
  }

  return (
    <div>
      {/* Focus label */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, background: "rgba(155,107,255,0.12)", border: "1px solid rgba(155,107,255,0.3)", marginBottom: 20 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#9b6bff", boxShadow: "0 0 8px #9b6bff" }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Тест по подтеме · {subtopicName}</span>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
          <strong style={{ color: "#86efac", fontWeight: 700 }}>{correctCount}</strong> правильно
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{questionCount}/{MAX_QUESTIONS}</span>
      </div>
      <div style={{ height: 9, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden", marginBottom: 26 }}>
        <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#9b6bff,#2bd9e3)", width: `${progressPct}%`, transition: "width .5s ease" }} />
      </div>

      {/* Loading */}
      {loading && !currentResponse && (
        <div style={{ padding: "32px 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#9b6bff", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* Question */}
      {currentResponse && sessionState === "session" && (
        <motion.div key={`q-${questionCount}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, background: levelTheme.bg, color: levelTheme.color, border: `1px solid ${levelTheme.border}`, fontFamily: "inherit" }}>{questionCount}</span>
            <span style={{ fontWeight: 700, fontSize: 14.5, color: levelTheme.color }}>
              {currentResponse.difficulty === "basic" ? "Базовый" : currentResponse.difficulty === "intermediate" ? "Средний" : "Продвинутый"}
            </span>
          </div>

          {currentResponse.questionType === "choice" && currentResponse.options ? (
            <>
              <p style={{ margin: "0 0 20px", fontSize: 18, lineHeight: 1.6, color: "rgba(255,255,255,0.92)" }}>{currentResponse.question}</p>
              <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {currentResponse.options.map((opt, i) => {
                  const isSelected = answer === opt
                  return (
                    <motion.button key={i} variants={fadeInUp} whileHover={{ x: 2 }} whileTap={{ scale: 0.985 }} onClick={() => setAnswer(opt)} style={{ textAlign: "left", padding: "14px 18px", borderRadius: 14, border: `1.5px solid ${isSelected ? "rgba(155,107,255,0.5)" : "rgba(255,255,255,0.1)"}`, background: isSelected ? "rgba(155,107,255,0.15)" : "rgba(255,255,255,0.04)", color: isSelected ? "#fff" : "rgba(255,255,255,0.75)", fontWeight: isSelected ? 600 : 500, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, fontFamily: "inherit" }}>
                      <span style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: isSelected ? "#9b6bff" : "rgba(255,255,255,0.08)", color: isSelected ? "#fff" : "rgba(255,255,255,0.4)", border: `1px solid ${isSelected ? "transparent" : "rgba(255,255,255,0.12)"}` }}>{String.fromCharCode(65 + i)}</span>
                      {opt}
                    </motion.button>
                  )
                })}
              </motion.div>
            </>
          ) : (
            <p style={{ margin: "0 0 0", fontSize: 18, lineHeight: 1.6, color: "rgba(255,255,255,0.92)" }}>{currentResponse.question}</p>
          )}

          {/* Confidence */}
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.42)", marginBottom: 12, marginTop: 24 }}>НАСКОЛЬКО УВЕРЕН В ОТВЕТЕ?</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 11, marginBottom: 16 }}>
            {CONFIDENCE_OPTIONS.map(c => {
              const isSel = selectedConfidence === c.level
              return (
                <motion.button key={c.level} whileHover={{ y: -2 }} whileTap={{ scale: 0.93 }} animate={{ scale: isSel ? 1.05 : 1 }} transition={springSnappy} onClick={() => handleConfidence(c.level)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "14px 10px", borderRadius: 14, cursor: "pointer", background: isSel ? c.iconBg : "rgba(255,255,255,0.04)", border: `1.5px solid ${isSel ? c.iconColor : "rgba(255,255,255,0.1)"}`, fontFamily: "inherit" }}>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, background: c.iconBg, color: c.iconColor }}>{c.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: 13, color: isSel ? "#fff" : "rgba(255,255,255,0.55)" }}>{c.label}</span>
                </motion.button>
              )
            })}
          </div>

          {currentResponse.questionType === "text" && (
            <textarea ref={textareaRef} value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAnswer() }} placeholder="Напиши свой ответ…" style={{ width: "100%", minHeight: 140, resize: "vertical", padding: "16px 18px", borderRadius: 15, background: "rgba(255,255,255,0.04)", border: `1.5px solid ${answer ? "rgba(155,107,255,0.4)" : "rgba(255,255,255,0.12)"}`, outline: "none", color: "#fff", fontSize: 15, lineHeight: 1.6, fontFamily: "inherit", boxSizing: "border-box" }} />
          )}

          {error && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.35)", color: "#fca5a5", fontSize: 13 }}>{error}</div>}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleDontKnow} disabled={loading} style={{ marginTop: 12, width: "100%", padding: "11px", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.18)", background: "transparent", color: "rgba(255,255,255,0.45)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Не знаю / Пропустить
          </motion.button>

          <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ padding: "3px 8px", borderRadius: 7, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 12 }}>⌘ Enter</span>
            </span>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleAnswer} disabled={(!answer.trim() && currentResponse.questionType === "text") || loading} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 26px", borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#9b6bff,#6d3cff)", color: "#fff", fontWeight: 700, fontSize: 15, boxShadow: "0 10px 26px rgba(109,60,255,0.4)", opacity: ((!answer.trim() && currentResponse.questionType === "text") || loading) ? 0.5 : 1, fontFamily: "inherit" }}>
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
            <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, background: levelTheme.bg, color: levelTheme.color, border: `1px solid ${levelTheme.border}`, fontFamily: "inherit" }}>{questionCount}</span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.35)" }}>ВОПРОС</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "rgba(255,255,255,0.75)" }}>{lastQuestion}</p>
            </div>
          )}

          {/* User's answer */}
          <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>МОЙ ОТВЕТ</div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "rgba(255,255,255,0.75)", whiteSpace: "pre-wrap" }}>{lastAnswer}</p>
          </div>

          {currentResponse.evaluation && (() => {
            const isRight = currentResponse.isCorrect === true
            const isWrong = currentResponse.isCorrect === false
            const v = { icon: isRight ? "✓" : isWrong ? "✗" : "~", color: isRight ? "#5ee08a" : isWrong ? "#ff7e92" : "#ffbb5c", bg: isRight ? "rgba(94,224,138,0.1)" : isWrong ? "rgba(255,126,146,0.1)" : "rgba(255,187,92,0.1)", border: isRight ? "rgba(94,224,138,0.35)" : isWrong ? "rgba(255,126,146,0.35)" : "rgba(255,187,92,0.35)", label: isRight ? "Верно" : isWrong ? "Не верно" : "Частично" }
            return (
              <div style={{ padding: "16px 18px", borderRadius: 14, background: v.bg, border: `1.5px solid ${v.border}`, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: v.bg, border: `2px solid ${v.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: v.color, flexShrink: 0 }}>{v.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: v.color }}>{v.label}</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.8)" }}>{currentResponse.evaluation}</p>
              </div>
            )
          })()}

          {currentResponse.isCorrect === false && currentResponse.correctAnswer && (
            <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(94,224,138,0.08)", border: "1px solid rgba(94,224,138,0.28)", marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#5ee08a", marginBottom: 8 }}>ПРАВИЛЬНЫЙ ОТВЕТ</div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.62, color: "rgba(255,255,255,0.88)" }}>{currentResponse.correctAnswer}</p>
            </div>
          )}

          {currentResponse.explanation && (
            <div style={{ padding: "16px 18px", borderRadius: 14, background: "linear-gradient(135deg,rgba(155,107,255,0.1),rgba(43,217,227,0.05))", border: "1px solid rgba(155,107,255,0.22)", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#b69cff", marginBottom: 10 }}>ЧТО ВАЖНО</div>
              <RichText text={currentResponse.explanation} className="[&_p]:!text-[rgba(255,255,255,0.75)] [&_p]:!text-sm" />
            </div>
          )}

          {/* Follow-up chat */}
          <div style={{ marginTop: 6 }}>
            {followUpMessages.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                {followUpMessages.map((m, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ alignSelf: "flex-end", maxWidth: "85%", padding: "10px 14px", borderRadius: "14px 14px 4px 14px", background: "rgba(155,107,255,0.2)", border: "1px solid rgba(155,107,255,0.35)", fontSize: 13.5, color: "#fff", fontWeight: 500 }}>
                      {m.question}
                    </div>
                    <div style={{ alignSelf: "flex-start", maxWidth: "92%", padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <RichText text={m.answer} className="[&_p]:!text-sm [&_p]:!text-[rgba(255,255,255,0.82)]" />
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
                style={{ flex: 1, resize: "none", padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", outline: "none", color: "#fff", fontSize: 13.5, lineHeight: 1.5, fontFamily: "inherit" }}
              />
              <button
                onClick={() => { if (followUpInput.trim()) { askFollowUp(followUpInput); setFollowUpInput("") } }}
                disabled={!followUpInput.trim() || followUpLoading}
                style={{ padding: "10px 14px", borderRadius: 12, border: "none", cursor: "pointer", background: "rgba(155,107,255,0.25)", color: "#c4adff", fontWeight: 700, fontSize: 13, fontFamily: "inherit", flexShrink: 0, opacity: (!followUpInput.trim() || followUpLoading) ? 0.5 : 1 }}
              >
                {followUpLoading ? "…" : "Спросить"}
              </button>
            </div>
          </div>

          {!isLastQuestion ? (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={nextQuestion} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#9b6bff,#6d3cff)", color: "#fff", fontWeight: 700, fontSize: 15, boxShadow: "0 8px 22px rgba(109,60,255,0.4)", fontFamily: "inherit" }}>
              Следующий вопрос →
            </motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={nextQuestion} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#9b6bff,#6d3cff)", color: "#fff", fontWeight: 700, fontSize: 15, boxShadow: "0 8px 22px rgba(109,60,255,0.4)", fontFamily: "inherit" }}>
              Завершить тест →
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  )
}
