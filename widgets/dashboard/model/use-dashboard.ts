"use client"

import { useState, useEffect, useCallback } from "react"
import type { Topic } from "@/entities/topic/model/types"
import { apiClient } from "@/shared/lib/api-client"

export const useDashboard = () => {
  const [topics, setTopics] = useState<Topic[]>([])
  const [newTopicName, setNewTopicName] = useState("")
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setTopics(await apiClient.getTopics())
    } catch (e) {
      console.error(e)
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

  return { topics, newTopicName, creating, loading, setNewTopicName, setCreating, createTopic, deleteTopic }
}
