import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import type { Message } from "@/entities/session/model/types"
import type { OverallLevel, SessionRecord, Subtopic } from "@/entities/topic/model/types"

const client = new Anthropic()

const SYSTEM_PROMPT = `Ты — эксперт в оценке знаний. Проанализируй сессию обучения и дай детальную карту знаний пользователя.

Задачи:
1. Определи все подтемы, которые охватывает тема (даже если они не упоминались в сессии)
2. Оцени знание каждой подтемы на основе ответов: needs_work / learning / good / expert
3. Дай конкретные рекомендации что делать с каждой подтемой
4. Определи общий уровень: beginner / intermediate / advanced / expert
5. Выдели сильные стороны и что нужно изучить

Формат ответа — СТРОГО JSON без markdown:
{
  "overallLevel": "beginner/intermediate/advanced/expert",
  "summary": "резюме в 2-3 предложения о текущем уровне",
  "subtopics": [
    {
      "name": "название подтемы",
      "status": "needs_work/learning/good/expert",
      "recommendation": "конкретно что сделать (изучить X, попрактиковать Y)"
    }
  ],
  "strengths": ["в чём пользователь силён"],
  "toStudyMore": ["что нужно изучить базово"],
  "toStudyDeeper": ["что нужно углубить для экспертного уровня"]
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
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    })

    const rawContent = response.content[0].type === "text" ? response.content[0].text : ""

    let parsed: Omit<SessionRecord, "id" | "date" | "score" | "total">
    try {
      parsed = JSON.parse(rawContent.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim())
    } catch {
      parsed = {
        overallLevel: "beginner" as OverallLevel,
        summary: "Анализ завершён.",
        subtopics: [] as Subtopic[],
        strengths: [],
        toStudyMore: [],
        toStudyDeeper: [],
      }
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error("Analyze API error:", err)
    return NextResponse.json({ error: "Failed to analyze" }, { status: 500 })
  }
}
