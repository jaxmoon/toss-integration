# Phase 1-3: 테스트 환경 설정

## ⚠️ 작업 전 필수 확인

### 1. TechSpec 문서 읽기
**반드시 먼저 읽을 것**: `/docs/toss-integration/techspec.md`

작업을 시작하기 전에 반드시 techspec.md를 읽고 다음을 이해해야 합니다:
- 테스트 전략 (Section 5 - Testing Strategy)
- TDD 접근 방식 (Section 4 - Implementation Plan)
- 테스트 커버리지 목표 (80%+)
- 구현할 테스트 케이스 목록

### 2. Jest 및 Testing Library 최신 문서 확인 (context7 사용)
**context7 MCP 도구를 사용하여 최신 문서를 확인하세요:**

```
1. Next.js 테스트 설정
   mcp__context7__resolve-library-id → "nextjs"
   mcp__context7__get-library-docs → topic: "jest configuration, testing"

2. React Testing Library
   mcp__context7__resolve-library-id → "testing-library"
   mcp__context7__get-library-docs → topic: "react testing setup, best practices"
```

확인할 주요 내용:
- Next.js 14 + Jest 설정 방법
- Testing Library 최신 권장 패턴
- React 18 호환성
- 비동기 테스트 패턴

---

## 에이전트

**담당**: `test-engineer-specialist`

---

## 목표

Jest와 React Testing Library를 설정하고, TDD 방식으로 개발할 수 있는 완전한 테스트 환경을 구축합니다.

---

## 선행 작업

- Phase 1-1 (Next.js 프로젝트 초기화) 완료
- Jest, @testing-library/react, @testing-library/jest-dom 설치 완료
- `__tests__/` 디렉토리 존재

---

## 구체적 작업

### 1. techspec.md 및 context7 문서 읽기 (필수)
```bash
cat /Users/jax/GitHub/primer/lecture/toss/docs/toss-integration/techspec.md
```

특히 **Section 4 (Implementation Plan - TDD)** 및 **Section 5 (Testing Strategy)** 집중 확인

### 2. jest.config.js 생성

Next.js 14와 호환되는 Jest 설정:

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Next.js 앱의 경로 (next.config.js와 .env 파일을 로드하기 위함)
  dir: './',
})

// Jest에 전달할 커스텀 설정
const customJestConfig = {
  // 각 테스트 전에 실행할 설정 파일
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // 테스트 환경
  testEnvironment: 'jest-environment-jsdom',

  // 모듈 경로 매핑 (tsconfig.json의 paths와 일치)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // 테스트 파일 패턴
  testMatch: [
    '**/__tests__/**/*.{ts,tsx}',
    '**/*.{test,spec}.{ts,tsx}',
  ],

  // 커버리지 수집 대상
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'config/**/*.ts',
    'types/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],

  // 커버리지 임계값 (목표: 80%)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // 테스트 타임아웃 (결제 API 테스트 고려)
  testTimeout: 10000,
}

// Next.js용 Jest 설정 반환
module.exports = createJestConfig(customJestConfig)
```

파일 생성:
```bash
cat > jest.config.js << 'EOF'
[위의 JavaScript 코드 전체]
EOF
```

### 3. jest.setup.js 생성

Jest 환경 설정 및 글로벌 mock:

```javascript
// jest.setup.js
import '@testing-library/jest-dom'

// Toss Payments SDK 모킹
global.TossPayments = jest.fn(() => ({
  widgets: jest.fn(() => ({
    setAmount: jest.fn(),
    renderPaymentMethods: jest.fn(),
    renderAgreement: jest.fn(),
  })),
  requestPayment: jest.fn(),
}))

// 환경 변수 모킹
process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY = 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm'
process.env.TOSS_SECRET_KEY = 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6'
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'

// window.matchMedia 모킹 (CSS 미디어 쿼리 테스트용)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// IntersectionObserver 모킹
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}

console.log('✅ Jest setup complete')
```

파일 생성:
```bash
cat > jest.setup.js << 'EOF'
[위의 JavaScript 코드 전체]
EOF
```

### 4. 테스트 유틸리티 생성

`__tests__/utils/test-utils.tsx`:

```typescript
// __tests__/utils/test-utils.tsx
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// 커스텀 렌더 함수 (향후 Provider 추가 가능)
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options })

export * from '@testing-library/react'
export { customRender as render }
```

파일 생성:
```bash
mkdir -p __tests__/utils
cat > __tests__/utils/test-utils.tsx << 'EOF'
[위의 TypeScript 코드 전체]
EOF
```

### 5. Mock 데이터 생성

`__tests__/mocks/payment-data.ts`:

```typescript
// __tests__/mocks/payment-data.ts
import type {
  Order,
  OrderItem,
  Customer,
  PaymentRequest,
  PaymentConfirmation,
} from '@/types/payment'

export const mockOrderItem: OrderItem = {
  id: 'item-001',
  name: '테스트 상품',
  price: 10000,
  quantity: 1,
  imageUrl: '/test-image.jpg',
}

export const mockOrder: Order = {
  orderId: 'order-test-001',
  orderName: '테스트 주문',
  amount: 10000,
  items: [mockOrderItem],
}

export const mockCustomer: Customer = {
  name: '홍길동',
  email: 'test@example.com',
  phone: '01012345678',
}

export const mockPaymentRequest: PaymentRequest = {
  orderId: 'order-test-001',
  orderName: '테스트 주문',
  amount: 10000,
  customerName: '홍길동',
  customerEmail: 'test@example.com',
  customerMobilePhone: '01012345678',
  successUrl: 'http://localhost:3000/success',
  failUrl: 'http://localhost:3000/fail',
}

export const mockPaymentConfirmation: PaymentConfirmation = {
  paymentKey: 'test_payment_key_123',
  orderId: 'order-test-001',
  status: 'DONE',
  totalAmount: 10000,
  method: '카드',
  requestedAt: '2024-01-01T00:00:00+09:00',
  approvedAt: '2024-01-01T00:00:10+09:00',
}
```

파일 생성:
```bash
mkdir -p __tests__/mocks
cat > __tests__/mocks/payment-data.ts << 'EOF'
[위의 TypeScript 코드 전체]
EOF
```

### 6. 샘플 테스트 작성

기본 동작 확인을 위한 샘플 테스트:

```typescript
// __tests__/sample.test.ts
describe('Test Environment', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true)
  })

  it('should have environment variables', () => {
    expect(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY).toBeDefined()
    expect(process.env.TOSS_SECRET_KEY).toBeDefined()
  })

  it('should import mock data', async () => {
    const { mockOrder, mockCustomer } = await import('./mocks/payment-data')
    expect(mockOrder.orderId).toBe('order-test-001')
    expect(mockCustomer.name).toBe('홍길동')
  })
})
```

파일 생성:
```bash
cat > __tests__/sample.test.ts << 'EOF'
[위의 TypeScript 코드 전체]
EOF
```

### 7. package.json 스크립트 확인

`package.json`에 테스트 스크립트 추가 확인:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

없으면 추가:
```bash
npm pkg set scripts.test="jest"
npm pkg set scripts.test:watch="jest --watch"
npm pkg set scripts.test:coverage="jest --coverage"
npm pkg set scripts.test:ci="jest --ci --coverage --maxWorkers=2"
```

### 8. 테스트 실행 확인

```bash
# 샘플 테스트 실행
npm test

# 결과: 3 tests should pass
```

---

## 출력물

생성되어야 할 파일:

```
├── jest.config.js              # Jest 설정
├── jest.setup.js               # Jest 환경 설정
├── __tests__/
│   ├── sample.test.ts         # 샘플 테스트
│   ├── utils/
│   │   └── test-utils.tsx     # 테스트 유틸리티
│   └── mocks/
│       └── payment-data.ts    # Mock 데이터
└── package.json                # 테스트 스크립트 추가
```

---

## 검증 방법

### 1. Jest 설정 확인
```bash
npx jest --showConfig
```

### 2. 샘플 테스트 실행
```bash
npm test
```

**기대 결과**:
```
PASS __tests__/sample.test.ts
  Test Environment
    ✓ should run tests successfully
    ✓ should have environment variables
    ✓ should import mock data

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

### 3. 커버리지 확인
```bash
npm run test:coverage
```

### 4. Watch 모드 확인
```bash
npm run test:watch
# Ctrl+C로 종료
```

---

## 완료 조건

- [ ] techspec.md 읽기 완료 (Testing Strategy 섹션)
- [ ] context7을 통한 Jest 및 Testing Library 최신 문서 확인
- [ ] `jest.config.js` 생성 (Next.js 14 호환)
- [ ] `jest.setup.js` 생성 (Toss SDK mock 포함)
- [ ] `__tests__/utils/test-utils.tsx` 생성
- [ ] `__tests__/mocks/payment-data.ts` 생성
- [ ] `__tests__/sample.test.ts` 생성
- [ ] package.json에 테스트 스크립트 추가
- [ ] `npm test` 실행 성공 (3 tests passed)
- [ ] `npm run test:coverage` 실행 가능

---

## Git 커밋

작업 완료 후 다음 커밋 메시지로 커밋:

```bash
git add jest.config.js jest.setup.js __tests__/ package.json
git commit -m "feat(test): Jest 및 Testing Library 설정

- Jest 14 호환 설정
- Testing Library setup
- Toss Payments SDK mock
- 테스트 유틸리티 및 mock 데이터
- 샘플 테스트 작성 (3 tests passing)

Related to: Phase 1-3"
```

---

## 참고 문서

- Next.js Testing: https://nextjs.org/docs/testing/jest
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro
- Jest 공식 문서: https://jestjs.io/docs/getting-started
- 프로젝트 TechSpec: `/docs/toss-integration/techspec.md` (Section 5)
