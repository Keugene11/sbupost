import { test, expect } from '@playwright/test'

test.describe('BottomNav', () => {
  test('login page does not show bottom nav', async ({ page }) => {
    await page.goto('/feed')
    await page.waitForURL('**/login**')
    const nav = page.locator('nav[style*="position: fixed"]')
    await expect(nav).toHaveCount(0)
  })

  test('page navigation works (login <-> signup)', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=SBUPost')).toBeVisible()

    // Navigate to signup
    const signupLink = page.locator('a[href="/signup"]')
    await expect(signupLink).toBeVisible()
    await signupLink.click()
    await page.waitForURL('**/signup**')
    await expect(page.locator('text=Join SBUPost')).toBeVisible()

    // Navigate back to login
    const loginLink = page.locator('a[href="/login"]')
    await expect(loginLink).toBeVisible()
    await loginLink.click()
    await page.waitForURL('**/login**')
    await expect(page.locator('text=SBUPost')).toBeVisible()
  })
})

test.describe('BottomNav component structure', () => {
  test('BottomNav source has correct stacking properties', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const content = fs.readFileSync(
      path.join(process.cwd(), 'src/components/BottomNav.tsx'),
      'utf-8'
    )

    // Verify the nav uses proper fixed positioning with max z-index
    expect(content).toContain("position: 'fixed'")
    expect(content).toContain('zIndex: 2147483647')
    expect(content).toContain("pointerEvents: 'auto'")
    expect(content).toContain("isolation: 'isolate'")
    expect(content).toContain("touchAction: 'manipulation'")

    // Verify it uses <nav> for semantics
    expect(content).toContain('<nav')
    expect(content).toContain('</nav>')

    // Verify links have adequate touch targets (py-2 not py-1)
    expect(content).toContain('py-2 press')
  })

  test('ReportModal has proper z-index to render above content', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const content = fs.readFileSync(
      path.join(process.cwd(), 'src/components/ReportModal.tsx'),
      'utf-8'
    )

    // ReportModal must have high z-index matching FollowListModal
    expect(content).toContain('zIndex: 2147483646')
    // Should use existing animations, not missing animate-scale-in
    expect(content).not.toContain('animate-scale-in')
  })
})
