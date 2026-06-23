"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useDashboard } from "../model/use-dashboard"
import type { Topic } from "@/entities/topic/model/types"
import { OVERALL_LEVEL_CONFIG } from "@/entities/topic/config"

const CIRC = 351.86

function calcProgress(topic: Topic) {
  const total = topic.currentSubtopics.length
  if (!total) return 0
  const done = topic.currentSubtopics.filter(s => s.status === "expert" || s.status === "good").length
  return Math.round((done / total) * 100)
}

function dotColor(status: string) {
  if (status === "expert" || status === "good") return "#4ade80"
  if (status === "learning") return "#ffae3b"
  return "rgba(255,255,255,0.32)"
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

  const activeTopic = filtered
    .filter(t => t.lastSessionAt)
    .sort((a, b) => new Date(b.lastSessionAt!).getTime() - new Date(a.lastSessionAt!).getTime())[0] ?? null

  const otherTopics = filtered.filter(t => t.id !== activeTopic?.id)
  const totalSessions = topics.reduce((sum, t) => sum + t.sessions.length, 0)
  const activeProgress = activeTopic ? calcProgress(activeTopic) : 0
  const activeDashoffset = CIRC * (1 - activeProgress / 100)

  const BG = "radial-gradient(1200px 800px at 80% -10%, rgba(109,60,255,0.18), transparent 60%), radial-gradient(900px 700px at 0% 100%, rgba(240,82,156,0.14), transparent 55%), #08070f"

  return (
    <div style={{ position: "relative", minHeight: "100vh", width: "100%", overflow: "hidden", background: BG }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", filter: "blur(70px)" }}>
        <div style={{ position: "absolute", top: "-8%", left: "8%", width: "38vw", height: "38vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #7c3cff, transparent 70%)", opacity: 0.55, animation: "drift1 26s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "18%", right: "-6%", width: "34vw", height: "34vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #ff4d8d, transparent 70%)", opacity: 0.42, animation: "drift2 30s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-12%", left: "30%", width: "42vw", height: "42vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #2bd9e3, transparent 70%)", opacity: 0.30, animation: "drift3 34s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "42%", left: "-8%", width: "30vw", height: "30vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #ffae3b, transparent 70%)", opacity: 0.22, animation: "drift4 28s ease-in-out infinite" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", padding: "16px 20px 80px" }}>

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

        {creating && (
          <div className="anim-rise" style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,0.07)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(155,107,255,0.4)", boxShadow: "0 12px 40px rgba(109,60,255,0.25)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>Новая тема</span>
            <input value={newTopicName} onChange={e => setNewTopicName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreate()} placeholder="TypeScript, System Design, PostgreSQL…" autoFocus style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 11, padding: "10px 12px", outline: "none", color: "#fff", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }} />
            <button onClick={handleCreate} disabled={!newTopicName.trim()} style={{ padding: "10px 18px", borderRadius: 11, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#9b6bff,#6d3cff)", color: "#fff", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", fontFamily: "inherit" }}>Добавить</button>
            <button onClick={() => { setCreating(false); setNewTopicName("") }} style={{ padding: "10px 12px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.14)", cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Отмена</button>
          </div>
        )}

        <header style={{ marginTop: 36, display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20 }}>
          <div className="anim-rise">
            {totalSessions > 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 14 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 10px #4ade80", display: "inline-block", flexShrink: 0 }} />
                {totalSessions} сессий · продолжай учиться
              </div>
            )}
            <h1 className="font-display" style={{ fontWeight: 700, fontSize: 36, lineHeight: 1.05, letterSpacing: "-0.025em", margin: "0 0 8px", color: "#fff" }}>
              {activeTopic ? "Продолжаем" : "Привет"}
            </h1>
            <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.55)", maxWidth: 400 }}>
              {activeTopic ? "Продолжай с того места, где остановился." : "Добавь первую тему и начни учиться."}
            </p>
          </div>
          {totalSessions > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ minWidth: 110, padding: "14px 16px", borderRadius: 16, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 8, fontWeight: 600, letterSpacing: "0.04em" }}>СЕССИЙ</div>
                <div className="font-display" style={{ fontWeight: 700, fontSize: 24, lineHeight: 1, color: "#fff" }}>{totalSessions}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3, fontWeight: 500 }}>всего</div>
              </div>
              <div style={{ minWidth: 110, padding: "14px 16px", borderRadius: 16, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 8, fontWeight: 600, letterSpacing: "0.04em" }}>ТЕМ</div>
                <div className="font-display" style={{ fontWeight: 700, fontSize: 24, lineHeight: 1, color: "#fff" }}>{topics.length}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3, fontWeight: 500 }}>изучаешь</div>
              </div>
            </div>
          )}
        </header>

        {error && (
          <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 14, background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.35)", color: "#fca5a5", fontSize: 13, fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{error}</span>
            <button onClick={reload} style={{ background: "none", border: "none", color: "#f87171", fontWeight: 700, cursor: "pointer", fontSize: 13, textDecoration: "underline", fontFamily: "inherit" }}>Повторить</button>
          </div>
        )}

        {loading && (
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
            {[0, 1].map(i => <div key={i} style={{ height: 80, borderRadius: 20, background: "rgba(255,255,255,0.05)" }} />)}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ marginTop: 36, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <h2 className="font-display" style={{ fontWeight: 600, fontSize: 20, letterSpacing: "-0.01em", margin: 0, color: "#fff" }}>Твои темы</h2>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{filtered.length} {filtered.length === 1 ? "тема" : filtered.length < 5 ? "темы" : "тем"}</span>
          </div>
        )}

        {!loading && activeTopic && (
          <article className="anim-pop" style={{ marginTop: 14, borderRadius: 24, background: "rgba(255,255,255,0.07)", backdropFilter: "blur(28px) saturate(150%)", WebkitBackdropFilter: "blur(28px) saturate(150%)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 18px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)", overflow: "hidden" }}>
            <div style={{ padding: "24px 26px", display: "flex", gap: 22, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div style={{ position: "relative", width: 108, height: 108, flexShrink: 0 }}>
                <svg width="108" height="108" viewBox="0 0 128 128" style={{ transform: "rotate(-90deg)" }}>
                  <defs>
                    <linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#9b6bff" />
                      <stop offset="100%" stopColor="#2bd9e3" />
                    </linearGradient>
                  </defs>
                  <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="11" />
                  <circle cx="64" cy="64" r="56" fill="none" stroke="url(#ringgrad)" strokeWidth="11" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={activeDashoffset} style={{ transition: "stroke-dashoffset .7s cubic-bezier(.2,.8,.2,1)" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span className="font-display" style={{ fontWeight: 700, fontSize: 24, lineHeight: 1, color: "#fff" }}>{activeProgress}%</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2, fontWeight: 500 }}>освоено</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                  <h3 className="font-display" style={{ fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", margin: 0, color: "#fff" }}>{activeTopic.name}</h3>
                  {activeTopic.overallLevel && (
                    <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: OVERALL_LEVEL_CONFIG[activeTopic.overallLevel].bg, color: OVERALL_LEVEL_CONFIG[activeTopic.overallLevel].color, border: `1px solid ${OVERALL_LEVEL_CONFIG[activeTopic.overallLevel].border}` }}>
                      {OVERALL_LEVEL_CONFIG[activeTopic.overallLevel].label}
                    </span>
                  )}
                  <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "linear-gradient(135deg,rgba(155,107,255,0.25),rgba(43,217,227,0.2))", color: "#fff", border: "1px solid rgba(255,255,255,0.18)" }}>активная</span>
                </div>
                <div style={{ marginTop: 5, fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
                  {activeTopic.sessions.length} сессий · {activeTopic.currentSubtopics.filter(s => s.status === "expert" || s.status === "good").length} из {activeTopic.currentSubtopics.length} тем
                </div>
                {activeTopic.currentSubtopics.length > 0 && (
                  <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {activeTopic.currentSubtopics.slice(0, 7).map(s => (
                      <span key={s.name} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 11px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 500 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: dotColor(s.status), boxShadow: `0 0 6px ${dotColor(s.status)}` }} />
                        {s.name}
                      </span>
                    ))}
                    {activeTopic.currentSubtopics.length > 7 && (
                      <span style={{ display: "inline-flex", alignItems: "center", padding: "6px 11px", borderRadius: 999, background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 12 }}>+{activeTopic.currentSubtopics.length - 7}</span>
                    )}
                  </div>
                )}
                <div style={{ marginTop: 16 }}>
                  <button onClick={() => router.push(`/topic/${activeTopic.id}`)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 20px", borderRadius: 13, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#9b6bff,#6d3cff)", color: "#fff", fontWeight: 700, fontSize: 14, boxShadow: "0 10px 26px rgba(109,60,255,0.45)", fontFamily: "inherit" }}>
                    Продолжить обучение →
                  </button>
                </div>
              </div>
            </div>
          </article>
        )}

        {!loading && otherTopics.length > 0 && (
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
            {otherTopics.map(t => {
              const progress = calcProgress(t)
              const started = t.sessions.length > 0
              return (
                <article key={t.id} className="anim-pop" style={{ position: "relative", borderRadius: 20, background: "rgba(255,255,255,0.055)", backdropFilter: "blur(22px) saturate(140%)", WebkitBackdropFilter: "blur(22px) saturate(140%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.14)", padding: "20px" }}>
                  <button onClick={() => deleteTopic(t.id)} style={{ position: "absolute", top: 14, right: 14, width: 26, height: 26, borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>×</button>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 32 }}>
                    <h3 className="font-display" style={{ fontWeight: 600, fontSize: 17, letterSpacing: "-0.01em", margin: 0, color: "#fff" }}>{t.name}</h3>
                    {t.overallLevel && (
                      <span style={{ padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: OVERALL_LEVEL_CONFIG[t.overallLevel].bg, color: OVERALL_LEVEL_CONFIG[t.overallLevel].color, border: `1px solid ${OVERALL_LEVEL_CONFIG[t.overallLevel].border}`, flexShrink: 0 }}>
                        {OVERALL_LEVEL_CONFIG[t.overallLevel].label}
                      </span>
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
                      <button onClick={() => router.push(`/topic/${t.id}`)} style={{ marginTop: 12, width: "100%", padding: "10px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Продолжить →</button>
                    </div>
                  ) : (
                    <div style={{ marginTop: 14 }}>
                      <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>Ещё не начато · {t.currentSubtopics.length} тем впереди</p>
                      <button onClick={() => router.push(`/topic/${t.id}`)} style={{ width: "100%", padding: "10px", borderRadius: 11, border: "none", cursor: "pointer", background: "linear-gradient(135deg,rgba(155,107,255,0.9),rgba(109,60,255,0.9))", color: "#fff", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>Начать →</button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {!loading && topics.length === 0 && !creating && !error && (
          <div style={{ marginTop: 48, padding: "40px 24px", textAlign: "center", borderRadius: 20, border: "1px dashed rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.03)" }}>
            <p style={{ margin: "0 0 20px", fontSize: 15, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Добавь первую тему и начни учиться</p>
            <button onClick={() => setCreating(true)} style={{ padding: "11px 24px", borderRadius: 13, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#9b6bff,#6d3cff)", color: "#fff", fontWeight: 700, fontSize: 14, boxShadow: "0 8px 22px rgba(109,60,255,0.45)", fontFamily: "inherit" }}>+ Добавить тему</button>
          </div>
        )}

        {!loading && query && filtered.length === 0 && (
          <div style={{ marginTop: 14, padding: "32px", textAlign: "center", borderRadius: 18, border: "1px dashed rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 500 }}>
            Ничего не найдено по запросу «{query}»
          </div>
        )}

      </div>
    </div>
  )
}
