import type { Topic } from "@/entities/topic/model/types"

const KEY = "zerc_topics"

export const storage = {
  getTopics: (): Topic[] => {
    if (typeof window === "undefined") return []
    try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") } catch { return [] }
  },

  saveTopic: (topic: Topic): void => {
    const topics = storage.getTopics()
    const idx = topics.findIndex((t) => t.id === topic.id)
    if (idx >= 0) topics[idx] = topic
    else topics.unshift(topic)
    localStorage.setItem(KEY, JSON.stringify(topics))
  },

  getTopicById: (id: string): Topic | null =>
    storage.getTopics().find((t) => t.id === id) ?? null,

  deleteTopic: (id: string): void => {
    localStorage.setItem(KEY, JSON.stringify(storage.getTopics().filter((t) => t.id !== id)))
  },
}
