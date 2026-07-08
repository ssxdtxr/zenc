"use client"

import { useState, useEffect } from "react"
import { ChevronLeftIcon } from "@/shared/ui/icons"
import { useRouter } from "next/navigation"
import { useTheory } from "../model/use-theory"
import { apiClient } from "@/shared/lib/api-client"
import { SUBTOPIC_STATUS_CONFIG } from "@/entities/topic/config"
import type { Topic } from "@/entities/topic/model/types"

type Props = {
  topicId: string
  subtopicName: string
}

const DIFFICULTY_CONFIG = {
  easy:   { label: "Лёгкое", color: "#5ee08a", bg: "rgba(94,224,138,0.12)", border: "rgba(94,224,138,0.3)" },
  medium: { label: "Среднее", color: "#ffbb5c", bg: "rgba(255,187,92,0.12)", border: "rgba(255,187,92,0.3)" },
  hard:   { label: "Сложное", color: "#ff7e92", bg: "rgba(255,126,146,0.12)", border: "rgba(255,126,146,0.3)" },
}

const EXAMPLE_COLORS = [
  { color: "#2bd9e3", bg: "rgba(43,217,227,0.12)", border: "rgba(43,217,227,0.28)" },
  { color: "#b69cff", bg: "rgba(155,107,255,0.12)", border: "rgba(155,107,255,0.28)" },
  { color: "#ffbb5c", bg: "rgba(255,187,92,0.12)", border: "rgba(255,187,92,0.28)" },
]

const CARD = {
  borderRadius: 20,
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(26px) saturate(150%)",
  WebkitBackdropFilter: "blur(26px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.14)",
} as const

const LABEL = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: "rgba(255,255,255,0.38)",
  marginBottom: 12,
} as const

export const TheoryPage = ({ topicId, subtopicName }: Props) => {
  const router = useRouter()
  const [topic, setTopic] = useState<Topic | null>(null)

  useEffect(() => {
    apiClient.getTopicById(topicId).then(setTopic)
  }, [topicId])

  const subtopic = topic?.currentSubtopics.find((s) => s.name === subtopicName)
  const statusCfg = subtopic ? SUBTOPIC_STATUS_CONFIG[subtopic.status] : null

  const { content, loading, error } = useTheory({
    topicName: topic?.name ?? "",
    subtopicName,
    userLevel: topic?.overallLevel ?? null,
    recommendation: subtopic?.recommendation ?? "",
    allSubtopics: topic?.currentSubtopics.map(s => s.name),
  })

  const BG = "radial-gradient(1200px 800px at 80% -10%, rgba(109,60,255,0.18), transparent 60%), radial-gradient(900px 700px at 0% 100%, rgba(43,217,227,0.1), transparent 55%), #08070f"

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: BG, overflow: "hidden" }}>
      {/* Blobs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", filter: "blur(70px)" }}>
        <div style={{ position: "absolute", top: "-8%", left: "8%", width: "38vw", height: "38vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #7c3cff, transparent 70%)", opacity: 0.42, animation: "drift1 26s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "24%", right: "-6%", width: "32vw", height: "32vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #2bd9e3, transparent 70%)", opacity: 0.22, animation: "drift2 30s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-12%", left: "34%", width: "40vw", height: "40vw", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #ff4d8d, transparent 70%)", opacity: 0.18, animation: "drift3 34s ease-in-out infinite" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "22px 28px 72px" }}>

        {/* NAV */}
        <nav style={{ position: "sticky", top: 16, zIndex: 20, display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderRadius: 20, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px) saturate(150%)", WebkitBackdropFilter: "blur(24px) saturate(150%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 10px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)", marginBottom: 22 }}>
          <button onClick={() => router.back()} style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.85)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeftIcon size={20} color="rgba(255,255,255,0.85)" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.42)" }}>{topic?.name}</div>
            <h1 className="font-display" style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", margin: "1px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#fff" }}>{subtopicName}</h1>
          </div>
          {statusCfg && (
            <span style={{ padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, whiteSpace: "nowrap", flexShrink: 0 }}>
              {statusCfg.label}
            </span>
          )}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => router.push(`/topic/${topicId}/subtopic/${encodeURIComponent(subtopicName)}/practice`)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#2bd9e3,#1bb8c4)", color: "#08070f", fontWeight: 700, fontSize: 13.5, boxShadow: "0 4px 14px rgba(43,217,227,0.3)", fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              ✏️ Практика
            </button>
            <button
              onClick={() => router.push(`/topic/${topicId}/subtopic/${encodeURIComponent(subtopicName)}/test`)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 12, border: "1px solid rgba(155,107,255,0.4)", cursor: "pointer", background: "rgba(155,107,255,0.12)", color: "#c4adff", fontWeight: 600, fontSize: 13.5, fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              🧠 Тест
            </button>
          </div>
        </nav>

        {/* LOADING */}
        {loading && (
          <div style={{ paddingTop: 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2.5px solid transparent", borderTopColor: "#9b6bff", animation: "spin 0.8s linear infinite" }} />
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Готовлю объяснение…</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 16, background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.35)", color: "#fca5a5", fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* TWO-COLUMN LAYOUT */}
        {content && (
          <div className="theory-layout">

            {/* ── ЛЕВАЯ КОЛОНКА: ТЕОРИЯ ── */}
            <div className="theory-main">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* ГЛАВНАЯ ИДЕЯ */}
                <section style={{ ...CARD, padding: "22px 24px" }}>
                  <div style={LABEL}>ГЛАВНАЯ ИДЕЯ</div>
                  <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.7, color: "rgba(255,255,255,0.88)" }}>{content.mainIdea}</p>
                </section>

                {/* НА ЧТО ОБРАТИТЬ ВНИМАНИЕ */}
                {content.watchOut && (
                  <section style={{ ...CARD, padding: "22px 24px", background: "linear-gradient(135deg,rgba(255,187,92,0.1),rgba(255,174,59,0.04))", border: "1px solid rgba(255,187,92,0.28)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,187,92,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#ffbb5c", flexShrink: 0 }}>!</span>
                      <span style={{ ...LABEL, marginBottom: 0, color: "#ffbb5c" }}>НА ЧТО ОБРАТИТЬ ВНИМАНИЕ</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.68, color: "rgba(255,255,255,0.82)" }}>{content.watchOut}</p>
                  </section>
                )}

                {/* ОПРЕДЕЛЕНИЯ */}
                {content.definitions.length > 0 && (
                  <section style={{ ...CARD, padding: "18px 24px" }}>
                    <div style={LABEL}>ОПРЕДЕЛЕНИЯ</div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {content.definitions.map((d, i) => (
                        <div key={d.term} style={{ padding: "14px 0", borderBottom: i < content.definitions.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                          <strong className="font-display" style={{ fontWeight: 700, fontSize: 15.5, color: "#b69cff" }}>{d.term}</strong>
                          <p style={{ margin: "5px 0 0", fontSize: 14.5, lineHeight: 1.6, color: "rgba(255,255,255,0.68)" }}>{d.definition}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* ПРИМЕРЫ */}
                {content.examples && content.examples.length > 0 && (
                  <section>
                    <div style={LABEL}>ПРИМЕРЫ</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {content.examples.map((ex, i) => {
                        const clr = EXAMPLE_COLORS[i % EXAMPLE_COLORS.length]
                        return (
                          <div key={i} style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${clr.border}`, boxShadow: "0 8px 28px rgba(0,0,0,0.38)" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "13px 18px", background: "rgba(10,9,16,0.85)", borderBottom: ex.code ? "1px solid rgba(255,255,255,0.08)" : "none", flexWrap: "wrap" }}>
                              <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: clr.bg, color: clr.color, border: `1px solid ${clr.border}`, flexShrink: 0, marginTop: 1 }}>{ex.label}</span>
                              <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, flex: 1 }}>{ex.explanation}</span>
                            </div>
                            {ex.code && (
                              <pre className="font-mono" style={{ margin: 0, padding: "18px 22px", background: "rgba(8,7,15,0.92)", fontSize: 13, lineHeight: 1.72, color: "rgba(255,255,255,0.82)", overflowX: "auto", whiteSpace: "pre" }}>{ex.code}</pre>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* ТИПИЧНЫЕ ОШИБКИ */}
                {content.antiPatterns && content.antiPatterns.length > 0 && (
                  <section style={{ ...CARD, padding: "22px 24px", background: "linear-gradient(135deg,rgba(255,80,80,0.09),rgba(255,60,60,0.03))", border: "1px solid rgba(255,80,80,0.22)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,80,80,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: "#ff6060", flexShrink: 0 }}>✕</span>
                      <span style={{ ...LABEL, marginBottom: 0, color: "#ff7070" }}>ТИПИЧНЫЕ ОШИБКИ</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {content.antiPatterns.map((p, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: "rgba(255,80,80,0.14)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff7070", fontWeight: 700, fontSize: 11, marginTop: 1 }}>✕</span>
                          <span style={{ fontSize: 15, lineHeight: 1.62, color: "rgba(255,255,255,0.8)" }}>{p}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* ЗАПОМНИ */}
                {content.keyPoints.length > 0 && (
                  <section style={{ ...CARD, padding: "22px 24px", background: "linear-gradient(135deg,rgba(155,107,255,0.14),rgba(43,217,227,0.06))", border: "1px solid rgba(155,107,255,0.28)" }}>
                    <div style={{ ...LABEL, color: "#b69cff" }}>ЗАПОМНИ</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {content.keyPoints.map((point, i) => (
                        <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                          <span style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, background: "rgba(155,107,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", color: "#c4adff", fontWeight: 700, fontSize: 11 }}>✓</span>
                          <span style={{ fontSize: 15.5, lineHeight: 1.62, color: "rgba(255,255,255,0.86)" }}>{point}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* FOOTER NAV */}
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => router.back()} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.16)", cursor: "pointer", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: 15, fontFamily: "inherit" }}>
                    ← Вернуться
                  </button>
                </div>
              </div>
            </div>

            {/* ── ПРАВАЯ КОЛОНКА: ПРАКТИКА ── */}
            <div className="theory-sidebar">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* УРОВНЕВОЕ ТЕСТИРОВАНИЕ */}
                <section style={{ ...CARD, padding: "18px 18px" }}>
                  <div style={LABEL}>ТЕСТ ПО УРОВНЯМ</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {([
                      { level: "basic",        label: "Базовый",     desc: "Определения и концепции", color: "#5ee08a", bg: "rgba(94,224,138,0.1)",  border: "rgba(94,224,138,0.28)"  },
                      { level: "intermediate", label: "Средний",     desc: "Применение и нюансы",     color: "#ffbb5c", bg: "rgba(255,187,92,0.1)",  border: "rgba(255,187,92,0.28)"  },
                      { level: "advanced",     label: "Продвинутый", desc: "Edge cases и детали",     color: "#ff7e92", bg: "rgba(255,126,146,0.1)", border: "rgba(255,126,146,0.28)" },
                    ] as const).map(l => (
                      <button
                        key={l.level}
                        onClick={() => router.push(`/topic/${topicId}/subtopic/${encodeURIComponent(subtopicName)}/level/${l.level}`)}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 13, border: `1px solid ${l.border}`, cursor: "pointer", background: l.bg, fontFamily: "inherit", textAlign: "left" }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, flexShrink: 0, boxShadow: `0 0 6px ${l.color}` }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: l.color }}>{l.label}</div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{l.desc}</div>
                        </div>
                        <span style={{ fontSize: 13, color: l.color, opacity: 0.7 }}>→</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* ПРАКТИКА ПО УРОВНЯМ */}
                <section style={{ ...CARD, padding: "18px 18px" }}>
                  <div style={LABEL}>ПРАКТИКА ПО УРОВНЯМ</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {([
                      { level: "basic",        label: "Базовый",     desc: "Определения и концепции", color: "#5ee08a", bg: "rgba(94,224,138,0.1)",  border: "rgba(94,224,138,0.28)"  },
                      { level: "intermediate", label: "Средний",     desc: "Применение и нюансы",     color: "#ffbb5c", bg: "rgba(255,187,92,0.1)",  border: "rgba(255,187,92,0.28)"  },
                      { level: "advanced",     label: "Продвинутый", desc: "Edge cases и детали",     color: "#ff7e92", bg: "rgba(255,126,146,0.1)", border: "rgba(255,126,146,0.28)" },
                    ] as const).map(l => (
                      <button
                        key={l.level}
                        onClick={() => router.push(`/topic/${topicId}/subtopic/${encodeURIComponent(subtopicName)}/level/${l.level}/practice`)}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 13, border: `1px solid ${l.border}`, cursor: "pointer", background: l.bg, fontFamily: "inherit", textAlign: "left" }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, flexShrink: 0, boxShadow: `0 0 6px ${l.color}` }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: l.color }}>{l.label}</div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{l.desc}</div>
                        </div>
                        <span style={{ fontSize: 13, color: l.color, opacity: 0.7 }}>→</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* ПРАКТИЧЕСКИЕ ЗАДАНИЯ */}
                {content.exercises && content.exercises.length > 0 && (
                  <section style={{ ...CARD, padding: "20px 20px" }}>
                    <div style={LABEL}>ПРАКТИКА</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {content.exercises.map((ex, i) => {
                        const d = DIFFICULTY_CONFIG[ex.difficulty] ?? DIFFICULTY_CONFIG.medium
                        return (
                          <div key={i} style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                              <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: d.bg, color: d.color, border: `1px solid ${d.border}`, flexShrink: 0 }}>{d.label}</span>
                              <span className="font-display" style={{ fontWeight: 600, fontSize: 14, color: "#fff", lineHeight: 1.3 }}>{ex.title}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.58, color: "rgba(255,255,255,0.58)" }}>{ex.description}</p>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* СВЯЗАНО С */}
                {content.relatedSubtopics && content.relatedSubtopics.length > 0 && (
                  <section style={{ ...CARD, padding: "20px 20px" }}>
                    <div style={LABEL}>СВЯЗАНО С</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {content.relatedSubtopics.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => router.push(`/topic/${topicId}/subtopic/${encodeURIComponent(r.name)}`)}
                          style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 3, padding: "11px 14px", borderRadius: 12, cursor: "pointer", background: "rgba(155,107,255,0.07)", border: "1px solid rgba(155,107,255,0.18)", fontFamily: "inherit" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <span className="font-display" style={{ fontWeight: 600, fontSize: 14, color: "#c4adff" }}>{r.name}</span>
                            <span style={{ fontSize: 13, color: "rgba(155,107,255,0.55)", flexShrink: 0 }}>→</span>
                          </div>
                          <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{r.relation}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* ГЛОССАРИЙ ПОДТЕМЫ */}
                {subtopic && subtopic.definitions.length > 0 && (
                  <section style={{ ...CARD, padding: "20px 20px" }}>
                    <div style={LABEL}>ГЛОССАРИЙ ПОДТЕМЫ</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {subtopic.definitions.map((d) => (
                        <div key={d.term}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: "#b69cff" }}>{d.term}</span>
                          <p style={{ margin: "3px 0 0", fontSize: 13, lineHeight: 1.55, color: "rgba(255,255,255,0.55)" }}>{d.definition}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
