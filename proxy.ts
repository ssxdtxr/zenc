import { NextRequest, NextResponse } from "next/server"

export function proxy(req: NextRequest) {
  const res = NextResponse.next()
  if (!req.cookies.get("zerc_uid")) {
    res.cookies.set("zerc_uid", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    })
  }
  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icons|sw\\.js|manifest\\.webmanifest).*)"],
}
