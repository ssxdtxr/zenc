"use client"

import { useState, useEffect, useCallback } from "react"
import type { Topic } from "@/entities/topic/model/types"
import { storage } from "@/shared/lib/storage"

export const useDashboard = () => {
  const [topics, setTopics] = useState<Topic[]>([])
  const [newTopicName, setNewTopicName] = useState("")
  const [creating, setCreating] = useState(false)

  const load = useCallback(() => setTopics(storage.getTopics()), [])

  useEffect(() => { load() }, [load])

  const createTopic = () => {
    const name = newTopicName.trim()
    if (!name) return
    const topic: Topic = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      lastSessionAt: null,
      sessions: [],
      currentSubtopics: [],
      overallLevel: null,
    }
    storage.saveTopic(topic)
    setTopics(storage.getTopics())
    setNewTopicName("")
    setCreating(false)
    return topic.id
  }

  const deleteTopic = (id: string) => {
    storage.deleteTopic(id)
    setTopics(storage.getTopics())
  }

  return { topics, newTopicName, creating, setNewTopicName, setCreating, createTopic, deleteTopic }
}
