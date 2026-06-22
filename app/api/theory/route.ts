import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import type { OverallLevel, TheoryContent } from "@/entities/topic/model/types"
import { prisma } from "@/lib/prisma"
import { extractJson } from "@/lib/extract-json"

const client = new Anthropic()

const SYSTEM_PROMPT = `Ты — технический наставник. Объясняй кратко и по делу — только суть, без воды.

Формат ответа — СТРОГО JSON без markdown:
{
  "title": "название подтемы",
  "mainIdea": "главная идея в 2-4 предложениях — что это такое, зачем нужно и как работает",
  "watchOut": "на что обратить внимание — 1-2 предложения о типичных ошибках, нюансах или распространённых заблуждениях",
  "definitions": [
    { "term": "ключевой термин подтемы", "definition": "точное определение в одном предложении" }
  ],
  "keyPoints": ["ключевой вывод 1", "ключевой вывод 2", "ключевой вывод 3"],
  "codeExample": "небольшой показательный пример кода или null если не применимо"
}

Правила:
- definitions: 3-5 самых важных терминов этой подтемы
- keyPoints: 3 главных вывода которые нужно запомнить
- codeExample: только если код реально помогает понять — иначе null
- Без лишних слов, без вступлений, только по делу`

const levelHints: Record<OverallLevel, string> = {
  beginner: "Объясняй просто, избегай жаргона, расшифровывай термины.",
  intermediate: "Можно использовать термины, объясняй нюансы и подводные камни.",
  advanced: "Углубляйся в детали, edge cases, best practices.",
  expert: "Фокусируйся на тонкостях, производительности, внутреннем устройстве.",
}

export async function POST(req: NextRequest) {
  try {
    const { topicName, subtopicName, userLevel, recommendation } = await req.json()
    const level: OverallLevel = userLevel ?? "beginner"
    const cacheKey = `${topicName}:${subtopicName}:${level}`

    const cached = await prisma.theoryCache.findUnique({ where: { cacheKey } })
    if (cached) return NextResponse.json(cached.content)

    const userMessage = `Объясни подтему "${subtopicName}" в контексте "${topicName}".
Уровень: ${level}. ${levelHints[level]}${recommendation ? ` Акцент: ${recommendation}` : ""}`

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
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

    await prisma.theoryCache.create({
      data: { cacheKey, topicName, subtopicName, userLevel: level, content: parsed as object },
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
