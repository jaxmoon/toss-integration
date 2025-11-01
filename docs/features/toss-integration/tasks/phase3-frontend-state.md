# Phase 3-2: Toss SDK 초기화 및 상태 관리

## ⚠️ 작업 전 필수 확인

### 1. TechSpec 문서 읽기
**반드시 먼저 읽을 것**: `/docs/toss-integration/techspec.md`

- Component Design - lib/tossPayments.ts (Section 3)
- Toss Payments SDK 통합 (Section 4)
- 환경 변수 - NEXT_PUBLIC_TOSS_CLIENT_KEY (Section 10)

### 2. Toss Payments SDK 최신 문서 확인 (context7 사용)

```
mcp__context7__resolve-library-id → "tosspayments"
mcp__context7__get-library-docs
  → topic: "widget sdk initialization, loadTossPayments, client key"
```

**필수 확인 사항**:
- `loadTossPayments()` 함수 사용법
- 클라이언트 키 설정
- SDK 로딩 에러 처리
- customerKey 파라미터

---

## 에이전트

**담당**: `frontend-state-specialist`

---

## 목표

Toss Payments SDK를 초기화하고, 결제 요청 상태를 관리하는 로직을 구현합니다.

---

## 선행 작업

- Phase 1 완료
- @tosspayments/tosspayments-sdk 설치 완료
- 환경 변수 설정 완료

---

## 구체적 작업

### 1. 🔴 RED: 실패하는 SDK 테스트 작성

`__tests__/lib/tossPayments.test.ts`:

```typescript
/**
 * @jest-environment jsdom
 */
import { loadTossPaymentsWidget } from '@/lib/tossPayments'

describe('loadTossPaymentsWidget', () => {
  it('should load Toss Payments SDK', async () => {
    const widget = await loadTossPaymentsWidget()
    expect(widget).toBeDefined()
  })

  it('should use client key from environment', async () => {
    expect(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY).toBeDefined()
  })

  it('should throw error if client key is missing', async () => {
    const originalKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
    delete process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY

    await expect(loadTossPaymentsWidget()).rejects.toThrow()

    process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY = originalKey
  })
})
```

**테스트 실행 (❌ 실패 확인):**
```bash
npm test -- lib/tossPayments
# 예상: FAIL
```

---

### 2. 🟢 GREEN: SDK 초기화 로직 구현

`lib/tossPayments.ts`:

```typescript
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import { TOSS_PAYMENTS_CONFIG } from '@/config/constants'

/**
 * Toss Payments 위젯 SDK 로드
 * @returns TossPayments 인스턴스
 */
export async function loadTossPaymentsWidget() {
  const clientKey = TOSS_PAYMENTS_CONFIG.clientKey

  if (!clientKey) {
    throw new Error(
      'Toss Payments client key가 설정되지 않았습니다. NEXT_PUBLIC_TOSS_CLIENT_KEY 환경 변수를 확인하세요.'
    )
  }

  try {
    const tossPayments = await loadTossPayments(clientKey)
    return tossPayments
  } catch (error) {
    console.error('Failed to load Toss Payments SDK:', error)
    throw new Error('Toss Payments SDK를 로드하지 못했습니다.')
  }
}

/**
 * Toss Payments 위젯 인스턴스 생성
 * @param customerKey 고객 고유 키 (선택, 기본값: ANONYMOUS)
 * @returns 위젯 인스턴스
 */
export async function createPaymentWidget(
  customerKey: string = TOSS_PAYMENTS_CONFIG.customerKey
) {
  const tossPayments = await loadTossPaymentsWidget()

  const widgets = tossPayments.widgets({
    customerKey,
  })

  return widgets
}
```

**테스트 실행 (✅ 통과 확인):**
```bash
npm test -- lib/tossPayments
# 예상: PASS - 3 tests passed
```

---

### 3. 🟢 GREEN: 결제 요청 Hook 구현 (선택적)

`hooks/usePayment.ts`:

```typescript
'use client'

import { useState, useCallback } from 'react'
import { createPaymentWidget } from '@/lib/tossPayments'
import type { PaymentRequest } from '@/types/payment'

interface PaymentState {
  isLoading: boolean
  error: string | null
  isSuccess: boolean
}

export function usePayment() {
  const [state, setState] = useState<PaymentState>({
    isLoading: false,
    error: null,
    isSuccess: false,
  })

  const requestPayment = useCallback(
    async (paymentData: PaymentRequest) => {
      setState({ isLoading: true, error: null, isSuccess: false })

      try {
        const widgets = await createPaymentWidget()

        // 금액 설정
        await widgets.setAmount({
          currency: 'KRW',
          value: paymentData.amount,
        })

        // 결제 요청
        await widgets.requestPayment({
          orderId: paymentData.orderId,
          orderName: paymentData.orderName,
          successUrl: paymentData.successUrl,
          failUrl: paymentData.failUrl,
          customerName: paymentData.customerName,
          customerEmail: paymentData.customerEmail,
          customerMobilePhone: paymentData.customerMobilePhone,
        })

        setState({ isLoading: false, error: null, isSuccess: true })
      } catch (error: any) {
        console.error('Payment request failed:', error)
        setState({
          isLoading: false,
          error: error.message || '결제 요청에 실패했습니다',
          isSuccess: false,
        })
      }
    },
    []
  )

  return {
    ...state,
    requestPayment,
  }
}
```

---

### 4. 🔵 REFACTOR: 코드 개선

테스트 통과 후 개선:
- 에러 메시지 개선
- SDK 로딩 재시도 로직 추가 (선택적)
- 타입 안전성 강화

**테스트 재실행:**
```bash
npm test -- lib/tossPayments
# 여전히 PASS
```

---

## 출력물

```
lib/
└── tossPayments.ts

hooks/
└── usePayment.ts (선택적)

__tests__/
└── lib/
    └── tossPayments.test.ts
```

---

## 완료 조건

- [ ] techspec.md 및 context7 (Toss SDK) 문서 확인
- [ ] 🔴 RED: SDK 테스트 작성 → 실행 → ❌ 실패 확인
- [ ] 🟢 GREEN: `lib/tossPayments.ts` 및 `hooks/usePayment.ts` 구현
- [ ] 🟢 GREEN: 테스트 실행 → ✅ 통과 (3 tests)
- [ ] 🔵 REFACTOR: 에러 처리 개선 → 테스트 → ✅ 통과
- [ ] `loadTossPaymentsWidget()`, `createPaymentWidget()` 함수 구현
- [ ] 클라이언트 키 환경 변수 사용

---

## Git 커밋

```bash
git add lib/tossPayments.ts hooks/usePayment.ts __tests__/lib/tossPayments.test.ts
git commit -m "feat(sdk): Toss Payments SDK 초기화 및 상태 관리

- loadTossPaymentsWidget() 함수
- createPaymentWidget() 함수
- usePayment() hook (상태 관리)
- 에러 처리 및 검증
- 단위 테스트

Related to: Phase 3-2"
```

---

## 참고

- Toss Payments Widget SDK: https://docs.tosspayments.com/reference/widget-sdk
- React Hooks: https://react.dev/reference/react/hooks
