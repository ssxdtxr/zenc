import { test, expect } from "@playwright/test"
import { register, login, uniqueEmail, createInviteToken, TEST_PASSWORD } from "./utils"

test.describe("auth", () => {
  test("register redirects to dashboard with empty state", async ({ page }) => {
    const email = uniqueEmail()
    await register(page, email)

    await expect(page).toHaveURL("/")
    await expect(page.getByText("Добавь первую тему и начни учиться")).toBeVisible()
  })

  test("registering the same email twice is rejected", async ({ page }) => {
    const email = uniqueEmail()
    await register(page, email)

    const invite = await createInviteToken()
    await page.goto(`/register?invite=${invite}`)
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("Зарегистрироваться")')

    await expect(page).toHaveURL(/\/register/)
    await expect(page.locator("text=/уже|занят|существ/i")).toBeVisible()
  })

  test("logout then login works", async ({ page }) => {
    const email = uniqueEmail()
    await register(page, email)

    await page.click('button:has-text("Выйти")')
    await expect(page).toHaveURL("/login")

    await login(page, email)
    await expect(page).toHaveURL("/")
  })

  test("wrong password is rejected", async ({ page }) => {
    const email = uniqueEmail()
    await register(page, email)
    await page.click('button:has-text("Выйти")')

    await page.goto("/login")
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', "wrongpassword")
    await page.click('button:has-text("Войти")')

    await expect(page).toHaveURL("/login")
    await expect(page.locator("text=/неверн|не найден/i")).toBeVisible()
  })

  test("unauthenticated visitor is redirected away from dashboard", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL("/login")
  })

  test("registration without an invite link is blocked", async ({ page }) => {
    await page.goto("/register")
    await expect(page.getByText("Регистрация закрыта")).toBeVisible()
    await expect(page.locator('input[type="email"]')).toHaveCount(0)
  })

  test("registering with a reused invite link is rejected", async ({ page }) => {
    const invite = await createInviteToken()

    await page.goto(`/register?invite=${invite}`)
    await page.fill('input[type="email"]', uniqueEmail())
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("Зарегистрироваться")')
    await page.waitForURL("/")
    await page.click('button:has-text("Выйти")')

    await page.goto(`/register?invite=${invite}`)
    await page.fill('input[type="email"]', uniqueEmail())
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("Зарегистрироваться")')

    await expect(page).toHaveURL(/\/register/)
    await expect(page.locator("text=/уже|использ/i")).toBeVisible()
  })
})
