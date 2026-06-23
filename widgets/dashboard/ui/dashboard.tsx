"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useDashboard } from "../model/use-dashboard"
import { OVERALL_LEVEL_CONFIG } from "@/entities/topic/config"
import type { Topic } from "@/entities/topic/model/types"

function calcProgress(topic: Topic) {
  const total = topic.currentSubtopics.length
  if (!total) return 0
  const good = topic.currentSubtopics.filter(s => s.status === "expert" || s.status === "good").length
  const learning = topic.currentSubtopics.filter(s => s.status === "learning").length
  return Math.round(((good + learning * 0.5) / total) * 100)
}

export const Dashboard = () => {
  const router = useRouter()
  const { topics, newTopicName, creating, loading, error, setNewTopicName, setCreating, createTopic, deleteTopic, reload } = useDashboard()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUserEmail(d.user?.email ?? null))
  }, [])

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  const handleCreate = async () => {
    const id = await createTopic()
    if (id) router.push(`/topic/${id}`)
  }

  const filtered = topics.filter(t =>
    !query || t.name.toLowerCase().includes(query.toLowerCase())
  )

  const totalSessions = topics.reduce((sum, t) => sum + t.sessions.length, 0)

  const BG = "radial-gradient(1200px 800px at 80% -10%, rgba(109,60,255,0.18), transparent 60%), radial-gradient(900px 700px at 0% 100%, rgba(240,82,156,0.14), transparent 55%), #08070f"

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: BG, overflow: "hidden" }}>
      {/* Blobs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", filter: "blur(70px)" }}>
        <div style={{ position: "absolute", top: "-8%", left: "8%", width: "38vw", height: "38vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #7c3cff, transparent 70%)", opacity: 0.55, animation: "drift1 26s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "18%", right: "-6%", width: "34vw", height: "34vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #ff4d8d, transparent 70%)", opacity: 0.42, animation: "drift2 30s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-12%", left: "30%", width: "42vw", height: "42vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #2bd9e3, transparent 70%)", opacity: 0.30, animation: "drift3 34s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "42%", left: "-8%", width: "30vw", height: "30vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #ffae3b, transparent 70%)", opacity: 0.22, animation: "drift4 28s ease-in-out infinite" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", padding: "16px 20px 80px" }}>

        {/* NAV */}
        <nav style={{ position: "sticky", top: 12, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px 10px 14px", borderRadius: 18, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px) saturate(150%)", WebkitBackdropFilter: "blur(24px) saturate(150%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 10px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="font-display" style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg,#9b6bff,#6d3cff)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, color: "#fff", boxShadow: "0 6px 18px rgba(109,60,255,0.5)" }}>Z</div>
            <span className="font-display" style={{ fontWeight: 600, fontSize: 17, letterSpacing: "-0.01em", color: "#fff" }}>Zerc</span>
          </div>
          <div style={{ flex: 1, maxWidth: 320, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск по темам…" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setCreating(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#9b6bff,#6d3cff)", color: "#fff", fontWeight: 700, fontSize: 13, boxShadow: "0 8px 22px rgba(109,60,255,0.45)", fontFamily: "inherit" }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Тема
            </button>
            {userEmail && (
              <button onClick={logout} title={`Выйти (${userEmail})`} style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#2bd9e3,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#06121a", cursor: "pointer", border: "1.5px solid rgba(255,255,255,0.25)", fontFamily: "inherit" }}>
                {userEmail[0].toUpperCase()}
              </button>
            )}
          </div>
        </nav>

        {/* ADD BAR */}
        {creating && (
          <div className="anim-rise" style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,0.07)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(155,107,255,0.4)", boxShadow: "0 12px 40px rgba(109,60,255,0.25)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>Новая тема</span>
            <input value={newTopicName} onChange={e => setNewTopicName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreate()} placeholder="TypeScript, System Design, PostgreSQL…" autoFocus style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 11, padding: "10px 12px", outline: "none", color: "#fff", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }} />
            <button onClick={handleCreate} disabled={!newTopicName.trim()} style={{ padding: "10px 18px", borderRadius: 11, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#9b6bff,#6d3cff)", color: "#fff", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", fontFamily: "inherit" }}>Добавить</button>
            <button onClick={() => { setCreating(false); setNewTopicName("") }} style={{ padding: "10px 12px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.14)", cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Отмена</button>
          </div>
        )}

        {/* HERO */}
        <header style={{ marginTop: 36 }}>
          <div className="anim-rise">
            {totalSessions > 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 14 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 10px #4ade80", display: "inline-block", flexShrink: 0 }} />
                {totalSessions} сессий · продолжай учиться
              </div>
            )}
            <h1 className="font-display" style={{ fontWeight: 700, fontSize: 36, lineHeight: 1.05, letterSpacing: "-0.025em", margin: "0 0 8px", color: "#fff" }}>
              {topics.length > 0 ? "Твои темы" : "Привет"}
            </h1>
            <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.55)" }}>
              {topics.length > 0 ? `${topics.length} ${topics.length === 1 ? "тема" : topics.length < 5 ? "темы" : "тем"} · продолжай учиться` : "Добавь первую тему и начни учиться."}
            </p>
          </div>
        </header>

        {/* ERROR */}
        {error && (
          <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 14, background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.35)", color: "#fca5a5", fontSize: 13, fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{error}</span>
            <button onClick={reload} style={{ background: "none", border: "none", color: "#f87171", fontWeight: 700, cursor: "pointer", fontSize: 13, textDecoration: "underline", fontFamily: "inherit" }}>Повторить</button>
          </div>
        )}

        {/* SKELETON */}
        {loading && (
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
            {[0, 1].map(i => <div key={i} style={{ height: 80, borderRadius: 20, background: "rgba(255,255,255,0.05)" }} />)}
          </div>
        )}

        {/* TOPICS GRID */}
        {!loading && filtered.length > 0 && (
          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
            {filtered.map(t => {
              const progress = calcProgress(t)
              const started = t.sessions.length > 0
              const now = Date.now()
              const dueCount = t.currentSubtopics.filter(
                s => s.nextReviewAt && new Date(s.nextReviewAt).getTime() <= now
              ).length
              return (
                <article key={t.id} className="anim-pop" style={{ position: "relative", borderRadius: 20, background: "rgba(255,255,255,0.055)", backdropFilter: "blur(22px) saturate(140%)", WebkitBackdropFilter: "blur(22px) saturate(140%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.14)", padding: "20px" }}>
                  <button onClick={() => deleteTopic(t.id)} style={{ position: "absolute", top: 14, right: 14, width: 26, height: 26, borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>×</button>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 32, marginBottom: 4 }}>
                    <h3 className="font-display" style={{ fontWeight: 600, fontSize: 17, letterSpacing: "-0.01em", margin: 0, color: "#fff" }}>{t.name}</h3>
                    {t.overallLevel && (
                      <span style={{ padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: OVERALL_LEVEL_CONFIG[t.overallLevel].bg, color: OVERALL_LEVEL_CONFIG[t.overallLevel].color, border: `1px solid ${OVERALL_LEVEL_CONFIG[t.overallLevel].border}`, flexShrink: 0 }}>
                        {OVERALL_LEVEL_CONFIG[t.overallLevel].label}
                      </span>
                    )}
                    {dueCount > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#ffbb5c", background: "rgba(255,187,92,0.18)", padding: "3px 8px", borderRadius: 999, border: "1px solid rgba(255,187,92,0.35)", flexShrink: 0 }}>🔔 {dueCount}</span>
                    )}
                  </div>

                  {started ? (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, marginBottom: 7 }}>
                        <span>{t.currentSubtopics.filter(s => s.status === "expert" || s.status === "good").length} из {t.currentSubtopics.length} тем</span>
                        <span>{progress}%</span>
                      </div>
                      <div style={{ height: 7, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#9b6bff,#2bd9e3)", width: `${progress}%`, transition: "width .6s ease" }} />
                      </div>
                      <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{t.sessions.length} сессий</div>
                      <button onClick={() => router.push(`/topic/${t.id}`)} style={{ marginTop: 12, width: "100%", padding: "10px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                        Продолжить →
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginTop: 14 }}>
                      <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>Ещё не начато · {t.currentSubtopics.length > 0 ? `${t.currentSubtopics.length} тем` : "добавлена"}</p>
                      <button onClick={() => router.push(`/topic/${t.id}`)} style={{ width: "100%", padding: "10px", borderRadius: 11, border: "none", cursor: "pointer", background: "linear-gradient(135deg,rgba(155,107,255,0.9),rgba(109,60,255,0.9))", color: "#fff", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
                        Начать →
                      </button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {/* EMPTY */}
        {!loading && topics.length === 0 && !creating && !error && (
          <div style={{ marginTop: 48, padding: "40px 24px", textAlign: "center", borderRadius: 20, border: "1px dashed rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.03)" }}>
            <p style={{ margin: "0 0 20px", fontSize: 15, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Добавь первую тему и начни учиться</p>
            <button onClick={() => setCreating(true)} style={{ padding: "11px 24px", borderRadius: 13, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#9b6bff,#6d3cff)", color: "#fff", fontWeight: 700, fontSize: 14, boxShadow: "0 8px 22px rgba(109,60,255,0.45)", fontFamily: "inherit" }}>+ Добавить тему</button>
          </div>
        )}

        {/* NO RESULTS */}
        {!loading && query && filtered.length === 0 && (
          <div style={{ marginTop: 14, padding: "32px", textAlign: "center", borderRadius: 18, border: "1px dashed rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 500 }}>
            Ничего не найдено по запросу «{query}»
          </div>
        )}

      </div>
    </div>
  )
}
