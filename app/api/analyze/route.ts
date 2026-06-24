import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import type { Message } from "@/entities/session/model/types"
import type { GlossaryTerm, OverallLevel, SessionRecord, Subtopic } from "@/entities/topic/model/types"
import { extractJson } from "@/lib/extract-json"

const client = new Anthropic()

const SYSTEM_PROMPT = `Ты — эксперт в оценке знаний. Проанализируй сессию обучения и дай детальную карту знаний пользователя.

Задачи:
1. Определи 5-8 ШИРОКИХ концептуальных подтем, которые охватывает тема. Группируй близкие детали вместе — не дроби на микроподтемы. Например, все ловушки Proxy → одна подтема "Ловушки Proxy (traps)", все паттерны использования → одна подтема. Максимум 8 подтем.
2. Оцени знание каждой подтемы: needs_work / learning / good / expert
3. Дай краткую рекомендацию для каждой подтемы (1 предложение)
4. Для каждой подтемы укажи 1-2 ключевых термина с коротким определением (одно предложение)
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
    const { topic, messages, score, total } = await req.json()
    const conversationMessages: Message[] = messages ?? []

    const userMessage = `Тема: "${topic}". Пользователь ответил на ${total} вопросов, правильно: ${score}/${total}.

Вот история сессии:
${conversationMessages.map((m, i) => `[${m.role === "user" ? "Пользователь" : "Система"}]: ${m.content}`).join("\n\n")}

Проанализируй знания пользователя и разбей тему на подтемы.`

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 6000,
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
