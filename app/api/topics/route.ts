import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrCreateUserId } from "@/lib/user-id"
import { logError } from "@/lib/log"

export async function GET() {
  let userId: string | undefined
  try {
    userId = await getOrCreateUserId()

    const topics = await prisma.topic.findMany({
      where: { userId },
      include: { subtopics: true, sessions: { orderBy: { date: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(topics)
  } catch (err) {
    logError("topics/list", err, { userId })
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  let userId: string | undefined
  try {
    userId = await getOrCreateUserId()
    const { name } = await req.json()

    const topic = await prisma.topic.create({
      data: { userId, name },
      include: { subtopics: true, sessions: true },
    })

    return NextResponse.json(topic)
  } catch (err) {
    logError("topics/create", err, { userId })
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
