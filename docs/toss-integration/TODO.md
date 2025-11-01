# Toss Payments 통합 - 진행 체크리스트

> **진행도**: 5% (1/20 Phase 완료)
>
> **마지막 업데이트**: 2025-11-01
>
> **현재 작업**: 문서 작성 단계

---

## 📋 Phase 0: 프로젝트 준비 (완료)

- [x] TechSpec 문서 작성
- [x] Git 저장소 초기화
- [x] Feature 브랜치 생성 (`feat/toss-integration`)
- [x] .gitignore 설정
- [x] 실행 계획서 작성 (plan.md)
- [x] TODO 체크리스트 작성 (이 파일)
- [ ] Task 문서 작성 (tasks/*.md)

---

## 🏗️ Phase 1: 프로젝트 기반 구축

**담당 에이전트**: 3명 (병렬 실행)
**예상 시간**: 30분

### 1-1. Next.js 프로젝트 초기화 (devops-infrastructure-specialist)
- [ ] `tasks/phase1-devops.md` 읽기
- [ ] `techspec.md` 필수 확인
- [ ] Next.js 14+ 프로젝트 생성 (`create-next-app`)
- [ ] TypeScript 설정 선택
- [ ] Tailwind CSS 설정 선택
- [ ] App Router 설정 선택
- [ ] 필수 의존성 설치:
  - [ ] `@tosspayments/tosspayments-sdk`
  - [ ] `axios`
  - [ ] `jest`
  - [ ] `@testing-library/react`
  - [ ] `@testing-library/jest-dom`
- [ ] `package.json` 확인
- [ ] `npm run dev` 정상 실행 확인
- [ ] `npm run build` 성공 확인
- [ ] Git 커밋: "feat(setup): Next.js 프로젝트 초기화 및 의존성 설치"

### 1-2. TypeScript 타입 정의 (database-engineer-specialist)
- [ ] `tasks/phase1-database.md` 읽기
- [ ] `techspec.md` 필수 확인
- [ ] `src/types/` 디렉토리 생성
- [ ] `types/payment.ts` 생성:
  - [ ] `Order` 인터페이스
  - [ ] `OrderItem` 인터페이스
  - [ ] `Customer` 인터페이스
  - [ ] `PaymentRequest` 인터페이스
  - [ ] `PaymentConfirmation` 인터페이스
- [ ] `src/config/` 디렉토리 생성
- [ ] `config/constants.ts` 생성:
  - [ ] 환경 변수 상수
  - [ ] Toss API URL
  - [ ] 샘플 상품 데이터
- [ ] TypeScript 컴파일 에러 확인
- [ ] Git 커밋: "feat(types): TypeScript 타입 정의 및 상수 추가"

### 1-3. 테스트 환경 설정 (test-engineer-specialist)
- [ ] `tasks/phase1-test-setup.md` 읽기
- [ ] `techspec.md` 필수 확인
- [ ] `jest.config.js` 생성
- [ ] `jest.setup.js` 생성
- [ ] `__tests__/` 디렉토리 생성
- [ ] `__tests__/utils/` 테스트 유틸리티 생성
- [ ] `__tests__/mocks/` 목 데이터 생성
- [ ] `npm test` 실행 확인 (통과 테스트 0개라도 OK)
- [ ] Git 커밋: "feat(test): Jest 및 Testing Library 설정"

**Phase 1 완료 조건**:
- [ ] Next.js 프로젝트 정상 실행
- [ ] TypeScript 컴파일 에러 0건
- [ ] 테스트 실행 가능
- [ ] 3개 커밋 생성

---

## 🎨 Phase 2: 기본 UI 컴포넌트 개발

**담당 에이전트**: 3명 (병렬 실행)
**예상 시간**: 1시간

### 2-1. OrderSummary 컴포넌트 (frontend-ui-specialist)
- [ ] `tasks/phase2-ui-order.md` 읽기
- [ ] `techspec.md` 필수 확인
- [ ] `components/OrderSummary.tsx` 생성
- [ ] Props 인터페이스 정의 (`OrderSummaryProps`)
- [ ] 주문 상품 목록 렌더링
- [ ] 총 금액 계산 및 표시
- [ ] 금액 포맷팅 유틸리티 구현
- [ ] Tailwind CSS 스타일링
- [ ] `__tests__/components/OrderSummary.test.tsx` 작성
- [ ] 단위 테스트 통과 확인
- [ ] Git 커밋: "feat(ui): OrderSummary 컴포넌트 구현"

### 2-2. LoadingSpinner 컴포넌트 (frontend-ui-specialist)
- [ ] `tasks/phase2-ui-loading.md` 읽기
- [ ] `techspec.md` 필수 확인
- [ ] `components/LoadingSpinner.tsx` 생성
- [ ] Props 인터페이스 정의 (선택적 size, message)
- [ ] CSS 애니메이션 구현
- [ ] Tailwind CSS 스타일링
- [ ] `__tests__/components/LoadingSpinner.test.tsx` 작성
- [ ] 단위 테스트 통과 확인
- [ ] Git 커밋: "feat(ui): LoadingSpinner 컴포넌트 구현"

### 2-3. 약관 동의 UI (frontend-ui-specialist)
- [ ] `tasks/phase2-ui-terms.md` 읽기
- [ ] `techspec.md` 필수 확인
- [ ] `components/TermsAgreement.tsx` 생성
- [ ] Props 인터페이스 정의 (onChange 콜백)
- [ ] 체크박스 UI 구현
- [ ] 필수 약관 유효성 검사
- [ ] Tailwind CSS 스타일링
- [ ] `__tests__/components/TermsAgreement.test.tsx` 작성
- [ ] 단위 테스트 통과 확인
- [ ] Git 커밋: "feat(ui): TermsAgreement 컴포넌트 구현"

**Phase 2 완료 조건**:
- [ ] 3개 컴포넌트 모두 단위 테스트 통과
- [ ] Tailwind CSS 스타일 적용 확인
- [ ] 3개 커밋 생성

---

## ⚙️ Phase 3: 코어 기능 구현

**담당 에이전트**: 3명 (병렬 실행)
**예상 시간**: 2시간

### 3-1. 결제 검증 API (backend-api-specialist)
- [ ] `tasks/phase3-backend-api.md` 읽기
- [ ] `techspec.md` 필수 확인
- [ ] `app/api/payments/confirm/route.ts` 생성
- [ ] POST 요청 핸들러 구현
- [ ] 요청 바디 유효성 검사 (`paymentKey`, `orderId`, `amount`)
- [ ] Toss Payments API 호출 로직
- [ ] axios를 사용한 HTTP 요청
- [ ] 에러 처리 로직
- [ ] 응답 포맷팅 (`PaymentConfirmation` 타입 사용)
- [ ] `__tests__/api/payments/confirm.test.ts` 작성
- [ ] API 라우트 테스트 통과 확인
- [ ] Git 커밋: "feat(api): 결제 검증 API 엔드포인트 구현"

### 3-2. Toss SDK 초기화 및 상태 관리 (frontend-state-specialist)
- [ ] `tasks/phase3-frontend-state.md` 읽기
- [ ] `techspec.md` 필수 확인
- [ ] `lib/tossPayments.ts` 생성
- [ ] `loadTossPayments()` 함수 구현
- [ ] 클라이언트 키 환경 변수 사용
- [ ] SDK 초기화 에러 처리
- [ ] `hooks/usePayment.ts` 생성 (선택적)
- [ ] 결제 요청 상태 관리 (로딩, 성공, 실패)
- [ ] `__tests__/lib/tossPayments.test.ts` 작성
- [ ] 단위 테스트 통과 확인
- [ ] Git 커밋: "feat(sdk): Toss Payments SDK 초기화 및 상태 관리"

### 3-3. PaymentWidget 컴포넌트 (frontend-ui-specialist)
- [ ] `tasks/phase3-ui-widget.md` 읽기
- [ ] `techspec.md` 필수 확인
- [ ] `components/PaymentWidget.tsx` 생성
- [ ] Props 인터페이스 정의 (`amount`, `orderId`, `orderName`, `customer`)
- [ ] Toss Payments 위젯 렌더링
- [ ] 결제 수단 선택 UI
- [ ] 결제 요청 버튼 구현
- [ ] 결제 창 호출 로직
- [ ] 에러 처리 및 사용자 피드백
- [ ] `app/checkout/page.tsx` 생성 (주문/결제 페이지)
- [ ] `app/success/page.tsx` 생성 (결제 성공 페이지)
- [ ] `app/fail/page.tsx` 생성 (결제 실패 페이지)
- [ ] `__tests__/components/PaymentWidget.test.tsx` 작성
- [ ] 통합 테스트 작성
- [ ] Git 커밋: "feat(widget): PaymentWidget 컴포넌트 및 페이지 구현"

**Phase 3 완료 조건**:
- [ ] API 엔드포인트 테스트 통과
- [ ] Toss SDK 정상 초기화
- [ ] 결제 위젯 렌더링 성공
- [ ] 3개 커밋 생성

---

## ✅ Phase 4: 통합 및 검증

**담당 에이전트**: 3명 (병렬 실행)
**예상 시간**: 1.5시간

### 4-1. 통합 및 E2E 테스트 (test-engineer-specialist)
- [ ] `tasks/phase4-testing.md` 읽기
- [ ] `techspec.md` 필수 확인
- [ ] 통합 테스트 작성:
  - [ ] 주문 페이지 → 결제 위젯 로드
  - [ ] 결제 요청 → API 호출
  - [ ] 결제 성공 → success 페이지 이동
  - [ ] 결제 실패 → fail 페이지 이동
- [ ] E2E 테스트 작성 (Playwright 또는 Cypress):
  - [ ] 전체 결제 플로우 (주문 → 결제 → 성공)
  - [ ] 결제 실패 시나리오
  - [ ] 결제 취소 시나리오
- [ ] 테스트 커버리지 확인 (목표: 80%+)
- [ ] 모든 테스트 통과 확인
- [ ] Git 커밋: "test: 통합 및 E2E 테스트 추가"

### 4-2. 보안 검토 (security-engineer-specialist)
- [ ] `tasks/phase4-security.md` 읽기
- [ ] `techspec.md` 필수 확인
- [ ] 보안 체크리스트 확인:
  - [ ] 환경 변수 사용 (.env.local)
  - [ ] `.env.local`이 .gitignore에 포함됨
  - [ ] 클라이언트 키만 클라이언트 노출
  - [ ] 시크릿 키는 서버에서만 사용
  - [ ] HTTPS 사용 (프로덕션)
  - [ ] 결제 금액 서버 측 검증
  - [ ] SQL Injection 방지 (해당 시)
  - [ ] XSS 방지 (입력값 검증)
- [ ] 발견된 보안 이슈 수정
- [ ] Git 커밋: "fix(security): 보안 이슈 수정"

### 4-3. 성능 최적화 (frontend-performance-specialist)
- [ ] `tasks/phase4-performance.md` 읽기
- [ ] `techspec.md` 필수 확인
- [ ] 위젯 로딩 시간 측정 (목표: 2초 이내)
- [ ] 코드 스플리팅 적용
- [ ] 이미지 최적화 (Next.js Image 컴포넌트)
- [ ] React.memo 적용 (필요 시)
- [ ] useMemo/useCallback 적용 (필요 시)
- [ ] Core Web Vitals 측정:
  - [ ] LCP (Largest Contentful Paint)
  - [ ] FID (First Input Delay)
  - [ ] CLS (Cumulative Layout Shift)
- [ ] 성능 개선 사항 적용
- [ ] Git 커밋: "perf: 성능 최적화 적용"

**Phase 4 완료 조건**:
- [ ] 모든 테스트 통과
- [ ] 보안 이슈 0건
- [ ] Core Web Vitals 기준 충족
- [ ] 3개 커밋 생성

---

## 🔍 Phase 5: 최종 검토

**담당 에이전트**: 3명 (순차 실행)
**예상 시간**: 1시간

### 5-1. 코드 리뷰 (code-review-specialist)
- [ ] 전체 코드베이스 검토
- [ ] 베스트 프랙티스 준수 확인
- [ ] 코드 스타일 일관성 확인
- [ ] 중복 코드 제거
- [ ] 리팩토링 제안 적용
- [ ] Git 커밋: "refactor: 코드 리뷰 피드백 반영"

### 5-2. 빌드 검증 (devops-infrastructure-specialist)
- [ ] `npm run build` 성공 확인
- [ ] 빌드 에러 0건
- [ ] 빌드 경고 최소화
- [ ] 프로덕션 준비 상태 점검
- [ ] 환경 변수 문서화 (.env.example 생성)
- [ ] README.md 업데이트 (설치 및 실행 방법)
- [ ] Git 커밋: "docs: README 및 환경 변수 문서화"

### 5-3. 최종 동작 확인 (backend-specialist)
- [ ] 로컬 환경에서 전체 플로우 테스트
- [ ] 테스트 카드로 결제 성공 시나리오 검증
- [ ] 에러 핸들링 검증
- [ ] 로깅 확인 (개발/프로덕션 환경)
- [ ] 최종 체크리스트 확인
- [ ] Git 커밋: "chore: 최종 검토 완료"

**Phase 5 완료 조건**:
- [ ] 빌드 에러 0건
- [ ] 코드 리뷰 승인
- [ ] 모든 테스트 통과
- [ ] 전체 기능 정상 동작
- [ ] 3개 커밋 생성

---

## 📊 전체 진행도 추적

| Phase | 상태 | 완료율 | 커밋 수 |
|-------|-----|--------|---------|
| Phase 0 | 🟡 진행 중 | 85% | 0 |
| Phase 1 | ⬜ 대기 | 0% | 0 |
| Phase 2 | ⬜ 대기 | 0% | 0 |
| Phase 3 | ⬜ 대기 | 0% | 0 |
| Phase 4 | ⬜ 대기 | 0% | 0 |
| Phase 5 | ⬜ 대기 | 0% | 0 |
| **총합** | **🟡** | **5%** | **0** |

---

## 📝 다음 작업

1. **즉시 실행**: `tasks/` 디렉토리 생성 및 12개 task 문서 작성
2. **Phase 1 시작 준비**: task 문서 완성 후 사용자에게 "Phase 1 시작 준비 완료" 알림
3. **사용자 명령 대기**: "Phase 1 시작해줘" 또는 "전체 자동 실행해줘"

---

## 🔄 업데이트 로그

| 날짜 | 작업 | 진행도 |
|------|------|--------|
| 2025-11-01 | TODO.md 생성 | 5% |

---

**마지막 커밋**: 없음 (아직 작업 미시작)
**다음 커밋 예정**: "feat(setup): Next.js 프로젝트 초기화 및 의존성 설치"
