"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { ErrorMessage } from "@/shared/ui/error-message"

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push("/")
      router.refresh()
    } catch {
      setError("Нет подключения к интернету")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-5" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm space-y-6 p-7 rounded-3xl" style={{ background: "var(--surface)", backdropFilter: "var(--glass)", WebkitBackdropFilter: "var(--glass)", boxShadow: "var(--shadow-lg)" }}>
        <div className="text-center space-y-1">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg mx-auto"
            style={{ background: "linear-gradient(135deg,#9b6bff,#6d3cff)", boxShadow: "0 4px 16px rgba(109,60,255,0.5)" }}
          >
            Z
          </div>
          <h1 className="text-2xl font-bold mt-4" style={{ color: "var(--text)" }}>Создать аккаунт</h1>
          <p className="text-sm" style={{ color: "var(--text-2)" }}>Начни учиться адаптивно с Zerc</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Input
            type="password"
            placeholder="Пароль (минимум 6 символов)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <ErrorMessage message={error} />}
          <Button size="lg" disabled={loading} onClick={() => {}}>
            {loading ? "Создаём аккаунт..." : "Зарегистрироваться →"}
          </Button>
        </form>

        <p className="text-center text-sm" style={{ color: "var(--text-2)" }}>
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "var(--accent)" }}>
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
