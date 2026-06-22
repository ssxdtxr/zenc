import { cookies } from "next/headers"
import { prisma } from "./prisma"

export async function getOrCreateUserId(): Promise<string> {
  const cookieStore = await cookies()
  const uid = cookieStore.get("zerc_uid")?.value

  if (!uid) throw new Error("No user ID cookie")

  // Upsert user so FK constraints work
  await prisma.user.upsert({
    where: { id: uid },
    update: {},
    create: { id: uid },
  })

  return uid
}
