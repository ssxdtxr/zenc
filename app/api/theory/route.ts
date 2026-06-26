import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import type { OverallLevel, TheoryContent } from "@/entities/topic/model/types"
import { prisma } from "@/lib/prisma"
import { extractJson } from "@/lib/extract-json"

const client = new Anthropic()

const SYSTEM_PROMPT = `Ты — технический наставник. Объясняй точно и по делу — только суть, без воды.

Формат ответа — СТРОГО JSON без markdown:
{
  "title": "название подтемы",
  "mainIdea": "главная идея в 2-4 предложениях — что это такое, зачем нужно и как работает",
  "watchOut": "на что обратить внимание — 1-2 предложения о нюансах или распространённых заблуждениях",
  "definitions": [
    { "term": "ключевой термин", "definition": "точное определение в одном предложении" }
  ],
  "examples": [
    {
      "label": "Базовый",
      "explanation": "короткое описание что показывает этот пример",
      "code": "код или null если не применимо"
    },
    {
      "label": "Реальный сценарий",
      "explanation": "как это выглядит в продакшн-коде",
      "code": "код или null"
    },
    {
      "label": "Edge case",
      "explanation": "нетривиальный случай, который часто упускают",
      "code": "код или null"
    }
  ],
  "antiPatterns": [
    "конкретная ошибка или антипаттерн, которую делают разработчики",
    "ещё одна типичная ошибка"
  ],
  "relatedSubtopics": [
    { "name": "название другой подтемы из списка", "relation": "одна фраза — зачем связь" }
  ],
  "exercises": [
    { "title": "название задания", "description": "что конкретно сделать — 1-2 предложения", "difficulty": "easy" },
    { "title": "название задания", "description": "что конкретно сделать", "difficulty": "medium" },
    { "title": "название задания", "description": "что конкретно сделать", "difficulty": "hard" }
  ],
  "keyPoints": ["главный вывод 1", "главный вывод 2", "главный вывод 3"]
}

Правила:
- definitions: 3-5 самых важных терминов
- examples: всегда 3 примера с нарастающей сложностью; code — null только если код совсем не применим
- antiPatterns: 2-4 конкретных ошибки которые реально допускают в коде или на собеседованиях
- relatedSubtopics: только из предоставленного списка подтем, только реально связанные
- exercises: ровно 3 практических задания разной сложности (easy/medium/hard); конкретные и выполнимые без специального окружения
- keyPoints: ровно 3 вывода
- Без лишних слов, без вступлений`

const levelHints: Record<OverallLevel, string> = {
  beginner: "Объясняй просто, избегай жаргона, расшифровывай термины.",
  intermediate: "Можно использовать термины, объясняй нюансы и подводные камни.",
  advanced: "Углубляйся в детали, edge cases, best practices.",
  expert: "Фокусируйся на тонкостях, производительности, внутреннем устройстве.",
}

export async function POST(req: NextRequest) {
  try {
    const { topicName, subtopicName, userLevel, recommendation, allSubtopics } = await req.json()
    const level: OverallLevel = userLevel ?? "beginner"
    const cacheKey = `v2:${topicName}:${subtopicName}:${level}`

    const cached = await prisma.theoryCache.findUnique({ where: { cacheKey } })
    if (cached) return NextResponse.json(cached.content)

    const otherSubtopics = Array.isArray(allSubtopics)
      ? (allSubtopics as string[]).filter((s: string) => s !== subtopicName)
      : []

    const userMessage = `Объясни подтему "${subtopicName}" в контексте темы "${topicName}".
Уровень пользователя: ${level}. ${levelHints[level]}${recommendation ? ` Акцент: ${recommendation}` : ""}
${otherSubtopics.length > 0 ? `\nДругие подтемы этой темы (используй для relatedSubtopics): ${otherSubtopics.join(", ")}` : ""}`

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    })

    const rawContent = response.content[0].type === "text" ? response.content[0].text : ""

    if (response.stop_reason === "max_tokens") {
      console.error("Theory truncated for:", subtopicName)
    }

    let parsed: TheoryContent
    try {
      parsed = extractJson(rawContent) as TheoryContent
    } catch {
      console.error("Theory JSON parse failed for:", subtopicName, "raw:", rawContent.slice(0, 300))
      return NextResponse.json({
        title: subtopicName,
        mainIdea: "Не удалось разобрать ответ. Попробуй обновить страницу.",
        watchOut: "",
        definitions: [],
        keyPoints: [],
        codeExample: null,
      })
    }

    await prisma.theoryCache.upsert({
      where: { cacheKey },
      update: { content: parsed as object },
      create: { cacheKey, topicName, subtopicName, userLevel: level, content: parsed as object },
    })

    return NextResponse.json(parsed)
  } catch (err) {
    console.error("Theory API error:", err)
    if (err instanceof Anthropic.APIError) {
      if (err.status === 529) return NextResponse.json({ error: "Anthropic перегружен — попробуй через минуту" }, { status: 503 })
      if (err.status === 429) return NextResponse.json({ error: "Превышен лимит запросов" }, { status: 429 })
      const msg = err.message.toLowerCase()
      if (err.status === 402 || msg.includes("credit") || msg.includes("billing")) {
        return NextResponse.json({ error: "На аккаунте Anthropic закончились средства" }, { status: 402 })
      }
    }
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
