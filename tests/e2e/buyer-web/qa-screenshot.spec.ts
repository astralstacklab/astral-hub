import { test } from '@playwright/test'
import { takeResponsiveScreenshots } from '../helpers/screenshot'

test('Final QA - take responsive screenshots', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await takeResponsiveScreenshots(page, 'buyer-web-mission-a')
})
