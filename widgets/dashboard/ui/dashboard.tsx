"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { TopicCard } from "@/features/topic-card/ui/topic-card"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { useDashboard } from "../model/use-dashboard"

export const Dashboard = () => {
  const router = useRouter()
  const { topics, newTopicName, creating, loading, error, setNewTopicName, setCreating, createTopic, deleteTopic, reload } = useDashboard()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUserEmail(d.user?.email ?? null))
  }, [])

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  const handleCreate = () => {
    const id = createTopic()
    if (id) router.push(`/topic/${id}`)
  }

  return (
    <div className="min-h-dvh" style={{ background: "var(--bg)" }}>
      {/* Frosted glass header */}
      <header
        className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between"
        style={{
          background: "rgba(245,243,255,0.8)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm select-none"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 2px 8px rgba(124,58,237,0.35)" }}
          >
            Z
          </div>
          <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>Zerc</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setCreating(true)}>+ Тема</Button>
          {userEmail && (
            <button
              onClick={logout}
              className="text-xs px-3 py-2 rounded-xl font-medium transition-all active:scale-[0.98]"
              style={{ color: "var(--text-3)", background: "var(--surface)", border: "1px solid var(--border)" }}
              title={userEmail}
            >
              Выйти
            </button>
          )}
        </div>
      </header>

      <main className="px-5 pb-10">
        {/* Hero */}
        <div className="pt-8 pb-6">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            {topics.length === 0 ? "Привет 👋" : "Твои темы"}
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "var(--text-2)" }}>
            {topics.length === 0
              ? "Выбери тему и стань экспертом"
              : `${topics.length} ${topics.length === 1 ? "тема" : topics.length < 5 ? "темы" : "тем"} · продолжай учиться`}
          </p>
        </div>

        {/* Create form */}
        {creating && (
          <div
            className="mb-5 p-4 rounded-3xl space-y-3"
            style={{ background: "var(--surface)", boxShadow: "var(--shadow)", border: "1.5px solid var(--border)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Новая тема</p>
            <Input
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Frontend, DevOps, История..."
              autoFocus
            />
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!newTopicName.trim()}>Создать →</Button>
              <Button variant="ghost" onClick={() => { setCreating(false); setNewTopicName("") }}>Отмена</Button>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div
            className="mb-5 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-sm"
            style={{ background: "#fef2f2", border: "1.5px solid rgba(220,38,38,0.2)", color: "#dc2626" }}
          >
            <span>{error}</span>
            <button
              onClick={reload}
              className="font-semibold shrink-0 underline underline-offset-2"
              style={{ color: "#dc2626" }}
            >
              Повторить
            </button>
          </div>
        )}

        {/* Skeleton while loading */}
        {loading && (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="rounded-3xl animate-pulse"
                style={{ background: "var(--surface)", height: 80 }}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && topics.length === 0 && !creating && !error && (
          <div
            className="mt-2 p-6 rounded-3xl text-center space-y-4"
            style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl"
              style={{ background: "var(--violet-light)" }}
            >
              🧠
            </div>
            <div>
              <p className="font-semibold" style={{ color: "var(--text)" }}>Добавь первую тему</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>Frontend, DevOps, История России...</p>
            </div>
            <Button onClick={() => setCreating(true)}>+ Добавить тему</Button>
          </div>
        )}

        {/* Topics list */}
        <div className="space-y-3">
          {!loading && topics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onClick={() => router.push(`/topic/${topic.id}`)}
              onDelete={(e) => { e.stopPropagation(); deleteTopic(topic.id) }}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
