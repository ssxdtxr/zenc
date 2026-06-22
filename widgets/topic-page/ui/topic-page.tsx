"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { GlossaryTerm, Topic, SessionRecord } from "@/entities/topic/model/types"
import { OVERALL_LEVEL_CONFIG, SUBTOPIC_STATUS_CONFIG } from "@/entities/topic/config"
import { TutorSession } from "@/widgets/tutor-session/ui/tutor-session"
import { Button } from "@/shared/ui/button"
import { apiClient } from "@/shared/lib/api-client"

type Props = { id: string }

export const TopicPage = ({ id }: Props) => {
  const router = useRouter()
  const [topic, setTopic] = useState<Topic | null>(null)
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
  const [loading, setLoading] = useState(true)

  const loadTopic = useCallback(async () => {
    try {
      const t = await apiClient.getTopicById(id)
      if (!t) router.push("/")
      else setTopic(t)
    } catch {
      router.push("/")
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { loadTopic() }, [loadTopic])

  const handleSessionComplete = async (results: Omit<SessionRecord, "id" | "date"> & { glossary?: GlossaryTerm[] }) => {
    if (!topic) return
    await apiClient.saveSession(id, results)
    await loadTopic()
  }

  const clearSavedSession = () => {
    try { localStorage.removeItem(`zerc_session_${id}`) } catch {}
  }

  const startNewSession = () => {
    clearSavedSession()
    setFocusSubtopics(undefined)
    setSessionKey((k) => k + 1)
    setInSession(true)
  }

  const startFocusedSession = () => {
    clearSavedSession()
    const weak = topic?.currentSubtopics
      .filter((s) => s.status === "needs_work" || s.status === "learning")
      .map((s) => s.name) ?? []
    setFocusSubtopics(weak)
    setSessionKey((k) => k + 1)
    setInSession(true)
  }

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--violet)" }} />
    </div>
  )

  if (!topic) return null

  const levelCfg = topic.overallLevel ? OVERALL_LEVEL_CONFIG[topic.overallLevel] : null
  const lastSession = topic.sessions[0] ?? null

  return (
    <div className="min-h-dvh" style={{ background: "var(--bg)" }}>
      <header
        className="sticky top-0 z-10 px-5 py-4 flex items-center gap-3"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <button
          onClick={() => inSession ? setInSession(false) : router.push("/")}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-2)", boxShadow: "var(--shadow-sm)" }}
        >
          ←
        </button>
        <span className="font-semibold flex-1 truncate text-sm" style={{ color: "var(--text)" }}>{topic.name}</span>
        {levelCfg && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
            style={{ color: levelCfg.color, background: levelCfg.bg, border: `1px solid ${levelCfg.border}` }}
          >
            {levelCfg.label}
          </span>
        )}
      </header>

      <main className="px-5 py-6 pb-10 space-y-4">
        {!inSession && (
          <>
            <Button size="lg" onClick={startNewSession}>
              {lastSession ? "Новая сессия →" : "Начать первую сессию →"}
            </Button>

            {(() => {
              const weakCount = topic.currentSubtopics.filter(
                (s) => s.status === "needs_work" || s.status === "learning"
              ).length
              return weakCount > 0 ? (
                <button
                  onClick={startFocusedSession}
                  className="w-full py-3 px-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{
                    background: "var(--violet-light)",
                    border: "1.5px solid var(--border)",
                    color: "var(--violet)",
                  }}
                >
                  <span>🎯</span>
                  <span>Тренировать слабые места · {weakCount}</span>
                </button>
              ) : null
            })()}

            {lastSession && (
              <div className="p-4 rounded-3xl space-y-2" style={{ background: "var(--surface)", boxShadow: "var(--shadow)", border: "1.5px solid var(--border)" }}>
                <div className="flex justify-between items-center">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Последняя сессия</p>
                  <span className="text-sm font-bold" style={{ color: "var(--violet)" }}>{lastSession.score}/{lastSession.total}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{lastSession.summary}</p>
              </div>
            )}

            {topic.currentSubtopics.length > 0 && (
              <div className="p-4 rounded-3xl space-y-3" style={{ background: "var(--surface)", boxShadow: "var(--shadow)", border: "1.5px solid var(--border)" }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Карта знаний</p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>нажми → читай теорию</p>
                </div>
                <div className="space-y-2">
                  {topic.currentSubtopics.map((s) => {
                    const cfg = SUBTOPIC_STATUS_CONFIG[s.status]
                    return (
                      <div
                        key={s.name}
                        className="rounded-2xl overflow-hidden"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                      >
                        {/* Header — кликабельный переход к теории */}
                        <button
                          onClick={() => router.push(`/topic/${id}/subtopic/${encodeURIComponent(s.name)}`)}
                          className="w-full flex items-start justify-between gap-3 p-3 text-left transition-all active:scale-[0.98]"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold" style={{ color: cfg.color }}>{s.name}</p>
                            {s.recommendation && (
                              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-2)" }}>{s.recommendation}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                            <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                            <span className="text-xs" style={{ color: cfg.color }}>→</span>
                          </div>
                        </button>

                        {/* Definitions */}
                        {s.definitions.length > 0 && (
                          <div
                            className="px-3 pb-3 space-y-2"
                            style={{ borderTop: `1px solid ${cfg.border}` }}
                          >
                            <p className="text-xs font-bold uppercase tracking-wider pt-2.5" style={{ color: cfg.color, opacity: 0.7 }}>
                              Определения
                            </p>
                            {s.definitions.map((d) => (
                              <div key={d.term} className="space-y-0.5">
                                <p className="text-xs font-semibold" style={{ color: cfg.color }}>{d.term}</p>
                                <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{d.definition}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {topic.glossary.length > 0 && (
              <div className="p-4 rounded-3xl space-y-3" style={{ background: "var(--surface)", boxShadow: "var(--shadow)", border: "1.5px solid var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Глоссарий</p>
                <div className="space-y-3">
                  {topic.glossary.map((g) => (
                    <div key={g.term} className="space-y-0.5">
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{g.term}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{g.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {topic.sessions.length > 1 && (
              <div className="p-4 rounded-3xl" style={{ background: "var(--surface)", boxShadow: "var(--shadow)", border: "1.5px solid var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-3)" }}>История</p>
                <div className="space-y-1">
                  {topic.sessions.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex justify-between py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                      <span className="text-sm" style={{ color: "var(--text-2)" }}>
                        {new Date(s.date).toLocaleDateString("ru", { day: "numeric", month: "short" })}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{s.score}/{s.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {inSession && (
          <div className="p-5 rounded-3xl" style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)", border: "1.5px solid var(--border)" }}>
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
        )}
      </main>
    </div>
  )
}
