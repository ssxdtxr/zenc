// One-line, grep-able error logs across all routes: `route=` and optional
// context fields (e.g. userId=) are always in the same place, so Vercel's
// log search can filter by them instead of parsing free-form messages.
export function logError(route: string, err: unknown, context?: Record<string, string | undefined>) {
  const message = err instanceof Error ? err.message : String(err)
  const ctxStr = context
    ? Object.entries(context)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${v}`)
        .join(" ")
    : ""

  console.error(`[error] route=${route}${ctxStr ? " " + ctxStr : ""} message=${message}`)
  if (err instanceof Error && err.stack) console.error(err.stack)
}
