"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheory } from "../model/use-theory"
import { TheorySidebar } from "@/features/theory-sidebar/ui/theory-sidebar"
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
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])

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

  const scrollToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

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
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--violet)" }} />
          <p className="text-sm" style={{ color: "var(--text-2)" }}>Готовлю объяснение...</p>
        </div>
      )}

      {error && (
        <div className="mx-5 mt-6 p-4 rounded-2xl text-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1.5px solid rgba(220,38,38,0.2)" }}>
          {error}
        </div>
      )}

      {content && (
        /* Desktop: sidebar layout. Mobile: stacked */
        <div className="px-5 py-6 pb-16 lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 lg:max-w-5xl lg:mx-auto lg:items-start">

          {/* Main content */}
          <article className="space-y-8 min-w-0">
            {/* Title + intro */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>{content.title}</h1>
              <p className="text-lg leading-relaxed font-medium" style={{ color: "var(--violet)" }}>
                {content.intro}
              </p>
            </div>

            {/* Sections */}
            {content.sections.map((section, i) => (
              <div
                key={i}
                ref={(el) => { sectionRefs.current[i] = el }}
                className="space-y-4 scroll-mt-20"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "var(--violet-light)", color: "var(--violet)" }}
                  >
                    {i + 1}
                  </span>
                  <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>{section.heading}</h2>
                </div>

                <RichText text={section.body} />

                {section.code && (
                  <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(124,58,237,0.15)" }}>
                    <div
                      className="px-4 py-2 flex items-center justify-between"
                      style={{ background: "#1a1535", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <span className="text-xs font-medium" style={{ color: "#a78bfa" }}>Пример</span>
                      <div className="flex gap-1.5">
                        {["#ff5f57","#febc2e","#28c840"].map(c => (
                          <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                    <div className="p-4 overflow-x-auto" style={{ background: "#120f2d" }}>
                      <pre className="text-xs leading-relaxed whitespace-pre" style={{ color: "#e8e3db", fontFamily: "ui-monospace, 'Cascadia Code', monospace" }}>
                        {section.code}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Key points */}
            {content.keyPoints.length > 0 && (
              <div className="p-5 rounded-3xl space-y-3" style={{ background: "var(--violet-light)", border: "1.5px solid rgba(124,58,237,0.2)" }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--violet)" }}>Главное</p>
                <ul className="space-y-2">
                  {content.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text)" }}>
                      <span className="mt-0.5 shrink-0 font-bold" style={{ color: "var(--violet)" }}>✓</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Practice */}
            {content.practiceIdeas.length > 0 && (
              <div className="p-5 rounded-3xl space-y-3" style={{ background: "#f0fdf4", border: "1.5px solid rgba(5,150,105,0.2)" }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#059669" }}>Попрактикуй</p>
                <ul className="space-y-2">
                  {content.practiceIdeas.map((idea, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-2)" }}>
                      <span className="mt-0.5 shrink-0 font-bold" style={{ color: "#059669" }}>{i + 1}.</span>
                      {idea}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mobile: sidebar inline after content */}
            {(content.literature.length > 0 || content.sections.length > 0) && (
              <div className="lg:hidden">
                <TheorySidebar
                  sections={content.sections}
                  literature={content.literature}
                  onSectionClick={scrollToSection}
                />
              </div>
            )}

            <button
              onClick={() => router.back()}
              className="text-sm font-medium"
              style={{ color: "var(--text-3)" }}
            >
              ← Вернуться к теме
            </button>
          </article>

          {/* Desktop sidebar — sticky */}
          <aside className="hidden lg:block sticky top-24">
            <TheorySidebar
              sections={content.sections}
              literature={content.literature}
              onSectionClick={scrollToSection}
            />
          </aside>
        </div>
      )}
    </div>
  )
}
