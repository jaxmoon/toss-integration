# Phase 3-3: PaymentWidget 및 결제 페이지 구현

## ⚠️ 작업 전 필수 확인

### 1. TechSpec 문서 읽기
**반드시 먼저 읽을 것**: `/docs/toss-integration/techspec.md`

- Component Design - PaymentWidget.tsx (Section 3)
- Functional Requirements - FR-4, FR-6, FR-7 (Section 2)
- Implementation Plan - 결제 위젯 통합 (Section 4)

### 2. Toss Payments Widget 최신 문서 확인 (context7 사용)

```
mcp__context7__get-library-docs
  → context7CompatibleLibraryID: "tosspayments"
  → topic: "widget rendering, payment methods, agreement, requestPayment"
```

**필수 확인 사항**:
- `widgets.renderPaymentMethods()` 사용법
- `widgets.renderAgreement()` 사용법
- `widgets.requestPayment()` 파라미터
- 결제 성공/실패 리다이렉트

---

## 에이전트

**담당**: `frontend-ui-specialist`

---

## 목표

Toss Payments 위젯을 렌더링하고 결제를 요청하는 컴포넌트 및 페이지를 구현합니다.

---

## 선행 작업

- Phase 3-1, 3-2 완료
- `lib/tossPayments.ts` 존재
- 모든 컴포넌트 (OrderSummary, LoadingSpinner, TermsAgreement) 존재

---

## 구체적 작업

### 1. PaymentWidget 컴포넌트 구현

`components/PaymentWidget.tsx`:

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'
import { createPaymentWidget } from '@/lib/tossPayments'
import { LoadingSpinner } from './LoadingSpinner'
import type { PaymentRequest } from '@/types/payment'

export interface PaymentWidgetProps {
  paymentData: PaymentRequest
  onPaymentRequest?: () => void
}

export function PaymentWidget({
  paymentData,
  onPaymentRequest,
}: PaymentWidgetProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const widgetRef = useRef<any>(null)
  const paymentMethodRef = useRef<HTMLDivElement>(null)
  const agreementRef = useRef<HTMLDivElement>(null)

  // 위젯 초기화 및 렌더링
  useEffect(() => {
    let isMounted = true

    async function initializeWidget() {
      try {
        const widgets = await createPaymentWidget()
        widgetRef.current = widgets

        // 금액 설정
        await widgets.setAmount({
          currency: 'KRW',
          value: paymentData.amount,
        })

        // 결제 수단 렌더링
        if (paymentMethodRef.current) {
          await widgets.renderPaymentMethods({
            selector: '#payment-method',
            variantKey: 'DEFAULT',
          })
        }

        // 약관 렌더링
        if (agreementRef.current) {
          await widgets.renderAgreement({
            selector: '#agreement',
            variantKey: 'AGREEMENT',
          })
        }

        if (isMounted) {
          setIsLoading(false)
        }
      } catch (err: any) {
        console.error('Widget initialization failed:', err)
        if (isMounted) {
          setError(err.message || '위젯 로드 실패')
          setIsLoading(false)
        }
      }
    }

    initializeWidget()

    return () => {
      isMounted = false
    }
  }, [paymentData.amount])

  // 결제 요청
  const handlePayment = async () => {
    if (!widgetRef.current) {
      setError('위젯이 초기화되지 않았습니다')
      return
    }

    try {
      onPaymentRequest?.()

      await widgetRef.current.requestPayment({
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        successUrl: paymentData.successUrl,
        failUrl: paymentData.failUrl,
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        customerMobilePhone: paymentData.customerMobilePhone,
      })
    } catch (err: any) {
      console.error('Payment request failed:', err)
      setError(err.message || '결제 요청 실패')
    }
  }

  if (isLoading) {
    return <LoadingSpinner message="결제 위젯을 불러오는 중..." />
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded"
        >
          새로고침
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 결제 수단 선택 */}
      <div id="payment-method" ref={paymentMethodRef} />

      {/* 약관 동의 */}
      <div id="agreement" ref={agreementRef} />

      {/* 결제 버튼 */}
      <button
        onClick={handlePayment}
        className="w-full py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
      >
        결제하기
      </button>
    </div>
  )
}
```

### 2. 주문/결제 페이지 구현

`app/checkout/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { OrderSummary } from '@/components/OrderSummary'
import { PaymentWidget } from '@/components/PaymentWidget'
import { DEFAULT_ORDER, TEST_CUSTOMER, APP_CONFIG } from '@/config/constants'

export default function CheckoutPage() {
  const [order] = useState(DEFAULT_ORDER)

  const paymentData = {
    orderId: order.orderId,
    orderName: order.orderName,
    amount: order.amount,
    customerName: TEST_CUSTOMER.name,
    customerEmail: TEST_CUSTOMER.email,
    customerMobilePhone: TEST_CUSTOMER.phone,
    successUrl: APP_CONFIG.successUrl,
    failUrl: APP_CONFIG.failUrl,
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          주문/결제
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 주문 요약 */}
          <div>
            <OrderSummary order={order} />
          </div>

          {/* 결제 위젯 */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">결제 정보</h2>
              <PaymentWidget paymentData={paymentData} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
```

### 3. 결제 성공 페이지

`app/success/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<any>(null)

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')
    const amount = searchParams.get('amount')

    if (!paymentKey || !orderId || !amount) {
      setError('결제 정보가 없습니다')
      setIsVerifying(false)
      return
    }

    // 결제 검증 API 호출
    async function verifyPayment() {
      try {
        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
          }),
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error?.message || '결제 검증 실패')
        }

        setPaymentInfo(data.data)
        setIsVerifying(false)
      } catch (err: any) {
        setError(err.message)
        setIsVerifying(false)
      }
    }

    verifyPayment()
  }, [searchParams])

  if (isVerifying) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="결제를 확인하는 중..." />
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            결제 검증 실패
          </h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            결제 완료
          </h1>
        </div>

        {paymentInfo && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">주문번호</span>
              <span className="font-medium">{paymentInfo.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">결제금액</span>
              <span className="font-medium">
                {paymentInfo.totalAmount.toLocaleString()}원
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">결제수단</span>
              <span className="font-medium">{paymentInfo.method}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
```

### 4. 결제 실패 페이지

`app/fail/page.tsx`:

```typescript
'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function FailPage() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('code')
  const errorMessage = searchParams.get('message')

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl">✕</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            결제 실패
          </h1>
        </div>

        <div className="space-y-2 text-sm mb-6">
          {errorCode && (
            <div>
              <span className="text-gray-600">에러 코드: </span>
              <span className="font-medium">{errorCode}</span>
            </div>
          )}
          {errorMessage && (
            <div>
              <span className="text-gray-600">사유: </span>
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}
        </div>

        <Link
          href="/checkout"
          className="block w-full py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700"
        >
          다시 시도
        </Link>
      </div>
    </main>
  )
}
```

---

## 출력물

```
components/
└── PaymentWidget.tsx

app/
├── checkout/
│   └── page.tsx
├── success/
│   └── page.tsx
└── fail/
    └── page.tsx
```

---

## 검증 방법

```bash
# 1. 개발 서버 실행
npm run dev

# 2. 브라우저에서 확인
# http://localhost:3000/checkout

# 3. 테스트 카드로 결제 진행
# 카드번호: 4242 4242 4242 4242
```

---

## 완료 조건

- [ ] techspec.md 및 context7 (Widget SDK) 문서 확인
- [ ] `components/PaymentWidget.tsx` 구현
- [ ] `app/checkout/page.tsx` 구현
- [ ] `app/success/page.tsx` 구현
- [ ] `app/fail/page.tsx` 구현
- [ ] 위젯 렌더링 성공
- [ ] 결제 요청 동작 확인
- [ ] 성공/실패 페이지 동작 확인

---

## Git 커밋

```bash
git add components/PaymentWidget.tsx app/checkout/ app/success/ app/fail/
git commit -m "feat(widget): PaymentWidget 및 결제 페이지 구현

- PaymentWidget 컴포넌트 (위젯 렌더링)
- 주문/결제 페이지 (/checkout)
- 결제 성공 페이지 (/success)
- 결제 실패 페이지 (/fail)
- 결제 검증 연동

Related to: Phase 3-3"
```

---

## 참고

- Toss Payments Widget: https://docs.tosspayments.com/reference/widget-sdk
- Next.js App Router: https://nextjs.org/docs/app
