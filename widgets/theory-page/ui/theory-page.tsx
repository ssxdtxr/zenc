"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheory } from "../model/use-theory"
import { RichText } from "@/features/theory-view/ui/rich-text"
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
          onClick={() => router.back()}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-2)", boxShadow: "var(--shadow-sm)" }}
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs" style={{ color: "var(--text-3)" }}>{topic?.name}</p>
          <p className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>{subtopicName}</p>
        </div>
        {statusCfg && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
            style={{ color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}
          >
            {statusCfg.label}
          </span>
        )}
      </header>

      {loading && (
        <div className="py-24 flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--violet)" }} />
          <p className="text-sm" style={{ color: "var(--text-2)" }}>Готовлю объяснение...</p>
        </div>
      )}

      {error && (
        <div className="mx-5 mt-6 p-4 rounded-2xl text-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>
          {error}
        </div>
      )}

      {content && (
        <div className="px-5 py-6 pb-16 space-y-4 max-w-2xl mx-auto">

          {/* Main idea */}
          <div className="p-4 rounded-3xl space-y-2" style={{ background: "var(--surface)", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Главная идея</p>
            <RichText text={content.mainIdea} />
          </div>

          {/* Watch out */}
          {content.watchOut && (
            <div className="p-4 rounded-3xl space-y-2" style={{ background: "#fffbeb", border: "1px solid rgba(217,119,6,0.2)" }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#d97706" }}>На что обратить внимание</p>
              <RichText text={content.watchOut} />
            </div>
          )}

          {/* Definitions */}
          {content.definitions.length > 0 && (
            <div className="p-4 rounded-3xl space-y-3" style={{ background: "var(--surface)", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Определения</p>
              <div className="space-y-3">
                {content.definitions.map((d) => (
                  <div key={d.term} className="space-y-0.5">
                    <p className="text-sm font-semibold" style={{ color: "var(--violet)" }}>{d.term}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{d.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Code example */}
          {content.codeExample && (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div
                className="px-4 py-2 flex items-center justify-between"
                style={{ background: "#18191A", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Пример</span>
                <div className="flex gap-1.5">
                  {["#ff5f57","#febc2e","#28c840"].map(c => (
                    <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="p-4 overflow-x-auto" style={{ background: "#1E1E1E" }}>
                <pre className="text-xs leading-relaxed whitespace-pre" style={{ color: "#D4D4D4", fontFamily: "ui-monospace, 'Cascadia Code', monospace" }}>
                  {content.codeExample}
                </pre>
              </div>
            </div>
          )}

          {/* Key points */}
          {content.keyPoints.length > 0 && (
            <div className="p-4 rounded-3xl space-y-2" style={{ background: "var(--violet-light)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--violet)" }}>Запомни</p>
              <ul className="space-y-1.5">
                {content.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text)" }}>
                    <span className="shrink-0 font-bold mt-0.5" style={{ color: "var(--violet)" }}>✓</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={() => router.back()} className="text-sm font-medium" style={{ color: "var(--text-3)" }}>
            ← Вернуться к теме
          </button>
        </div>
      )}
    </div>
  )
}
