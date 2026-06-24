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

      <div style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", padding: "22px 28px 72px" }}>

        {/* NAV */}
        <nav style={{ position: "sticky", top: 16, zIndex: 20, display: "flex", alignItems: "center", gap: 16, padding: "11px 16px", borderRadius: 20, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px) saturate(150%)", WebkitBackdropFilter: "blur(24px) saturate(150%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 10px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)" }}>
          <button onClick={() => router.back()} style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.85)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeftIcon size={20} color="rgba(255,255,255,0.85)" /></button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>{topic?.name}</div>
            <h1 className="font-display" style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", margin: "1px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#fff" }}>{subtopicName}</h1>
          </div>
          {statusCfg && (
            <span style={{ padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, whiteSpace: "nowrap", flexShrink: 0 }}>
              {statusCfg.label}
            </span>
          )}
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

        {/* CONTENT */}
        {content && (
          <>
            {/* ГЛАВНАЯ ИДЕЯ */}
            <section style={{ marginTop: 20, padding: "24px 26px", borderRadius: 22, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(26px) saturate(150%)", WebkitBackdropFilter: "blur(26px) saturate(150%)", border: "1px solid rgba(255,255,255,0.13)", boxShadow: "0 14px 46px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.16)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", color: "rgba(255,255,255,0.42)", marginBottom: 12 }}>ГЛАВНАЯ ИДЕЯ</div>
              <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.68, color: "rgba(255,255,255,0.85)" }}>{content.mainIdea}</p>
            </section>

            {/* НА ЧТО ОБРАТИТЬ ВНИМАНИЕ */}
            {content.watchOut && (
              <section style={{ marginTop: 14, padding: "24px 26px", borderRadius: 22, background: "linear-gradient(135deg,rgba(255,187,92,0.12),rgba(255,174,59,0.05))", backdropFilter: "blur(26px)", WebkitBackdropFilter: "blur(26px)", border: "1px solid rgba(255,187,92,0.3)", boxShadow: "0 14px 46px rgba(0,0,0,0.32)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,187,92,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#ffbb5c", flexShrink: 0, fontFamily: "inherit" }}>!</span>
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", color: "#ffbb5c" }}>НА ЧТО ОБРАТИТЬ ВНИМАНИЕ</span>
                </div>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: "rgba(255,255,255,0.82)" }}>{content.watchOut}</p>
              </section>
            )}

            {/* ОПРЕДЕЛЕНИЯ */}
            {content.definitions.length > 0 && (
              <section style={{ marginTop: 14, padding: "8px 26px", borderRadius: 22, background: "rgba(255,255,255,0.05)", backdropFilter: "blur(26px) saturate(150%)", WebkitBackdropFilter: "blur(26px) saturate(150%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 14px 46px rgba(0,0,0,0.4)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", color: "rgba(255,255,255,0.42)", margin: "18px 0 4px" }}>ОПРЕДЕЛЕНИЯ</div>
                {content.definitions.map((d, i) => (
                  <div key={d.term} style={{ padding: "16px 0", borderBottom: i < content.definitions.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                    <strong className="font-display" style={{ fontWeight: 700, fontSize: 16.5, color: "#b69cff" }}>{d.term}</strong>
                    <p style={{ margin: "6px 0 0", fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,0.7)" }}>{d.definition}</p>
                  </div>
                ))}
              </section>
            )}

            {/* ПРИМЕР (code) */}
            {content.codeExample && (
              <section style={{ marginTop: 14, borderRadius: 22, overflow: "hidden", border: "1px solid rgba(255,255,255,0.13)", boxShadow: "0 14px 46px rgba(0,0,0,0.45)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 18px", background: "rgba(10,9,16,0.9)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f57", flexShrink: 0 }} />
                  <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#febc2e", flexShrink: 0 }} />
                  <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#28c840", flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginLeft: 8 }}>Пример</span>
                </div>
                <pre className="font-mono" style={{ margin: 0, padding: "20px 22px", background: "rgba(8,7,15,0.92)", fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.82)", overflowX: "auto", whiteSpace: "pre" }}>
                  {content.codeExample}
                </pre>
              </section>
            )}

            {/* ЗАПОМНИ */}
            {content.keyPoints.length > 0 && (
              <section style={{ marginTop: 14, padding: "24px 26px", borderRadius: 22, background: "linear-gradient(135deg,rgba(155,107,255,0.16),rgba(43,217,227,0.07))", backdropFilter: "blur(26px)", WebkitBackdropFilter: "blur(26px)", border: "1px solid rgba(155,107,255,0.3)", boxShadow: "0 14px 46px rgba(0,0,0,0.34)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", color: "#b69cff", marginBottom: 14 }}>ЗАПОМНИ</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  {content.keyPoints.map((point, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, background: "rgba(155,107,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#c4adff", fontWeight: 700, fontSize: 12 }}>✓</span>
                      <span style={{ fontSize: 15.5, lineHeight: 1.6, color: "rgba(255,255,255,0.85)" }}>{point}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FOOTER NAV */}
            <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => router.back()} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.16)", cursor: "pointer", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: 15, fontFamily: "inherit" }}>
                ← Вернуться к теме
              </button>
              <button onClick={() => router.push(`/topic/${topicId}/subtopic/${encodeURIComponent(subtopicName)}/test`)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 26px", borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#9b6bff,#6d3cff)", color: "#fff", fontWeight: 700, fontSize: 15, boxShadow: "0 10px 26px rgba(109,60,255,0.4)", fontFamily: "inherit" }}>
                Проверить себя →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
