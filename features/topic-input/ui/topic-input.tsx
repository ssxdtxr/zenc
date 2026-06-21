"use client"

import { EXAMPLE_TOPICS } from "@/entities/session/config"
import { Button } from "@/shared/ui/button"
import { ErrorMessage } from "@/shared/ui/error-message"
import { Input } from "@/shared/ui/input"

type Props = {
  value: string
  loading: boolean
  error: string | null
  onChange: (value: string) => void
  onSubmit: () => void
}

export const TopicInput = ({ value, loading, error, onChange, onSubmit }: Props) => (
  <div className="space-y-8 sm:space-y-10">
    <div className="space-y-3">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Что хочешь изучить?</h1>
      <p className="text-zinc-400 leading-relaxed text-sm sm:text-base">
        Введи тему. Система задаст персонализированные вопросы на основе твоих ответов
        и поможет найти пробелы в знаниях.
      </p>
    </div>

    <div className="space-y-3">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        placeholder="Например: История России, DevOps..."
        autoFocus
      />
      <Button size="lg" onClick={onSubmit} disabled={!value.trim() || loading}>
        {loading ? "Подготовка..." : "Начать →"}
      </Button>
      {error && <ErrorMessage message={error} />}
    </div>

    <div className="space-y-3">
      <p className="text-xs text-zinc-600 uppercase tracking-widest font-medium">Примеры</p>
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => onChange(t)}
            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 active:bg-zinc-800 transition-colors text-sm min-h-[40px]"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  </div>
)
