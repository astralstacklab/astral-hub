import type { Page } from '@playwright/test'

export const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
} as const

export type ViewportName = keyof typeof VIEWPORTS

/**
 * Take screenshots at all predefined viewports.
 * Files are saved to `tests/e2e/screenshots/<prefix>-<viewport>.png`.
 */
export async function takeResponsiveScreenshots(page: Page, prefix: string): Promise<void> {
  for (const [name, size] of Object.entries(VIEWPORTS)) {
    await page.setViewportSize(size)
    await page.waitForTimeout(500) // allow layout reflow
    await page.screenshot({
      path: `tests/e2e/screenshots/${prefix}-${name}.png`,
      fullPage: true,
    })
  }
}

/**
 * Take a single screenshot at current viewport.
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `tests/e2e/screenshots/${name}.png`,
    fullPage: true,
  })
}
