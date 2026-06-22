"use client"

import { useState, useRef, useEffect } from "react"
import type { RefObject } from "react"
import type { Message, TutorResponse } from "@/entities/session/model/types"
import type { GlossaryTerm, SessionRecord } from "@/entities/topic/model/types"
import { fetchTutorResponse } from "../api/tutor-api"

export type SessionState = "session" | "feedback" | "analyzing" | "results"

export const MAX_QUESTIONS = 10

type TutorSession = {
  sessionState: SessionState
  answer: string
  loading: boolean
  error: string | null
  questionCount: number
  correctCount: number
  allGaps: string[]
  currentResponse: TutorResponse | null
  results: Omit<SessionRecord, "id" | "date"> | null
  textareaRef: RefObject<HTMLTextAreaElement | null>
  setAnswer: (v: string) => void
  submitAnswer: () => Promise<void>
  nextQuestion: () => void
}

type Props = {
  topicName: string
  focusSubtopics?: string[]
  onComplete: (results: Omit<SessionRecord, "id" | "date">) => void
}

export const useTutorSession = ({ topicName, focusSubtopics, onComplete }: Props): TutorSession => {
  const [sessionState, setSessionState] = useState<SessionState>("session")
  const [answer, setAnswer] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [currentResponse, setCurrentResponse] = useState<TutorResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [allGaps, setAllGaps] = useState<string[]>([])
  const [results, setResults] = useState<Omit<SessionRecord, "id" | "date"> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const initialized = useRef(false)
  const pendingAnalysis = useRef<{ messages: Message[]; correct: number } | null>(null)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
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
      const data = await fetchTutorResponse({ topic: topicName, messages: [], questionNumber: 1, focusSubtopics })
      setCurrentResponse(data)
      setMessages([{ role: "assistant", content: data.assistantMessage }])
      setQuestionCount(1)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось подключиться к AI")
    } finally {
      setLoading(false)
    }
  }

  const analyzeSession = async (finalMessages: Message[], finalCorrect: number) => {
    setSessionState("analyzing")
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
          }),
        })
      } catch {
        throw new Error("Нет подключения к интернету")
      }
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error)

      const sessionResults: Omit<SessionRecord, "id" | "date"> & { glossary: GlossaryTerm[] } = {
        score: finalCorrect,
        total: MAX_QUESTIONS,
        overallLevel: data.overallLevel,
        summary: data.summary,
        subtopics: data.subtopics ?? [],
        strengths: data.strengths ?? [],
        toStudyMore: data.toStudyMore ?? [],
        toStudyDeeper: data.toStudyDeeper ?? [],
        glossary: data.glossary ?? [],
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
      })

      const newCorrect = data.isCorrect ? correctCount + 1 : correctCount
      const finalMessages = [...updatedMessages, { role: "assistant" as const, content: data.assistantMessage }]

      setMessages(finalMessages)
      setCurrentResponse(data)
      setAnswer("")
      if (data.isCorrect) setCorrectCount(newCorrect)
      if (data.knowledgeGaps?.length) {
        setAllGaps((prev) => [...prev, ...data.knowledgeGaps.filter((g) => !prev.includes(g))])
      }

      if (isLastQuestion) {
        pendingAnalysis.current = { messages: finalMessages, correct: newCorrect }
      }
      setSessionState("feedback")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось получить ответ")
    } finally {
      setLoading(false)
    }
  }

  const nextQuestion = () => {
    if (pendingAnalysis.current) {
      const { messages, correct } = pendingAnalysis.current
      pendingAnalysis.current = null
      analyzeSession(messages, correct)
      return
    }
    setQuestionCount((c) => c + 1)
    setSessionState("session")
  }

  return {
    sessionState, answer, loading, error,
    questionCount, correctCount, allGaps, currentResponse, results, textareaRef,
    setAnswer, submitAnswer, nextQuestion,
  }
}
