import { expect, test } from '@playwright/test'

test.describe('Buyer Web Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should have correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/卡牌商城/)
  })

  test('should render Hero section with glitch text', async ({ page }) => {
    const hero = page.getByTestId('hero-section')
    await expect(hero).toBeVisible()

    // Glitch title: COLLECT / TRADE / WIN
    const title = hero.locator('h1')
    await expect(title).toContainText('COLLECT')
    await expect(title).toContainText('TRADE')
    await expect(title).toContainText('WIN')

    // Subtitle
    await expect(hero).toContainText('The Future of Card Trading is Here')
  })

  test('should render CTA buttons', async ({ page }) => {
    const hero = page.getByTestId('hero-section')

    await expect(hero.getByText('START TRADING')).toBeVisible()
    await expect(hero.getByText('EXPLORE MARKETPLACE')).toBeVisible()
  })

  test('should render stats bar with 3 items', async ({ page }) => {
    const statsBar = page.getByTestId('stats-bar')
    await expect(statsBar).toBeVisible()
    await expect(statsBar.locator(':scope > div')).toHaveCount(3)

    await expect(statsBar).toContainText('10K+')
    await expect(statsBar).toContainText('2.5K+')
    await expect(statsBar).toContainText('NT$ 5M+')
  })

  test('should render Features section', async ({ page }) => {
    await expect(page.getByText('WHY CHOOSE US')).toBeVisible()

    const featureCards = page.locator('article')
    await expect(featureCards).toHaveCount(4)

    await expect(page.getByText('Real-Time Auctions')).toBeVisible()
    await expect(page.getByText('Secure Payments')).toBeVisible()
    await expect(page.getByText('Market Insights')).toBeVisible()
    await expect(page.getByText('OMO Experience')).toBeVisible()
  })

  test('should render Footer', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    await expect(footer).toContainText('Astral Hub')
    await expect(footer).toContainText('All rights reserved')
  })

  test('should have black background (DeFi Cyberpunk theme)', async ({ page }) => {
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })
    expect(bodyBg).toBe('rgb(0, 0, 0)')
  })
})
