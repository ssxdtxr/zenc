"use client"

import { useState } from "react"
import { SessionResults } from "@/features/session-results/ui/session-results"
import type { SessionRecord } from "@/entities/topic/model/types"
import { MAX_QUESTIONS, useTutorSession } from "../model/use-tutor-session"
import type { ConfidenceLevel } from "@/features/confidence-picker/ui/confidence-picker"

const LEVEL_THEME: Record<string, { color: string; bg: string; border: string }> = {
  basic:        { color: "#86efac", bg: "rgba(74,222,128,0.14)",   border: "rgba(74,222,128,0.3)" },
  intermediate: { color: "#fbbf24", bg: "rgba(251,191,36,0.14)",   border: "rgba(251,191,36,0.3)" },
  advanced:     { color: "#f87171", bg: "rgba(248,113,113,0.14)",   border: "rgba(248,113,113,0.3)" },
}

const CONFIDENCE_OPTIONS: { level: ConfidenceLevel; label: string; icon: string; bg: string; border: string; iconBg: string; iconColor: string; textColor: string }[] = [
  { level: 1, label: "Не уверен",  icon: "?", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.12)", iconBg: "rgba(251,191,36,0.2)",  iconColor: "#fbbf24", textColor: "rgba(255,255,255,0.65)" },
  { level: 2, label: "Частично",   icon: "~", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.12)", iconBg: "rgba(96,165,250,0.2)",   iconColor: "#60a5fa", textColor: "rgba(255,255,255,0.65)" },
  { level: 3, label: "Уверен",     icon: "✓", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.12)", iconBg: "rgba(74,222,128,0.2)",   iconColor: "#4ade80", textColor: "rgba(255,255,255,0.65)" },
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
  const {
    sessionState, answer, confidence, loading, error,
    questionCount, correctCount, currentResponse, results, textareaRef,
    setAnswer, setConfidence, submitAnswer, submitDontKnow, nextQuestion,
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
      <div style={{ padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2.5px solid transparent", borderTopColor: "#9b6bff", animation: "spin 0.8s linear infinite" }} />
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Анализирую твои знания…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
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
          <button onClick={() => setFocusOpen(o => !o)} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 16px", borderRadius: 14, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "inherit", marginBottom: 22 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#9b6bff", boxShadow: "0 0 8px #9b6bff", flexShrink: 0 }} />
              Фокус сессии · {focusSubtopics.length} тем
            </span>
            <span style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", display: "inline-block", transform: focusOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s ease" }}>⌄</span>
          </button>
          {focusOpen && (
            <div style={{ marginTop: -14, marginBottom: 22, display: "flex", flexWrap: "wrap", gap: 7 }}>
              {focusSubtopics.map(ft => (
                <span key={ft} style={{ padding: "6px 11px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12.5, fontWeight: 500, color: "rgba(255,255,255,0.65)" }}>{ft}</span>
              ))}
            </div>
          )}
        </>
      )}

      {/* PROGRESS */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
          <strong style={{ color: "#86efac", fontWeight: 700 }}>{correctCount}</strong> правильно
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{questionCount}/{MAX_QUESTIONS}</span>
      </div>
      <div style={{ height: 9, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden", marginBottom: 26 }}>
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
        <div>
          {/* Question number + level */}
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, background: levelTheme.bg, color: levelTheme.color, border: `1px solid ${levelTheme.border}`, fontFamily: "inherit" }}>{questionCount}</span>
            <span style={{ fontWeight: 700, fontSize: 14.5, color: levelTheme.color }}>
              {currentResponse.difficulty === "basic" ? "Базовый" : currentResponse.difficulty === "intermediate" ? "Средний" : "Продвинутый"}
            </span>
          </div>

          {/* Question text */}
          <p style={{ margin: "0 0 26px", fontSize: 19, lineHeight: 1.6, color: "rgba(255,255,255,0.92)", fontWeight: 400 }}>
            {currentResponse.question}
          </p>

          {/* CHOICE OPTIONS */}
          {currentResponse.questionType === "choice" && currentResponse.options && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {currentResponse.options.map((opt, i) => {
                const isSelected = answer === opt
                return (
                  <button key={i} onClick={() => setAnswer(opt)} style={{ textAlign: "left", padding: "14px 18px", borderRadius: 14, border: `1.5px solid ${isSelected ? "rgba(155,107,255,0.5)" : "rgba(255,255,255,0.1)"}`, background: isSelected ? "rgba(155,107,255,0.15)" : "rgba(255,255,255,0.04)", color: isSelected ? "#fff" : "rgba(255,255,255,0.75)", fontWeight: isSelected ? 600 : 500, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, fontFamily: "inherit" }}>
                    <span style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: isSelected ? "#9b6bff" : "rgba(255,255,255,0.08)", color: isSelected ? "#fff" : "rgba(255,255,255,0.4)", border: `1px solid ${isSelected ? "transparent" : "rgba(255,255,255,0.12)"}` }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          )}

          {/* CONFIDENCE */}
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.42)", marginBottom: 12 }}>НАСКОЛЬКО УВЕРЕН В ОТВЕТЕ?</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 11, marginBottom: 16 }}>
            {CONFIDENCE_OPTIONS.map(c => {
              const isSelected = selectedConfidence === c.level
              return (
                <button key={c.level} onClick={() => handleConfidence(c.level)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 12px", borderRadius: 15, cursor: "pointer", background: isSelected ? c.iconBg : c.bg, border: `1.5px solid ${isSelected ? c.iconColor : c.border}`, fontFamily: "inherit", transition: "all .18s ease" }}>
                  <span style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, background: c.iconBg, color: c.iconColor }}>{c.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: isSelected ? "#fff" : c.textColor }}>{c.label}</span>
                </button>
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
              style={{ width: "100%", minHeight: 160, resize: "vertical", padding: "18px 20px", borderRadius: 16, background: "rgba(255,255,255,0.04)", border: `1.5px solid ${answer ? "rgba(155,107,255,0.4)" : "rgba(255,255,255,0.12)"}`, outline: "none", color: "#fff", fontSize: 15.5, lineHeight: 1.6, fontFamily: "inherit", boxSizing: "border-box", transition: "border-color .2s ease" }}
            />
          )}

          {/* ERROR */}
          {error && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.35)", color: "#fca5a5", fontSize: 13 }}>{error}</div>}

          {/* DONT KNOW */}
          <button onClick={submitDontKnow} disabled={loading} style={{ marginTop: 12, width: "100%", padding: "11px", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.18)", background: "transparent", color: "rgba(255,255,255,0.45)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Не знаю / Не знаком с темой
          </button>

          {/* SUBMIT ROW */}
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ padding: "3px 8px", borderRadius: 7, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 12 }}>⌘ Enter</span>
              отправить
            </span>
            <button onClick={submitAnswer} disabled={(!answer.trim() && currentResponse.questionType === "text") || loading} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", background: "linear-gradient(135deg,#9b6bff,#6d3cff)", color: "#fff", fontWeight: 700, fontSize: 15.5, boxShadow: "0 10px 26px rgba(109,60,255,0.4)", opacity: ((!answer.trim() && currentResponse.questionType === "text") || loading) ? 0.5 : 1, fontFamily: "inherit", transition: "all .2s ease" }}>
              {loading ? "Проверяю…" : "Ответить →"}
            </button>
          </div>
        </div>
      )}

      {/* FEEDBACK / REVIEW STATE */}
      {currentResponse && sessionState === "feedback" && (
        <div>
          {/* Question recap */}
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, background: levelTheme.bg, color: levelTheme.color, border: `1px solid ${levelTheme.border}`, fontFamily: "inherit" }}>{questionCount}</span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>{currentResponse.question}</span>
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
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "rgba(255,255,255,0.82)" }}>{currentResponse.evaluation}</p>
              </div>
            )
          })()}

          {/* User's answer */}
          <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>ТВОЙ ОТВЕТ</div>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "rgba(255,255,255,0.75)", whiteSpace: "pre-wrap" }}>{answer}</p>
          </div>

          {/* Breakdown */}
          {currentResponse.explanation && (
            <div style={{ padding: "18px 20px", borderRadius: 16, background: "linear-gradient(135deg,rgba(155,107,255,0.12),rgba(43,217,227,0.06))", border: "1px solid rgba(155,107,255,0.25)", marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#b69cff", marginBottom: 12 }}>ЧТО ВАЖНО БЫЛО УПОМЯНУТЬ</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {currentResponse.explanation.split("\n").filter(Boolean).map((line, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#7be3ec", fontWeight: 700, fontSize: 14, lineHeight: 1.5, flexShrink: 0 }}>·</span>
                    <span style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.78)" }}>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Self-assessment OR last question */}
          {!isLastQuestion ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.42)", marginBottom: 11 }}>КАК ПРОШЛО?</div>
              <div style={{ display: "flex", gap: 11, flexWrap: "wrap" }}>
                <button onClick={nextQuestion} style={{ flex: 1, minWidth: 180, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, padding: 15, borderRadius: 14, cursor: "pointer", background: "rgba(94,224,138,0.14)", border: "1.5px solid rgba(94,224,138,0.4)", color: "#86efac", fontWeight: 700, fontSize: 15, fontFamily: "inherit" }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(94,224,138,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✓</span>
                  Понял, верно
                </button>
                <button onClick={nextQuestion} style={{ flex: 1, minWidth: 180, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, padding: 15, borderRadius: 14, cursor: "pointer", background: "rgba(255,187,92,0.12)", border: "1.5px solid rgba(255,187,92,0.4)", color: "#ffbb5c", fontWeight: 700, fontSize: 15, fontFamily: "inherit" }}>
                  Нужно повторить
                </button>
              </div>
            </>
          ) : (
            <button onClick={nextQuestion} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#9b6bff,#6d3cff)", color: "#fff", fontWeight: 700, fontSize: 16, boxShadow: "0 10px 26px rgba(109,60,255,0.4)", fontFamily: "inherit" }}>
              Завершить сессию →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
