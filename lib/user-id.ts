import { cookies } from "next/headers"
import { verifyToken } from "./jwt"

export async function getOrCreateUserId(): Promise<string> {
  const cookieStore = await cookies()
  const token = cookieStore.get("zerc_token")?.value
  if (!token) throw new Error("Не авторизован")

  const payload = await verifyToken(token)
  if (!payload) throw new Error("Невалидный токен")

  return payload.sub
}
