export function extractJson(raw: string): unknown {
  const trimmed = raw.trim()

  // Direct JSON
  try { return JSON.parse(trimmed) } catch {}

  // Strip any ``` code block (with or without language tag)
  const stripped = trimmed.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim()
  try { return JSON.parse(stripped) } catch {}

  // Find outermost { ... } in case there's text around it
  const start = trimmed.indexOf("{")
  const end = trimmed.lastIndexOf("}")
  if (start !== -1 && end > start) {
    try { return JSON.parse(trimmed.slice(start, end + 1)) } catch {}
  }

  throw new Error(`Failed to parse JSON from LLM response: ${trimmed.slice(0, 200)}`)
}
