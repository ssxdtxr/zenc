import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import type { Message, TutorResponse } from "@/entities/session/model/types"
import { extractJson } from "@/lib/extract-json"

const client = new Anthropic()

const SYSTEM_PROMPT = `Ты — адаптивный тьютор-эксперт. Твоя задача — помочь пользователю глубоко изучить любую тему через интерактивный диалог.

Правила работы:
1. ОЦЕНКА ЗНАНИЙ: Анализируй каждый ответ, чтобы определить реальный уровень понимания — не просто правильно/неправильно, а насколько глубоко человек понимает суть.
2. АДАПТАЦИЯ: Следующий вопрос всегда строится на основе того, что уже было сказано. Если пользователь ошибся — углубись в пробел. Если ответил хорошо — двигайся дальше или усложни.
3. ПЕРСОНАЛИЗАЦИЯ: Объяснения должны опираться на аналогии, примеры и язык, понятный именно этому пользователю, исходя из его ответов.
4. ПРОГРЕССИЯ: Начинай с базовых концепций, постепенно переходи к сложным взаимосвязям и нюансам.
5. ЧЕСТНОСТЬ: Если ответ неверный — скажи прямо, но конструктивно. Объясни почему и дай правильное понимание.
6. МЕТАКОГНИЦИЯ: Если в начале ответа пользователя стоит метка уверенности — учти её в оценке. Высокая уверенность + неверный ответ = явный сигнал иллюзии понимания, укажи на это прямо. Низкая уверенность + верный ответ = скажи что знания лучше чем кажется.

Тип вопроса:
- "choice" — для фактических, определительных или терминологических вопросов. Дай 3–4 варианта ответа, один из которых правильный. Варианты должны быть правдоподобными.
- "text" — для концептуальных, объяснительных или аналитических вопросов, где нужно развёрнуто ответить своими словами.
Чередуй типы, не используй "choice" два раза подряд при открытых темах.

ВАЖНО: задавай только теоретические вопросы — на понимание концепций, определений, принципов работы. НЕ просить писать код, НЕ просить реализовывать функции. Вопросы должны проверять теоретическое знание, а не навык программирования.

Формат ответа — СТРОГО JSON без markdown:
{
  "theory": null,
  "evaluation": "оценка последнего ответа (null для первого вопроса)",
  "explanation": "объяснение/обучающий момент (null для первого вопроса)",
  "isCorrect": true/false/null,
  "question": "теоретический вопрос",
  "questionType": "text" или "choice",
  "options": ["вариант А", "вариант Б", "вариант В", "вариант Г"] (только для questionType=choice, иначе null),
  "difficulty": "basic/intermediate/advanced",
  "knowledgeGaps": ["список выявленных пробелов в знаниях"]
}`

export async function POST(req: NextRequest) {
  try {
    const { topic, messages, questionNumber, focusSubtopics, previousSubtopics, overallLevel, confidence } = await req.json()
    const conversationMessages: Message[] = messages ?? []
    const hasFocus = Array.isArray(focusSubtopics) && focusSubtopics.length > 0
    const hasPrevious = Array.isArray(previousSubtopics) && previousSubtopics.length > 0

    const systemPrompt = hasFocus
      ? SYSTEM_PROMPT + `\n\nВАЖНО: это целенаправленная тренировка слабых мест. Все 10 вопросов должны быть посвящены ТОЛЬКО этим подтемам: ${focusSubtopics.join(", ")}. Не отклоняйся на другие аспекты темы. Начни с самой слабой подтемы и проработай каждую глубоко.`
      : SYSTEM_PROMPT

    let firstMessage: string
    if (hasFocus) {
      firstMessage = `Тема: "${topic}". Целенаправленная тренировка слабых мест: ${focusSubtopics.join(", ")}. Задай первый вопрос по одной из этих подтем.`
    } else if (hasPrevious) {
      const levelNote = overallLevel ? ` Текущий уровень пользователя: ${overallLevel}.` : ""
      const covered = previousSubtopics.map((s: { name: string; status: string }) => `${s.name} (${s.status})`).join(", ")
      firstMessage = `Тема: "${topic}".${levelNote} В предыдущих сессиях уже разбирались: ${covered}. Начни новую сессию — задай вопрос по подтеме, которая ещё не проработана или требует углубления. Не повторяй вопросы из предыдущих сессий.`
    } else {
      firstMessage = `Тема для изучения: "${topic}". Начни с первого диагностического вопроса, чтобы понять мой текущий уровень знаний по этой теме.`
    }

    const apiMessages =
      conversationMessages.length === 0
        ? [{ role: "user" as const, content: firstMessage }]
        : confidence
          ? conversationMessages.map((msg, idx) =>
              idx === conversationMessages.length - 1 && msg.role === "user"
                ? { ...msg, content: `[Уверенность перед ответом: ${confidence === 1 ? "низкая" : confidence === 2 ? "средняя" : "высокая"}]\n${msg.content}` }
                : msg
            )
          : conversationMessages

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    })

    const rawContent = response.content[0].type === "text" ? response.content[0].text : ""

    let parsed: Omit<TutorResponse, "questionNumber" | "assistantMessage">
    try {
      parsed = extractJson(rawContent) as typeof parsed
    } catch {
      parsed = { theory: null, evaluation: null, explanation: null, isCorrect: null, question: rawContent, questionType: "text", options: null, difficulty: "basic", knowledgeGaps: [] }
    }

    return NextResponse.json({ ...parsed, questionNumber: questionNumber ?? 1, assistantMessage: rawContent })
  } catch (err) {
    console.error("Tutor API error:", err)
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
