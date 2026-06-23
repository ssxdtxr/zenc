import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrCreateUserId } from "@/lib/user-id"
import { extractJson } from "@/lib/extract-json"
import type { Message } from "@/entities/session/model/types"

const client = new Anthropic()

function nextReviewAt(status: string): Date {
  const days: Record<string, number> = { needs_work: 1, learning: 3, good: 7, expert: 21 }
  const d = new Date()
  d.setDate(d.getDate() + (days[status] ?? 3))
  return d
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getOrCreateUserId()
    const { topicId, topicName, subtopicName, messages, score, total } = await req.json()

    const topic = await prisma.topic.findFirst({ where: { id: topicId, userId } })
    if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const msgs: Message[] = messages ?? []
    const history = msgs
      .map(m => `[${m.role === "user" ? "Пользователь" : "Система"}]: ${m.content}`)
      .join("\n\n")

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{
        role: "user",
        content: `Оцени знание пользователя по подтеме "${subtopicName}" темы "${topicName}".
Результат: ${score}/${total} правильных ответов.

История сессии:
${history}

Задачи:
1. Оцени уровень знания подтемы
2. Составь 2-4 определения ключевых терминов, которые фигурировали в вопросах этой сессии. Определения должны быть экспертного уровня — точные, полные, без воды. Так, как их сформулировал бы senior-специалист: суть + механизм работы + чем отличается от похожих понятий.

Верни СТРОГО JSON без markdown:
{
  "status": "needs_work/learning/good/expert",
  "summary": "2-3 предложения об уровне понимания этой конкретной подтемы",
  "recommendation": "одно конкретное действие что сделать дальше",
  "definitions": [
    {
      "term": "термин из сессии",
      "definition": "экспертное определение в 1-2 предложения — суть, механизм, отличие от аналогов"
    }
  ]
}`,
      }],
    })

    const raw = response.content[0].type === "text" ? response.content[0].text : ""
    let parsed: {
      status: string
      summary: string
      recommendation: string
      definitions: { term: string; definition: string }[]
    }
    try {
      parsed = extractJson(raw) as typeof parsed
    } catch {
      parsed = {
        status: "learning",
        summary: "Сессия завершена.",
        recommendation: "Повтори материал и попробуй снова.",
        definitions: [],
      }
    }

    const validStatuses = ["needs_work", "learning", "good", "expert"]
    if (!validStatuses.includes(parsed.status)) parsed.status = "learning"
    if (!Array.isArray(parsed.definitions)) parsed.definitions = []

    // Update subtopic: status + definitions
    await prisma.topicSubtopic.updateMany({
      where: { topicId, name: subtopicName },
      data: {
        status: parsed.status,
        recommendation: parsed.recommendation,
        nextReviewAt: nextReviewAt(parsed.status),
        ...(parsed.definitions.length > 0 && { definitions: parsed.definitions }),
      },
    })

    return NextResponse.json(parsed)
  } catch (err) {
    console.error("Subtopic eval error:", err)
    if (err instanceof Anthropic.APIError) {
      const msg = err.message.toLowerCase()
      if (err.status === 402 || msg.includes("credit")) {
        return NextResponse.json({ error: "На аккаунте Anthropic закончились средства" }, { status: 402 })
      }
    }
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
