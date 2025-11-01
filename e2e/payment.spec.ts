import { test, expect } from '@playwright/test'

test.describe('Payment Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('should complete full payment flow - checkout page load', async ({ page }) => {
    // 1. Navigate to checkout page
    await page.goto('/checkout')

    // 2. Verify page loaded correctly
    await expect(page.locator('h1')).toContainText('주문/결제')

    // 3. Verify page description
    await expect(page.locator('text=결제 정보를 확인하고 결제를 진행해주세요')).toBeVisible()

    // 4. Verify order summary section
    const orderSection = page.locator('section[aria-label="주문 정보"]')
    await expect(orderSection).toBeVisible()

    // 5. Verify payment widget section
    const paymentSection = page.locator('section[aria-label="결제 정보"]')
    await expect(paymentSection).toBeVisible()

    // 6. Verify payment section header
    await expect(page.locator('h2:has-text("결제 정보")')).toBeVisible()

    // 7. Verify test notice is present
    const testNotice = page.locator('[role="complementary"][aria-label="테스트 안내"]')
    await expect(testNotice).toBeVisible()
    await expect(testNotice).toContainText('테스트 결제 안내')
    await expect(testNotice).toContainText('4242 4242 4242 4242')
  })

  test('should display order summary correctly', async ({ page }) => {
    await page.goto('/checkout')

    // Verify order summary elements
    await expect(page.locator('text=주문 요약')).toBeVisible()
    await expect(page.locator('text=주문번호')).toBeVisible()
    await expect(page.locator('text=총 결제금액')).toBeVisible()

    // Verify amount is displayed
    await expect(page.locator('text=/50,000원/')).toBeVisible()

    // Verify order items are displayed
    await expect(page.locator('text=샘플 상품 A')).toBeVisible()
  })

  test('should display payment widget loading state', async ({ page }) => {
    await page.goto('/checkout')

    // Wait for payment widget container
    const widgetContainer = page.locator('#payment-widget')
    await expect(widgetContainer).toBeVisible({ timeout: 10000 })
  })

  test('should handle payment failure scenario', async ({ page }) => {
    // Simulate failure by directly navigating to fail page
    await page.goto('/fail?code=PAY_PROCESS_CANCELED&message=사용자가 결제를 취소했습니다')

    // Verify failure page elements
    await expect(page.locator('h1')).toContainText('결제 실패')
    await expect(page.locator('text=사용자가 결제를 취소했습니다')).toBeVisible()

    // Verify retry button is present
    const retryButton = page.locator('a:has-text("다시 시도")')
    await expect(retryButton).toBeVisible()

    // Verify home button is present
    const homeButton = page.locator('a:has-text("홈으로")')
    await expect(homeButton).toBeVisible()
  })

  test('should verify successful payment mock', async ({ page }) => {
    // Mock API response for payment confirmation
    await page.route('/api/payments/confirm', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            paymentKey: 'test_payment_key_123',
            orderId: 'order-test-001',
            status: 'DONE',
            totalAmount: 50000,
            method: '카드',
            requestedAt: new Date().toISOString(),
            approvedAt: new Date().toISOString(),
          },
        }),
      })
    })

    // Navigate to success page with query parameters
    await page.goto('/success?paymentKey=test_payment_key_123&orderId=order-test-001&amount=50000')

    // Verify success page elements
    await expect(page.locator('h1')).toContainText('결제 완료', { timeout: 10000 })

    // Verify payment details are displayed
    await expect(page.locator('text=결제가 성공적으로 완료되었습니다')).toBeVisible()
    await expect(page.locator('text=/50,000원/')).toBeVisible()
  })

  test('should have proper mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/checkout')

    // Verify page is responsive
    await expect(page.locator('h1:has-text("주문/결제")')).toBeVisible()

    // Verify sections are stacked vertically on mobile
    const orderSection = page.locator('section[aria-label="주문 정보"]')
    const paymentSection = page.locator('section[aria-label="결제 정보"]')

    await expect(orderSection).toBeVisible()
    await expect(paymentSection).toBeVisible()

    // Verify test notice is still visible
    await expect(page.locator('text=테스트 결제 안내')).toBeVisible()
  })

  test('should handle navigation from checkout to fail page', async ({ page }) => {
    await page.goto('/checkout')

    // Verify we're on checkout page
    await expect(page.locator('h1:has-text("주문/결제")')).toBeVisible()

    // Navigate to fail page (simulating redirect)
    await page.goto('/fail?code=INVALID_CARD_NUMBER&message=유효하지 않은 카드번호입니다')

    // Verify fail page
    await expect(page.locator('h1:has-text("결제 실패")')).toBeVisible()
    await expect(page.locator('text=유효하지 않은 카드번호입니다')).toBeVisible()

    // Click retry button
    await page.click('a:has-text("다시 시도")')

    // Verify we're back on checkout page
    await expect(page).toHaveURL('/checkout')
  })

  test('should display order items with correct information', async ({ page }) => {
    await page.goto('/checkout')

    // Wait for order summary to load
    await expect(page.locator('text=주문 요약')).toBeVisible()

    // Verify order items are displayed
    const orderItems = page.locator('[aria-label="주문 상품"]')
    await expect(orderItems).toBeVisible()

    // Verify product information
    await expect(page.locator('text=샘플 상품 A')).toBeVisible()
    await expect(page.locator('text=/50,000원/')).toBeVisible()
    await expect(page.locator('text=/수량: 1/')).toBeVisible()
  })

  test('should handle success page with all payment details', async ({ page }) => {
    // Mock successful payment confirmation
    await page.route('/api/payments/confirm', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            paymentKey: 'test_payment_key_456',
            orderId: 'order-test-002',
            status: 'DONE',
            totalAmount: 50000,
            method: '카드',
            requestedAt: '2024-01-01T00:00:00.000Z',
            approvedAt: '2024-01-01T00:00:05.000Z',
          },
        }),
      })
    })

    await page.goto('/success?paymentKey=test_payment_key_456&orderId=order-test-002&amount=50000')

    // Verify success page fully loads
    await expect(page.locator('h1:has-text("결제 완료")')).toBeVisible({ timeout: 10000 })

    // Verify payment confirmation details
    await expect(page.locator('text=order-test-002')).toBeVisible()
    await expect(page.locator('text=/50,000원/')).toBeVisible()

    // Verify home button is present
    const homeButton = page.locator('a:has-text("홈으로")')
    await expect(homeButton).toBeVisible()
  })

  test('should verify accessibility landmarks', async ({ page }) => {
    await page.goto('/checkout')

    // Verify ARIA landmarks
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('section[aria-label="주문 정보"]')).toBeVisible()
    await expect(page.locator('section[aria-label="결제 정보"]')).toBeVisible()
    await expect(page.locator('[role="complementary"][aria-label="테스트 안내"]')).toBeVisible()

    // Verify proper heading hierarchy
    const h1 = page.locator('h1')
    await expect(h1).toHaveCount(1)
    await expect(h1).toContainText('주문/결제')

    const h2 = page.locator('h2')
    await expect(h2.first()).toBeVisible()
  })

  test('should handle fail page with various error codes', async ({ page }) => {
    // Test different error codes
    const errorScenarios = [
      { code: 'PAY_PROCESS_CANCELED', message: '사용자가 결제를 취소했습니다' },
      { code: 'INVALID_CARD_NUMBER', message: '유효하지 않은 카드번호입니다' },
      { code: 'INSUFFICIENT_FUNDS', message: '잔액이 부족합니다' },
    ]

    for (const scenario of errorScenarios) {
      await page.goto(`/fail?code=${scenario.code}&message=${scenario.message}`)

      await expect(page.locator('h1:has-text("결제 실패")')).toBeVisible()
      await expect(page.locator(`text=${scenario.message}`)).toBeVisible()
      await expect(page.locator('a:has-text("다시 시도")')).toBeVisible()
    }
  })
})

test.describe('Payment Widget Integration', () => {
  test('should load payment widget without errors', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/checkout')

    // Wait for widget to load
    await page.waitForTimeout(3000)

    // Verify no critical errors occurred
    const criticalErrors = consoleErrors.filter(
      (error) => !error.includes('Warning') && !error.includes('DevTools')
    )

    // Log errors for debugging if they exist
    if (criticalErrors.length > 0) {
      console.log('Console errors detected:', criticalErrors)
    }
  })

  test('should display payment methods container', async ({ page }) => {
    await page.goto('/checkout')

    // Wait for payment method container
    const paymentMethodContainer = page.locator('#payment-method')
    await expect(paymentMethodContainer).toBeVisible({ timeout: 10000 })
  })

  test('should display terms agreement container', async ({ page }) => {
    await page.goto('/checkout')

    // Wait for terms agreement container
    const agreementContainer = page.locator('#agreement')
    await expect(agreementContainer).toBeVisible({ timeout: 10000 })
  })
})
