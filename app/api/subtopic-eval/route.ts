import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrCreateUserId } from "@/lib/user-id"
import { extractJson } from "@/lib/extract-json"
import { askClaudeText, anthropicErrorResponse } from "@/lib/anthropic"
import { statusFromScore, upgradeOnly, nextReviewAt } from "@/lib/subtopic-status"
import { enforceAiUsageLimit } from "@/lib/ai-usage"
import { logError } from "@/lib/log"
import type { Message } from "@/entities/session/model/types"

export async function POST(req: NextRequest) {
  let userId: string | undefined
  try {
    userId = await getOrCreateUserId()
    const { topicId, topicName, subtopicName, messages, score, total } = await req.json()

    const topic = await prisma.topic.findFirst({ where: { id: topicId, userId } })
    if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const limitResponse = await enforceAiUsageLimit(userId)
    if (limitResponse) return limitResponse

    const msgs: Message[] = messages ?? []
    const history = msgs
      .map(m => `[${m.role === "user" ? "Пользователь" : "Система"}]: ${m.content}`)
      .join("\n\n")

    const raw = await askClaudeText({
      maxTokens: 800,
      label: "subtopic-eval",
      messages: [{
        role: "user",
        content: `Оцени знание пользователя по подтеме "${subtopicName}" темы "${topicName}".
Результат: ${score}/${total} правильных ответов.

История сессии:
${history}

Задачи:
1. Составь 2-4 определения ключевых терминов, которые фигурировали в вопросах этой сессии. Определения должны быть экспертного уровня — точные, полные, без воды. Так, как их сформулировал бы senior-специалист: суть + механизм работы + чем отличается от похожих понятий.
2. Дай краткую рекомендацию что делать дальше.

Верни СТРОГО JSON без markdown:
{
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

    let parsed: {
      summary: string
      recommendation: string
      definitions: { term: string; definition: string }[]
    }
    try {
      parsed = extractJson(raw) as typeof parsed
    } catch (err) {
      logError("subtopic-eval", err, { userId, subtopicName })
      parsed = {
        summary: "Сессия завершена.",
        recommendation: "Повтори материал и попробуй снова.",
        definitions: [],
      }
    }

    if (!Array.isArray(parsed.definitions)) parsed.definitions = []

    const existing = await prisma.topicSubtopic.findFirst({ where: { topicId, name: subtopicName } })
    const finalStatus = upgradeOnly(existing?.status, statusFromScore(score, total))

    // Update subtopic: status + definitions
    await prisma.topicSubtopic.updateMany({
      where: { topicId, name: subtopicName },
      data: {
        status: finalStatus,
        recommendation: parsed.recommendation,
        nextReviewAt: nextReviewAt(finalStatus),
        ...(parsed.definitions.length > 0 && { definitions: parsed.definitions }),
      },
    })

    return NextResponse.json({ ...parsed, status: finalStatus })
  } catch (err) {
    return anthropicErrorResponse(err, "subtopic-eval", { userId })
  }
}
