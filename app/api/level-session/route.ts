import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import { extractJson } from "@/lib/extract-json"
import type { Message } from "@/entities/session/model/types"

const client = new Anthropic()

const DIFFICULTY_LABELS: Record<string, string> = {
  basic: "базовый — определения, концепции, «что это такое»",
  intermediate: "средний — применение, нюансы, сравнение подходов",
  advanced: "продвинутый — сложные случаи, нюансы, глубина темы",
}

export async function POST(req: NextRequest) {
  try {
    const { topicName, subtopicName, difficulty, messages, questionNumber } = await req.json()
    const diffLabel = DIFFICULTY_LABELS[difficulty] ?? difficulty
    const msgs: Message[] = messages ?? []

    const systemPrompt = `Ты — строгий тьютор по любой предметной области (техническая или гуманитарная). Проводишь уровневое тестирование подтемы.

Тема: "${topicName}", подтема: "${subtopicName}".
Уровень: ${diffLabel}. Задавай ТОЛЬКО вопросы этого уровня сложности.

Правила:
- Минимум 3 вопроса перед завершением
- shouldFinish: true — когда уверен что знания полные ИЛИ пользователь явно не справляется (3+ провала подряд)
- isComplete: true — пользователь освоил этот уровень; false — нет
- При isCorrect=false всегда заполняй correctAnswer
- Чередуй "choice" и "text", не давай "choice" дважды подряд

Формат — СТРОГО JSON без markdown:
{
  "evaluation": "оценка ответа или null для первого вопроса",
  "correctAnswer": "правильный ответ если isCorrect=false, иначе null",
  "explanation": "краткое объяснение или null",
  "isCorrect": true/false/null,
  "question": "вопрос или null если shouldFinish=true",
  "questionType": "text/choice",
  "options": ["А","Б","В","Г"] или null,
  "shouldFinish": false,
  "isComplete": null,
  "finishSummary": null
}

При завершении (shouldFinish:true) question=null, isComplete и finishSummary обязательны:
"finishSummary": "2-3 предложения об уровне пользователя на этой сложности"`

    const firstMessage = `Подтема: "${subtopicName}" темы "${topicName}". Уровень: ${diffLabel}. Задай первый вопрос.`
    // Anthropic requires conversation to start with a user message.
    // Client stores only assistant/user turns after the initial trigger, so we prepend it.
    const apiMessages: Message[] = msgs.length === 0 || msgs[0].role === "assistant"
      ? [{ role: "user", content: firstMessage }, ...msgs]
      : msgs

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: systemPrompt,
      messages: apiMessages,
    })

    const raw = response.content[0].type === "text" ? response.content[0].text : ""
    const parsed = extractJson(raw) as Record<string, unknown>
    return NextResponse.json({ ...parsed, questionNumber: questionNumber ?? 1 })
  } catch (err) {
    console.error("Level session error:", err)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
