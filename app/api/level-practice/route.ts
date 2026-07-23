import { NextRequest, NextResponse } from "next/server"
import { askClaudeJson, anthropicErrorResponse } from "@/lib/anthropic"
import { getOrCreateUserId } from "@/lib/user-id"
import { enforceAiUsageLimit } from "@/lib/ai-usage"

const DIFFICULTY_LABELS: Record<string, string> = {
  basic: "базовый — определения, концепции, «что это такое»",
  intermediate: "средний — применение, нюансы, сравнение подходов",
  advanced: "продвинутый — сложные случаи, нюансы, глубина темы",
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getOrCreateUserId()
    const limitResponse = await enforceAiUsageLimit(userId)
    if (limitResponse) return limitResponse

    const { topicName, subtopicName, difficulty } = await req.json()
    const diffLabel = DIFFICULTY_LABELS[difficulty] ?? difficulty

    const parsed = await askClaudeJson<{ exercises: { title: string; description: string }[] }>({
      maxTokens: 1200,
      label: "level-practice",
      system: `Ты — наставник по любой предметной области (техническая или гуманитарная). Придумай практические задания по подтеме, все строго одного уровня сложности. Подбирай тип задания под характер темы: код/задача — для технических тем, разбор текста/аргументация/сравнение — для гуманитарных.

Формат ответа — СТРОГО JSON без markdown:
{
  "exercises": [
    { "title": "название задания", "description": "что конкретно сделать — 1-2 предложения" }
  ]
}

Правила:
- Ровно 3 задания, все уровня "${diffLabel}"
- Конкретные и выполнимые без специального окружения
- Без лишних слов, без вступлений`,
      messages: [{
        role: "user",
        content: `Подтема: "${subtopicName}" темы "${topicName}". Уровень сложности: ${diffLabel}. Придумай 3 практических задания.`,
      }],
    })

    return NextResponse.json(parsed)
  } catch (err) {
    return anthropicErrorResponse(err, "Level practice error")
  }
}
