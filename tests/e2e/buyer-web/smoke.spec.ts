import { test, expect } from '@playwright/test'
import { takeScreenshot } from '../helpers/screenshot'

test.describe('Buyer Web - Smoke Test', () => {
  test('should load the homepage', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBeLessThan(400)
  })

  test('should have a page title', async ({ page }) => {
    await page.goto('/')
    const title = await page.title()
    expect(title).toBeTruthy()
  })

  test('should take a smoke screenshot', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await takeScreenshot(page, 'buyer-web-smoke')
  })
})
