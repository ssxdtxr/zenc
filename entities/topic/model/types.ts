export type SubtopicStatus = "needs_work" | "learning" | "good" | "expert"

export type OverallLevel = "beginner" | "intermediate" | "advanced" | "expert"

export type Subtopic = {
  name: string
  status: SubtopicStatus
  recommendation: string
}

export type SessionRecord = {
  id: string
  date: string
  score: number
  total: number
  overallLevel: OverallLevel
  summary: string
  subtopics: Subtopic[]
  strengths: string[]
  toStudyMore: string[]
  toStudyDeeper: string[]
}

export type TheorySection = {
  heading: string
  body: string
  code: string | null
}

export type LiteratureType = "book" | "docs" | "article" | "course" | "video"

export type LiteratureItem = {
  title: string
  author: string | null
  type: LiteratureType
  url: string | null
  description: string
}

export type TheoryContent = {
  title: string
  intro: string
  sections: TheorySection[]
  keyPoints: string[]
  practiceIdeas: string[]
  literature: LiteratureItem[]
}

export type GlossaryTerm = {
  term: string
  definition: string
}

export type Topic = {
  id: string
  name: string
  createdAt: string
  lastSessionAt: string | null
  sessions: SessionRecord[]
  currentSubtopics: Subtopic[]
  overallLevel: OverallLevel | null
  glossary: GlossaryTerm[]
}
