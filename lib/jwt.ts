import { SignJWT, jwtVerify } from "jose"

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET ?? "fallback-secret-change-me")

export type JwtPayload = {
  sub: string  // userId
  email: string
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setExpirationTime("30d")
    .sign(secret())
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    return { sub: payload.sub as string, email: payload.email as string }
  } catch {
    return null
  }
}
