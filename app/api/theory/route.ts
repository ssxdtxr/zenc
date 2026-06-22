import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import type { OverallLevel, TheoryContent } from "@/entities/topic/model/types"
import { prisma } from "@/lib/prisma"

const client = new Anthropic()

const SYSTEM_PROMPT = `Ты — опытный преподаватель и технический писатель. Твоя задача — объяснить тему так, чтобы человек действительно понял её, а не просто запомнил определение.

Принципы объяснения:
1. АНАЛОГИИ ПРЕЖДЕ ВСЕГО — сначала объясни через понятную аналогию из реальной жизни, потом технические детали
2. ОТ ПРОСТОГО К СЛОЖНОМУ — начни с самой сути, затем углубляйся
3. ПРИМЕРЫ — каждый концепт подкрепи конкретным примером кода или ситуации
4. ЖИВОЙ ЯЗЫК — разговорный стиль, без канцелярщины, как объяснял бы другу
5. ГЛУБИНА — не останавливайся на поверхности, объясняй "почему именно так"
6. ФОРМАТИРОВАНИЕ в поле body — используй **жирный** для ключевых терминов, *курсив* для акцентов, \`код\` для технических слов/команд прямо в тексте

Формат ответа — СТРОГО JSON без markdown:
{
  "title": "краткое название темы",
  "intro": "одно ёмкое предложение — суть темы через аналогию",
  "sections": [
    {
      "heading": "заголовок раздела",
      "body": "объяснение раздела (2-4 абзаца, живым языком)",
      "code": "пример кода или null если не нужен"
    }
  ],
  "keyPoints": ["ключевой вывод 1", "ключевой вывод 2", "ключевой вывод 3"],
  "practiceIdeas": ["практическое задание 1", "практическое задание 2"],
  "literature": [
    {
      "title": "название книги/статьи/ресурса",
      "author": "автор или null",
      "type": "book | docs | article | course | video",
      "url": "реальный URL или null",
      "description": "1-2 предложения — что именно здесь найдёт пользователь и почему это полезно для данной темы"
    }
  ]
}`

const levelHints: Record<OverallLevel, string> = {
  beginner: "Объясняй максимально просто, избегай жаргона, каждый термин расшифровывай.",
  intermediate: "Пользователь знает основы. Можно использовать термины, но объясняй нюансы и подводные камни.",
  advanced: "Пользователь опытный. Углубляйся в детали реализации, edge cases, best practices.",
  expert: "Уровень эксперта. Фокусируйся на тонкостях, performance, архитектурных решениях, внутреннем устройстве.",
}

export async function POST(req: NextRequest) {
  try {
    const { topicName, subtopicName, userLevel, recommendation } = await req.json()
    const level: OverallLevel = userLevel ?? "beginner"
    const cacheKey = `${topicName}:${subtopicName}:${level}`

    // Check cache first — avoid unnecessary Anthropic calls
    const cached = await prisma.theoryCache.findUnique({ where: { cacheKey } })
    if (cached) {
      return NextResponse.json(cached.content)
    }

    const userMessage = `Объясни тему "${subtopicName}" в контексте "${topicName}".

Уровень пользователя: ${level}. ${levelHints[level]}
${recommendation ? `Особое внимание удели: ${recommendation}` : ""}

Дай полное, глубокое объяснение с 4-6 разделами, примерами кода и практическими заданиями.`

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    })

    const rawContent = response.content[0].type === "text" ? response.content[0].text : ""

    let parsed: TheoryContent
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("No JSON found")
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      parsed = {
        title: subtopicName,
        intro: "Не удалось разобрать ответ. Попробуй обновить страницу.",
        sections: [],
        keyPoints: [],
        practiceIdeas: [],
        literature: [],
      }
    }

    // Cache in DB for future requests
    await prisma.theoryCache.create({
      data: { cacheKey, topicName, subtopicName, userLevel: level, content: parsed as object },
    })

    return NextResponse.json(parsed)
  } catch (err) {
    console.error("Theory API error:", err)
    return NextResponse.json({ error: "Failed to generate theory" }, { status: 500 })
  }
}
