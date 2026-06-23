"use client"

import { ErrorMessage } from "@/shared/ui/error-message"
import { Button } from "@/shared/ui/button"

type Props = {
  options: string[]
  selected: string
  loading: boolean
  error: string | null
  onSelect: (option: string) => void
  onSubmit: () => void
}

export const ChoiceForm = ({ options, selected, loading, error, onSelect, onSubmit }: Props) => (
  <div className="space-y-4">
    <div className="space-y-2.5">
      {options.map((option, i) => {
        const isSelected = selected === option
        return (
          <button
            key={i}
            onClick={() => onSelect(option)}
            className="w-full text-left p-4 rounded-2xl transition-all active:scale-[0.98] flex items-start gap-3"
            style={{
              background: isSelected ? "var(--accent-light)" : "var(--surface-2)",
              border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
              boxShadow: isSelected ? "0 0 0 3px var(--accent-light)" : "none",
            }}
          >
            <span
              className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: isSelected ? "var(--accent)" : "var(--surface)",
                color: isSelected ? "white" : "var(--text-3)",
                border: `1px solid ${isSelected ? "transparent" : "var(--border)"}`,
              }}
            >
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-sm leading-relaxed" style={{ color: isSelected ? "var(--accent)" : "var(--text)" }}>
              {option}
            </span>
          </button>
        )
      })}
    </div>

    <Button size="lg" onClick={onSubmit} disabled={!selected || loading}>
      {loading ? "Проверяю..." : "Ответить →"}
    </Button>

    {error && <ErrorMessage message={error} />}
  </div>
)
