"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { XIcon, SearchIcon, PlusIcon, HelpIcon } from "@/shared/ui/icons"
import { useDashboard } from "../model/use-dashboard"
import { OVERALL_LEVEL_CONFIG } from "@/entities/topic/config"
import type { Topic } from "@/entities/topic/model/types"
import { springSnappy, springSoft } from "@/shared/lib/motion"
import { AppShell } from "@/widgets/app-shell/ui/app-shell"

const PROGRESS_TOOLTIP = "Процент = доля подтем со статусом «Экспертно» от общего числа подтем"

// Matches TopicPage's mastery ring: % of subtopics marked "expert", nothing else.
function calcProgress(topic: Topic) {
  const total = topic.currentSubtopics.length
  if (!total) return 0
  const expert = topic.currentSubtopics.filter(s => s.status === "expert").length
  return Math.round((expert / total) * 100)
}

export const Dashboard = () => {
  const router = useRouter()
  const { topics, newTopicName, creating, loading, error, setNewTopicName, setCreating, createTopic, deleteTopic, reload } = useDashboard()
  const [query, setQuery] = useState("")

  const handleCreate = async () => {
    const id = await createTopic()
    if (id) router.push(`/topic/${id}`)
  }

  const filtered = topics.filter(t =>
    !query || t.name.toLowerCase().includes(query.toLowerCase())
  )

  const totalSessions = topics.reduce((sum, t) => sum + t.sessions.length, 0)

  return (
    <AppShell>
      <div style={{ position: "relative", flex: 1, background: "var(--bg)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "22px 24px 80px" }}>

          {/* HEADER */}
          <div style={{ paddingBottom: 18, borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                {totalSessions > 0 && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 12 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--text)", flexShrink: 0 }} />
                    {totalSessions} сессий · продолжай учиться
                  </div>
                )}
                <h1 className="font-display" style={{ fontWeight: 700, fontSize: 28, lineHeight: 1.1, letterSpacing: "-0.02em", margin: 0, color: "var(--text)" }}>
                  {topics.length > 0 ? "Твои темы" : "Привет"}
                </h1>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <div className="nav-search" style={{ alignItems: "center", gap: 8, padding: "9px 13px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)", width: 260 }}>
                  <SearchIcon size={14} color="var(--text-3)" />
                  <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск по темам…" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }} />
                </div>
                <button onClick={() => setCreating(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 12, border: "none", cursor: "pointer", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 13, boxShadow: "var(--shadow)", fontFamily: "inherit", flexShrink: 0 }}>
                  <PlusIcon size={14} color="#fff" /> Тема
                </button>
              </div>
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--text-2)" }}>
              {topics.length > 0 ? `${topics.length} ${topics.length === 1 ? "тема" : topics.length < 5 ? "темы" : "тем"} · продолжай учиться` : "Добавь первую тему и начни учиться."}
            </p>
          </div>

          {/* ADD BAR */}
          <AnimatePresence>
            {creating && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border-strong)" }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", whiteSpace: "nowrap" }}>Новая тема</span>
                <input value={newTopicName} onChange={e => setNewTopicName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreate()} placeholder="TypeScript, System Design, PostgreSQL…" autoFocus style={{ flex: 1, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 11, padding: "10px 12px", outline: "none", color: "var(--text)", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }} />
                <motion.button whileTap={{ scale: 0.93 }} onClick={handleCreate} disabled={!newTopicName.trim()} style={{ padding: "10px 18px", borderRadius: 11, border: "none", cursor: "pointer", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", fontFamily: "inherit" }}>Добавить</motion.button>
                <motion.button whileTap={{ scale: 0.93 }} onClick={() => { setCreating(false); setNewTopicName("") }} style={{ padding: "10px 12px", borderRadius: 11, border: "1px solid var(--border)", cursor: "pointer", background: "transparent", color: "var(--text-2)", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Отмена</motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ERROR */}
          {error && (
            <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 14, background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#dc2626", fontSize: 13, fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{error}</span>
              <button onClick={reload} style={{ background: "none", border: "none", color: "#dc2626", fontWeight: 700, cursor: "pointer", fontSize: 13, textDecoration: "underline", fontFamily: "inherit" }}>Повторить</button>
            </div>
          )}

          {/* SKELETON */}
          {loading && (
            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
              {[0, 1].map(i => <div key={i} style={{ height: 80, borderRadius: 20, background: "var(--surface)" }} />)}
            </div>
          )}

          {/* TOPICS GRID */}
          {!loading && filtered.length > 0 && (
            <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
              <AnimatePresence mode="popLayout">
              {filtered.map((t, i) => {
                const progress = calcProgress(t)
                const hasSubtopics = t.currentSubtopics.length > 0
                const startedSession = t.sessions.length > 0
                const now = Date.now()
                const dueCount = t.currentSubtopics.filter(
                  s => s.nextReviewAt && new Date(s.nextReviewAt).getTime() <= now
                ).length
                return (
                  <motion.article
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0, transition: { ...springSoft, delay: Math.min(i, 8) * 0.04 } }}
                    exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
                    whileHover={{ y: -4, boxShadow: "var(--shadow-lg)", transition: springSnappy }}
                    style={{ position: "relative", borderRadius: 18, background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow)", padding: "20px" }}
                  >
                    <motion.button whileTap={{ scale: 0.93 }} onClick={() => deleteTopic(t.id)} style={{ position: "absolute", top: 14, right: 14, width: 26, height: 26, minHeight: 26, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><XIcon size={12} color="var(--text-3)" /></motion.button>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 32, marginBottom: 4 }}>
                      <h3 className="font-display" style={{ fontWeight: 600, fontSize: 17, letterSpacing: "-0.01em", margin: 0, color: "var(--text)" }}>{t.name}</h3>
                      {t.overallLevel && (
                        <span style={{ padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)", flexShrink: 0 }}>
                          {OVERALL_LEVEL_CONFIG[t.overallLevel].label}
                        </span>
                      )}
                      {dueCount > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text)", background: "var(--surface-hover)", padding: "3px 8px", borderRadius: 999, border: "1px solid var(--border)", flexShrink: 0 }}>{dueCount} к повтору</span>
                      )}
                    </div>

                    {hasSubtopics ? (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-3)", fontWeight: 600, marginBottom: 7 }}>
                          <span>{t.currentSubtopics.filter(s => s.status === "expert").length} из {t.currentSubtopics.length} тем</span>
                          <span title={PROGRESS_TOOLTIP} style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "help" }}>
                            {progress}%
                            <HelpIcon size={12} color="var(--text-3)" />
                          </span>
                        </div>
                        <div style={{ height: 7, borderRadius: 999, background: "var(--border)", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 999, background: "var(--accent)", width: `${progress}%`, transition: "width .6s ease" }} />
                        </div>
                        <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>{t.sessions.length} сессий</div>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push(`/topic/${t.id}`)} style={{ marginTop: 12, width: "100%", padding: "10px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                          {startedSession ? "Продолжить →" : "Начать →"}
                        </motion.button>
                      </div>
                    ) : (
                      <div style={{ marginTop: 14 }}>
                        <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>Ещё не начато · добавлена</p>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push(`/topic/${t.id}`)} style={{ width: "100%", padding: "10px", borderRadius: 11, border: "none", cursor: "pointer", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
                          Начать →
                        </motion.button>
                      </div>
                    )}
                  </motion.article>
                )
              })}
              </AnimatePresence>
            </div>
          )}

          {/* EMPTY */}
          {!loading && topics.length === 0 && !creating && !error && (
            <div style={{ marginTop: 48, padding: "40px 24px", textAlign: "center", borderRadius: 18, border: "1px dashed var(--border)", background: "var(--surface-2)" }}>
              <p style={{ margin: "0 0 20px", fontSize: 15, color: "var(--text-2)", fontWeight: 500 }}>Добавь первую тему и начни учиться</p>
              <button onClick={() => setCreating(true)} style={{ padding: "11px 24px", borderRadius: 13, border: "none", cursor: "pointer", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 14, boxShadow: "var(--shadow)", fontFamily: "inherit" }}>+ Добавить тему</button>
            </div>
          )}

          {/* NO RESULTS */}
          {!loading && query && filtered.length === 0 && (
            <div style={{ marginTop: 14, padding: "32px", textAlign: "center", borderRadius: 18, border: "1px dashed var(--border)", background: "var(--surface-2)", color: "var(--text-2)", fontSize: 14, fontWeight: 500 }}>
              Ничего не найдено по запросу «{query}»
            </div>
          )}

        </div>
      </div>
    </AppShell>
  )
}
