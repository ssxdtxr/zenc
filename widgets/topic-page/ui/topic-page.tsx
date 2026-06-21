"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Topic, SessionRecord } from "@/entities/topic/model/types"
import { OVERALL_LEVEL_CONFIG, SUBTOPIC_STATUS_CONFIG } from "@/entities/topic/config"
import { TutorSession } from "@/widgets/tutor-session/ui/tutor-session"
import { Button } from "@/shared/ui/button"
import { storage } from "@/shared/lib/storage"

type Props = { id: string }

export const TopicPage = ({ id }: Props) => {
  const router = useRouter()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [inSession, setInSession] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)

  const loadTopic = useCallback(() => {
    const t = storage.getTopicById(id)
    if (!t) router.push("/")
    else setTopic(t)
  }, [id, router])

  useEffect(() => { loadTopic() }, [loadTopic])

  const handleSessionComplete = (results: Omit<SessionRecord, "id" | "date">) => {
    if (!topic) return
    const record: SessionRecord = { ...results, id: crypto.randomUUID(), date: new Date().toISOString() }
    const updated: Topic = {
      ...topic,
      lastSessionAt: record.date,
      sessions: [record, ...topic.sessions],
      currentSubtopics: record.subtopics,
      overallLevel: record.overallLevel,
    }
    storage.saveTopic(updated)
    setTopic(updated)
  }

  const startNewSession = () => {
    setSessionKey((k) => k + 1)
    setInSession(true)
  }

  if (!topic) return (
    <div className="min-h-dvh flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--violet)" }} />
    </div>
  )

  const levelCfg = topic.overallLevel ? OVERALL_LEVEL_CONFIG[topic.overallLevel] : null
  const lastSession = topic.sessions[0] ?? null

  return (
    <div className="min-h-dvh" style={{ background: "var(--bg)" }}>
      {/* Header */}
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
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-2)", boxShadow: "var(--shadow-sm)" }}
        >
          ←
        </button>
        <span className="font-semibold flex-1 truncate" style={{ color: "var(--text)" }}>{topic.name}</span>
        {levelCfg && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ color: levelCfg.color, background: levelCfg.bg, border: `1px solid ${levelCfg.border}` }}
          >
            {levelCfg.label}
          </span>
        )}
      </header>

      <main className="px-5 py-6 pb-10 space-y-4">
        {!inSession && (
          <>
            {/* Start CTA */}
            <Button size="lg" onClick={startNewSession}>
              {lastSession ? "Новая сессия →" : "Начать первую сессию →"}
            </Button>

            {/* Last session */}
            {lastSession && (
              <div
                className="p-4 rounded-3xl space-y-2"
                style={{ background: "var(--surface)", boxShadow: "var(--shadow)", border: "1.5px solid var(--border)" }}
              >
                <div className="flex justify-between items-center">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Последняя сессия</p>
                  <span className="text-sm font-bold" style={{ color: "var(--violet)" }}>{lastSession.score}/{lastSession.total}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{lastSession.summary}</p>
              </div>
            )}

            {/* Subtopics */}
            {topic.currentSubtopics.length > 0 && (
              <div
                className="p-4 rounded-3xl space-y-3"
                style={{ background: "var(--surface)", boxShadow: "var(--shadow)", border: "1.5px solid var(--border)" }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Карта знаний</p>
                <div className="space-y-2">
                  {topic.currentSubtopics.map((s) => {
                    const cfg = SUBTOPIC_STATUS_CONFIG[s.status]
                    return (
                      <div
                        key={s.name}
                        className="flex items-start justify-between gap-3 p-3 rounded-2xl"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold" style={{ color: cfg.color }}>{s.name}</p>
                          {s.recommendation && (
                            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-2)" }}>{s.recommendation}</p>
                          )}
                        </div>
                        <span className="text-xs font-medium shrink-0 pt-0.5" style={{ color: cfg.color }}>{cfg.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* History */}
            {topic.sessions.length > 1 && (
              <div
                className="p-4 rounded-3xl"
                style={{ background: "var(--surface)", boxShadow: "var(--shadow)", border: "1.5px solid var(--border)" }}
              >
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
          <div
            className="p-5 rounded-3xl"
            style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)", border: "1.5px solid var(--border)" }}
          >
            <TutorSession
              key={sessionKey}
              topicName={topic.name}
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
