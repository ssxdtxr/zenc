"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeftIcon, TargetIcon, ChevronDownIcon } from "@/shared/ui/icons"
import { useRouter } from "next/navigation"
import type { GlossaryTerm, Topic, SessionRecord } from "@/entities/topic/model/types"
import { OVERALL_LEVEL_CONFIG } from "@/entities/topic/config"
import { TutorSession } from "@/widgets/tutor-session/ui/tutor-session"
import { apiClient } from "@/shared/lib/api-client"

type Props = { id: string }
type Filter = "all" | "needs_work" | "learning" | "good"

const CIRC = 282.74

function getTheme(status: string) {
  if (status === "good" || status === "expert")
    return { accent: "#5ee08a", bg: "rgba(94,224,138,0.12)", border: "rgba(94,224,138,0.28)", label: "Хорошо" }
  if (status === "learning")
    return { accent: "#ffbb5c", bg: "rgba(255,187,92,0.12)", border: "rgba(255,187,92,0.28)", label: "В процессе" }
  return { accent: "#ff7e92", bg: "rgba(255,126,146,0.12)", border: "rgba(255,126,146,0.28)", label: "Нужно подтянуть" }
}

export const TopicPage = ({ id }: Props) => {
  const router = useRouter()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("all")
  const [openTerms, setOpenTerms] = useState<Record<string, boolean>>({})

  const [inSession, setInSession] = useState(() => {
    try {
      const saved = localStorage.getItem(`zerc_session_${id}`)
      if (!saved) return false
      const data = JSON.parse(saved)
      return !!(data.currentResponse && data.questionCount > 0)
    } catch { return false }
  })
  const [sessionKey, setSessionKey] = useState(0)
  const [focusSubtopics, setFocusSubtopics] = useState<string[] | undefined>(() => {
    try {
      const saved = localStorage.getItem(`zerc_session_${id}`)
      if (!saved) return undefined
      const data = JSON.parse(saved)
      return data.focusSubtopics ?? undefined
    } catch { return undefined }
  })

  const loadTopic = useCallback(async () => {
    try {
      const t = await apiClient.getTopicById(id)
      if (!t) router.push("/")
      else setTopic(t)
    } catch { router.push("/") }
    finally { setLoading(false) }
  }, [id, router])

  useEffect(() => { loadTopic() }, [loadTopic])

  const handleSessionComplete = async (results: Omit<SessionRecord, "id" | "date"> & { glossary?: GlossaryTerm[] }) => {
    if (!topic) return
    await apiClient.saveSession(id, results)
    await loadTopic()
  }

  const clearSaved = () => { try { localStorage.removeItem(`zerc_session_${id}`) } catch {} }
  const startNewSession = () => { clearSaved(); setFocusSubtopics(undefined); setSessionKey(k => k + 1); setInSession(true) }
  const startFocused = () => {
    clearSaved()
    const weak = topic?.currentSubtopics.filter(s => s.status === "needs_work" || s.status === "learning").map(s => s.name) ?? []
    setFocusSubtopics(weak); setSessionKey(k => k + 1); setInSession(true)
  }

  const startReview = () => {
    clearSaved()
    const due = topic?.currentSubtopics
      .filter(s => s.nextReviewAt && new Date(s.nextReviewAt).getTime() <= Date.now())
      .map(s => s.name) ?? []
    setFocusSubtopics(due); setSessionKey(k => k + 1); setInSession(true)
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#08070f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#9b6bff", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!topic) return null

  const subs = topic.currentSubtopics
  const goodCount = subs.filter(s => s.status === "good" || s.status === "expert").length
  const progCount = subs.filter(s => s.status === "learning").length
  const weakCount = subs.filter(s => s.status === "needs_work").length
  const total = subs.length
  const mastery = total ? Math.round(((goodCount + progCount * 0.5) / total) * 100) : 0
  const dashOffset = CIRC * (1 - mastery / 100)

  const filtered = subs.filter(s => {
    if (filter === "all") return true
    if (filter === "good") return s.status === "good" || s.status === "expert"
    return s.status === filter
  })

  const levelCfg = topic.overallLevel ? OVERALL_LEVEL_CONFIG[topic.overallLevel] : null
  const lastSession = topic.sessions[0] ?? null
  const nextWeak = subs.find(s => s.status === "needs_work" || s.status === "learning")
  const now = Date.now()
  const dueForReview = subs.filter(s => s.nextReviewAt && new Date(s.nextReviewAt).getTime() <= now)

  const BG = "radial-gradient(1200px 800px at 80% -10%, rgba(109,60,255,0.18), transparent 60%), radial-gradient(900px 700px at 0% 100%, rgba(240,82,156,0.13), transparent 55%), #08070f"

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "Все", count: total },
    { key: "needs_work", label: "Слабые", count: weakCount },
    { key: "learning", label: "В процессе", count: progCount },
    { key: "good", label: "Освоено", count: goodCount },
  ]

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: BG, overflow: "hidden" }}>
      {/* Blobs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", filter: "blur(70px)" }}>
        <div style={{ position: "absolute", top: "-8%", left: "8%", width: "38vw", height: "38vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #7c3cff, transparent 70%)", opacity: 0.48, animation: "drift1 26s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "18%", right: "-6%", width: "34vw", height: "34vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #ff4d8d, transparent 70%)", opacity: 0.34, animation: "drift2 30s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-12%", left: "30%", width: "42vw", height: "42vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #2bd9e3, transparent 70%)", opacity: 0.24, animation: "drift3 34s ease-in-out infinite" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "22px 28px 80px" }}>

        {/* NAV */}
        <nav style={{ position: "sticky", top: 16, zIndex: 20, display: "flex", alignItems: "center", gap: 16, padding: "12px 18px", borderRadius: 20, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px) saturate(150%)", WebkitBackdropFilter: "blur(24px) saturate(150%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 10px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)" }}>
          <button onClick={() => inSession ? setInSession(false) : router.push("/")} style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.85)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeftIcon size={20} color="rgba(255,255,255,0.85)" /></button>
          <h1 className="font-display" style={{ fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", margin: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#fff" }}>{topic.name}</h1>
          {levelCfg && (
            <span style={{ padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700, background: levelCfg.bg, color: levelCfg.color, border: `1px solid ${levelCfg.border}`, flexShrink: 0 }}>{levelCfg.label}</span>
          )}
        </nav>

        {/* SESSION */}
        {inSession && (
          <div style={{ marginTop: 22 }}>
            <div style={{ padding: "20px", borderRadius: 20, background: "rgba(255,255,255,0.07)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 16px 50px rgba(0,0,0,0.45)" }}>
              <TutorSession
                key={sessionKey}
                topicId={id}
                topicName={topic.name}
                focusSubtopics={focusSubtopics}
                previousSubtopics={topic.currentSubtopics}
                overallLevel={topic.overallLevel}
                onComplete={handleSessionComplete}
                onBack={() => router.push("/")}
                onNewSession={startNewSession}
              />
            </div>
          </div>
        )}

        {!inSession && (
          <>
            {/* PROGRESS HERO */}
            <div style={{ marginTop: 22, padding: "24px 26px", borderRadius: 24, background: "rgba(255,255,255,0.07)", backdropFilter: "blur(28px) saturate(150%)", WebkitBackdropFilter: "blur(28px) saturate(150%)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 16px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: 26, flexWrap: "wrap" }}>
              <div style={{ position: "relative", width: 104, height: 104, flexShrink: 0 }}>
                <svg width="104" height="104" viewBox="0 0 104 104" style={{ transform: "rotate(-90deg)" }}>
                  <defs>
                    <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#9b6bff" />
                      <stop offset="100%" stopColor="#2bd9e3" />
                    </linearGradient>
                  </defs>
                  <circle cx="52" cy="52" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="9" />
                  <circle cx="52" cy="52" r="45" fill="none" stroke="url(#pg)" strokeWidth="9" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={dashOffset} style={{ transition: "stroke-dashoffset .7s cubic-bezier(.2,.8,.2,1)" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span className="font-display" style={{ fontWeight: 700, fontSize: 25, lineHeight: 1, color: "#fff" }}>{mastery}%</span>
                  <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", fontWeight: 500, marginTop: 2 }}>освоено</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div className="font-display" style={{ fontWeight: 600, fontSize: 17, marginBottom: 12, color: "#fff" }}>
                  Освоено {goodCount} из {total} подтем
                </div>
                <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 999, background: "rgba(94,224,138,0.12)", border: "1px solid rgba(94,224,138,0.28)", fontSize: 13, fontWeight: 600, color: "#86efac" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#5ee08a", flexShrink: 0 }} />{goodCount} хорошо
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 999, background: "rgba(255,187,92,0.12)", border: "1px solid rgba(255,187,92,0.28)", fontSize: 13, fontWeight: 600, color: "#ffbb5c" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ffbb5c", flexShrink: 0 }} />{progCount} в процессе
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 999, background: "rgba(255,126,146,0.12)", border: "1px solid rgba(255,126,146,0.28)", fontSize: 13, fontWeight: 600, color: "#ff8d9f" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff7e92", flexShrink: 0 }} />{weakCount} подтянуть
                  </span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={startNewSession} style={{ flex: 1, minWidth: 200, padding: "18px 20px", borderRadius: 18, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#9b6bff,#6d3cff)", color: "#fff", fontWeight: 700, fontSize: 17, boxShadow: "0 14px 38px rgba(109,60,255,0.45)", textAlign: "left", fontFamily: "inherit" }}>
                <div className="font-display">{lastSession ? "Новая сессия →" : "Начать →"}</div>
                <div style={{ fontWeight: 500, fontSize: 12.5, opacity: 0.8, marginTop: 3 }}>10 вопросов · адаптивно</div>
              </button>
              {dueForReview.length > 0 && (
                <button onClick={startReview} style={{ flex: 1, minWidth: 200, padding: "18px 20px", borderRadius: 18, cursor: "pointer", background: "rgba(255,187,92,0.1)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", border: "1px solid rgba(255,187,92,0.4)", color: "#fff", fontWeight: 700, fontSize: 17, textAlign: "left", fontFamily: "inherit" }}>
                  <div className="font-display" style={{ color: "#ffbb5c" }}>Повторить →</div>
                  <div style={{ fontWeight: 500, fontSize: 12.5, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>{dueForReview.length} подтем пора повторить</div>
                </button>
              )}
              {weakCount > 0 && dueForReview.length === 0 && (
                <button onClick={startFocused} style={{ flex: 1, minWidth: 200, padding: "18px 20px", borderRadius: 18, cursor: "pointer", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", fontWeight: 700, fontSize: 17, textAlign: "left", fontFamily: "inherit" }}>
                  <div className="font-display">Слабые места →</div>
                  <div style={{ fontWeight: 500, fontSize: 12.5, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>{weakCount} подтем · {nextWeak?.name ?? ""}</div>
                </button>
              )}
            </div>

            {/* LAST SESSION */}
            {lastSession && (
              <div style={{ marginTop: 14, padding: "16px 20px", borderRadius: 16, background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", color: "rgba(255,255,255,0.42)", whiteSpace: "nowrap" }}>ПОСЛЕДНЯЯ СЕССИЯ</span>
                <div style={{ flex: 1, minWidth: 100, height: 7, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.round((lastSession.score / lastSession.total) * 100)}%`, borderRadius: 999, background: "linear-gradient(90deg,#9b6bff,#2bd9e3)" }} />
                </div>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{lastSession.summary?.slice(0, 40) || "Анализ завершён"}</span>
                <span className="font-display" style={{ fontWeight: 700, fontSize: 16, color: "#b69cff" }}>{lastSession.score}/{lastSession.total}</span>
              </div>
            )}

            {/* KNOWLEDGE MAP */}
            {total > 0 && (
              <>
                <div style={{ marginTop: 34, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
                  <h2 className="font-display" style={{ fontWeight: 600, fontSize: 13, letterSpacing: "0.07em", color: "rgba(255,255,255,0.5)", margin: 0 }}>
                    КАРТА ЗНАНИЙ <span style={{ color: "rgba(255,255,255,0.3)" }}>· {total}</span>
                  </h2>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>нажми → читай теорию</span>
                </div>

                {/* Filters */}
                <div style={{ marginTop: 16, display: "flex", gap: 9, flexWrap: "wrap" }}>
                  {FILTERS.map(f => {
                    const on = filter === f.key
                    return (
                      <button key={f.key} onClick={() => setFilter(f.key)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 999, cursor: "pointer", background: on ? "rgba(155,107,255,0.18)" : "rgba(255,255,255,0.05)", border: `1px solid ${on ? "rgba(155,107,255,0.45)" : "rgba(255,255,255,0.12)"}`, color: on ? "#fff" : "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 13.5, fontFamily: "inherit" }}>
                        {f.label}<span style={{ opacity: 0.65, fontWeight: 700 }}>{f.count}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Subtopic rows */}
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  {filtered.map(s => {
                    const th = getTheme(s.status)
                    const isDue = s.nextReviewAt && new Date(s.nextReviewAt).getTime() <= now
                    return (
                      <button key={s.name} onClick={() => router.push(`/topic/${id}/subtopic/${encodeURIComponent(s.name)}`)} style={{ textAlign: "left", display: "block", width: "100%", padding: "17px 20px", borderRadius: 16, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderLeft: `3px solid ${th.accent}`, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", fontFamily: "inherit" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                            <span className="font-display" style={{ fontWeight: 600, fontSize: 16.5, color: "#fff" }}>{s.name}</span>
                            {isDue && <span style={{ fontSize: 11, fontWeight: 700, color: "#ffbb5c", background: "rgba(255,187,92,0.15)", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>пора повторить</span>}
                          </div>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 11px", borderRadius: 999, background: th.bg, border: `1px solid ${th.border}`, fontWeight: 700, fontSize: 12, color: th.accent, whiteSpace: "nowrap", flexShrink: 0 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: th.accent }} />{th.label}
                          </span>
                        </div>
                        {s.recommendation && (
                          <p style={{ margin: "7px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "rgba(255,255,255,0.58)" }}>{s.recommendation}</p>
                        )}
                        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 14, fontSize: 12.5, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                          <span style={{ color: th.accent, fontWeight: 700 }}>Читать теорию →</span>
                        </div>
                      </button>
                    )
                  })}
                  {filtered.length === 0 && (
                    <div style={{ padding: "28px", textAlign: "center", borderRadius: 16, border: "1px dashed rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Нет подтем в этой категории</div>
                  )}
                </div>
              </>
            )}

            {/* GLOSSARY BY SUBTOPIC */}
            {subs.some(s => s.definitions.length > 0) && (() => {
              const subsWithDefs = subs.filter(s => s.definitions.length > 0)
              const totalDefs = subsWithDefs.reduce((n, s) => n + s.definitions.length, 0)
              return (
                <>
                  <div style={{ marginTop: 38, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <h2 className="font-display" style={{ fontWeight: 600, fontSize: 13, letterSpacing: "0.07em", color: "rgba(255,255,255,0.5)", margin: 0 }}>
                      ГЛОССАРИЙ <span style={{ color: "rgba(255,255,255,0.3)" }}>· {totalDefs} терминов</span>
                    </h2>
                  </div>

                  <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    {subsWithDefs.map(s => {
                      const th = getTheme(s.status)
                      const isOpen = !!openTerms[s.name]
                      return (
                        <div key={s.name} style={{ borderRadius: 16, background: "rgba(255,255,255,0.045)", border: `1px solid rgba(255,255,255,0.1)`, borderLeft: `3px solid ${th.accent}`, overflow: "hidden" }}>
                          <button
                            onClick={() => setOpenTerms(prev => ({ ...prev, [s.name]: !prev[s.name] }))}
                            style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 18px", cursor: "pointer", background: "transparent", border: "none", fontFamily: "inherit" }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: th.accent, flexShrink: 0 }} />
                              <span className="font-display" style={{ fontWeight: 600, fontSize: 15, color: "#fff" }}>{s.name}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>{s.definitions.length} {s.definitions.length === 1 ? "термин" : "термина"}</span>
                            </div>
                            <span style={{ fontSize: 15, color: "rgba(255,255,255,0.35)", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s ease", flexShrink: 0 }}><ChevronDownIcon size={15} color="rgba(255,255,255,0.35)" /></span>
                          </button>
                          {isOpen && (
                            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "14px 18px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                              {s.definitions.map(d => (
                                <div key={d.term}>
                                  <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: th.accent }}>{d.term}</p>
                                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "rgba(255,255,255,0.65)" }}>{d.definition}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}

            {/* HISTORY */}
            {topic.sessions.length > 1 && (
              <div style={{ marginTop: 38, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 14 }}>
                <h2 className="font-display" style={{ fontWeight: 600, fontSize: 13, letterSpacing: "0.07em", color: "rgba(255,255,255,0.5)", margin: 0 }}>ИСТОРИЯ СЕССИЙ</h2>
              </div>
            )}
            {topic.sessions.length > 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {topic.sessions.slice(0, 5).map(s => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 500, minWidth: 80 }}>{new Date(s.date).toLocaleDateString("ru", { day: "numeric", month: "short" })}</span>
                    <div style={{ flex: 1, height: 5, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.round((s.score / s.total) * 100)}%`, borderRadius: 999, background: "linear-gradient(90deg,#9b6bff,#2bd9e3)" }} />
                    </div>
                    <span className="font-display" style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{s.score}/{s.total}</span>
                  </div>
                ))}
              </div>
            )}

          </>
        )}
      </div>
    </div>
  )
}
