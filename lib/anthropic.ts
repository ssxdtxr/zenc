import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { extractJson } from "@/lib/extract-json"
import { logError } from "@/lib/log"

export const anthropic = new Anthropic()

const DEFAULT_MODEL = "claude-sonnet-4-6"

type ClaudeMessage = { role: "user" | "assistant"; content: string }

export async function askClaudeText(params: {
  system?: string
  messages: ClaudeMessage[]
  maxTokens: number
  model?: string
  label?: string
}): Promise<string> {
  const response = await anthropic.messages.create({
    model: params.model ?? DEFAULT_MODEL,
    max_tokens: params.maxTokens,
    ...(params.system ? { system: params.system } : {}),
    messages: params.messages,
  })

  const raw = response.content[0]?.type === "text" ? response.content[0].text : ""

  if (response.stop_reason === "max_tokens") {
    console.warn(`[warn] claude response truncated at max_tokens label=${params.label ?? "claude"}`)
  }

  return raw
}

export async function askClaudeJson<T>(params: {
  system?: string
  messages: ClaudeMessage[]
  maxTokens: number
  model?: string
  label?: string
}): Promise<T> {
  const raw = await askClaudeText(params)
  return extractJson(raw) as T
}

// Maps Anthropic API errors to the right HTTP status + a Russian user-facing
// message. Use in a route's catch block: `catch (err) { return anthropicErrorResponse(err, "tutor", { userId }) }`
export function anthropicErrorResponse(err: unknown, route: string, context?: Record<string, string | undefined>): NextResponse {
  logError(route, err, context)

  if (err instanceof Anthropic.APIError) {
    if (err.status === 529) {
      return NextResponse.json({ error: "Anthropic перегружен — попробуй через минуту" }, { status: 503 })
    }
    if (err.status === 429) {
      return NextResponse.json({ error: "Превышен лимит запросов — подожди немного" }, { status: 429 })
    }
    const msg = err.message.toLowerCase()
    if (err.status === 402 || msg.includes("credit") || msg.includes("billing") || msg.includes("balance")) {
      return NextResponse.json({ error: "На аккаунте Anthropic закончились средства — пополни баланс" }, { status: 402 })
    }
  }

  return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
}
