# Phase 3-1: 결제 검증 API 구현

## ⚠️ 작업 전 필수 확인

### 1. TechSpec 문서 읽기
**반드시 먼저 읽을 것**: `/docs/toss-integration/techspec.md`

- API Design (Section 3)
- Implementation Plan - API 구현 (Section 4)
- 환경 변수 - TOSS_SECRET_KEY (Section 10)

### 2. Toss Payments API 최신 문서 확인 (context7 사용)

```
mcp__context7__resolve-library-id → "tosspayments"
mcp__context7__get-library-docs
  → topic: "payment confirmation api, server integration, authentication"
```

**필수 확인 사항**:
- Payment Confirmation API 엔드포인트
- 인증 방법 (Basic Auth with Secret Key)
- 요청/응답 스키마
- 에러 응답 처리

---

## 에이전트

**담당**: `backend-api-specialist`

---

## 목표

결제 완료 후 서버에서 Toss Payments API를 호출하여 결제를 검증하는 API 엔드포인트를 구현합니다.

---

## 선행 작업

- Phase 1-2 완료 (타입 정의, 환경 변수)
- `types/payment.ts` 존재
- `config/constants.ts` 존재
- axios 패키지 설치 완료

---

## 구체적 작업

### 1. API 라우트 테스트 작성 (RED)

`__tests__/api/payments/confirm.test.ts`:

```typescript
import { POST } from '@/app/api/payments/confirm/route'
import { mockPaymentConfirmRequest } from '@/__tests__/mocks/payment-data'

// axios mock
jest.mock('axios')
const axios = require('axios')

describe('POST /api/payments/confirm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should confirm payment successfully', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        paymentKey: 'test_key',
        orderId: 'order-001',
        status: 'DONE',
        totalAmount: 10000,
      },
    })

    const request = new Request('http://localhost:3000/api/payments/confirm', {
      method: 'POST',
      body: JSON.stringify(mockPaymentConfirmRequest),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('DONE')
  })

  it('should return 400 for missing parameters', async () => {
    const request = new Request('http://localhost:3000/api/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should handle API errors', async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          code: 'INVALID_PAYMENT_KEY',
          message: '잘못된 결제 키입니다',
        },
      },
    })

    const request = new Request('http://localhost:3000/api/payments/confirm', {
      method: 'POST',
      body: JSON.stringify(mockPaymentConfirmRequest),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })
})
```

### 2. Mock 데이터 추가

`__tests__/mocks/payment-data.ts`에 추가:

```typescript
export const mockPaymentConfirmRequest = {
  paymentKey: 'test_payment_key_123',
  orderId: 'order-test-001',
  amount: 10000,
}
```

### 3. API 라우트 구현 (GREEN)

`app/api/payments/confirm/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { TOSS_PAYMENTS_CONFIG } from '@/config/constants'
import type {
  PaymentConfirmRequest,
  PaymentConfirmation,
  ApiResponse,
} from '@/types/payment'

/**
 * 결제 검증 API
 * POST /api/payments/confirm
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 요청 바디 파싱
    const body: PaymentConfirmRequest = await request.json()
    const { paymentKey, orderId, amount } = body

    // 2. 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'paymentKey, orderId, amount는 필수입니다',
          },
        },
        { status: 400 }
      )
    }

    // 3. Toss Payments API 호출
    const secretKey = TOSS_PAYMENTS_CONFIG.secretKey
    const url = `${TOSS_PAYMENTS_CONFIG.apiUrl}/payments/confirm`

    const response = await axios.post<PaymentConfirmation>(
      url,
      {
        paymentKey,
        orderId,
        amount,
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString(
            'base64'
          )}`,
          'Content-Type': 'application/json',
        },
      }
    )

    // 4. 성공 응답
    return NextResponse.json<ApiResponse<PaymentConfirmation>>({
      success: true,
      data: response.data,
    })
  } catch (error: any) {
    console.error('Payment confirmation error:', error)

    // 5. Toss API 에러 처리
    if (error.response?.data) {
      const tossError = error.response.data
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: tossError.code || 'TOSS_API_ERROR',
            message: tossError.message || '결제 검증에 실패했습니다',
          },
        },
        { status: error.response.status || 400 }
      )
    }

    // 6. 기타 에러 처리
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '서버 오류가 발생했습니다',
        },
      },
      { status: 500 }
    )
  }
}
```

### 4. 테스트 실행

```bash
npm test -- api/payments/confirm
```

### 5. 수동 테스트 (curl)

```bash
curl -X POST http://localhost:3000/api/payments/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "paymentKey": "test_key",
    "orderId": "order-001",
    "amount": 10000
  }'
```

---

## 출력물

```
app/
└── api/
    └── payments/
        └── confirm/
            └── route.ts

__tests__/
├── api/
│   └── payments/
│       └── confirm.test.ts
└── mocks/
    └── payment-data.ts (업데이트)
```

---

## 보안 고려사항

1. **시크릿 키 보호**
   - 절대 클라이언트에 노출하지 않음
   - 서버 환경 변수에만 존재 (`TOSS_SECRET_KEY`)

2. **금액 검증**
   - 클라이언트에서 전달된 금액과 서버 DB의 금액 비교 필요
   - 현재는 샘플이므로 검증 생략, 프로덕션에서는 필수

3. **HTTPS 사용**
   - 프로덕션 환경에서는 반드시 HTTPS 사용

4. **에러 메시지**
   - 프로덕션에서는 상세한 에러 정보 노출 최소화

---

## 완료 조건

- [ ] techspec.md 및 context7 (Toss API) 문서 확인
- [ ] API 라우트 테스트 작성 (3 tests)
- [ ] `app/api/payments/confirm/route.ts` 구현
- [ ] 모든 테스트 통과
- [ ] 에러 처리 구현 (400, 500)
- [ ] Basic Auth 인증 구현
- [ ] TypeScript 타입 안전성 확보

---

## Git 커밋

```bash
git add app/api/payments/confirm/route.ts __tests__/api/payments/confirm.test.ts __tests__/mocks/payment-data.ts
git commit -m "feat(api): 결제 검증 API 엔드포인트 구현

- POST /api/payments/confirm
- Toss Payments API 연동
- Basic Auth 인증
- 에러 처리 (400, 500)
- 단위 테스트 (3 tests passing)

Related to: Phase 3-1"
```

---

## 참고

- Toss Payments API: https://docs.tosspayments.com/reference/using-api/api-keys
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
