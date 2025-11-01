# TechSpec: Toss Payments 위젯 결제 연동

## 1. Overview
**Purpose**: Toss Payments 위젯을 사용하여 샘플 주문 페이지를 구현하고, 안전한 결제 프로세스를 테스트할 수 있는 환경을 구축합니다.

**Success Criteria**:
- Toss Payments 위젯이 정상적으로 로드되고 표시됨
- 테스트 카드를 사용하여 결제 프로세스를 완료할 수 있음
- 결제 성공/실패 상태를 정확히 처리하고 표시함
- 결제 검증 API를 통해 결제 정보의 무결성을 확인함

## 2. Requirements

### Functional Requirements
- [FR-1] Next.js 프로젝트 초기 설정 및 기본 구조 생성
- [FR-2] Toss Payments 위젯 SDK 통합 및 초기화
- [FR-3] 샘플 상품 정보를 표시하는 주문 페이지 구현
- [FR-4] 결제 수단 선택 UI (위젯) 렌더링
- [FR-5] 이용약관 동의 UI 렌더링
- [FR-6] 결제 요청 및 결제창 호출 기능
- [FR-7] 결제 성공/실패 처리 페이지
- [FR-8] 백엔드 API를 통한 결제 검증

### Non-Functional Requirements
- [NFR-1] 보안: 클라이언트 키와 시크릿 키의 적절한 관리
- [NFR-2] 성능: 위젯 로딩 시간 최소화 (2초 이내)
- [NFR-3] UX: 직관적이고 반응형인 UI 디자인
- [NFR-4] 에러 처리: 결제 실패 시 명확한 에러 메시지 표시
- [NFR-5] 테스트: 다양한 결제 시나리오 테스트 가능

## 3. Architecture & Design

### System Architecture
```
┌─────────────────────────────────────┐
│         Client (Browser)             │
│  ┌─────────────────────────────┐    │
│  │  Next.js App (React)        │    │
│  │  - Order Page Component     │    │
│  │  - Toss Payments Widget     │    │
│  │  - Success/Fail Pages       │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
                  │
                  │ API Calls
                  ▼
┌─────────────────────────────────────┐
│      Next.js API Routes              │
│  ┌─────────────────────────────┐    │
│  │  /api/payments/confirm      │    │
│  │  - Payment verification     │    │
│  │  - Toss API integration     │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
                  │
                  │ HTTPS
                  ▼
┌─────────────────────────────────────┐
│    Toss Payments API Server         │
│    - Payment processing              │
│    - Transaction management          │
└─────────────────────────────────────┘
```

### Component Design
```
src/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # 홈 페이지 (주문 페이지로 리다이렉트)
│   ├── checkout/
│   │   └── page.tsx              # 주문/결제 페이지
│   ├── success/
│   │   └── page.tsx              # 결제 성공 페이지
│   ├── fail/
│   │   └── page.tsx              # 결제 실패 페이지
│   └── api/
│       └── payments/
│           └── confirm/
│               └── route.ts      # 결제 검증 API
├── components/
│   ├── OrderSummary.tsx         # 주문 요약 컴포넌트
│   ├── PaymentWidget.tsx        # Toss 결제 위젯 컴포넌트
│   └── LoadingSpinner.tsx       # 로딩 표시 컴포넌트
├── lib/
│   └── tossPayments.ts          # Toss Payments SDK 초기화
├── types/
│   └── payment.ts               # TypeScript 타입 정의
└── config/
    └── constants.ts             # 환경 변수 및 상수
```

### Data Models
```typescript
// 주문 정보
interface Order {
  orderId: string;
  orderName: string;
  amount: number;
  items: OrderItem[];
}

// 주문 상품
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

// 고객 정보
interface Customer {
  name: string;
  email: string;
  phone: string;
}

// 결제 요청
interface PaymentRequest {
  orderId: string;
  orderName: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerMobilePhone: string;
  successUrl: string;
  failUrl: string;
}

// 결제 확인 응답
interface PaymentConfirmation {
  paymentKey: string;
  orderId: string;
  status: 'READY' | 'IN_PROGRESS' | 'DONE' | 'CANCELED' | 'PARTIAL_CANCELED' | 'ABORTED' | 'EXPIRED';
  totalAmount: number;
  method: string;
  requestedAt: string;
  approvedAt?: string;
}
```

### API Design
```yaml
# 결제 검증 API
POST /api/payments/confirm
Request:
  paymentKey: string
  orderId: string
  amount: number
Response:
  success: boolean
  data?: PaymentConfirmation
  error?: string
```

## 4. Implementation Plan (TDD Approach)

### Phase 1: Red (Write Failing Tests)
**Test Cases to Write First:**
1. Next.js 프로젝트 초기화 및 기본 라우팅 테스트
2. Toss Payments SDK 로드 및 초기화 테스트
3. 결제 위젯 렌더링 테스트
4. 결제 금액 업데이트 테스트
5. 결제 요청 파라미터 유효성 테스트
6. API 라우트 결제 검증 테스트
7. 에러 처리 시나리오 테스트

### Phase 2: Green (Implement Minimum Code)
**Implementation Steps:**
1. Next.js 프로젝트 생성 및 기본 설정
   - TypeScript, Tailwind CSS 설정
   - 환경 변수 설정 (.env.local)

2. Toss Payments SDK 통합
   - @tosspayments/tosspayments-sdk 패키지 설치
   - SDK 초기화 로직 구현

3. 주문 페이지 구현
   - 샘플 상품 데이터 정의
   - 주문 요약 UI 구현

4. 결제 위젯 컴포넌트 구현
   - 결제 수단 UI 렌더링
   - 이용약관 UI 렌더링
   - 결제 요청 로직

5. 결제 성공/실패 페이지 구현
   - URL 파라미터 파싱
   - 결제 결과 표시

6. 백엔드 API 구현
   - 결제 검증 엔드포인트
   - Toss API 호출 로직

### Phase 3: Refactor
**Refactoring Checklist:**
- [ ] 중복 코드 제거 (custom hooks 생성)
- [ ] 컴포넌트 분리 및 재사용성 향상
- [ ] 에러 바운더리 추가
- [ ] 로딩 상태 관리 개선
- [ ] TypeScript 타입 정의 강화
- [ ] 성능 최적화 (React.memo, useMemo 활용)

## 5. Testing Strategy

### Unit Tests
- SDK 초기화 함수 테스트
- 금액 포맷팅 유틸리티 함수 테스트
- API 라우트 핸들러 테스트
- 커버리지 목표: 80% 이상

### Integration Tests
- 결제 위젯 로드 및 렌더링 통합 테스트
- 결제 프로세스 전체 플로우 테스트
- API 통신 테스트 (모킹 사용)

### E2E Tests
- 주문 페이지 접속 → 상품 확인 → 결제 수단 선택 → 결제 완료
- 결제 실패 시나리오 (잘못된 카드 정보)
- 결제 취소 시나리오

## 6. Dependencies

### Technical Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tosspayments/tosspayments-sdk": "^2.0.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "@testing-library/react": "^14.0.0",
    "jest": "^29.0.0"
  }
}
```

### System Dependencies
- Node.js v18+ (Next.js requirement)
- Toss Payments API (테스트 환경)
- 브라우저: Chrome 90+, Safari 14+, Firefox 90+

## 7. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Toss API 서비스 장애 | High | Low | 에러 처리 강화, 재시도 로직 구현 |
| 결제 정보 변조 시도 | High | Medium | 서버 측 검증 필수, HTTPS 사용 |
| 위젯 로딩 실패 | Medium | Low | 폴백 UI 제공, 재로드 버튼 추가 |
| 테스트 키 노출 | Low | Medium | 환경 변수 사용, .gitignore 설정 |
| 브라우저 호환성 문제 | Medium | Low | 폴리필 적용, 지원 브라우저 명시 |

## 8. Timeline & Milestones

- [ ] TechSpec 리뷰 및 승인 (Day 1)
- [ ] 프로젝트 초기 설정 (Day 1)
- [ ] 테스트 작성 (Day 2)
- [ ] 기본 UI 구현 (Day 2-3)
- [ ] Toss Payments 위젯 통합 (Day 3-4)
- [ ] API 구현 및 검증 로직 (Day 4)
- [ ] 통합 테스트 및 디버깅 (Day 5)
- [ ] 리팩토링 및 최적화 (Day 5)
- [ ] 코드 리뷰 (Day 6)
- [ ] 문서화 및 배포 준비 (Day 6)

## 9. Open Questions
- 향후 실제 프로덕션 키로 전환 시 고려사항?
- 결제 내역 저장을 위한 데이터베이스 연동 필요 여부?
- 다국어 지원 필요 여부? (한국어/영어)
- 모바일 앱 WebView 지원 고려 사항?
- PCI DSS 컴플라이언스 요구사항?

## 10. Implementation Notes

### 환경 변수 설정
```bash
# .env.local
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm
TOSS_SECRET_KEY=test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 테스트 카드 정보
- 카드번호: 4242 4242 4242 4242
- 유효기간: 미래 날짜
- CVC: 임의의 3자리
- 비밀번호: 00

### 주요 구현 포인트
1. **customerKey 관리**: 테스트 환경에서는 ANONYMOUS 사용 가능
2. **금액 검증**: 클라이언트와 서버 양쪽에서 금액 검증 필수
3. **에러 처리**: 사용자 친화적인 에러 메시지 표시
4. **로깅**: 개발 환경에서 상세 로그, 프로덕션에서는 최소화