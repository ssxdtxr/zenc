import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import { extractJson } from "@/lib/extract-json"
import { getOrCreateUserId } from "@/lib/user-id"
import { enforceAiUsageLimit } from "@/lib/ai-usage"

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const userId = await getOrCreateUserId()
    const { topicName, subtopicName, exerciseTitle, exerciseDescription, exerciseDifficulty, userAnswer } = await req.json()

    if (!userAnswer?.trim()) {
      return NextResponse.json({ error: "Пустой ответ" }, { status: 400 })
    }

    const limitResponse = await enforceAiUsageLimit(userId)
    if (limitResponse) return limitResponse

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: `Ты — строгий, но справедливый ментор по любой предметной области. Оцени решение практического задания по теме — будь то код, задача, разбор текста или аргументация.

Формат ответа — СТРОГО JSON без markdown:
{
  "verdict": "correct" | "partial" | "incorrect",
  "score": число от 0 до 100,
  "feedback": "детальный разбор решения: что правильно, что не так, что упущено (2-4 предложения)",
  "betterApproach": "как это стоило сделать лучше — null если решение отличное"
}

Правила оценки:
- correct (80-100): решение полное, правильное, не хватает лишь мелочей
- partial (40-79): основная идея верная, но есть существенные пробелы или ошибки
- incorrect (0-39): решение неверное или не отвечает на задание
- feedback: конкретно, без воды — называй что именно сделано хорошо или плохо
- betterApproach: только если есть что улучшить, иначе null`,
      messages: [{
        role: "user",
        content: `Тема: "${topicName}", подтема: "${subtopicName}"
Задание (${exerciseDifficulty}): ${exerciseTitle}
Описание: ${exerciseDescription}

Решение пользователя:
${userAnswer}`,
      }],
    })

    const raw = response.content[0].type === "text" ? response.content[0].text : ""
    const parsed = extractJson(raw) as { verdict: string; score: number; feedback: string; betterApproach: string | null }
    return NextResponse.json(parsed)
  } catch (err) {
    console.error("Practice eval error:", err)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
