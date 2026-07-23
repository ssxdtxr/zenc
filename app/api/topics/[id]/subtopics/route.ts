import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrCreateUserId } from "@/lib/user-id"
import { logError } from "@/lib/log"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string | undefined
  try {
    userId = await getOrCreateUserId()
    const { id: topicId } = await params
    const { name } = await req.json()

    const trimmed = typeof name === "string" ? name.trim() : ""
    if (!trimmed) return NextResponse.json({ error: "Название не может быть пустым" }, { status: 400 })

    const topic = await prisma.topic.findFirst({ where: { id: topicId, userId } })
    if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const existing = await prisma.topicSubtopic.findFirst({
      where: { topicId, name: { equals: trimmed, mode: "insensitive" } },
    })
    if (existing) return NextResponse.json({ error: "Такая подтема уже есть" }, { status: 409 })

    const subtopic = await prisma.topicSubtopic.create({
      data: {
        topicId,
        name: trimmed,
        status: "needs_work",
        recommendation: "",
        definitions: [],
      },
    })

    return NextResponse.json(subtopic)
  } catch (err) {
    logError("topics/subtopics/add", err, { userId })
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
