import { expect, test } from '@playwright/test'

test.describe('Buyer Web Navigation', () => {
  test('should show header with logo and desktop nav', async ({ page }) => {
    await page.goto('/')

    const header = page.locator('header')
    await expect(header).toBeVisible()

    // Logo
    const logo = header.getByRole('link', { name: 'ASTRAL HUB' })
    await expect(logo).toBeVisible()

    // Desktop nav links
    await expect(header.getByRole('link', { name: '商城' })).toBeVisible()
    await expect(header.getByRole('link', { name: '競標' })).toBeVisible()
    await expect(header.getByRole('link', { name: '我的訂單' })).toBeVisible()

    // Cart icon
    await expect(header.getByLabel('Shopping cart')).toBeVisible()
  })

  test('should show hamburger menu on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    const header = page.locator('header')

    // Desktop nav should be hidden
    const desktopNav = header.locator('nav[aria-label="Primary"]')
    await expect(desktopNav).toBeHidden()

    // Hamburger button should be visible
    const menuButton = header.getByRole('button', { name: 'Toggle menu' })
    await expect(menuButton).toBeVisible()
  })

  test('should open and close mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Open menu
    const menuButton = page.locator('header').getByRole('button', { name: 'Toggle menu' })
    await expect(menuButton).toBeVisible()
    await menuButton.click()

    // Close button only exists in the teleported overlay
    const closeButton = page.getByRole('button', { name: 'Close menu' })
    await expect(closeButton).toBeVisible({ timeout: 10000 })

    // Scope assertions to teleported mobile overlay only.
    const overlay = page.locator('div.fixed.inset-0').filter({ has: closeButton })
    await expect(overlay).toBeVisible()
    await expect(overlay.getByRole('link', { name: '商城' })).toBeVisible()
    await expect(overlay.getByRole('link', { name: '競標' })).toBeVisible()
    await expect(overlay.getByRole('link', { name: '我的訂單' })).toBeVisible()

    // Close menu
    await closeButton.click()
    await expect(closeButton).toBeHidden()
  })

  test('should have responsive layout across viewports', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await expect(page.locator('header nav[aria-label="Primary"]')).toBeVisible()
    await expect(page.locator('header').getByRole('button', { name: 'Toggle menu' })).toBeHidden()

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(300)
    await expect(page.locator('header nav[aria-label="Primary"]')).toBeVisible()

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(300)
    await expect(page.locator('header nav[aria-label="Primary"]')).toBeHidden()
    await expect(page.locator('header').getByRole('button', { name: 'Toggle menu' })).toBeVisible()
  })
})
