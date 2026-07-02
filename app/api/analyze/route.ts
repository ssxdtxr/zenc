import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import type { Message } from "@/entities/session/model/types"
import type { GlossaryTerm, OverallLevel, SessionRecord, Subtopic } from "@/entities/topic/model/types"
import { extractJson } from "@/lib/extract-json"

const client = new Anthropic()

const SYSTEM_PROMPT = `Ты — эксперт в оценке знаний. Проанализируй сессию обучения и дай детальную карту знаний пользователя.

Задачи:
1. Определи подтемы темы. Каждая подтема — отдельный механизм или паттерн, не аспект одного и того же. Правило: если два пункта отвечают на вопрос "что это / зачем / как использовать" про один объект — это ОДНА подтема. Не создавай отдельные подтемы для "концепция X", "паттерны X", "применение X" — это одна подтема "X". Генерируй 10–15 подтем, которые ПОЛНОСТЬЮ покрывают тему — так, чтобы человек, освоивший все подтемы, мог считать себя экспертом в этой теме.
2. Оцени знание каждой подтемы: needs_work / learning / good / expert
3. Дай краткую рекомендацию для каждой подтемы (1 предложение)
4. Для каждой подтемы укажи до 5 ключевых терминов. Включай только те, которые нужны для понимания этой подтемы и часто встречаются на практике. Не включай общеизвестные термины.
5. Определи общий уровень: beginner / intermediate / advanced / expert
6. Выдели сильные стороны и что нужно изучить

Формат ответа — СТРОГО JSON без markdown:
{
  "overallLevel": "beginner/intermediate/advanced/expert",
  "summary": "резюме в 2-3 предложения о текущем уровне",
  "subtopics": [
    {
      "name": "название подтемы",
      "status": "needs_work/learning/good/expert",
      "recommendation": "одно предложение — что конкретно сделать",
      "definitions": [
        { "term": "ключевой термин", "definition": "определение в одном предложении" }
      ]
    }
  ],
  "strengths": ["в чём пользователь силён"],
  "toStudyMore": ["что нужно изучить базово"],
  "toStudyDeeper": ["что нужно углубить для экспертного уровня"],
  "glossary": []
}`

export async function POST(req: NextRequest) {
  try {
    const { topic, messages, score, total, existingSubtopics } = await req.json()
    const conversationMessages: Message[] = messages ?? []
    const hasExisting = Array.isArray(existingSubtopics) && existingSubtopics.length > 0

    const subtopicsConstraint = hasExisting
      ? `\nСуществующие подтемы темы (ОЦЕНИВАЙ ТОЛЬКО ИХ, не создавай новые, не переименовывай):
${(existingSubtopics as string[]).map((s: string) => `- ${s}`).join("\n")}
Если в сессии не было вопросов по какой-то подтеме — оставь ей статус "needs_work" с рекомендацией изучить.`
      : ""

    const userMessage = `Тема: "${topic}". Пользователь ответил на ${total} вопросов, правильно: ${score}/${total}.${subtopicsConstraint}

Вот история сессии:
${conversationMessages.map((m) => `[${m.role === "user" ? "Пользователь" : "Система"}]: ${m.content}`).join("\n\n")}

Проанализируй знания пользователя${hasExisting ? " и оцени каждую из существующих подтем" : " и разбей тему на подтемы"}.`

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    })

    const rawContent = response.content[0].type === "text" ? response.content[0].text : ""

    if (response.stop_reason === "max_tokens") {
      console.error("Analyze truncated by max_tokens, raw length:", rawContent.length)
    }

    let parsed: Omit<SessionRecord, "id" | "date" | "score" | "total"> & { glossary: GlossaryTerm[] }
    try {
      parsed = extractJson(rawContent) as typeof parsed
    } catch {
      console.error("Analyze JSON parse failed, stop_reason:", response.stop_reason, "raw:", rawContent.slice(0, 500))
      parsed = {
        overallLevel: "beginner" as OverallLevel,
        summary: "Анализ завершён.",
        subtopics: [] as Subtopic[],
        strengths: [],
        toStudyMore: [],
        toStudyDeeper: [],
        glossary: [] as GlossaryTerm[],
      }
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error("Analyze API error:", err)
    if (err instanceof Anthropic.APIError) {
      if (err.status === 529) return NextResponse.json({ error: "Anthropic перегружен — попробуй через минуту" }, { status: 503 })
      if (err.status === 429) return NextResponse.json({ error: "Превышен лимит запросов — подожди немного" }, { status: 429 })
      const msg = err.message.toLowerCase()
      if (err.status === 402 || msg.includes("credit") || msg.includes("billing") || msg.includes("balance")) {
        return NextResponse.json({ error: "На аккаунте Anthropic закончились средства — пополни баланс" }, { status: 402 })
      }
    }
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
