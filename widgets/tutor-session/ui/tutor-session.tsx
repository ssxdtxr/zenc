"use client"

import { AnswerForm } from "@/features/answer-question/ui/answer-form"
import { ChoiceForm } from "@/features/choose-answer/ui/choice-form"
import { FeedbackView } from "@/features/feedback/ui/feedback-view"
import { SessionResults } from "@/features/session-results/ui/session-results"
import { DIFFICULTY_CONFIG } from "@/entities/session/config"
import type { SessionRecord } from "@/entities/topic/model/types"
import { MAX_QUESTIONS, useTutorSession } from "../model/use-tutor-session"

type Props = {
  topicName: string
  onComplete: (results: Omit<SessionRecord, "id" | "date">) => void
  onBack: () => void
  onNewSession: () => void
}

export const TutorSession = ({ topicName, onComplete, onBack, onNewSession }: Props) => {
  const {
    sessionState, answer, loading, error,
    questionCount, correctCount, currentResponse, results, textareaRef,
    setAnswer, submitAnswer, nextQuestion,
  } = useTutorSession({ topicName, onComplete })

  const diffInfo = currentResponse ? DIFFICULTY_CONFIG[currentResponse.difficulty] : null
  const isChoice = currentResponse?.questionType === "choice" && !!currentResponse.options?.length
  const isLastQuestion = questionCount >= MAX_QUESTIONS

  if (sessionState === "analyzing") {
    return (
      <div className="py-12 flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--violet)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>Анализирую твои знания...</p>
      </div>
    )
  }

  if (sessionState === "results" && results) {
    return <SessionResults topicName={topicName} results={results} onNewSession={onNewSession} onBack={onBack} />
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs" style={{ color: "var(--text-3)" }}>
          <span>{correctCount} правильно</span>
          <span>{questionCount}/{MAX_QUESTIONS}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(questionCount / MAX_QUESTIONS) * 100}%`,
              background: "linear-gradient(90deg, #7c3aed, #a855f7)",
            }}
          />
        </div>
      </div>

      {currentResponse && (sessionState === "session" || sessionState === "feedback") && (
        <>
          {sessionState === "session" && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ color: "var(--text-3)", background: "var(--surface-2)" }}
                >
                  {questionCount}
                </span>
                {diffInfo && (
                  <span className={`text-xs font-semibold ${diffInfo.color}`}>{diffInfo.label}</span>
                )}
              </div>

              <p className="text-lg font-semibold leading-snug" style={{ color: "var(--text)" }}>
                {currentResponse.question}
              </p>

              {isChoice ? (
                <ChoiceForm
                  options={currentResponse.options!}
                  selected={answer}
                  loading={loading}
                  error={error}
                  onSelect={setAnswer}
                  onSubmit={submitAnswer}
                />
              ) : (
                <AnswerForm
                  value={answer}
                  loading={loading}
                  error={error}
                  textareaRef={textareaRef}
                  onChange={setAnswer}
                  onSubmit={submitAnswer}
                />
              )}
            </div>
          )}

          {sessionState === "feedback" && (
            <FeedbackView response={currentResponse} onNext={nextQuestion} isLast={isLastQuestion} />
          )}
        </>
      )}

      {loading && !currentResponse && (
        <div className="py-10 flex justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--violet)" }} />
        </div>
      )}
    </div>
  )
}
