"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { ChevronDownIcon } from "@/shared/ui/icons"
import { SessionResults } from "@/features/session-results/ui/session-results"
import { RichText } from "@/features/theory-view/ui/rich-text"
import type { SessionRecord } from "@/entities/topic/model/types"
import { MAX_QUESTIONS, useTutorSession } from "../model/use-tutor-session"
import type { ConfidenceLevel } from "@/features/confidence-picker/ui/confidence-picker"
import { fadeInUp, staggerContainer, springSnappy } from "@/shared/lib/motion"

const LEVEL_THEME: Record<string, { color: string; bg: string; border: string }> = {
  basic:        { color: "#86efac", bg: "rgba(74,222,128,0.14)",   border: "rgba(74,222,128,0.3)" },
  intermediate: { color: "#fbbf24", bg: "rgba(251,191,36,0.14)",   border: "rgba(251,191,36,0.3)" },
  advanced:     { color: "#f87171", bg: "rgba(248,113,113,0.14)",   border: "rgba(248,113,113,0.3)" },
}

const CONFIDENCE_OPTIONS: { level: ConfidenceLevel; label: string; icon: string; bg: string; border: string; iconBg: string; iconColor: string; textColor: string }[] = [
  { level: 1, label: "Не уверен",  icon: "?", bg: "rgba(var(--fg-rgb),0.04)", border: "rgba(var(--fg-rgb),0.12)", iconBg: "rgba(251,191,36,0.2)",  iconColor: "#fbbf24", textColor: "rgba(var(--fg-rgb),0.65)" },
  { level: 2, label: "Частично",   icon: "~", bg: "rgba(var(--fg-rgb),0.04)", border: "rgba(var(--fg-rgb),0.12)", iconBg: "rgba(96,165,250,0.2)",   iconColor: "#60a5fa", textColor: "rgba(var(--fg-rgb),0.65)" },
  { level: 3, label: "Уверен",     icon: "✓", bg: "rgba(var(--fg-rgb),0.04)", border: "rgba(var(--fg-rgb),0.12)", iconBg: "rgba(74,222,128,0.2)",   iconColor: "#4ade80", textColor: "rgba(var(--fg-rgb),0.65)" },
]

type Props = {
  topicId: string
  topicName: string
  focusSubtopics?: string[]
  previousSubtopics?: { name: string; status: string }[]
  overallLevel?: string | null
  onComplete: (results: Omit<SessionRecord, "id" | "date">) => void
  onBack: () => void
  onNewSession: () => void
}

export const TutorSession = ({ topicId, topicName, focusSubtopics, previousSubtopics, overallLevel, onComplete, onBack, onNewSession }: Props) => {
  const [followUpInput, setFollowUpInput] = useState("")
  const followUpRef = useRef<HTMLTextAreaElement>(null)

  const {
    sessionState, answer, confidence, loading, error,
    questionCount, correctCount, currentResponse, results, textareaRef,
    followUpMessages, followUpLoading, lastQuestion, lastAnswer,
    setAnswer, setConfidence, submitAnswer, submitDontKnow, askFollowUp, nextQuestion,
  } = useTutorSession({ topicId, topicName, focusSubtopics, previousSubtopics, overallLevel, onComplete })

  const [focusOpen, setFocusOpen] = useState(false)
  const [selectedConfidence, setSelectedConfidence] = useState<ConfidenceLevel | null>(confidence)

  const handleConfidence = (v: ConfidenceLevel) => {
    setSelectedConfidence(v)
    setConfidence(v)
  }

  const hasFocus = focusSubtopics && focusSubtopics.length > 0
  const isLastQuestion = questionCount >= MAX_QUESTIONS
  const progressPct = (questionCount / MAX_QUESTIONS) * 100
  const levelTheme = LEVEL_THEME[currentResponse?.difficulty ?? "basic"] ?? LEVEL_THEME.basic

  if (sessionState === "analyzing") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2.5px solid transparent", borderTopColor: "#9b6bff", animation: "spin 0.8s linear infinite" }} />
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "rgba(var(--fg-rgb),0.55)" }}>Анализирую твои знания…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </motion.div>
    )
  }

  if (sessionState === "results" && results) {
    return <SessionResults topicName={topicName} results={results} onNewSession={onNewSession} onBack={onBack} />
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* FOCUS TOPICS */}
      {hasFocus && (
        <>
          <button onClick={() => setFocusOpen(o => !o)} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 16px", borderRadius: 14, cursor: "pointer", background: "rgba(var(--fg-rgb),0.04)", border: "1px solid rgba(var(--fg-rgb),0.1)", fontFamily: "inherit", marginBottom: 22 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 13.5, fontWeight: 600, color: "rgba(var(--fg-rgb),0.65)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#9b6bff", boxShadow: "0 0 8px #9b6bff", flexShrink: 0 }} />
              Фокус сессии · {focusSubtopics.length} тем
            </span>
            <span style={{ fontSize: 15, color: "rgba(var(--fg-rgb),0.4)", display: "inline-block", transform: focusOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s ease" }}><ChevronDownIcon size={15} color="rgba(var(--fg-rgb),0.4)" /></span>
          </button>
          {focusOpen && (
            <div style={{ marginTop: -14, marginBottom: 22, display: "flex", flexWrap: "wrap", gap: 7 }}>
              {focusSubtopics.map(ft => (
                <span key={ft} style={{ padding: "6px 11px", borderRadius: 999, background: "rgba(var(--fg-rgb),0.05)", border: "1px solid rgba(var(--fg-rgb),0.1)", fontSize: 12.5, fontWeight: 500, color: "rgba(var(--fg-rgb),0.65)" }}>{ft}</span>
              ))}
            </div>
          )}
        </>
      )}

      {/* PROGRESS */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "rgba(var(--fg-rgb),0.55)" }}>
          <strong style={{ color: "#86efac", fontWeight: 700 }}>{correctCount}</strong> правильно
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "rgba(var(--fg-rgb),0.7)" }}>{questionCount}/{MAX_QUESTIONS}</span>
      </div>
      <div style={{ height: 9, borderRadius: 999, background: "rgba(var(--fg-rgb),0.1)", overflow: "hidden", marginBottom: 26 }}>
        <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#9b6bff,#2bd9e3)", width: `${progressPct}%`, transition: "width .5s ease" }} />
      </div>

      {/* LOADING (first question) */}
      {loading && !currentResponse && (
        <div style={{ padding: "32px 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#9b6bff", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* QUESTION + ANSWER */}
      {currentResponse && sessionState === "session" && (
        <motion.div key={`q-${questionCount}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {/* Question number + level */}
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, background: levelTheme.bg, color: levelTheme.color, border: `1px solid ${levelTheme.border}`, fontFamily: "inherit" }}>{questionCount}</span>
            <span style={{ fontWeight: 700, fontSize: 14.5, color: levelTheme.color }}>
              {currentResponse.difficulty === "basic" ? "Базовый" : currentResponse.difficulty === "intermediate" ? "Средний" : "Продвинутый"}
            </span>
          </div>

          {/* Question text */}
          <p style={{ margin: "0 0 26px", fontSize: 19, lineHeight: 1.6, color: "rgba(var(--fg-rgb),0.92)", fontWeight: 400 }}>
            {currentResponse.question}
          </p>

          {/* CHOICE OPTIONS */}
          {currentResponse.questionType === "choice" && currentResponse.options && (
            <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {currentResponse.options.map((opt, i) => {
                const isSelected = answer === opt
                return (
                  <motion.button key={i} variants={fadeInUp} whileHover={{ x: 2 }} whileTap={{ scale: 0.985 }} onClick={() => setAnswer(opt)} style={{ textAlign: "left", padding: "14px 18px", borderRadius: 14, border: `1.5px solid ${isSelected ? "rgba(155,107,255,0.5)" : "rgba(var(--fg-rgb),0.1)"}`, background: isSelected ? "rgba(155,107,255,0.15)" : "rgba(var(--fg-rgb),0.04)", color: isSelected ? "var(--text)" : "rgba(var(--fg-rgb),0.75)", fontWeight: isSelected ? 600 : 500, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, fontFamily: "inherit" }}>
                    <span style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: isSelected ? "#9b6bff" : "rgba(var(--fg-rgb),0.08)", color: isSelected ? "var(--text)" : "rgba(var(--fg-rgb),0.4)", border: `1px solid ${isSelected ? "transparent" : "rgba(var(--fg-rgb),0.12)"}` }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </motion.button>
                )
              })}
            </motion.div>
          )}

          {/* CONFIDENCE */}
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(var(--fg-rgb),0.42)", marginBottom: 12 }}>НАСКОЛЬКО УВЕРЕН В ОТВЕТЕ?</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 11, marginBottom: 16 }}>
            {CONFIDENCE_OPTIONS.map(c => {
              const isSelected = selectedConfidence === c.level
              return (
                <motion.button key={c.level} whileHover={{ y: -2 }} whileTap={{ scale: 0.93 }} animate={{ scale: isSelected ? 1.05 : 1 }} transition={springSnappy} onClick={() => handleConfidence(c.level)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 12px", borderRadius: 15, cursor: "pointer", background: isSelected ? c.iconBg : c.bg, border: `1.5px solid ${isSelected ? c.iconColor : c.border}`, fontFamily: "inherit" }}>
                  <span style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, background: c.iconBg, color: c.iconColor }}>{c.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: isSelected ? "var(--text)" : c.textColor }}>{c.label}</span>
                </motion.button>
              )
            })}
          </div>

          {/* TEXTAREA (text questions) */}
          {currentResponse.questionType === "text" && (
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitAnswer() }}
              placeholder="Напиши свой ответ…"
              style={{ width: "100%", minHeight: 160, resize: "vertical", padding: "18px 20px", borderRadius: 16, background: "rgba(var(--fg-rgb),0.04)", border: `1.5px solid ${answer ? "rgba(155,107,255,0.4)" : "rgba(var(--fg-rgb),0.12)"}`, outline: "none", color: "var(--text)", fontSize: 15.5, lineHeight: 1.6, fontFamily: "inherit", boxSizing: "border-box", transition: "border-color .2s ease" }}
            />
          )}

          {/* ERROR */}
          {error && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.35)", color: "#fca5a5", fontSize: 13 }}>{error}</div>}

          {/* DONT KNOW */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={submitDontKnow} disabled={loading} style={{ marginTop: 12, width: "100%", padding: "11px", borderRadius: 12, border: "1px dashed rgba(var(--fg-rgb),0.18)", background: "transparent", color: "rgba(var(--fg-rgb),0.45)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Не знаю / Не знаком с темой
          </motion.button>

          {/* SUBMIT ROW */}
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 13, color: "rgba(var(--fg-rgb),0.4)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ padding: "3px 8px", borderRadius: 7, background: "rgba(var(--fg-rgb),0.07)", border: "1px solid rgba(var(--fg-rgb),0.12)", fontSize: 12 }}>⌘ Enter</span>
              отправить
            </span>
            <motion.button whileHover={loading ? undefined : { scale: 1.02 }} whileTap={loading ? undefined : { scale: 0.96 }} onClick={submitAnswer} disabled={(!answer.trim() && currentResponse.questionType === "text") || loading} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", background: "linear-gradient(135deg,#9b6bff,#6d3cff)", color: "#fff", fontWeight: 700, fontSize: 15.5, boxShadow: "0 10px 26px rgba(109,60,255,0.4)", opacity: ((!answer.trim() && currentResponse.questionType === "text") || loading) ? 0.5 : 1, fontFamily: "inherit" }}>
              {loading ? "Проверяю…" : "Ответить →"}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* FEEDBACK / REVIEW STATE */}
      {currentResponse && sessionState === "feedback" && (
        <motion.div key={`f-${questionCount}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {/* Question that was answered */}
          {lastQuestion && (
            <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(var(--fg-rgb),0.04)", border: "1px solid rgba(var(--fg-rgb),0.08)", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, background: levelTheme.bg, color: levelTheme.color, border: `1px solid ${levelTheme.border}`, fontFamily: "inherit" }}>{questionCount}</span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(var(--fg-rgb),0.35)" }}>ВОПРОС</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "rgba(var(--fg-rgb),0.75)" }}>{lastQuestion}</p>
            </div>
          )}

          {/* User's answer */}
          <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(var(--fg-rgb),0.04)", border: "1px solid rgba(var(--fg-rgb),0.08)", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(var(--fg-rgb),0.35)", marginBottom: 6 }}>МОЙ ОТВЕТ</div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "rgba(var(--fg-rgb),0.75)", whiteSpace: "pre-wrap" }}>{lastAnswer}</p>
          </div>

          {/* VERDICT — главный сигнал */}
          {currentResponse.evaluation && (() => {
            const isRight = currentResponse.isCorrect === true
            const isWrong = currentResponse.isCorrect === false
            const verdict = {
              icon: isRight ? "✓" : isWrong ? "✗" : "~",
              label: isRight ? "Верно" : isWrong ? "Не совсем" : "Частично",
              color: isRight ? "#5ee08a" : isWrong ? "#ff7e92" : "#ffbb5c",
              bg: isRight ? "rgba(94,224,138,0.1)" : isWrong ? "rgba(255,126,146,0.1)" : "rgba(255,187,92,0.1)",
              border: isRight ? "rgba(94,224,138,0.35)" : isWrong ? "rgba(255,126,146,0.35)" : "rgba(255,187,92,0.35)",
            }
            return (
              <div style={{ padding: "18px 20px", borderRadius: 16, background: verdict.bg, border: `1.5px solid ${verdict.border}`, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: verdict.bg, border: `2px solid ${verdict.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: verdict.color, flexShrink: 0 }}>{verdict.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: verdict.color }}>{verdict.label}</span>
                </div>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "rgba(var(--fg-rgb),0.82)" }}>{currentResponse.evaluation}</p>
              </div>
            )
          })()}

          {/* Correct answer — only on wrong */}
          {currentResponse.isCorrect === false && currentResponse.correctAnswer && (
            <div style={{ padding: "16px 20px", borderRadius: 16, background: "rgba(94,224,138,0.08)", border: "1px solid rgba(94,224,138,0.28)", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#5ee08a", marginBottom: 8 }}>ПРАВИЛЬНЫЙ ОТВЕТ</div>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.62, color: "rgba(var(--fg-rgb),0.88)" }}>{currentResponse.correctAnswer}</p>
            </div>
          )}

          {/* Breakdown */}
          {currentResponse.explanation && (
            <div style={{ padding: "18px 20px", borderRadius: 16, background: "linear-gradient(135deg,rgba(155,107,255,0.12),rgba(43,217,227,0.06))", border: "1px solid rgba(155,107,255,0.25)", marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#b69cff", marginBottom: 12 }}>ЧТО ВАЖНО БЫЛО УПОМЯНУТЬ</div>
              <RichText text={currentResponse.explanation} className="[&_p]:!text-[rgba(var(--fg-rgb),0.78)] [&_p]:!text-sm" />
            </div>
          )}

          {/* Follow-up chat */}
          <div style={{ marginTop: 6 }}>
            {/* Thread */}
            {followUpMessages.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                {followUpMessages.map((m, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ alignSelf: "flex-end", maxWidth: "85%", padding: "10px 14px", borderRadius: "14px 14px 4px 14px", background: "rgba(155,107,255,0.2)", border: "1px solid rgba(155,107,255,0.35)", fontSize: 14, color: "var(--text)", fontWeight: 500 }}>
                      {m.question}
                    </div>
                    <div style={{ alignSelf: "flex-start", maxWidth: "92%", padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "rgba(var(--fg-rgb),0.06)", border: "1px solid rgba(var(--fg-rgb),0.1)" }}>
                      <RichText text={m.answer} className="[&_p]:!text-sm [&_p]:!text-[rgba(var(--fg-rgb),0.82)]" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
              <textarea
                ref={followUpRef}
                value={followUpInput}
                onChange={e => setFollowUpInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && followUpInput.trim()) {
                    askFollowUp(followUpInput)
                    setFollowUpInput("")
                  }
                }}
                placeholder="Задай уточняющий вопрос по этой теме…"
                rows={2}
                style={{ flex: 1, resize: "none", padding: "10px 14px", borderRadius: 12, background: "rgba(var(--fg-rgb),0.04)", border: "1px solid rgba(var(--fg-rgb),0.12)", outline: "none", color: "var(--text)", fontSize: 14, lineHeight: 1.5, fontFamily: "inherit" }}
              />
              <button
                onClick={() => { if (followUpInput.trim()) { askFollowUp(followUpInput); setFollowUpInput("") } }}
                disabled={!followUpInput.trim() || followUpLoading}
                style={{ padding: "10px 16px", borderRadius: 12, border: "none", cursor: "pointer", background: "rgba(155,107,255,0.25)", color: "#c4adff", fontWeight: 700, fontSize: 13, fontFamily: "inherit", flexShrink: 0, opacity: (!followUpInput.trim() || followUpLoading) ? 0.5 : 1 }}
              >
                {followUpLoading ? "…" : "Спросить"}
              </button>
            </div>
          </div>

          {/* Self-assessment OR last question */}
          {!isLastQuestion ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(var(--fg-rgb),0.42)", marginBottom: 11 }}>КАК ПРОШЛО?</div>
              <div style={{ display: "flex", gap: 11, flexWrap: "wrap" }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={nextQuestion} style={{ flex: 1, minWidth: 180, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, padding: 15, borderRadius: 14, cursor: "pointer", background: "rgba(94,224,138,0.14)", border: "1.5px solid rgba(94,224,138,0.4)", color: "#86efac", fontWeight: 700, fontSize: 15, fontFamily: "inherit" }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(94,224,138,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✓</span>
                  Следующий вопрос →
                </motion.button>
              </div>
            </>
          ) : (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.985 }} onClick={nextQuestion} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#9b6bff,#6d3cff)", color: "#fff", fontWeight: 700, fontSize: 16, boxShadow: "0 10px 26px rgba(109,60,255,0.4)", fontFamily: "inherit" }}>
              Завершить сессию →
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  )
}
