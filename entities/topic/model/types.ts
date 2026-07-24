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
  prerequisites: string[]
  nextReviewAt: string | null
}

export type SuggestedSubtopic = {
  name: string
  reason: string
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
  // Only present on the raw /api/analyze response — candidates the model
  // noticed outside the existing knowledge map. Not persisted to the DB;
  // the user accepts/rejects them right on the session-results screen.
  suggestedNewSubtopics?: SuggestedSubtopic[]
}

export type TheoryDefinition = {
  term: string
  definition: string
}

export type TheoryExample = {
  label: string
  explanation: string
  code?: string | null
}

export type TheoryRelated = {
  name: string
  relation: string
}

export type TheoryExercise = {
  title: string
  description: string
  difficulty: "easy" | "medium" | "hard"
}

export type TheorySection = {
  heading: string
  explanation: string
}

export type TheoryContent = {
  title: string
  sections: TheorySection[]
  watchOut: string
  definitions: TheoryDefinition[]
  keyPoints: string[]
  codeExample?: string | null
  examples?: TheoryExample[]
  antiPatterns?: string[]
  relatedSubtopics?: TheoryRelated[]
  exercises?: TheoryExercise[]
}

export type Topic = {
  id: string
  name: string
  createdAt: string
  lastSessionAt: string | null
  sessions: SessionRecord[]
  currentSubtopics: Subtopic[]
  overallLevel: OverallLevel | null
}
