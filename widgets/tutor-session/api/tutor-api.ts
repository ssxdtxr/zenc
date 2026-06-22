import type { Message, TutorResponse } from "@/entities/session/model/types"

type RequestPayload = {
  topic: string
  messages: Message[]
  questionNumber: number
  focusSubtopics?: string[]
  previousSubtopics?: { name: string; status: string }[]
  overallLevel?: string | null
}

export const fetchTutorResponse = async (payload: RequestPayload): Promise<TutorResponse> => {
  let res: Response
  try {
    res = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error("Нет подключения к интернету")
  }

  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error ?? "Ошибка сервера")

  return data as TutorResponse
}
