import { NextRequest, NextResponse } from "next/server"
import { askClaudeText, anthropicErrorResponse } from "@/lib/anthropic"
import { getOrCreateUserId } from "@/lib/user-id"
import { enforceAiUsageLimit } from "@/lib/ai-usage"

export async function POST(req: NextRequest) {
  let userId: string | undefined
  try {
    userId = await getOrCreateUserId()
    const limitResponse = await enforceAiUsageLimit(userId)
    if (limitResponse) return limitResponse

    const { topicName, originalQuestion, userAnswer, evaluation, history, question } = await req.json()

    const historyText = (history as { question: string; answer: string }[])
      .map(m => `Вопрос: ${m.question}\nОтвет: ${m.answer}`)
      .join("\n\n")

    const answer = await askClaudeText({
      maxTokens: 600,
      label: "follow-up",
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

    return NextResponse.json({ answer })
  } catch (err) {
    return anthropicErrorResponse(err, "follow-up", { userId })
  }
}
