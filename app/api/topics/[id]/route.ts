import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrCreateUserId } from "@/lib/user-id"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getOrCreateUserId()
    const { id } = await params

    const topic = await prisma.topic.findFirst({
      where: { id, userId },
      include: {
        subtopics: true,
        sessions: { orderBy: { date: "desc" } },
      },
    })

    if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(topic)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getOrCreateUserId()
    const { id } = await params

    await prisma.topic.deleteMany({ where: { id, userId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
