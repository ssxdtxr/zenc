import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import { getOrCreateUserId } from "@/lib/user-id"
import { enforceAiUsageLimit } from "@/lib/ai-usage"

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const userId = await getOrCreateUserId()
    const limitResponse = await enforceAiUsageLimit(userId)
    if (limitResponse) return limitResponse

    const { topicName, originalQuestion, userAnswer, evaluation, history, question } = await req.json()

    const historyText = (history as { question: string; answer: string }[])
      .map(m => `Вопрос: ${m.question}\nОтвет: ${m.answer}`)
      .join("\n\n")

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: `Ты — наставник по теме "${topicName}". Студент только что ответил на вопрос и теперь задаёт уточняющие вопросы, чтобы лучше разобраться. Отвечай точно, кратко, по существу. Не задавай встречных вопросов — только объясняй.`,
      messages: [{
        role: "user",
        content: `Контекст сессии:
Вопрос: ${originalQuestion}
Ответ студента: ${userAnswer}
Оценка: ${evaluation ?? "—"}
${historyText ? `\nПредыдущие уточнения:\n${historyText}` : ""}

Новый уточняющий вопрос студента: ${question}`,
      }],
    })

    const answer = response.content[0].type === "text" ? response.content[0].text : ""
    return NextResponse.json({ answer })
  } catch (err) {
    console.error("Follow-up error:", err)
    if (err instanceof Anthropic.APIError) {
      const msg = err.message.toLowerCase()
      if (err.status === 402 || msg.includes("credit")) {
        return NextResponse.json({ error: "На аккаунте Anthropic закончились средства" }, { status: 402 })
      }
    }
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
