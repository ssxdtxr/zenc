import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrCreateUserId } from "@/lib/user-id"
import { extractJson } from "@/lib/extract-json"
import { askClaudeText, anthropicErrorResponse } from "@/lib/anthropic"
import { enforceAiUsageLimit } from "@/lib/ai-usage"
import { logError } from "@/lib/log"

const SYSTEM_PROMPT = `Ты — эксперт в составлении карт знаний. Составь список подтем для учебной темы.

Правила:
1. Каждая подтема — отдельный механизм, паттерн или концепция, НЕ аспект одного и того же.
2. Если несколько пунктов отвечают на вопрос "что это / зачем / как использовать" про ОДИН объект — это ОДНА подтема.
3. НЕ создавай отдельные подтемы для "концепция X", "паттерны X", "применение X" — это одна подтема "X".
4. Генерируй 10–15 подтем, которые ПОЛНОСТЬЮ покрывают тему — так, чтобы человек, освоивший все подтемы, мог считать себя экспертом в этой теме.
5. Для каждой подтемы — максимум 3 основных термина, только самое ядро, без которого понять подтему невозможно. Не включай второстепенные или общеизвестные термины, которые любой разработчик знает без объяснения.
6. Для каждой подтемы определи пререквизиты — какие ДРУГИЕ подтемы из этого же списка нужно понимать до неё. У базовых и у независимых друг от друга подтем — пустой список. Только прямые зависимости, не транзитивные.

Формат ответа — СТРОГО JSON без markdown:
{
  "subtopics": [
    {
      "name": "название подтемы",
      "recommendation": "что конкретно изучить (1 предложение)",
      "definitions": [
        { "term": "один ключевой термин", "definition": "определение в одном предложении" }
      ],
      "prerequisites": ["название другой подтемы из этого же списка, которую нужно понимать раньше"]
    }
  ]
}`

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string | undefined
  try {
    userId = await getOrCreateUserId()
    const { id } = await params

    const topic = await prisma.topic.findFirst({
      where: { id, userId },
      include: {
        subtopics: true,
        sessions: { orderBy: { date: "desc" }, take: 3 },
      },
    })

    if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const limitResponse = await enforceAiUsageLimit(userId)
    if (limitResponse) return limitResponse

    const sessionContext = topic.sessions.length > 0
      ? topic.sessions.map(s =>
          `Сессия ${new Date(s.date).toLocaleDateString("ru")}: ${s.score}/${s.total}. ${s.summary}`
        ).join("\n")
      : ""

    const userMessage = `Тема: "${topic.name}"
${sessionContext ? `\nКонтекст знаний пользователя:\n${sessionContext}` : ""}
${topic.subtopics.length > 0 ? `\nТекущие подтемы (перегруппируй при необходимости): ${topic.subtopics.map(s => s.name).join(", ")}` : ""}

Составь правильный сгруппированный список подтем.`

    const rawContent = await askClaudeText({
      maxTokens: 8000,
      label: "regenerate-subtopics",
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    })

    let parsed: { subtopics: { name: string; recommendation: string; definitions: { term: string; definition: string }[]; prerequisites?: string[] }[] }
    try {
      parsed = extractJson(rawContent) as typeof parsed
    } catch (err) {
      logError("regenerate-subtopics", err, { userId, topicId: id })
      return NextResponse.json({ error: "Ошибка генерации", detail: rawContent.slice(0, 200) }, { status: 500 })
    }

    if (!parsed.subtopics?.length) {
      return NextResponse.json({ error: "Пустой результат" }, { status: 500 })
    }

    // De-dupe by name (case-insensitive) — createMany fails its whole batch on a
    // unique-constraint hit, and the model occasionally emits near-duplicates.
    const seen = new Set<string>()
    const deduped = parsed.subtopics.filter(s => {
      const key = s.name.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Map old statuses/nextReviewAt by lowercase name match
    const oldStatusMap = new Map(topic.subtopics.map(s => [s.name.toLowerCase(), s.status]))
    const oldReviewMap = new Map(topic.subtopics.map(s => [s.name.toLowerCase(), s.nextReviewAt]))

    // Delete + recreate must be atomic — if createMany throws after deleteMany
    // already committed, the topic is left with zero subtopics and no way back.
    await prisma.$transaction([
      prisma.topicSubtopic.deleteMany({ where: { topicId: id } }),
      prisma.topicSubtopic.createMany({
        data: deduped.map(s => ({
          topicId: id,
          name: s.name,
          status: oldStatusMap.get(s.name.toLowerCase()) ?? "needs_work",
          recommendation: s.recommendation,
          definitions: s.definitions ?? [],
          prerequisites: s.prerequisites ?? [],
          nextReviewAt: oldReviewMap.get(s.name.toLowerCase()) ?? null,
        })),
      }),
    ])

    return NextResponse.json({ ok: true, count: deduped.length })
  } catch (err) {
    return anthropicErrorResponse(err, "regenerate-subtopics", { userId })
  }
}
