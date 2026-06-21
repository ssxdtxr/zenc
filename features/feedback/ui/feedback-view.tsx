import type { TutorResponse } from "@/entities/session/model/types"
import { Button } from "@/shared/ui/button"

type Props = { response: TutorResponse; isLast: boolean; onNext: () => void }

export const FeedbackView = ({ response, isLast, onNext }: Props) => {
  const correct = response.isCorrect
  const isRight = correct === true
  const isWrong = correct === false

  const verdict = {
    color: isRight ? "#059669" : isWrong ? "#dc2626" : "#d97706",
    bg: isRight ? "#f0fdf4" : isWrong ? "#fef2f2" : "#fffbeb",
    border: isRight ? "rgba(5,150,105,0.2)" : isWrong ? "rgba(220,38,38,0.2)" : "rgba(217,119,6,0.2)",
    label: isRight ? "✓ Правильно" : isWrong ? "✗ Не совсем" : "~ Частично",
  }

  return (
    <div className="space-y-4">
      {response.evaluation && (
        <div
          className="p-4 rounded-2xl"
          style={{ background: verdict.bg, border: `1.5px solid ${verdict.border}` }}
        >
          <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: verdict.color }}>{verdict.label}</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{response.evaluation}</p>
        </div>
      )}

      {response.explanation && (
        <div
          className="p-4 rounded-2xl space-y-1.5"
          style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Объяснение</p>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-2)" }}>{response.explanation}</p>
        </div>
      )}

      {response.knowledgeGaps?.length > 0 && (
        <div
          className="p-4 rounded-2xl space-y-1.5"
          style={{ background: "#fffbeb", border: "1.5px solid rgba(217,119,6,0.2)" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#d97706" }}>Пробелы</p>
          {response.knowledgeGaps.map((g, i) => (
            <p key={i} className="text-sm" style={{ color: "var(--text-2)" }}>— {g}</p>
          ))}
        </div>
      )}

      {!isLast && response.question && (
        <div
          className="p-4 rounded-2xl space-y-3"
          style={{ background: "var(--violet-light)", border: "1.5px solid rgba(124,58,237,0.15)" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--violet)" }}>Следующий вопрос</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{response.question}</p>
          <Button onClick={onNext}>Продолжить →</Button>
        </div>
      )}

      {isLast && (
        <Button size="lg" onClick={onNext}>Завершить сессию →</Button>
      )}
    </div>
  )
}
