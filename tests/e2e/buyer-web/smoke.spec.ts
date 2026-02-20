import { test, expect } from '@playwright/test'

test.describe('Buyer Web Smoke Test', () => {
  test('should render the homepage with neon theme', async ({ page }) => {
    // Navigate to the buyer web app
    await page.goto('/')

    // Check for the main title
    const title = page.locator('h1')
    await expect(title).toBeVisible()
    await expect(title).toHaveText('CARD ERP')

    // Verify that the Orbitron font or neon class is likely applied (checking computed style)
    const titleStyle = await title.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return {
        color: style.color,
        fontFamily: style.fontFamily,
        textTransform: style.textTransform,
      }
    })

    // Primary neon-cyan is #00F0FF (rgb(0, 240, 255))
    expect(titleStyle.color).toBe('rgb(0, 240, 255)')
    expect(titleStyle.fontFamily).toContain('Orbitron')
    expect(titleStyle.textTransform).toBe('uppercase')

    // Check for the neon button
    const neonButton = page.locator('button.neon-button')
    await expect(neonButton).toBeVisible()
    await expect(neonButton).toHaveText('開始探索')

    // Check for another neon magenta button or element
    const magentaButton = page.locator('button:has-text("查看競標")')
    await expect(magentaButton).toBeVisible()

    // Check background is black
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })
    expect(bodyBg).toBe('rgb(0, 0, 0)')
  })

  test('should show stats grid', async ({ page }) => {
    await page.goto('/')

    const stats = page.locator('.grid > div')
    await expect(stats).toHaveCount(3)

    await expect(stats.nth(0)).toContainText('Active Listings')
    await expect(stats.nth(1)).toContainText('Traders Online')
    await expect(stats.nth(2)).toContainText('Auctions Ending')
  })
})
