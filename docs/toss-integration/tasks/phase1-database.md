# Phase 1-2: TypeScript 타입 정의 및 상수 설정

## ⚠️ 작업 전 필수 확인

### 1. TechSpec 문서 읽기
**반드시 먼저 읽을 것**: `/docs/toss-integration/techspec.md`

작업을 시작하기 전에 반드시 techspec.md를 읽고 다음을 이해해야 합니다:
- 데이터 모델 정의 (Section 3 - Data Models)
- 시스템 아키텍처 (Section 3 - System Architecture)
- 환경 변수 설정 (Section 10)
- 테스트 카드 정보 (Section 10)

### 2. Toss Payments 최신 문서 확인 (context7 사용)
**context7 MCP 도구를 사용하여 최신 Toss Payments API 문서를 확인하세요:**

```
1. mcp__context7__resolve-library-id 호출
   - libraryName: "tosspayments"

2. mcp__context7__get-library-docs 호출
   - context7CompatibleLibraryID: (1번에서 받은 ID)
   - topic: "payment api types, request response models"
```

확인할 주요 내용:
- Payment API 요청/응답 데이터 모델
- PaymentConfirmation 인터페이스 최신 필드
- 결제 상태(status) 값 목록
- 에러 응답 구조

---

## 에이전트

**담당**: `database-engineer-specialist`

---

## 목표

Toss Payments 통합에 필요한 모든 TypeScript 인터페이스와 타입을 정의하고, 환경 변수 및 샘플 데이터 상수를 설정합니다.

---

## 선행 작업

- Phase 1-1 (Next.js 프로젝트 초기화) 완료
- `types/` 디렉토리 존재
- `config/` 디렉토리 존재

---

## 구체적 작업

### 1. techspec.md 읽기 (필수)
```bash
cat /Users/jax/GitHub/primer/lecture/toss/docs/toss-integration/techspec.md
```

특히 **Section 3 (Data Models)**를 집중적으로 확인

### 2. types/payment.ts 생성

techspec.md의 Data Models 섹션을 기반으로 TypeScript 인터페이스 작성:

```typescript
// types/payment.ts

/**
 * 주문 상품 정보
 */
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

/**
 * 주문 정보
 */
export interface Order {
  orderId: string;
  orderName: string;
  amount: number;
  items: OrderItem[];
}

/**
 * 고객 정보
 */
export interface Customer {
  name: string;
  email: string;
  phone: string;
}

/**
 * 결제 요청 파라미터
 */
export interface PaymentRequest {
  orderId: string;
  orderName: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerMobilePhone: string;
  successUrl: string;
  failUrl: string;
}

/**
 * 결제 상태
 */
export type PaymentStatus =
  | 'READY'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'CANCELED'
  | 'PARTIAL_CANCELED'
  | 'ABORTED'
  | 'EXPIRED';

/**
 * 결제 확인 응답
 */
export interface PaymentConfirmation {
  paymentKey: string;
  orderId: string;
  status: PaymentStatus;
  totalAmount: number;
  method: string;
  requestedAt: string;
  approvedAt?: string;
}

/**
 * API 응답 래퍼
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 결제 검증 요청
 */
export interface PaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}
```

파일 생성:
```bash
cat > types/payment.ts << 'EOF'
[위의 TypeScript 코드 전체]
EOF
```

### 3. config/constants.ts 생성

환경 변수, API URL, 샘플 데이터 등의 상수 정의:

```typescript
// config/constants.ts

/**
 * Toss Payments API 설정
 */
export const TOSS_PAYMENTS_CONFIG = {
  // 클라이언트 키 (브라우저에서 사용)
  clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '',

  // 시크릿 키 (서버에서만 사용)
  secretKey: process.env.TOSS_SECRET_KEY || '',

  // API Base URL
  apiUrl: 'https://api.tosspayments.com/v1',

  // 고객 키 (테스트 환경에서는 ANONYMOUS 사용 가능)
  customerKey: 'ANONYMOUS',
} as const;

/**
 * 애플리케이션 URL
 */
export const APP_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',

  // 결제 성공 리다이렉트 URL
  get successUrl() {
    return `${this.baseUrl}/success`;
  },

  // 결제 실패 리다이렉트 URL
  get failUrl() {
    return `${this.baseUrl}/fail`;
  },
} as const;

/**
 * 샘플 상품 데이터
 */
export const SAMPLE_PRODUCTS = [
  {
    id: 'prod-001',
    name: 'Toss Payments 위젯 통합 가이드',
    price: 50000,
    quantity: 1,
    imageUrl: '/images/sample-product.jpg',
  },
  {
    id: 'prod-002',
    name: '결제 시스템 구축 컨설팅',
    price: 150000,
    quantity: 1,
    imageUrl: '/images/consulting.jpg',
  },
] as const;

/**
 * 기본 주문 정보
 */
export const DEFAULT_ORDER = {
  orderId: `order-${Date.now()}`,
  orderName: 'Toss Payments 위젯 통합 가이드',
  amount: 50000,
  items: [SAMPLE_PRODUCTS[0]],
} as const;

/**
 * 테스트 고객 정보
 */
export const TEST_CUSTOMER = {
  name: '홍길동',
  email: 'test@example.com',
  phone: '01012345678',
} as const;

/**
 * 에러 메시지
 */
export const ERROR_MESSAGES = {
  PAYMENT_FAILED: '결제에 실패했습니다. 다시 시도해주세요.',
  INVALID_AMOUNT: '결제 금액이 올바르지 않습니다.',
  INVALID_ORDER: '주문 정보가 올바르지 않습니다.',
  SDK_LOAD_FAILED: 'Toss Payments SDK를 로드하지 못했습니다.',
  API_ERROR: 'API 요청 중 오류가 발생했습니다.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
} as const;

/**
 * 성공 메시지
 */
export const SUCCESS_MESSAGES = {
  PAYMENT_COMPLETE: '결제가 완료되었습니다.',
  ORDER_CREATED: '주문이 생성되었습니다.',
} as const;
```

파일 생성:
```bash
cat > config/constants.ts << 'EOF'
[위의 TypeScript 코드 전체]
EOF
```

### 4. types/index.ts 생성 (선택적 - 편의성)

타입 내보내기 중앙 관리:

```typescript
// types/index.ts
export type {
  OrderItem,
  Order,
  Customer,
  PaymentRequest,
  PaymentStatus,
  PaymentConfirmation,
  ApiResponse,
  PaymentConfirmRequest,
} from './payment';
```

### 5. TypeScript 컴파일 확인

```bash
npx tsc --noEmit
```

에러가 없어야 합니다.

---

## 출력물

생성되어야 할 파일:

```
types/
├── payment.ts       # 모든 결제 관련 인터페이스 및 타입
└── index.ts        # 타입 재내보내기 (선택적)

config/
└── constants.ts    # 환경 변수, 샘플 데이터, 메시지 상수
```

---

## 검증 방법

### 1. TypeScript 컴파일 확인
```bash
npx tsc --noEmit
```

### 2. 타입 import 테스트

임시 테스트 파일 생성:
```bash
cat > __tests__/types-test.ts << 'EOF'
import type { Order, PaymentRequest, PaymentConfirmation } from '../types/payment';
import { TOSS_PAYMENTS_CONFIG, SAMPLE_PRODUCTS } from '../config/constants';

// 타입 사용 테스트
const testOrder: Order = {
  orderId: 'test-001',
  orderName: 'Test Product',
  amount: 10000,
  items: [],
};

const testRequest: PaymentRequest = {
  orderId: 'test-001',
  orderName: 'Test',
  amount: 10000,
  customerName: '테스트',
  customerEmail: 'test@test.com',
  customerMobilePhone: '01012345678',
  successUrl: 'http://localhost:3000/success',
  failUrl: 'http://localhost:3000/fail',
};

console.log('✅ Types are working correctly');
console.log('Client Key:', TOSS_PAYMENTS_CONFIG.clientKey ? 'Set' : 'Not set');
console.log('Sample Products:', SAMPLE_PRODUCTS.length);
EOF

npx ts-node __tests__/types-test.ts || npx tsx __tests__/types-test.ts
rm __tests__/types-test.ts
```

### 3. 환경 변수 확인
```bash
# .env.local에서 환경 변수 로드 확인
node -e "require('dotenv').config({path:'.env.local'}); console.log('Client Key:', process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ? '✅ Set' : '❌ Not set')"
```

---

## 완료 조건

- [ ] techspec.md 읽기 완료 (특히 Data Models 섹션)
- [ ] `types/payment.ts` 생성
  - [ ] `OrderItem` 인터페이스 정의
  - [ ] `Order` 인터페이스 정의
  - [ ] `Customer` 인터페이스 정의
  - [ ] `PaymentRequest` 인터페이스 정의
  - [ ] `PaymentConfirmation` 인터페이스 정의
  - [ ] `PaymentStatus` 타입 정의
  - [ ] `ApiResponse<T>` 제네릭 인터페이스 정의
- [ ] `config/constants.ts` 생성
  - [ ] `TOSS_PAYMENTS_CONFIG` 상수
  - [ ] `APP_CONFIG` 상수
  - [ ] `SAMPLE_PRODUCTS` 배열
  - [ ] `ERROR_MESSAGES` 상수
  - [ ] `SUCCESS_MESSAGES` 상수
- [ ] `types/index.ts` 생성 (선택적)
- [ ] TypeScript 컴파일 에러 0건 (`npx tsc --noEmit`)
- [ ] 타입 import 테스트 성공

---

## Git 커밋

작업 완료 후 다음 커밋 메시지로 커밋:

```bash
git add types/ config/
git commit -m "feat(types): TypeScript 타입 정의 및 상수 설정

- 결제 관련 인터페이스 정의 (Order, PaymentRequest, PaymentConfirmation 등)
- Toss Payments 설정 상수
- 샘플 상품 데이터 및 메시지 상수
- 환경 변수 통합

Related to: Phase 1-2"
```

---

## 참고 문서

- TypeScript 공식 문서: https://www.typescriptlang.org/docs/
- Toss Payments API 레퍼런스: https://docs.tosspayments.com/reference
- 프로젝트 TechSpec: `/docs/toss-integration/techspec.md` (Section 3)
