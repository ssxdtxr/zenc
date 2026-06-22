import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"

const PUBLIC_PATHS = ["/login", "/register", "/api/auth/login", "/api/auth/register"]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  if (isPublic) return NextResponse.next()

  const token = req.cookies.get("zerc_token")?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icons|sw\\.js|manifest\\.webmanifest|favicon\\.ico).*)"],
}
