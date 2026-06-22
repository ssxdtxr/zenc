"use client"

import { useState } from "react"
import type { LiteratureItem, TheorySection } from "@/entities/topic/model/types"

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  book:    { label: "Книга",   color: "#7c3aed", bg: "#f5f3ff", icon: "📖" },
  docs:    { label: "Доки",    color: "#0369a1", bg: "#f0f9ff", icon: "📄" },
  article: { label: "Статья",  color: "#065f46", bg: "#f0fdf4", icon: "✍️" },
  course:  { label: "Курс",    color: "#92400e", bg: "#fffbeb", icon: "🎓" },
  video:   { label: "Видео",   color: "#991b1b", bg: "#fef2f2", icon: "▶️" },
}

type Props = {
  sections: TheorySection[]
  literature: LiteratureItem[]
  onSectionClick: (index: number) => void
}

export const TheorySidebar = ({ sections, literature, onSectionClick }: Props) => {
  const [tab, setTab] = useState<"toc" | "lit">("toc")

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ background: "var(--surface)", boxShadow: "var(--shadow)", border: "1.5px solid var(--border)" }}
    >
      {/* Tabs */}
      <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
        {(["toc", "lit"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-xs font-semibold transition-colors"
            style={{
              color: tab === t ? "var(--violet)" : "var(--text-3)",
              background: tab === t ? "var(--violet-light)" : "transparent",
            }}
          >
            {t === "toc" ? "Содержание" : `Литература (${literature.length})`}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Table of contents */}
        {tab === "toc" && (
          <div className="space-y-1">
            {sections.map((s, i) => (
              <button
                key={i}
                onClick={() => onSectionClick(i)}
                className="w-full text-left flex items-start gap-2.5 p-2.5 rounded-xl transition-colors"
                style={{ color: "var(--text-2)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
              >
                <span
                  className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "var(--violet-light)", color: "var(--violet)" }}
                >
                  {i + 1}
                </span>
                <span className="text-xs leading-relaxed">{s.heading}</span>
              </button>
            ))}
          </div>
        )}

        {/* Literature */}
        {tab === "lit" && (
          <div className="space-y-3">
            {literature.length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: "var(--text-3)" }}>Нет рекомендаций</p>
            )}
            {literature.map((item, i) => {
              const meta = TYPE_META[item.type] ?? TYPE_META.article
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-sm shrink-0 mt-0.5">{meta.icon}</span>
                    <div className="min-w-0">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold leading-snug hover:underline block"
                          style={{ color: "var(--violet)" }}
                        >
                          {item.title}
                        </a>
                      ) : (
                        <p className="text-xs font-semibold leading-snug" style={{ color: "var(--text)" }}>
                          {item.title}
                        </p>
                      )}
                      {item.author && (
                        <p className="text-xs" style={{ color: "var(--text-3)" }}>{item.author}</p>
                      )}
                    </div>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ color: meta.color, background: meta.bg }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed pl-6" style={{ color: "var(--text-2)" }}>
                    {item.description}
                  </p>
                  {i < literature.length - 1 && (
                    <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
