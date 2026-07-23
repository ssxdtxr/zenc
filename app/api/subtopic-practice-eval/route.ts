import { NextRequest, NextResponse } from "next/server"
import { askClaudeJson, anthropicErrorResponse } from "@/lib/anthropic"
import { getOrCreateUserId } from "@/lib/user-id"
import { enforceAiUsageLimit } from "@/lib/ai-usage"

export async function POST(req: NextRequest) {
  let userId: string | undefined
  try {
    userId = await getOrCreateUserId()
    const { topicName, subtopicName, exerciseTitle, exerciseDescription, exerciseDifficulty, userAnswer } = await req.json()

    if (!userAnswer?.trim()) {
      return NextResponse.json({ error: "Пустой ответ" }, { status: 400 })
    }

    const limitResponse = await enforceAiUsageLimit(userId)
    if (limitResponse) return limitResponse

    const parsed = await askClaudeJson<{ verdict: string; score: number; feedback: string; betterApproach: string | null }>({
      maxTokens: 1000,
      label: "subtopic-practice-eval",
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

    return NextResponse.json(parsed)
  } catch (err) {
    return anthropicErrorResponse(err, "subtopic-practice-eval", { userId })
  }
}
