# Phase 4-1: 통합 및 E2E 테스트

## ⚠️ 작업 전 필수 확인

### 1. TechSpec 문서 읽기
**반드시 먼저 읽을 것**: `/docs/toss-integration/techspec.md`

- Testing Strategy (Section 5)
- Implementation Plan - Test Cases (Section 4)
- 테스트 커버리지 목표: 80%+

### 2. 최신 테스트 문서 확인 (context7 사용)

```
1. Testing Library Best Practices
   mcp__context7__get-library-docs
     → "testing-library"
     → topic: "integration testing, user-centric tests"

2. Playwright (E2E)
   mcp__context7__resolve-library-id → "playwright"
   mcp__context7__get-library-docs → topic: "e2e testing, nextjs"
```

---

## 에이전트

**담당**: `test-engineer-specialist`

---

## 목표

전체 결제 플로우를 검증하는 통합 테스트 및 E2E 테스트를 작성하고 실행합니다.

---

## 선행 작업

- Phase 1-3 모든 작업 완료
- 모든 컴포넌트 및 API 구현 완료

---

## 구체적 작업

### 1. Playwright 설치 (E2E 테스트용)

```bash
npm install --save-dev @playwright/test
npx playwright install
```

`playwright.config.ts` 생성:

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
})
```

### 2. 통합 테스트 작성

`__tests__/integration/payment-flow.test.tsx`:

```typescript
/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import CheckoutPage from '@/app/checkout/page'

// Mock fetch
global.fetch = jest.fn()

describe('Payment Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render checkout page with order summary and payment widget', async () => {
    render(<CheckoutPage />)

    // 주문 요약 표시 확인
    expect(screen.getByText(/주문\/결제/)).toBeInTheDocument()

    // 결제 위젯 로딩
    await waitFor(() => {
      expect(screen.queryByText(/결제 위젯을 불러오는 중/)).not.toBeInTheDocument()
    })
  })

  it('should display order total correctly', () => {
    render(<CheckoutPage />)

    // 총 결제금액 표시 확인
    expect(screen.getByText('총 결제금액')).toBeInTheDocument()
    expect(screen.getByText(/50,000원/)).toBeInTheDocument()
  })
})
```

### 3. E2E 테스트 작성

`e2e/payment.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Payment Flow E2E', () => {
  test('should complete full payment flow', async ({ page }) => {
    // 1. 주문 페이지 접속
    await page.goto('/checkout')

    // 2. 페이지 로드 확인
    await expect(page.locator('h1')).toContainText('주문/결제')

    // 3. 주문 요약 확인
    await expect(page.locator('text=총 결제금액')).toBeVisible()

    // 4. 결제 위젯 로드 대기
    await page.waitForSelector('#payment-method', { timeout: 10000 })

    // 5. 결제 버튼 확인
    const payButton = page.locator('button:has-text("결제하기")')
    await expect(payButton).toBeVisible()

    // 주의: 실제 결제는 테스트하지 않음 (Toss 테스트 환경 필요)
  })

  test('should handle payment failure', async ({ page }) => {
    // 실패 페이지 직접 접속 (시뮬레이션)
    await page.goto('/fail?code=PAY_PROCESS_CANCELED&message=사용자가 결제를 취소했습니다')

    // 실패 메시지 확인
    await expect(page.locator('h1')).toContainText('결제 실패')
    await expect(page.locator('text=사용자가 결제를 취소했습니다')).toBeVisible()

    // 다시 시도 버튼 확인
    await expect(page.locator('a:has-text("다시 시도")')).toBeVisible()
  })

  test('should verify successful payment', async ({ page }) => {
    // Success 페이지 Mock (실제 결제 없이 테스트)
    await page.route('/api/payments/confirm', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            paymentKey: 'test_key',
            orderId: 'order-test-001',
            status: 'DONE',
            totalAmount: 50000,
            method: '카드',
            approvedAt: new Date().toISOString(),
          },
        }),
      })
    })

    await page.goto('/success?paymentKey=test_key&orderId=order-test-001&amount=50000')

    // 성공 메시지 확인
    await expect(page.locator('h1')).toContainText('결제 완료')
    await expect(page.locator('text=50,000원')).toBeVisible()
  })
})
```

### 4. API 통합 테스트

`__tests__/integration/api.test.ts`:

```typescript
import axios from 'axios'

describe('API Integration Tests', () => {
  it('should confirm payment with valid data', async () => {
    // Mock axios
    jest.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        paymentKey: 'test_key',
        orderId: 'order-001',
        status: 'DONE',
        totalAmount: 10000,
      },
    })

    const response = await fetch('http://localhost:3000/api/payments/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentKey: 'test_key',
        orderId: 'order-001',
        amount: 10000,
      }),
    })

    expect(response.ok).toBe(true)
  })
})
```

### 5. 테스트 커버리지 확인

```bash
# 단위 + 통합 테스트 커버리지
npm run test:coverage

# E2E 테스트 실행
npx playwright test

# 커버리지 리포트 확인
open coverage/lcov-report/index.html
```

---

## 출력물

```
playwright.config.ts

__tests__/
└── integration/
    ├── payment-flow.test.tsx
    └── api.test.ts

e2e/
└── payment.spec.ts

coverage/
└── lcov-report/
    └── index.html
```

---

## 완료 조건

- [ ] techspec.md 및 context7 (Testing) 문서 확인
- [ ] Playwright 설치 및 설정
- [ ] 통합 테스트 작성 (2 tests)
- [ ] E2E 테스트 작성 (3 scenarios)
- [ ] API 통합 테스트 작성
- [ ] 모든 테스트 통과
- [ ] 테스트 커버리지 80% 이상

---

## Git 커밋

```bash
git add playwright.config.ts __tests__/integration/ e2e/
git commit -m "test: 통합 및 E2E 테스트 추가

- Playwright E2E 테스트 설정
- 결제 플로우 통합 테스트
- 성공/실패 시나리오 E2E 테스트
- API 통합 테스트
- 테스트 커버리지 80%+

Related to: Phase 4-1"
```

---

## 참고

- Playwright: https://playwright.dev/
- Testing Library: https://testing-library.com/
- Jest Coverage: https://jestjs.io/docs/code-coverage
