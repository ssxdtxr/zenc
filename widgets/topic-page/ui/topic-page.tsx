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
  const [inSession, setInSession] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)
  const [focusSubtopics, setFocusSubtopics] = useState<string[] | undefined>(undefined)
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

  const startNewSession = () => {
    setFocusSubtopics(undefined)
    setSessionKey((k) => k + 1)
    setInSession(true)
  }

  const startFocusedSession = () => {
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
          background: "rgba(245,243,255,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
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
                    border: "1.5px solid rgba(124,58,237,0.25)",
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
                      <button
                        key={s.name}
                        onClick={() => router.push(`/topic/${id}/subtopic/${encodeURIComponent(s.name)}`)}
                        className="w-full flex items-start justify-between gap-3 p-3 rounded-2xl text-left transition-all active:scale-[0.98]"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
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
              topicName={topic.name}
              focusSubtopics={focusSubtopics}
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
