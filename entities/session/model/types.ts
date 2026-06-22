export type Difficulty = "basic" | "intermediate" | "advanced"

export type AppState = "topic" | "session" | "feedback"

export type Message = {
  role: "user" | "assistant"
  content: string
}

export type QuestionType = "text" | "choice"

export type TutorResponse = {
  theory: string | null
  question: string
  questionType: QuestionType
  options: string[] | null
  evaluation: string | null
  explanation: string | null
  isCorrect: boolean | null
  difficulty: Difficulty
  questionNumber: number
  knowledgeGaps: string[]
  assistantMessage: string
}
