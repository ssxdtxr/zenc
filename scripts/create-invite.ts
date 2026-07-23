import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config()

import { randomBytes } from "crypto"

async function main() {
  const { prisma } = await import("../lib/prisma")
  try {
    const note = process.argv[2]
    const token = randomBytes(24).toString("base64url")

    await prisma.inviteToken.create({ data: { token, note } })

    const baseUrl = process.env.APP_BASE_URL ?? "https://zenc-topaz.vercel.app"
    console.log(`Invite created${note ? ` for "${note}"` : ""}:`)
    console.log(`${baseUrl}/register?invite=${token}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
