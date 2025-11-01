# Phase 2-1: OrderSummary 컴포넌트 구현

## ⚠️ 작업 전 필수 확인

### 1. TechSpec 문서 읽기
**반드시 먼저 읽을 것**: `/docs/toss-integration/techspec.md`

- Component Design (Section 3)
- Data Models - Order, OrderItem (Section 3)
- Testing Strategy (Section 5)

### 2. 최신 문서 확인 (context7 사용)

```
1. React 최신 패턴
   mcp__context7__resolve-library-id → "react"
   mcp__context7__get-library-docs → topic: "react 18 components, typescript"

2. Tailwind CSS
   mcp__context7__resolve-library-id → "tailwindcss"
   mcp__context7__get-library-docs → topic: "utility classes, responsive design"
```

---

## 에이전트

**담당**: `frontend-ui-specialist`

---

## 목표

주문 요약 정보를 표시하는 OrderSummary 컴포넌트를 TDD 방식으로 구현합니다.

---

## 선행 작업

- Phase 1 완료 (프로젝트 초기화, 타입 정의, 테스트 환경)
- `types/payment.ts` 존재 (Order, OrderItem 타입)
- `components/` 디렉토리 존재

---

## 구체적 작업

### 1. 🔴 RED: 실패하는 테스트 작성

`__tests__/components/OrderSummary.test.tsx`:

```typescript
import { render, screen } from '@/__tests__/utils/test-utils'
import { OrderSummary } from '@/components/OrderSummary'
import { mockOrder } from '@/__tests__/mocks/payment-data'

describe('OrderSummary', () => {
  it('should render order name', () => {
    render(<OrderSummary order={mockOrder} />)
    expect(screen.getByText(mockOrder.orderName)).toBeInTheDocument()
  })

  it('should render all order items', () => {
    render(<OrderSummary order={mockOrder} />)
    mockOrder.items.forEach((item) => {
      expect(screen.getByText(item.name)).toBeInTheDocument()
    })
  })

  it('should display formatted prices', () => {
    render(<OrderSummary order={mockOrder} />)
    expect(screen.getByText(/10,000원/)).toBeInTheDocument()
  })

  it('should calculate and display total amount', () => {
    render(<OrderSummary order={mockOrder} />)
    expect(screen.getByText('총 결제금액')).toBeInTheDocument()
    expect(screen.getByText(/10,000원/)).toBeInTheDocument()
  })

  it('should display item quantities', () => {
    const orderWithMultiple = {
      ...mockOrder,
      items: [{ ...mockOrder.items[0], quantity: 3 }],
    }
    render(<OrderSummary order={orderWithMultiple} />)
    expect(screen.getByText(/수량: 3/)).toBeInTheDocument()
  })
})
```

**테스트 실행 (❌ 실패 확인 필수):**
```bash
npm test -- OrderSummary
# 예상: FAIL - 컴포넌트가 없으므로 모든 테스트 실패
```

---

### 2. 🟢 GREEN: 테스트를 통과하는 최소한의 코드 작성

#### 2-1. 금액 포맷팅 유틸리티

`lib/format.ts`:

```typescript
/**
 * 숫자를 한국 원화 형식으로 포맷팅
 * @example formatCurrency(10000) → "10,000원"
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

/**
 * 숫자를 천단위 콤마로 포맷팅
 * @example formatNumber(10000) → "10,000"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR')
}
```

#### 2-2. OrderSummary 컴포넌트 구현

`components/OrderSummary.tsx`:

```typescript
import type { Order } from '@/types/payment'
import { formatCurrency } from '@/lib/format'

export interface OrderSummaryProps {
  order: Order
}

export function OrderSummary({ order }: OrderSummaryProps) {
  const { orderName, amount, items } = order

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      {/* 주문명 */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">{orderName}</h2>
      </div>

      {/* 주문 상품 목록 */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-4"
          >
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{item.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                수량: {item.quantity}개
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">
                {formatCurrency(item.price * item.quantity)}
              </p>
              {item.quantity > 1 && (
                <p className="text-sm text-gray-500">
                  @{formatCurrency(item.price)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 총 결제금액 */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            총 결제금액
          </span>
          <span className="text-2xl font-bold text-blue-600">
            {formatCurrency(amount)}
          </span>
        </div>
      </div>
    </div>
  )
}
```

**테스트 실행 (✅ 통과 확인):**
```bash
npm test -- OrderSummary
# 예상: PASS - 5 tests passed
```

---

### 3. 🔵 REFACTOR: 코드 개선

테스트가 통과하는 상태에서 코드를 개선합니다:

- **중복 코드 제거**: 반복되는 로직을 함수로 추출
- **접근성 개선**: aria-label, role 속성 추가
- **반응형 디자인**: 모바일/데스크톱 대응 확인
- **타입 안전성**: TypeScript strict 모드 검증

개선 후 **반드시 테스트 재실행:**
```bash
npm test -- OrderSummary
# 여전히 PASS 확인
```

---

## 출력물

```
components/
└── OrderSummary.tsx

lib/
└── format.ts

__tests__/
└── components/
    └── OrderSummary.test.tsx
```

---

## 검증 방법

```bash
# 1. 테스트 통과
npm test -- OrderSummary

# 2. TypeScript 에러 확인
npx tsc --noEmit

# 3. Storybook 또는 격리 환경 확인 (선택)
# 임시 페이지 생성해서 렌더링 확인
```

---

## 완료 조건

- [ ] techspec.md 및 context7 문서 확인
- [ ] 🔴 RED: 테스트 먼저 작성 → 실행 → ❌ 실패 확인
- [ ] 🟢 GREEN: `lib/format.ts` 및 `components/OrderSummary.tsx` 구현
- [ ] 🟢 GREEN: 테스트 실행 → ✅ 통과 확인 (5 tests)
- [ ] 🔵 REFACTOR: 코드 개선
- [ ] 🔵 REFACTOR: 테스트 재실행 → ✅ 여전히 통과
- [ ] Tailwind CSS 스타일 적용
- [ ] 반응형 디자인 확인

---

## Git 커밋

```bash
git add components/OrderSummary.tsx lib/format.ts __tests__/components/OrderSummary.test.tsx
git commit -m "feat(ui): OrderSummary 컴포넌트 구현

- 주문 요약 정보 표시 컴포넌트
- 금액 포맷팅 유틸리티
- TDD 방식 단위 테스트 (5 tests passing)
- Tailwind CSS 스타일링

Related to: Phase 2-1"
```

---

## 참고

- React 컴포넌트 패턴: https://react.dev/learn
- Tailwind CSS: https://tailwindcss.com/docs
- Testing Library: https://testing-library.com/docs/react-testing-library/intro
