"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeftIcon, ChevronDownIcon, HelpIcon, PlusIcon } from "@/shared/ui/icons"
import { useRouter } from "next/navigation"
import type { Topic, SessionRecord } from "@/entities/topic/model/types"
import { OVERALL_LEVEL_CONFIG, SUBTOPIC_STATUS_CONFIG } from "@/entities/topic/config"
import { TutorSession } from "@/widgets/tutor-session/ui/tutor-session"
import { SubtopicMap } from "@/features/subtopic-map/ui/subtopic-map"
import { apiClient } from "@/shared/lib/api-client"
import { fadeInUp } from "@/shared/lib/motion"
import { AppShell } from "@/widgets/app-shell/ui/app-shell"

type Props = { id: string }

const CIRC = 282.74
const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
const MASTERY_TOOLTIP = "Процент = доля подтем со статусом «Экспертно» от общего числа подтем"

function getTheme(status: string) {
  const cfg = SUBTOPIC_STATUS_CONFIG[status as keyof typeof SUBTOPIC_STATUS_CONFIG] ?? SUBTOPIC_STATUS_CONFIG.needs_work
  const label = status === "needs_work" ? "Нужно подтянуть" : status === "learning" ? "В процессе" : status === "good" ? "Хорошо" : "Освоено"
  return { dot: cfg.dot, border: cfg.border, bg: cfg.bg, text: cfg.color, label }
}

export const TopicPage = ({ id }: Props) => {
  const router = useRouter()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)
  const [openTerms, setOpenTerms] = useState<Record<string, boolean>>({})

  const [regenerating, setRegenerating] = useState(false)
  const [resetting, setResetting] = useState(false)

  const [showAddSubtopic, setShowAddSubtopic] = useState(false)
  const [newSubtopicName, setNewSubtopicName] = useState("")
  const [addingSubtopic, setAddingSubtopic] = useState(false)
  const [addSubtopicError, setAddSubtopicError] = useState<string | null>(null)

  const addSubtopic = async () => {
    const trimmed = newSubtopicName.trim()
    if (!trimmed || addingSubtopic) return
    setAddingSubtopic(true)
    setAddSubtopicError(null)
    try {
      await apiClient.addSubtopic(id, trimmed)
      setNewSubtopicName("")
      setShowAddSubtopic(false)
      await loadTopic()
    } catch (err) {
      setAddSubtopicError(err instanceof Error ? err.message : "Ошибка соединения")
    } finally {
      setAddingSubtopic(false)
    }
  }

  const regenerateSubtopics = async () => {
    if (regenerating) return
    setRegenerating(true)
    try {
      const res = await fetch(`/api/topics/${id}/regenerate-subtopics`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        console.error("Regenerate failed:", data)
        alert(`Ошибка: ${data.detail ?? data.error ?? "неизвестная ошибка"}`)
        return
      }
      await loadTopic()
    } catch (err) {
      console.error("Regenerate error:", err)
      alert("Ошибка соединения")
    } finally {
      setRegenerating(false)
    }
  }

  const resetAndReanalyze = async () => {
    if (resetting) return
    setResetting(true)
    try {
      const res = await fetch(`/api/topics/${id}/reset`, { method: "POST" })
      if (!res.ok) { alert("Ошибка сброса"); return }
      clearSaved()
      await loadTopic()
      setFocusSubtopics(undefined)
      setSessionKey(k => k + 1)
      setInSession(true)
    } catch {
      alert("Ошибка соединения")
    } finally {
      setResetting(false)
    }
  }

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

  const handleSessionComplete = async (results: Omit<SessionRecord, "id" | "date">) => {
    if (!topic) return
    await apiClient.saveSession(id, results)
    await loadTopic()
  }

  const clearSaved = () => { try { localStorage.removeItem(`zerc_session_${id}`) } catch {} }
  const startNewSession = () => { clearSaved(); setFocusSubtopics(undefined); setSessionKey(k => k + 1); setInSession(true) }
  const startFocused = () => {
    clearSaved()
    const weak = topic?.currentSubtopics.filter(s => s.status !== "expert").map(s => s.name) ?? []
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
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--text)", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!topic) return null

  const subs = topic.currentSubtopics
  const expertCount = subs.filter(s => s.status === "expert").length
  const goodCount = subs.filter(s => s.status === "good").length
  const progCount = subs.filter(s => s.status === "learning").length
  const weakCount = subs.filter(s => s.status === "needs_work").length
  const total = subs.length
  const mastery = total ? Math.round((expertCount / total) * 100) : 0
  const dashOffset = CIRC * (1 - mastery / 100)

  const levelCfg = topic.overallLevel ? OVERALL_LEVEL_CONFIG[topic.overallLevel] : null
  const lastSession = topic.sessions[0] ?? null
  const nextWeak = subs.find(s => s.status !== "expert")
  const now = Date.now()
  const dueForReview = subs.filter(s => s.nextReviewAt && new Date(s.nextReviewAt).getTime() <= now)

  const today = new Date()
  const activityDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })
  const activity = activityDays.map(d => ({
    label: DAY_LABELS[(d.getDay() + 6) % 7],
    count: topic.sessions.filter(s => new Date(s.date).toDateString() === d.toDateString()).length,
  }))
  const maxActivity = Math.max(1, ...activity.map(a => a.count))

  const STATUS_LEGEND: { key: string; label: string; count: number }[] = [
    { key: "needs_work", label: "Нужно подтянуть", count: weakCount },
    { key: "learning", label: "В процессе", count: progCount },
    { key: "good", label: "Хорошо", count: goodCount },
    { key: "expert", label: "Освоено", count: expertCount },
  ]

  return (
    <AppShell>
      <div style={{ position: "relative", flex: 1, background: "var(--bg)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "22px 24px 80px" }}>

          {/* HEADER */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 18, borderBottom: "1px solid var(--border)" }}>
            <button onClick={() => inSession ? setInSession(false) : router.push("/")} style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeftIcon size={19} color="var(--text)" /></button>
            <h1 className="font-display" style={{ fontWeight: 700, fontSize: 21, letterSpacing: "-0.02em", margin: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text)" }}>{topic.name}</h1>
            {levelCfg && (
              <span style={{ padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700, background: "var(--surface)", color: "var(--text-2)", border: "1px solid var(--border)", flexShrink: 0 }}>{levelCfg.label}</span>
            )}
          </div>

          <AnimatePresence mode="wait">
            {/* SESSION */}
            {inSession && (
              <motion.div key="session" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }} style={{ marginTop: 22 }}>
                <div style={{ padding: "20px", borderRadius: 20, background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
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
              </motion.div>
            )}

            {!inSession && (
              <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}>
                {/* PROGRESS HERO */}
                <motion.div variants={fadeInUp} initial="hidden" animate="show" style={{ marginTop: 22, padding: "24px 26px", borderRadius: 20, background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 26, flexWrap: "wrap" }}>
                    <div title={MASTERY_TOOLTIP} style={{ position: "relative", width: 104, height: 104, flexShrink: 0, cursor: "help" }}>
                      <svg width="104" height="104" viewBox="0 0 104 104" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="52" cy="52" r="45" fill="none" stroke="var(--border)" strokeWidth="9" />
                        <circle cx="52" cy="52" r="45" fill="none" stroke="var(--text)" strokeWidth="9" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={dashOffset} style={{ transition: "stroke-dashoffset .7s cubic-bezier(.2,.8,.2,1)" }} />
                      </svg>
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <span className="font-display" style={{ fontWeight: 700, fontSize: 25, lineHeight: 1, color: "var(--text)" }}>{mastery}%</span>
                        <span style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 500, marginTop: 2, display: "inline-flex", alignItems: "center", gap: 3 }}>
                          освоено <HelpIcon size={11} color="var(--text-3)" />
                        </span>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div className="font-display" style={{ fontWeight: 600, fontSize: 17, marginBottom: 12, color: "var(--text)" }}>
                        Освоено {expertCount} из {total} подтем
                      </div>
                      <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                        {STATUS_LEGEND.map(s => {
                          const th = getTheme(s.key)
                          return (
                            <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 999, background: th.bg, border: `1px solid ${th.border}`, fontSize: 13, fontWeight: 600, color: th.text }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: th.dot, flexShrink: 0 }} />{s.count} {s.label.toLowerCase()}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Last session — folded into the hero instead of its own card */}
                  {lastSession && (
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.07em", color: "var(--text-3)", whiteSpace: "nowrap" }}>ПОСЛЕДНЯЯ СЕССИЯ</span>
                      <div style={{ flex: 1, minWidth: 100, height: 6, borderRadius: 999, background: "var(--border)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.round((lastSession.score / lastSession.total) * 100)}%`, borderRadius: 999, background: "var(--accent)" }} />
                      </div>
                      <span style={{ fontSize: 13.5, color: "var(--text-2)" }}>{lastSession.summary?.slice(0, 40) || "Анализ завершён"}</span>
                      <span className="font-display" style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{lastSession.score}/{lastSession.total}</span>
                    </div>
                  )}
                </motion.div>

                {/* TWO-COLUMN BODY */}
                <div style={{ marginTop: 28, display: "grid", gap: 28 }} className="grid-cols-1 lg:grid-cols-12">
                  <div className="lg:col-span-8 order-2 lg:order-none" style={{ minWidth: 0 }}>
                    {/* KNOWLEDGE MAP */}
                    {total > 0 && (
                      <>
                        <div style={{ paddingBottom: 12, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                          <h2 className="font-display" style={{ fontWeight: 600, fontSize: 13, letterSpacing: "0.07em", color: "var(--text-2)", margin: 0 }}>
                            КАРТА ЗНАНИЙ <span style={{ color: "var(--text-3)" }}>· {total}</span>
                          </h2>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button
                              onClick={() => setShowAddSubtopic(v => !v)}
                              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-2)", fontFamily: "inherit" }}
                            >
                              <PlusIcon size={12} color="currentColor" />Добавить
                            </button>
                            <button
                              onClick={regenerateSubtopics}
                              disabled={regenerating || resetting}
                              style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: (regenerating || resetting) ? "default" : "pointer", background: "var(--surface)", border: "1px solid var(--border)", color: (regenerating || resetting) ? "var(--text-3)" : "var(--text-2)", fontFamily: "inherit" }}
                            >
                              {regenerating ? "Пересобираем..." : "Пересобрать"}
                            </button>
                          </div>
                        </div>

                        {showAddSubtopic && (
                          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <input
                                autoFocus
                                value={newSubtopicName}
                                onChange={e => { setNewSubtopicName(e.target.value); setAddSubtopicError(null) }}
                                onKeyDown={e => { if (e.key === "Enter") addSubtopic() }}
                                placeholder="Название подтемы"
                                style={{ flex: 1, minWidth: 0, padding: "9px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14, fontFamily: "inherit" }}
                              />
                              <button
                                onClick={addSubtopic}
                                disabled={addingSubtopic || !newSubtopicName.trim()}
                                style={{ padding: "9px 16px", borderRadius: 10, border: "none", cursor: (addingSubtopic || !newSubtopicName.trim()) ? "default" : "pointer", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 13.5, opacity: (addingSubtopic || !newSubtopicName.trim()) ? 0.5 : 1, fontFamily: "inherit" }}
                              >
                                {addingSubtopic ? "Добавляем..." : "Добавить"}
                              </button>
                            </div>
                            {addSubtopicError && <span style={{ fontSize: 12.5, color: "#e5484d" }}>{addSubtopicError}</span>}
                          </div>
                        )}

                        {/* Dependency graph — replaces the old flat list+filters */}
                        <div style={{ marginTop: 16 }}>
                          <SubtopicMap subtopics={subs} onSelect={(name) => router.push(`/topic/${id}/subtopic/${encodeURIComponent(name)}`)} />
                        </div>
                      </>
                    )}

                    {/* HISTORY */}
                    {topic.sessions.length > 1 && (
                      <div style={{ marginTop: 38, paddingBottom: 12, borderBottom: "1px solid var(--border)", marginBottom: 14 }}>
                        <h2 className="font-display" style={{ fontWeight: 600, fontSize: 13, letterSpacing: "0.07em", color: "var(--text-2)", margin: 0 }}>ИСТОРИЯ СЕССИЙ</h2>
                      </div>
                    )}
                    {topic.sessions.length > 1 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {topic.sessions.slice(0, 5).map(s => (
                          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                            <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 500, minWidth: 80 }}>{new Date(s.date).toLocaleDateString("ru", { day: "numeric", month: "short" })}</span>
                            <div style={{ flex: 1, height: 5, borderRadius: 999, background: "var(--border)", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${Math.round((s.score / s.total) * 100)}%`, borderRadius: 999, background: "var(--accent)" }} />
                            </div>
                            <span className="font-display" style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{s.score}/{s.total}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SIDEBAR — order-1 on mobile so the primary CTA sits above the knowledge map, not below it */}
                  <div className="lg:col-span-4 order-1 lg:order-none" style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                    <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.985 }} onClick={startNewSession} style={{ padding: "18px 20px", borderRadius: 16, border: "none", cursor: "pointer", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 16, boxShadow: "var(--shadow)", textAlign: "left", fontFamily: "inherit" }}>
                      <div className="font-display">{lastSession ? "Новая сессия →" : "Начать →"}</div>
                      <div style={{ fontWeight: 500, fontSize: 12.5, opacity: 0.75, marginTop: 3 }}>10 вопросов · адаптивно</div>
                    </motion.button>
                    {dueForReview.length > 0 && (
                      <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.985 }} onClick={startReview} style={{ padding: "18px 20px", borderRadius: 16, cursor: "pointer", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontWeight: 700, fontSize: 16, textAlign: "left", fontFamily: "inherit" }}>
                        <div className="font-display">Повторить →</div>
                        <div style={{ fontWeight: 500, fontSize: 12.5, color: "var(--text-2)", marginTop: 3 }}>{dueForReview.length} подтем пора повторить</div>
                      </motion.button>
                    )}
                    {(weakCount > 0 || goodCount > 0 || progCount > 0) && dueForReview.length === 0 && (
                      <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.985 }} onClick={startFocused} style={{ padding: "18px 20px", borderRadius: 16, cursor: "pointer", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontWeight: 700, fontSize: 16, textAlign: "left", fontFamily: "inherit" }}>
                        <div className="font-display">До мастерства →</div>
                        <div style={{ fontWeight: 500, fontSize: 12.5, color: "var(--text-2)", marginTop: 3 }}>{total - expertCount} подтем · {nextWeak?.name ?? ""}</div>
                      </motion.button>
                    )}

                    {/* ACTIVITY */}
                    <div style={{ marginTop: 8, padding: "18px 20px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)" }}>
                      <h3 className="font-display" style={{ fontWeight: 600, fontSize: 12, letterSpacing: "0.07em", color: "var(--text-2)", margin: "0 0 16px" }}>АКТИВНОСТЬ</h3>
                      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 6, height: 64 }}>
                        {activity.map((a, i) => (
                          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                            <div style={{ width: "100%", maxWidth: 18, height: Math.max(3, (a.count / maxActivity) * 48), borderRadius: 3, background: a.count > 0 ? "var(--accent)" : "var(--border)" }} />
                            <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 600 }}>{a.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* GLOSSARY BY SUBTOPIC */}
                    {subs.some(s => s.definitions.length > 0) && (() => {
                      const subsWithDefs = subs.filter(s => s.definitions.length > 0)
                      const totalDefs = subsWithDefs.reduce((n, s) => n + s.definitions.length, 0)
                      return (
                        <div style={{ padding: "18px 20px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)" }}>
                          <h3 className="font-display" style={{ fontWeight: 600, fontSize: 12, letterSpacing: "0.07em", color: "var(--text-2)", margin: "0 0 14px" }}>
                            ГЛОССАРИЙ <span style={{ color: "var(--text-3)" }}>· {totalDefs}</span>
                          </h3>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {subsWithDefs.map(s => {
                              const th = getTheme(s.status)
                              const isOpen = !!openTerms[s.name]
                              return (
                                <div key={s.name} style={{ borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border)", borderLeft: `3px solid ${th.border}`, overflow: "hidden" }}>
                                  <button
                                    onClick={() => setOpenTerms(prev => ({ ...prev, [s.name]: !prev[s.name] }))}
                                    style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "11px 14px", cursor: "pointer", background: "transparent", border: "none", fontFamily: "inherit" }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: th.dot, flexShrink: 0 }} />
                                      <span className="font-display" style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                                    </div>
                                    <span style={{ fontSize: 13, color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                                      {s.definitions.length}
                                      <span style={{ display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s ease" }}><ChevronDownIcon size={13} color="var(--text-3)" /></span>
                                    </span>
                                  </button>
                                  {isOpen && (
                                    <div style={{ borderTop: "1px solid var(--border)", padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
                                      {s.definitions.map(d => (
                                        <div key={d.term}>
                                          <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{d.term}</p>
                                          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "var(--text-2)" }}>{d.definition}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  )
}
