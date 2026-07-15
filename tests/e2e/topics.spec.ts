import { test, expect } from "@playwright/test"
import { register, uniqueEmail } from "./utils"

test.describe("topics", () => {
  test("create a topic and navigate to its page", async ({ page }) => {
    const email = uniqueEmail()
    await register(page, email)

    const topicName = `E2E Topic ${Date.now()}`
    await page.click('button:has-text("Тема")')
    await page.fill('input[placeholder*="TypeScript"]', topicName)
    await page.click('button:has-text("Добавить")')

    await page.waitForURL(/\/topic\/.+/)
    await expect(page.getByRole("heading", { name: topicName })).toBeVisible()
    await expect(page.getByText("Освоено 0 из 0 подтем")).toBeVisible()
  })

  test("created topic shows up on the dashboard", async ({ page }) => {
    const email = uniqueEmail()
    await register(page, email)

    const topicName = `E2E Dashboard Topic ${Date.now()}`
    await page.click('button:has-text("Тема")')
    await page.fill('input[placeholder*="TypeScript"]', topicName)
    await page.click('button:has-text("Добавить")')
    await page.waitForURL(/\/topic\/.+/)

    await page.goto("/")
    await expect(page.getByText(topicName)).toBeVisible()
  })

  test("deleting a topic removes it from the dashboard", async ({ page }) => {
    const email = uniqueEmail()
    await register(page, email)

    const topicName = `E2E Delete Topic ${Date.now()}`
    await page.click('button:has-text("Тема")')
    await page.fill('input[placeholder*="TypeScript"]', topicName)
    await page.click('button:has-text("Добавить")')
    await page.waitForURL(/\/topic\/.+/)

    await page.goto("/")
    const card = page.locator("article", { hasText: topicName })
    await expect(card).toBeVisible()
    await card.getByRole("button").first().click()
    await expect(page.getByText(topicName)).not.toBeVisible()
  })

  test("searching the dashboard filters topics by name", async ({ page }) => {
    const email = uniqueEmail()
    await register(page, email)

    const keep = `Keep ${Date.now()}`
    const drop = `Drop ${Date.now()}`
    for (const name of [keep, drop]) {
      await page.click('button:has-text("Тема")')
      await page.fill('input[placeholder*="TypeScript"]', name)
      await page.click('button:has-text("Добавить")')
      await page.waitForURL(/\/topic\/.+/)
      await page.goto("/")
    }

    await page.fill('input[placeholder="Поиск по темам…"]', "Keep")
    await expect(page.getByText(keep)).toBeVisible()
    await expect(page.getByText(drop)).not.toBeVisible()
  })
})
