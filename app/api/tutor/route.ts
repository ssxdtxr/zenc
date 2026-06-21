import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import type { Message, TutorResponse } from "@/entities/session/model/types"

const client = new Anthropic()

const SYSTEM_PROMPT = `Ты — адаптивный тьютор-эксперт. Твоя задача — помочь пользователю глубоко изучить любую тему через интерактивный диалог.

Правила работы:
1. ОЦЕНКА ЗНАНИЙ: Анализируй каждый ответ, чтобы определить реальный уровень понимания — не просто правильно/неправильно, а насколько глубоко человек понимает суть.
2. АДАПТАЦИЯ: Следующий вопрос всегда строится на основе того, что уже было сказано. Если пользователь ошибся — углубись в пробел. Если ответил хорошо — двигайся дальше или усложни.
3. ПЕРСОНАЛИЗАЦИЯ: Объяснения должны опираться на аналогии, примеры и язык, понятный именно этому пользователю, исходя из его ответов.
4. ПРОГРЕССИЯ: Начинай с базовых концепций, постепенно переходи к сложным взаимосвязям и нюансам.
5. ЧЕСТНОСТЬ: Если ответ неверный — скажи прямо, но конструктивно. Объясни почему и дай правильное понимание.

Тип вопроса:
- "choice" — для фактических, определительных или терминологических вопросов. Дай 3–4 варианта ответа, один из которых правильный. Варианты должны быть правдоподобными.
- "text" — для концептуальных, объяснительных или аналитических вопросов, где нужно развёрнуто ответить своими словами.
Чередуй типы, не используй "choice" два раза подряд при открытых темах.

Формат ответа — СТРОГО JSON без markdown:
{
  "evaluation": "оценка последнего ответа (null для первого вопроса)",
  "explanation": "объяснение/обучающий момент (null для первого вопроса)",
  "isCorrect": true/false/null,
  "question": "следующий вопрос для пользователя",
  "questionType": "text" или "choice",
  "options": ["вариант А", "вариант Б", "вариант В", "вариант Г"] (только для questionType=choice, иначе null),
  "difficulty": "basic/intermediate/advanced",
  "knowledgeGaps": ["список выявленных пробелов в знаниях"]
}`

export async function POST(req: NextRequest) {
  try {
    const { topic, messages, questionNumber } = await req.json()
    const conversationMessages: Message[] = messages ?? []

    const apiMessages =
      conversationMessages.length === 0
        ? [{ role: "user" as const, content: `Тема для изучения: "${topic}". Начни с первого диагностического вопроса, чтобы понять мой текущий уровень знаний по этой теме.` }]
        : conversationMessages

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: apiMessages,
    })

    const rawContent = response.content[0].type === "text" ? response.content[0].text : ""

    let parsed: Omit<TutorResponse, "questionNumber" | "assistantMessage">
    try {
      parsed = JSON.parse(rawContent.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim())
    } catch {
      parsed = { evaluation: null, explanation: null, isCorrect: null, question: rawContent, questionType: "text", options: null, difficulty: "basic", knowledgeGaps: [] }
    }

    return NextResponse.json({ ...parsed, questionNumber: questionNumber ?? 1, assistantMessage: rawContent })
  } catch (err) {
    console.error("Tutor API error:", err)
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 })
  }
}
