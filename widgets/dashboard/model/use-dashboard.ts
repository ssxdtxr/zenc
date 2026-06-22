"use client"

import { useState, useEffect, useCallback } from "react"
import type { Topic } from "@/entities/topic/model/types"
import { apiClient } from "@/shared/lib/api-client"

export const useDashboard = () => {
  const [topics, setTopics] = useState<Topic[]>([])
  const [newTopicName, setNewTopicName] = useState("")
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTopics(await apiClient.getTopics())
    } catch (e) {
      if (e instanceof TypeError) {
        setError("Нет подключения к интернету")
      } else {
        setError(e instanceof Error ? e.message : "Не удалось загрузить темы")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const createTopic = async (): Promise<string | undefined> => {
    const name = newTopicName.trim()
    if (!name) return
    try {
      const topic = await apiClient.createTopic(name)
      setTopics((prev) => [topic, ...prev])
      setNewTopicName("")
      setCreating(false)
      return topic.id
    } catch (e) {
      console.error(e)
    }
  }

  const deleteTopic = async (id: string) => {
    await apiClient.deleteTopic(id)
    setTopics((prev) => prev.filter((t) => t.id !== id))
  }

  return { topics, newTopicName, creating, loading, error, setNewTopicName, setCreating, createTopic, deleteTopic, reload: load }
}
