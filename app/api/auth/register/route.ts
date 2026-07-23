import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signToken } from "@/lib/jwt"
import { logError } from "@/lib/log"

export async function POST(req: NextRequest) {
  try {
    const { email, password, invite } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email и пароль обязательны" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Пароль должен быть не менее 6 символов" }, { status: 400 })
    }
    if (!invite || typeof invite !== "string") {
      return NextResponse.json({ error: "Регистрация только по инвайт-ссылке" }, { status: 403 })
    }

    const inviteToken = await prisma.inviteToken.findUnique({ where: { token: invite } })
    if (!inviteToken || inviteToken.usedAt) {
      return NextResponse.json({ error: "Неверная или уже использованная инвайт-ссылка" }, { status: 403 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.$transaction(async (tx) => {
      // Re-check under the transaction so two concurrent redemptions of the
      // same link can't both succeed.
      const claim = await tx.inviteToken.updateMany({
        where: { id: inviteToken.id, usedAt: null },
        data: { usedAt: new Date() },
      })
      if (claim.count === 0) throw new Error("INVITE_ALREADY_USED")

      const created = await tx.user.create({ data: { email, passwordHash } })
      await tx.inviteToken.update({ where: { id: inviteToken.id }, data: { usedByUserId: created.id } })
      return created
    }).catch((err) => {
      if (err instanceof Error && err.message === "INVITE_ALREADY_USED") return null
      throw err
    })

    if (!user) {
      return NextResponse.json({ error: "Неверная или уже использованная инвайт-ссылка" }, { status: 403 })
    }

    const token = await signToken({ sub: user.id, email: user.email })

    const res = NextResponse.json({ ok: true })
    res.cookies.set("zerc_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  } catch (err) {
    logError("auth/register", err)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
