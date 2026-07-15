import type { Page } from "@playwright/test"

export const TEST_PASSWORD = "testpass123"

export function uniqueEmail() {
  return `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`
}

export async function register(page: Page, email: string) {
  await page.goto("/register")
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
