import Anthropic from "@anthropic-ai/sdk"
import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import type { OverallLevel, TheoryContent } from "@/entities/topic/model/types"
import { prisma } from "@/lib/prisma"
import { extractJson } from "@/lib/extract-json"
import { getOrCreateUserId } from "@/lib/user-id"

const client = new Anthropic()

const SYSTEM_PROMPT = `Ты — наставник, который объясняет любую предметную область: технические дисциплины (программирование, математика, инженерия) и нетехнические (история, литература, языки, естественные науки, право и т.д.). Объясняй точно и по делу — только суть, без воды. Сначала определи природу темы и адаптируй формат под неё — не притягивай код и антипаттерны к темам, где их нет.

Формат ответа — СТРОГО JSON без markdown:
{
  "title": "название подтемы",
  "sections": [
    { "heading": "название смысловой части", "explanation": "объяснение этой части в 2-4 предложениях" }
  ],
  "watchOut": "на что обратить внимание — 1-2 предложения о нюансах или распространённых заблуждениях",
  "definitions": [
    { "term": "ключевой термин", "definition": "точное определение в одном предложении" }
  ],
  "examples": [
    {
      "label": "Базовый",
      "explanation": "короткое описание что показывает этот пример",
      "code": "код/формула или null если не применимо для этой темы"
    },
    {
      "label": "Реальный сценарий",
      "explanation": "как это применяется на практике (в проекте, в тексте, в исследовании, в жизни — смотря что уместно)",
      "code": "код/формула или null"
    },
    {
      "label": "Edge case",
      "explanation": "нетривиальный случай, исключение или спорный момент, который часто упускают",
      "code": "код/формула или null"
    }
  ],
  "antiPatterns": [
    "конкретная типичная ошибка или заблуждение по этой теме — код, если тема техническая; неверное толкование, распространённый миф, логическая ошибка — если нет",
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
- sections: разбей объяснение на смысловые части. Если подтема узкая (один механизм/концепция) — ОДНА секция. Если подтема широкая и объединяет несколько механизмов, паттернов или этапов — 3-6 секций, по одной на каждый смысловой блок, с своим заголовком. Не дроби искусственно узкую подтему и не сливай в одну секцию то, что заслуживает разделения.
- definitions: 3-5 самых важных терминов
- examples: всегда 3 примера с нарастающей сложностью; code — заполняй только если код/формула реально уместны для темы, иначе null (для истории, литературы, языков и т.п. почти всегда null)
- antiPatterns: 2-4 конкретных ошибки или заблуждения, которые реально возникают у изучающих эту тему — не обязательно про код
- relatedSubtopics: только из предоставленного списка подтем, только реально связанные
- exercises: ровно 3 практических задания разной сложности (easy/medium/hard); задания подбирай под характер темы (написать код, решить задачу, проанализировать текст, сравнить события, сформулировать аргумент и т.п.) — конкретные и выполнимые без специального окружения
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
    const trimmedRecommendation: string = (recommendation ?? "").trim()

    // No recommendation yet — shared cache across all users, saves Anthropic calls for the common case.
    // Once a subtopic has a personalized recommendation (from a prior test), scope the cache to this
    // user + this exact recommendation, so the theory actually reflects it and regenerates when it changes.
    const cacheKey = trimmedRecommendation
      ? `v5:user:${await getOrCreateUserId()}:${topicName}:${subtopicName}:${level}:${createHash("sha256").update(trimmedRecommendation).digest("hex").slice(0, 16)}`
      : `v5:shared:${topicName}:${subtopicName}:${level}`

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
      max_tokens: 8000,
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
        sections: [{ heading: "", explanation: "Не удалось разобрать ответ. Попробуй обновить страницу." }],
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
