import { expect, test } from '@playwright/test'

test.describe('Buyer Web Smoke Test', () => {
  test('should render hero and header structure', async ({ page }) => {
    await page.goto('/')

    const hero = page.getByTestId('hero-section')
    await expect(hero).toBeVisible()

    const header = page.locator('header')
    await expect(header).toBeVisible()
    await expect(header.getByRole('link', { name: 'CARD ERP' })).toBeVisible()

    const title = hero.locator('h1')
    await expect(title).toContainText('COLLECT')
    await expect(title).toContainText('TRADE')
    await expect(title).toContainText('WIN')

    const statsBar = page.getByTestId('stats-bar')
    await expect(statsBar).toBeVisible()
    await expect(statsBar.locator(':scope > div')).toHaveCount(3)
  })

  test('should show mobile hamburger and hide desktop nav', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    const header = page.locator('header')
    const desktopNav = header.locator('nav[aria-label="Primary"]')
    await expect(desktopNav).toBeHidden()

    const menuButton = header.getByRole('button', { name: 'Toggle menu' })
    await expect(menuButton).toBeVisible()

    await menuButton.click()
    await expect(page.getByRole('link', { name: '商城' })).toBeVisible()
  })
})
