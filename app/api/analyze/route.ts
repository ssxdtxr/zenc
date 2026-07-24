import { NextRequest, NextResponse } from "next/server"
import type { Message } from "@/entities/session/model/types"
import type { OverallLevel, SessionRecord, Subtopic } from "@/entities/topic/model/types"
import { extractJson } from "@/lib/extract-json"
import { askClaudeText, anthropicErrorResponse } from "@/lib/anthropic"
import { getOrCreateUserId } from "@/lib/user-id"
import { enforceAiUsageLimit } from "@/lib/ai-usage"
import { logError } from "@/lib/log"

const SYSTEM_PROMPT = `Ты — эксперт в оценке знаний. Проанализируй сессию обучения и дай детальную карту знаний пользователя.

Задачи:
1. Определи подтемы темы. Каждая подтема — отдельный механизм или паттерн, не аспект одного и того же. Правило: если два пункта отвечают на вопрос "что это / зачем / как использовать" про один объект — это ОДНА подтема. Не создавай отдельные подтемы для "концепция X", "паттерны X", "применение X" — это одна подтема "X". Генерируй 10–15 подтем, которые ПОЛНОСТЬЮ покрывают тему — так, чтобы человек, освоивший все подтемы, мог считать себя экспертом в этой теме.
2. Оцени знание каждой подтемы: needs_work / learning / good / expert
3. Дай краткую рекомендацию для каждой подтемы (1 предложение)
4. Для каждой подтемы укажи максимум 3 основных термина — только самое ядро, без которого понять подтему невозможно. Не включай второстепенные или общеизвестные термины.
5. Для каждой подтемы определи пререквизиты — какие ДРУГИЕ подтемы из этого же списка нужно понимать до неё. Не все подтемы линейно зависимы: у базовых подтем пререквизитов нет (пустой список), у независимых друг от друга подтем одного уровня сложности — тоже. Указывай только прямые, реально необходимые зависимости (не транзитивные — если A требует B, а B требует C, не пиши что A требует C).
6. Определи общий уровень: beginner / intermediate / advanced / expert
7. Выдели сильные стороны и что нужно изучить
8. Если в диалоге всплыл значимый аспект темы, который не покрыт существующим списком подтем — предложи его в suggestedNewSubtopics (не добавляй сам, только предложи). Если существующего списка нет (это первый разбор темы) — оставь suggestedNewSubtopics пустым, все найденное уже должно войти в основной список subtopics.

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
      ],
      "prerequisites": ["название другой подтемы из этого же списка, которую нужно понимать раньше"]
    }
  ],
  "strengths": ["в чём пользователь силён"],
  "toStudyMore": ["что нужно изучить базово"],
  "toStudyDeeper": ["что нужно углубить для экспертного уровня"],
  "suggestedNewSubtopics": [
    { "name": "название новой подтемы", "reason": "почему она всплыла в диалоге и заслуживает отдельного места в карте знаний" }
  ]
}`

export async function POST(req: NextRequest) {
  let userId: string | undefined
  try {
    userId = await getOrCreateUserId()
    const limitResponse = await enforceAiUsageLimit(userId)
    if (limitResponse) return limitResponse

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

    const rawContent = await askClaudeText({
      maxTokens: 8000,
      label: "analyze",
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    })

    let parsed: Omit<SessionRecord, "id" | "date" | "score" | "total">
    try {
      parsed = extractJson(rawContent) as typeof parsed
    } catch (err) {
      logError("analyze", err, { userId })
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
    return anthropicErrorResponse(err, "analyze", { userId })
  }
}
