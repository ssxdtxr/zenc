import type { Message, TutorResponse } from "@/entities/session/model/types"

type RequestPayload = {
  topic: string
  messages: Message[]
  questionNumber: number
}

export const fetchTutorResponse = async (payload: RequestPayload): Promise<TutorResponse> => {
  const res = await fetch("/api/tutor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error ?? "Ошибка сервера")

  return data as TutorResponse
}
