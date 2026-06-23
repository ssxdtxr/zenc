import type { TutorResponse } from "@/entities/session/model/types"
import { Button } from "@/shared/ui/button"
import { RichText } from "@/features/theory-view/ui/rich-text"
import { CheckIcon, CrossIcon } from "@/shared/ui/icons"

type Props = { response: TutorResponse; isLast: boolean; onNext: () => void }

export const FeedbackView = ({ response, isLast, onNext }: Props) => {
  const correct = response.isCorrect
  const isRight = correct === true
  const isWrong = correct === false

  const verdict = {
    color: isRight ? "#4ade80" : isWrong ? "#f87171" : "#fbbf24",
    bg: isRight ? "rgba(74,222,128,0.1)" : isWrong ? "rgba(220,38,38,0.12)" : "rgba(251,191,36,0.1)",
    border: isRight ? "rgba(74,222,128,0.25)" : isWrong ? "rgba(220,38,38,0.25)" : "rgba(251,191,36,0.25)",
    label: isRight ? "Верно" : isWrong ? "Не верно" : "Частично",
    Icon: isRight ? CheckIcon : isWrong ? CrossIcon : null,
  }

  return (
    <div className="space-y-4">
      {response.evaluation && (
        <div
          className="p-4 rounded-2xl"
          style={{ background: verdict.bg, border: `1.5px solid ${verdict.border}` }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            {verdict.Icon && <verdict.Icon size={13} color={verdict.color} />}
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: verdict.color }}>{verdict.label}</p>
          </div>
          <RichText text={response.evaluation} className="[&_p]:!text-[var(--text)]" />
        </div>
      )}

      {response.explanation && (
        <div
          className="p-4 rounded-2xl space-y-1.5"
          style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Объяснение</p>
          <RichText text={response.explanation} />
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
          style={{ background: "rgba(155,107,255,0.08)", border: "1px solid rgba(155,107,255,0.2)" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Следующий вопрос</p>
          <RichText text={response.question} className="[&_p]:!text-[var(--text)]" />
          <Button onClick={onNext}>Продолжить →</Button>
        </div>
      )}

      {isLast && (
        <Button size="lg" onClick={onNext}>Завершить сессию →</Button>
      )}
    </div>
  )
}
