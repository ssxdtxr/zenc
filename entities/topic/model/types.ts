export type SubtopicStatus = "needs_work" | "learning" | "good" | "expert"

export type OverallLevel = "beginner" | "intermediate" | "advanced" | "expert"

export type SubtopicDefinition = {
  term: string
  definition: string
}

export type Subtopic = {
  name: string
  status: SubtopicStatus
  recommendation: string
  definitions: SubtopicDefinition[]
  nextReviewAt: string | null
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

export type TheoryDefinition = {
  term: string
  definition: string
}

export type TheoryContent = {
  title: string
  mainIdea: string
  watchOut: string
  definitions: TheoryDefinition[]
  keyPoints: string[]
  codeExample: string | null
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
