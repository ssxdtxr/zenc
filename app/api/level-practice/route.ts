import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import { extractJson } from "@/lib/extract-json"

const client = new Anthropic()

const DIFFICULTY_LABELS: Record<string, string> = {
  basic: "базовый — определения, концепции, «что это такое»",
  intermediate: "средний — применение, нюансы, сравнение подходов",
  advanced: "продвинутый — сложные случаи, нюансы, глубина темы",
}

export async function POST(req: NextRequest) {
  try {
    const { topicName, subtopicName, difficulty } = await req.json()
    const diffLabel = DIFFICULTY_LABELS[difficulty] ?? difficulty

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
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

    const raw = response.content[0].type === "text" ? response.content[0].text : ""
    const parsed = extractJson(raw) as { exercises: { title: string; description: string }[] }
    return NextResponse.json(parsed)
  } catch (err) {
    console.error("Level practice error:", err)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
