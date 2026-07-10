"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { RefObject } from "react"
import type { Message, TutorResponse } from "@/entities/session/model/types"
import type { SessionRecord } from "@/entities/topic/model/types"
import type { ConfidenceLevel } from "@/features/confidence-picker/ui/confidence-picker"
import { fetchTutorResponse } from "../api/tutor-api"

export type SessionState = "session" | "feedback" | "analyzing" | "results"

export const MAX_QUESTIONS = 10

type SavedSession = {
  messages: Message[]
  currentResponse: TutorResponse
  sessionState: "session" | "feedback"
  questionCount: number
  correctCount: number
  allGaps: string[]
  pendingAnalysis: { messages: Message[]; correct: number } | null
  focusSubtopics?: string[]
  followUpMessages?: FollowUpMessage[]
}

export type FollowUpMessage = { question: string; answer: string }

type TutorSession = {
  sessionState: SessionState
  answer: string
  confidence: ConfidenceLevel | null
  loading: boolean
  error: string | null
  questionCount: number
  correctCount: number
  allGaps: string[]
  currentResponse: TutorResponse | null
  results: Omit<SessionRecord, "id" | "date"> | null
  textareaRef: RefObject<HTMLTextAreaElement | null>
  followUpMessages: FollowUpMessage[]
  followUpLoading: boolean
  lastQuestion: string | null
  lastAnswer: string | null
  setAnswer: (v: string) => void
  setConfidence: (v: ConfidenceLevel | null) => void
  submitAnswer: () => Promise<void>
  submitDontKnow: () => Promise<void>
  askFollowUp: (question: string) => Promise<void>
  nextQuestion: () => void
}

type Props = {
  topicId: string
  topicName: string
  focusSubtopics?: string[]
  previousSubtopics?: { name: string; status: string }[]
  overallLevel?: string | null
  onComplete: (results: Omit<SessionRecord, "id" | "date">) => void
}

export const useTutorSession = ({ topicId, topicName, focusSubtopics, previousSubtopics, overallLevel, onComplete }: Props): TutorSession => {
  const storageKey = `zerc_session_${topicId}`

  const [sessionState, setSessionState] = useState<SessionState>("session")
  const [answer, setAnswer] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [currentResponse, setCurrentResponse] = useState<TutorResponse | null>(null)
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [allGaps, setAllGaps] = useState<string[]>([])
  const [results, setResults] = useState<Omit<SessionRecord, "id" | "date"> | null>(null)
  const [followUpMessages, setFollowUpMessages] = useState<FollowUpMessage[]>([])
  const [followUpLoading, setFollowUpLoading] = useState(false)
  const [lastQuestion, setLastQuestion] = useState<string | null>(null)
  const [lastAnswer, setLastAnswer] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const initialized = useRef(false)
  const pendingAnalysis = useRef<{ messages: Message[]; correct: number } | null>(null)

  const clearSaved = useCallback(() => {
    try { localStorage.removeItem(storageKey) } catch {}
  }, [storageKey])

  const saveState = useCallback((
    msgs: Message[],
    response: TutorResponse,
    state: "session" | "feedback",
    qCount: number,
    cCount: number,
    gaps: string[],
    pending: { messages: Message[]; correct: number } | null,
    overrideFollowUps?: FollowUpMessage[],
  ) => {
    try {
      const data: SavedSession = {
        messages: msgs, currentResponse: response, sessionState: state,
        questionCount: qCount, correctCount: cCount, allGaps: gaps, pendingAnalysis: pending,
        focusSubtopics, followUpMessages: overrideFollowUps ?? followUpMessages,
      }
      localStorage.setItem(storageKey, JSON.stringify(data))
    } catch {}
  }, [storageKey, followUpMessages])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Try to restore saved session
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const saved: SavedSession = JSON.parse(raw)
        if (saved.currentResponse && saved.questionCount > 0) {
          setMessages(saved.messages)
          setCurrentResponse(saved.currentResponse)
          setSessionState(saved.sessionState)
          setQuestionCount(saved.questionCount)
          setCorrectCount(saved.correctCount)
          setAllGaps(saved.allGaps)
          if (saved.pendingAnalysis) pendingAnalysis.current = saved.pendingAnalysis
          if (saved.followUpMessages?.length) setFollowUpMessages(saved.followUpMessages)
          return
        }
      }
    } catch {}

    startSession()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (sessionState === "session") textareaRef.current?.focus()
  }, [sessionState, currentResponse])

  const startSession = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchTutorResponse({ topic: topicName, messages: [], questionNumber: 1, focusSubtopics, previousSubtopics, overallLevel })
      setCurrentResponse(data)
      setMessages([{ role: "assistant", content: data.assistantMessage }])
      setQuestionCount(1)
      saveState([{ role: "assistant", content: data.assistantMessage }], data, "session", 1, 0, [], null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось подключиться к AI")
    } finally {
      setLoading(false)
    }
  }

  const analyzeSession = async (finalMessages: Message[], finalCorrect: number) => {
    setSessionState("analyzing")
    clearSaved()
    try {
      let res: Response
      try {
        res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topicName,
            messages: finalMessages,
            score: finalCorrect,
            total: MAX_QUESTIONS,
            existingSubtopics: previousSubtopics?.map(s => s.name) ?? [],
          }),
        })
      } catch {
        throw new Error("Нет подключения к интернету")
      }
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error)

      const sessionResults: Omit<SessionRecord, "id" | "date"> = {
        score: finalCorrect,
        total: MAX_QUESTIONS,
        overallLevel: data.overallLevel,
        summary: data.summary,
        subtopics: data.subtopics ?? [],
        strengths: data.strengths ?? [],
        toStudyMore: data.toStudyMore ?? [],
        toStudyDeeper: data.toStudyDeeper ?? [],
      }
      setResults(sessionResults)
      setSessionState("results")
      onComplete(sessionResults)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось проанализировать сессию")
      setSessionState("feedback")
    }
  }

  const submitAnswer = async () => {
    if (!answer.trim() || loading) return
    setLoading(true)
    setError(null)
    const questionBeingAnswered = currentResponse?.question ?? null
    setLastQuestion(questionBeingAnswered)
    setLastAnswer(answer)
    try {
      const userMessage: Message = { role: "user", content: answer }
      const updatedMessages = [...messages, userMessage]

      const isLastQuestion = questionCount >= MAX_QUESTIONS
      const nextNum = questionCount + 1

      const data = await fetchTutorResponse({
        topic: topicName,
        messages: updatedMessages,
        questionNumber: nextNum,
        focusSubtopics,
        confidence: confidence ?? undefined,
      })
      setConfidence(null)

      const newCorrect = data.isCorrect ? correctCount + 1 : correctCount
      const finalMessages = [...updatedMessages, { role: "assistant" as const, content: data.assistantMessage }]
      const newGaps = isLastQuestion
        ? allGaps
        : [...allGaps, ...(data.knowledgeGaps ?? []).filter((g) => !allGaps.includes(g))]

      setMessages(finalMessages)
      setCurrentResponse(data)
      setAnswer("")
      if (data.isCorrect) setCorrectCount(newCorrect)
      if (!isLastQuestion && data.knowledgeGaps?.length) setAllGaps(newGaps)

      const pending = isLastQuestion ? { messages: finalMessages, correct: newCorrect } : null
      if (isLastQuestion) pendingAnalysis.current = pending

      setSessionState("feedback")
      saveState(finalMessages, data, "feedback", questionCount, newCorrect, newGaps, pending)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось получить ответ")
    } finally {
      setLoading(false)
    }
  }

  const submitDontKnow = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    setConfidence(1)
    setLastQuestion(currentResponse?.question ?? null)
    setLastAnswer("Не знаю ответа.")
    try {
      const userMessage: Message = { role: "user", content: "Не знаю ответа на этот вопрос." }
      const updatedMessages = [...messages, userMessage]

      const isLastQuestion = questionCount >= MAX_QUESTIONS
      const nextNum = questionCount + 1

      const data = await fetchTutorResponse({
        topic: topicName,
        messages: updatedMessages,
        questionNumber: nextNum,
        focusSubtopics,
        confidence: 1,
      })
      setConfidence(null)

      const finalMessages = [...updatedMessages, { role: "assistant" as const, content: data.assistantMessage }]
      const newGaps = [...allGaps, ...(data.knowledgeGaps ?? []).filter((g: string) => !allGaps.includes(g))]

      setMessages(finalMessages)
      setCurrentResponse(data)
      setAnswer("")
      if (data.knowledgeGaps?.length) setAllGaps(newGaps)

      const pending = isLastQuestion ? { messages: finalMessages, correct: correctCount } : null
      if (isLastQuestion) pendingAnalysis.current = pending
      setSessionState("feedback")
      saveState(finalMessages, data, "feedback", questionCount, correctCount, newGaps, pending)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось получить ответ")
    } finally {
      setLoading(false)
    }
  }

  const nextQuestion = () => {
    if (pendingAnalysis.current) {
      const { messages: msgs, correct } = pendingAnalysis.current
      pendingAnalysis.current = null
      analyzeSession(msgs, correct)
      return
    }
    const nextCount = questionCount + 1
    setQuestionCount(nextCount)
    setSessionState("session")
    setFollowUpMessages([])
    if (currentResponse) saveState(messages, currentResponse, "session", nextCount, correctCount, allGaps, null)
  }

  const askFollowUp = async (question: string) => {
    if (!question.trim() || followUpLoading || !currentResponse) return
    setFollowUpLoading(true)
    try {
      const res = await fetch("/api/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicName,
          originalQuestion: currentResponse.question,
          userAnswer: messages[messages.length - 2]?.content ?? "",
          evaluation: currentResponse.evaluation,
          history: followUpMessages,
          question,
        }),
      })
      const data = await res.json()
      if (data.answer) {
        const updated = [...followUpMessages, { question, answer: data.answer }]
        setFollowUpMessages(updated)
        // Persist to localStorage so reload restores chat history
        if (currentResponse) saveState(messages, currentResponse, "feedback", questionCount, correctCount, allGaps, pendingAnalysis.current, updated)
      }
    } catch {
      // silent fail
    } finally {
      setFollowUpLoading(false)
    }
  }

  return {
    sessionState, answer, confidence, loading, error,
    questionCount, correctCount, allGaps, currentResponse, results, textareaRef,
    followUpMessages, followUpLoading, lastQuestion, lastAnswer,
    setAnswer, setConfidence, submitAnswer, submitDontKnow, askFollowUp, nextQuestion,
  }
}
