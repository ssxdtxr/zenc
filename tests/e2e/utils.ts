import type { Page } from "@playwright/test"
import { randomBytes } from "crypto"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
dotenv.config()

export const TEST_PASSWORD = "testpass123"

export function uniqueEmail() {
  return `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`
}

// Registration requires a valid invite token — mint one directly in the DB,
// mirroring scripts/create-invite.ts, so tests don't need a real invite flow.
export async function createInviteToken(): Promise<string> {
  const { prisma } = await import("../../lib/prisma")
  const token = randomBytes(24).toString("base64url")
  await prisma.inviteToken.create({ data: { token, note: "e2e" } })
  return token
}

export async function register(page: Page, email: string) {
  const invite = await createInviteToken()
  await page.goto(`/register?invite=${invite}`)
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button:has-text("Зарегистрироваться")')
  await page.waitForURL("/")
}

export async function login(page: Page, email: string) {
  await page.goto("/login")
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button:has-text("Войти")')
  await page.waitForURL("/")
}
