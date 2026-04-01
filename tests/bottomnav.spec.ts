import { test, expect } from '@playwright/test'

test.describe('BottomNav', () => {
  test('login page does not show bottom nav', async ({ page }) => {
    await page.goto('/feed')
    await page.waitForURL('**/login**')
    const nav = page.locator('nav')
    await expect(nav).toHaveCount(0)
  })

  test('page navigation works (login <-> signup)', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=SBUPost')).toBeVisible()

    const signupLink = page.locator('a[href="/signup"]')
    await expect(signupLink).toBeVisible()
    await signupLink.click()
    await page.waitForURL('**/signup**')
    await expect(page.locator('text=Join SBUPost')).toBeVisible()

    const loginLink = page.locator('a[href="/login"]')
    await expect(loginLink).toBeVisible()
    await loginLink.click()
    await page.waitForURL('**/login**')
    await expect(page.locator('text=SBUPost')).toBeVisible()
  })
})

test.describe('BottomNav component', () => {
  test('uses button + router.push instead of Link for reliable navigation', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const content = fs.readFileSync(
      path.join(process.cwd(), 'src/components/BottomNav.tsx'),
      'utf-8'
    )

    // Uses button elements with router.push for navigation
    // (Link can be blocked by overlays; buttons with router.push are more reliable)
    expect(content).toContain('useRouter')
    expect(content).toContain('router.push(href)')
    expect(content).toContain('<button')

    // Uses Tailwind classes for positioning (not inline styles)
    expect(content).toContain('fixed bottom-0')
    expect(content).toContain('z-[2147483647]')

    // Semantic nav element
    expect(content).toContain('<nav')
    expect(content).toContain('</nav>')
  })

  test('devIndicators disabled to prevent overlap with bottom nav', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const content = fs.readFileSync(
      path.join(process.cwd(), 'next.config.ts'),
      'utf-8'
    )

    expect(content).toMatch(/devIndicators\s*:\s*false/)
  })
})
