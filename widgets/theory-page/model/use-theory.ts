"use client"

import { useState, useEffect } from "react"
import type { OverallLevel, TheoryContent } from "@/entities/topic/model/types"

type Props = {
  topicName: string
  subtopicName: string
  userLevel: OverallLevel | null
  recommendation: string
  allSubtopics?: string[]
}

export const useTheory = ({ topicName, subtopicName, userLevel, recommendation, allSubtopics }: Props) => {
  const [content, setContent] = useState<TheoryContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTheory = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/theory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicName, subtopicName, userLevel, recommendation, allSubtopics }),
        })
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error)
        setContent(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось загрузить теорию")
      } finally {
        setLoading(false)
      }
    }

    fetchTheory()
  }, [topicName, subtopicName, userLevel, recommendation])

  return { content, loading, error }
}
