// Prints per-user Anthropic call counts for a given day (defaults to today, UTC).
// Usage: npm run usage [-- YYYY-MM-DD]
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config()

async function main() {
  const { prisma } = await import("../lib/prisma")
  const { limitForPlan } = await import("../lib/ai-usage")

  const dateArg = process.argv[2]
  const date = dateArg ? new Date(dateArg) : new Date()
  date.setUTCHours(0, 0, 0, 0)

  const rows = await prisma.aiUsageDaily.findMany({
    where: { date },
    include: { user: { select: { email: true, plan: true } } },
    orderBy: { count: "desc" },
  })

  console.log(`AI usage for ${date.toISOString().slice(0, 10)}\n`)

  if (rows.length === 0) {
    console.log("No AI calls recorded for this day.")
  } else {
    for (const row of rows) {
      const limit = limitForPlan(row.user.plan)
      const flag = row.count > limit ? "  ← hit limit" : ""
      console.log(`${String(row.count).padStart(4)} / ${limit}  ${row.user.email} [${row.user.plan}]${flag}`)
    }
    console.log(`\nTotal: ${rows.reduce((sum, r) => sum + r.count, 0)} calls across ${rows.length} users`)
  }

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
