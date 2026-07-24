"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeftIcon } from "@/shared/ui/icons"
import { useRouter } from "next/navigation"
import { useTheory } from "../model/use-theory"
import { apiClient } from "@/shared/lib/api-client"
import { SUBTOPIC_STATUS_CONFIG } from "@/entities/topic/config"
import type { Topic } from "@/entities/topic/model/types"
import { fadeInUp, staggerContainer } from "@/shared/lib/motion"
import { AppShell } from "@/widgets/app-shell/ui/app-shell"

type Props = {
  topicId: string
  subtopicName: string
}

const DIFFICULTY_CONFIG = {
  easy:   { label: "Лёгкое",   bg: "var(--surface-2)",     border: "var(--border)" },
  medium: { label: "Среднее", bg: "var(--surface)",        border: "var(--border)" },
  hard:   { label: "Сложное", bg: "var(--surface-hover)",  border: "var(--border-strong)" },
}

const LEVELS = [
  { level: "basic",        label: "Базовый",     desc: "Определения и концепции", dot: "rgba(var(--fg-rgb),0.3)",  bg: "var(--surface-2)",    border: "var(--border)" },
  { level: "intermediate", label: "Средний",     desc: "Применение и нюансы",     dot: "rgba(var(--fg-rgb),0.6)",  bg: "var(--surface)",       border: "var(--border)" },
  { level: "advanced",     label: "Продвинутый", desc: "Edge cases и детали",     dot: "var(--text)",              bg: "var(--surface-hover)", border: "var(--border-strong)" },
] as const

const CARD = {
  borderRadius: 16,
  background: "var(--surface)",
  border: "1px solid var(--border)",
} as const

const LABEL = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: "var(--text-3)",
  marginBottom: 12,
} as const

function statusTheme(status: string) {
  const cfg = SUBTOPIC_STATUS_CONFIG[status as keyof typeof SUBTOPIC_STATUS_CONFIG] ?? SUBTOPIC_STATUS_CONFIG.needs_work
  return { bg: cfg.bg, border: cfg.border, text: cfg.color }
}

function sectionAnchor(i: number) {
  return `theory-section-${i}`
}

// Model separates paragraphs with \n\n — render each as its own <p> instead of
// collapsing them into one block (HTML whitespace would otherwise swallow the breaks).
function Paragraphs({ text, style }: { text: string; style: React.CSSProperties }) {
  const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} style={{ ...style, marginTop: i === 0 ? 0 : "0.9em" }}>{p}</p>
      ))}
    </>
  )
}

export const TheoryPage = ({ topicId, subtopicName }: Props) => {
  const router = useRouter()
  const [topic, setTopic] = useState<Topic | null>(null)

  useEffect(() => {
    apiClient.getTopicById(topicId)
      .then(t => t ? setTopic(t) : router.push("/"))
      .catch(() => router.push("/"))
  }, [topicId, router])

  const subtopic = topic?.currentSubtopics.find((s) => s.name === subtopicName)
  const statusLabel = subtopic ? SUBTOPIC_STATUS_CONFIG[subtopic.status].label : null
  const statusCfg = subtopic ? statusTheme(subtopic.status) : null

  const { content, loading, error } = useTheory({
    topicName: topic?.name ?? "",
    subtopicName,
    userLevel: topic?.overallLevel ?? null,
    recommendation: subtopic?.recommendation ?? "",
    allSubtopics: topic?.currentSubtopics.map(s => s.name),
  })

  return (
    <AppShell>
      <div style={{ position: "relative", flex: 1, background: "var(--bg)" }}>
        <div style={{ maxWidth: 1480, margin: "0 auto", padding: "22px 24px 72px" }}>

          {/* HEADER */}
          <nav className="theory-nav" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, paddingBottom: 18, borderBottom: "1px solid var(--border)", marginBottom: 22 }}>
            <div className="theory-nav-row" style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
              <button onClick={() => router.back()} style={{ width: 38, height: 38, minHeight: 38, flexShrink: 0, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronLeftIcon size={19} color="var(--text)" />
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>{topic?.name}</div>
                <h1 className="font-display" style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", margin: "1px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text)" }}>{subtopicName}</h1>
              </div>
            </div>
            <div className="theory-nav-row" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {statusCfg && (
                <span style={{ padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, background: statusCfg.bg, color: statusCfg.text, border: `1px solid ${statusCfg.border}`, whiteSpace: "nowrap", flexShrink: 0 }}>
                  {statusLabel}
                </span>
              )}
              <button
                onClick={() => router.push(`/topic/${topicId}/subtopic/${encodeURIComponent(subtopicName)}/practice`)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", minHeight: 38, borderRadius: 10, border: "1px solid var(--border)", cursor: "pointer", background: "var(--surface)", color: "var(--text)", fontWeight: 600, fontSize: 13.5, fontFamily: "inherit", whiteSpace: "nowrap" }}
              >
                ✏️ Практика
              </button>
              <button
                onClick={() => router.push(`/topic/${topicId}/subtopic/${encodeURIComponent(subtopicName)}/test`)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", minHeight: 38, borderRadius: 10, border: "none", cursor: "pointer", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 13.5, fontFamily: "inherit", whiteSpace: "nowrap" }}
              >
                🧠 Тест
              </button>
            </div>
          </nav>

          {/* LOADING */}
          {loading && (
            <div style={{ paddingTop: 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2.5px solid var(--border)", borderTopColor: "var(--text)", animation: "spin 0.8s linear infinite" }} />
              <p style={{ margin: 0, fontSize: 14, color: "var(--text-2)", fontWeight: 500 }}>Готовлю объяснение…</p>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 16, background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#dc2626", fontSize: 14 }}>
              {error}
            </div>
          )}

          {/* TWO-COLUMN LAYOUT */}
          {content && (
            <div className="theory-layout">

              {/* ── ЛЕВАЯ КОЛОНКА: ТЕОРИЯ ── */}
              <div className="theory-main">
                <motion.div variants={staggerContainer(0.07)} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                  {/* ОГЛАВЛЕНИЕ — только если секций несколько */}
                  {content.sections.length > 2 && (
                    <motion.nav variants={fadeInUp} style={{ ...CARD, padding: "14px 18px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {content.sections.map((s, i) => (
                          <a
                            key={i}
                            href={`#${sectionAnchor(i)}`}
                            style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)", textDecoration: "none" }}
                          >
                            {i + 1}. {s.heading}
                          </a>
                        ))}
                      </div>
                    </motion.nav>
                  )}

                  {/* ГЛАВНАЯ ИДЕЯ */}
                  <motion.section variants={fadeInUp} style={{ ...CARD, padding: "22px 24px" }}>
                    <div style={LABEL}>ГЛАВНАЯ ИДЕЯ</div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {content.sections.map((s, i) => (
                        <div key={i} id={sectionAnchor(i)} style={{ padding: i === 0 ? "0 0 16px" : "16px 0 0", borderTop: i > 0 ? "1px solid var(--border)" : "none", marginTop: i > 0 ? 16 : 0, scrollMarginTop: 90 }}>
                          {content.sections.length > 1 && (
                            <h3 className="font-display" style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 15.5, color: "var(--text)" }}>{s.heading}</h3>
                          )}
                          <Paragraphs text={s.explanation} style={{ margin: 0, fontSize: 16.5, lineHeight: 1.7, color: "var(--text)" }} />
                        </div>
                      ))}
                    </div>
                  </motion.section>

                  {/* НА ЧТО ОБРАТИТЬ ВНИМАНИЕ */}
                  {content.watchOut && (
                    <motion.section variants={fadeInUp} style={{ ...CARD, padding: "22px 24px", background: "var(--surface-hover)", border: "1px solid var(--border-strong)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                        <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#fff", flexShrink: 0 }}>!</span>
                        <span style={{ ...LABEL, marginBottom: 0, color: "var(--text)" }}>НА ЧТО ОБРАТИТЬ ВНИМАНИЕ</span>
                      </div>
                      <Paragraphs text={content.watchOut} style={{ margin: 0, fontSize: 15.5, lineHeight: 1.68, color: "var(--text-2)" }} />
                    </motion.section>
                  )}

                  {/* ОПРЕДЕЛЕНИЯ */}
                  {content.definitions.length > 0 && (
                    <motion.section variants={fadeInUp} style={{ ...CARD, padding: "18px 24px" }}>
                      <div style={LABEL}>ОПРЕДЕЛЕНИЯ</div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {content.definitions.map((d, i) => (
                          <div key={d.term} style={{ padding: "14px 0", borderBottom: i < content.definitions.length - 1 ? "1px solid var(--border)" : "none" }}>
                            <strong className="font-display" style={{ fontWeight: 700, fontSize: 15.5, color: "var(--text)" }}>{d.term}</strong>
                            <p style={{ margin: "5px 0 0", fontSize: 14.5, lineHeight: 1.6, color: "var(--text-2)" }}>{d.definition}</p>
                          </div>
                        ))}
                      </div>
                    </motion.section>
                  )}

                  {/* ПРИМЕРЫ */}
                  {content.examples && content.examples.length > 0 && (
                    <motion.section variants={fadeInUp}>
                      <div style={LABEL}>ПРИМЕРЫ</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {content.examples.map((ex, i) => (
                          <div key={i} style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "13px 18px", background: "var(--surface-2)", borderBottom: ex.code ? "1px solid var(--border)" : "none", flexWrap: "wrap" }}>
                              <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "var(--surface-hover)", color: "var(--text-2)", border: "1px solid var(--border)", flexShrink: 0, marginTop: 1 }}>{ex.label}</span>
                              <span style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5, flex: 1 }}>{ex.explanation}</span>
                            </div>
                            {ex.code && (
                              <pre className="font-mono" style={{ margin: 0, padding: "18px 22px", background: "#0a0a0c", fontSize: 13, lineHeight: 1.72, color: "rgba(255,255,255,0.82)", overflowX: "auto", whiteSpace: "pre" }}>{ex.code}</pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.section>
                  )}

                  {/* ТИПИЧНЫЕ ОШИБКИ */}
                  {content.antiPatterns && content.antiPatterns.length > 0 && (
                    <motion.section variants={fadeInUp} style={{ ...CARD, padding: "22px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                        <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: "#fff", flexShrink: 0 }}>✕</span>
                        <span style={{ ...LABEL, marginBottom: 0, color: "var(--text)" }}>ТИПИЧНЫЕ ОШИБКИ</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {content.antiPatterns.map((p, i) => (
                          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: "var(--surface-hover)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)", fontWeight: 700, fontSize: 11, marginTop: 1 }}>✕</span>
                            <span style={{ fontSize: 15, lineHeight: 1.62, color: "var(--text-2)" }}>{p}</span>
                          </div>
                        ))}
                      </div>
                    </motion.section>
                  )}

                  {/* ЗАПОМНИ */}
                  {content.keyPoints.length > 0 && (
                    <motion.section variants={fadeInUp} style={{ ...CARD, padding: "22px 24px", background: "var(--surface-hover)", border: "1px solid var(--border-strong)" }}>
                      <div style={{ ...LABEL, color: "var(--text)" }}>ЗАПОМНИ</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {content.keyPoints.map((point, i) => (
                          <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                            <span style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 11 }}>✓</span>
                            <span style={{ fontSize: 15.5, lineHeight: 1.62, color: "var(--text)" }}>{point}</span>
                          </div>
                        ))}
                      </div>
                    </motion.section>
                  )}

                  {/* FOOTER NAV */}
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => router.back()} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 20px", borderRadius: 12, border: "1px solid var(--border)", cursor: "pointer", background: "var(--surface)", color: "var(--text)", fontWeight: 600, fontSize: 15, fontFamily: "inherit" }}>
                      ← Вернуться
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* ── ПРАВАЯ КОЛОНКА: ПРАКТИКА ── */}
              <div className="theory-sidebar">
                <motion.div variants={staggerContainer(0.07, 0.1)} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                  {/* УРОВНЕВОЕ ТЕСТИРОВАНИЕ */}
                  <motion.section variants={fadeInUp} style={{ ...CARD, padding: "18px 18px" }}>
                    <div style={LABEL}>ТЕСТ ПО УРОВНЯМ</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {LEVELS.map(l => (
                        <motion.button
                          key={l.level}
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => router.push(`/topic/${topicId}/subtopic/${encodeURIComponent(subtopicName)}/level/${l.level}`)}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: `1px solid ${l.border}`, cursor: "pointer", background: l.bg, fontFamily: "inherit", textAlign: "left" }}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.dot, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{l.label}</div>
                            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>{l.desc}</div>
                          </div>
                          <span style={{ fontSize: 13, color: "var(--text-3)" }}>→</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.section>

                  {/* ПРАКТИКА ПО УРОВНЯМ */}
                  <motion.section variants={fadeInUp} style={{ ...CARD, padding: "18px 18px" }}>
                    <div style={LABEL}>ПРАКТИКА ПО УРОВНЯМ</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {LEVELS.map(l => (
                        <motion.button
                          key={l.level}
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => router.push(`/topic/${topicId}/subtopic/${encodeURIComponent(subtopicName)}/level/${l.level}/practice`)}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: `1px solid ${l.border}`, cursor: "pointer", background: l.bg, fontFamily: "inherit", textAlign: "left" }}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.dot, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{l.label}</div>
                            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>{l.desc}</div>
                          </div>
                          <span style={{ fontSize: 13, color: "var(--text-3)" }}>→</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.section>

                  {/* ПРАКТИЧЕСКИЕ ЗАДАНИЯ */}
                  {content.exercises && content.exercises.length > 0 && (
                    <motion.section variants={fadeInUp} style={{ ...CARD, padding: "20px 20px" }}>
                      <div style={LABEL}>ПРАКТИКА</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {content.exercises.map((ex, i) => {
                          const d = DIFFICULTY_CONFIG[ex.difficulty] ?? DIFFICULTY_CONFIG.medium
                          return (
                            <div key={i} style={{ padding: "14px 16px", borderRadius: 12, background: d.bg, border: `1px solid ${d.border}` }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                                <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: "var(--surface)", color: "var(--text-2)", border: "1px solid var(--border)", flexShrink: 0 }}>{d.label}</span>
                                <span className="font-display" style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", lineHeight: 1.3 }}>{ex.title}</span>
                              </div>
                              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.58, color: "var(--text-2)" }}>{ex.description}</p>
                            </div>
                          )
                        })}
                      </div>
                    </motion.section>
                  )}

                  {/* СВЯЗАНО С */}
                  {content.relatedSubtopics && content.relatedSubtopics.length > 0 && (
                    <motion.section variants={fadeInUp} style={{ ...CARD, padding: "20px 20px" }}>
                      <div style={LABEL}>СВЯЗАНО С</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {content.relatedSubtopics.map((r, i) => (
                          <motion.button
                            key={i}
                            whileHover={{ x: 3 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => router.push(`/topic/${topicId}/subtopic/${encodeURIComponent(r.name)}`)}
                            style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 3, padding: "11px 14px", borderRadius: 12, cursor: "pointer", background: "var(--surface-2)", border: "1px solid var(--border)", fontFamily: "inherit" }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                              <span className="font-display" style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{r.name}</span>
                              <span style={{ fontSize: 13, color: "var(--text-3)", flexShrink: 0 }}>→</span>
                            </div>
                            <span style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.4 }}>{r.relation}</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.section>
                  )}

                  {/* ГЛОССАРИЙ ПОДТЕМЫ */}
                  {subtopic && subtopic.definitions.length > 0 && (
                    <motion.section variants={fadeInUp} style={{ ...CARD, padding: "20px 20px" }}>
                      <div style={LABEL}>ГЛОССАРИЙ ПОДТЕМЫ</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {subtopic.definitions.map((d) => (
                          <div key={d.term}>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{d.term}</span>
                            <p style={{ margin: "3px 0 0", fontSize: 13, lineHeight: 1.55, color: "var(--text-2)" }}>{d.definition}</p>
                          </div>
                        ))}
                      </div>
                    </motion.section>
                  )}

                </motion.div>
              </div>

            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
