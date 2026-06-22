import type { GlossaryTerm, SessionRecord, Topic } from "@/entities/topic/model/types"

type DbTopic = Topic & {
  sessions: (Omit<SessionRecord, "subtopics"> & {
    strengths: string[]
    toStudyMore: string[]
    toStudyDeeper: string[]
  })[]
  subtopics: { id: string; name: string; status: string; recommendation: string; definitions: { term: string; definition: string }[] }[]
  glossary: { id: string; term: string; definition: string }[]
}

function mapDbTopic(t: DbTopic): Topic {
  return {
    id: t.id,
    name: t.name,
    createdAt: t.createdAt as unknown as string,
    lastSessionAt: t.lastSessionAt as unknown as string | null,
    overallLevel: t.overallLevel as Topic["overallLevel"],
    currentSubtopics: (t.subtopics ?? []).map((s) => ({
      name: s.name,
      status: s.status as Topic["currentSubtopics"][0]["status"],
      recommendation: s.recommendation,
      definitions: (s.definitions as { term: string; definition: string }[]) ?? [],
    })),
    glossary: (t.glossary ?? []).map((g): GlossaryTerm => ({
      term: g.term,
      definition: g.definition,
    })),
    sessions: (t.sessions ?? []).map((s) => ({
      id: s.id,
      date: s.date as unknown as string,
      score: s.score,
      total: s.total,
      overallLevel: s.overallLevel as SessionRecord["overallLevel"],
      summary: s.summary,
      subtopics: [],
      strengths: s.strengths ?? [],
      toStudyMore: s.toStudyMore ?? [],
      toStudyDeeper: s.toStudyDeeper ?? [],
    })),
  }
}

export const apiClient = {
  async getTopics(): Promise<Topic[]> {
    const res = await fetch("/api/topics")
    if (!res.ok) throw new Error("Failed to load topics")
    const data: DbTopic[] = await res.json()
    return data.map(mapDbTopic)
  },

  async createTopic(name: string): Promise<Topic> {
    const res = await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) throw new Error("Failed to create topic")
    return mapDbTopic(await res.json())
  },

  async getTopicById(id: string): Promise<Topic | null> {
    const res = await fetch(`/api/topics/${id}`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error("Failed to load topic")
    return mapDbTopic(await res.json())
  },

  async deleteTopic(id: string): Promise<void> {
    await fetch(`/api/topics/${id}`, { method: "DELETE" })
  },

  async saveSession(topicId: string, results: Omit<SessionRecord, "id" | "date">): Promise<void> {
    const res = await fetch(`/api/topics/${topicId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(results),
    })
    if (!res.ok) throw new Error("Failed to save session")
  },
}
