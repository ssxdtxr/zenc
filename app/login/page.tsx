"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { ErrorMessage } from "@/shared/ui/error-message"

export default function LoginPage() {
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
      const res = await fetch("/api/auth/login", {
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
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg mx-auto"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}
          >
            Z
          </div>
          <h1 className="text-2xl font-bold mt-4" style={{ color: "var(--text)" }}>Войти в Zerc</h1>
          <p className="text-sm" style={{ color: "var(--text-2)" }}>Продолжи учиться с того места, где остановился</p>
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
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <ErrorMessage message={error} />}
          <Button size="lg" disabled={loading} onClick={() => {}}>
            {loading ? "Входим..." : "Войти →"}
          </Button>
        </form>

        <p className="text-center text-sm" style={{ color: "var(--text-2)" }}>
          Нет аккаунта?{" "}
          <Link href="/register" className="font-semibold" style={{ color: "var(--violet)" }}>
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  )
}
