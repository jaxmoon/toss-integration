# Toss Payments 통합 - 실행 계획서

## 프로젝트 개요

**목적**: Toss Payments 위젯을 사용하여 샘플 주문 페이지를 구현하고, 안전한 결제 프로세스를 테스트할 수 있는 환경을 구축

**기술 스택**:
- Next.js 14+ (App Router)
- React 18+
- TypeScript 5+
- Toss Payments SDK 2.0+
- Tailwind CSS
- Jest + Testing Library

**문서 기준**: `/docs/toss-integration/techspec.md` 참조

---

## 현재 진행 상황

### 전체 진행도: 5%

#### ✅ 완료된 작업
- [x] TechSpec 문서 작성 (techspec.md)
- [x] Git 저장소 초기화
- [x] feature 브랜치 생성 (`feat/toss-integration`)
- [x] .gitignore 설정

#### 🚧 진행 중 작업
- [ ] 없음

#### 📋 미완료 작업
- [ ] Next.js 프로젝트 초기화
- [ ] 의존성 설치 (Toss SDK, axios, Jest 등)
- [ ] TypeScript 및 Tailwind CSS 설정
- [ ] 프로젝트 디렉토리 구조 생성
- [ ] 모든 소스 코드 (컴포넌트, 페이지, API, 테스트)

---

## 서브에이전트 병렬 실행 전략

### Phase 1: 프로젝트 기반 구축 (병렬 실행)

**실행 시간**: 약 30분
**병렬 작업 수**: 3개

| 에이전트 | 담당 작업 | Task 문서 | 출력물 |
|---------|----------|-----------|--------|
| `devops-infrastructure-specialist` | Next.js 초기화, 의존성 설치 | `tasks/phase1-devops.md` | package.json, tsconfig.json, tailwind.config.js |
| `database-engineer-specialist` | 타입 정의 및 인터페이스 작성 | `tasks/phase1-database.md` | types/payment.ts, config/constants.ts |
| `test-engineer-specialist` | Jest 및 테스트 환경 설정 | `tasks/phase1-test-setup.md` | jest.config.js, setup 파일, 테스트 유틸리티 |

**완료 조건**:
- Next.js 프로젝트 정상 실행 (`npm run dev`)
- TypeScript 컴파일 에러 없음
- 테스트 실행 가능 (`npm test`)

---

### Phase 2: 기본 UI 컴포넌트 개발 (병렬 실행)

**실행 시간**: 약 1시간
**병렬 작업 수**: 3개

| 에이전트 | 담당 작업 | Task 문서 | 출력물 |
|---------|----------|-----------|--------|
| `frontend-ui-specialist` #1 | OrderSummary 컴포넌트 | `tasks/phase2-ui-order.md` | components/OrderSummary.tsx, 테스트 |
| `frontend-ui-specialist` #2 | LoadingSpinner 컴포넌트 | `tasks/phase2-ui-loading.md` | components/LoadingSpinner.tsx, 테스트 |
| `frontend-ui-specialist` #3 | 약관 동의 UI | `tasks/phase2-ui-terms.md` | components/TermsAgreement.tsx, 테스트 |

**완료 조건**:
- 각 컴포넌트의 단위 테스트 통과
- Storybook 또는 격리 환경에서 렌더링 확인
- Tailwind CSS 스타일 적용

---

### Phase 3: 코어 기능 구현 (병렬 실행)

**실행 시간**: 약 2시간
**병렬 작업 수**: 3개

| 에이전트 | 담당 작업 | Task 문서 | 출력물 |
|---------|----------|-----------|--------|
| `backend-api-specialist` | 결제 검증 API 구현 | `tasks/phase3-backend-api.md` | api/payments/confirm/route.ts |
| `frontend-state-specialist` | Toss SDK 초기화 및 상태 관리 | `tasks/phase3-frontend-state.md` | lib/tossPayments.ts, hooks |
| `frontend-ui-specialist` | PaymentWidget 컴포넌트 통합 | `tasks/phase3-ui-widget.md` | components/PaymentWidget.tsx, 페이지 |

**완료 조건**:
- API 엔드포인트 테스트 통과
- Toss SDK 정상 초기화
- 결제 위젯 렌더링 성공

---

### Phase 4: 통합 및 검증 (병렬 실행)

**실행 시간**: 약 1.5시간
**병렬 작업 수**: 3개

| 에이전트 | 담당 작업 | Task 문서 | 출력물 |
|---------|----------|-----------|--------|
| `test-engineer-specialist` | 통합 및 E2E 테스트 | `tasks/phase4-testing.md` | 테스트 스위트, 커버리지 리포트 |
| `security-engineer-specialist` | 보안 검토 | `tasks/phase4-security.md` | 보안 체크리스트, 수정 사항 |
| `frontend-performance-specialist` | 성능 최적화 | `tasks/phase4-performance.md` | 최적화 보고서, 수정 사항 |

**완료 조건**:
- 통합 테스트 통과
- E2E 테스트 통과 (결제 성공/실패 시나리오)
- 보안 이슈 0건
- Core Web Vitals 기준 충족

---

### Phase 5: 최종 검토 (순차 실행)

**실행 시간**: 약 1시간
**작업 방식**: 순차적 실행

1. **code-review-specialist** (30분)
   - 전체 코드베이스 품질 검토
   - 베스트 프랙티스 준수 확인
   - 리팩토링 제안

2. **devops-infrastructure-specialist** (15분)
   - 빌드 검증 (`npm run build`)
   - 프로덕션 준비 상태 점검
   - 환경 변수 검토

3. **backend-specialist** (15분)
   - API 동작 최종 확인
   - 에러 핸들링 검증
   - 로깅 확인

**완료 조건**:
- 빌드 에러 0건
- 코드 리뷰 승인
- 모든 테스트 통과

---

## 진행 상황 추적 방법 (권장)

### Git 커밋 + TODO.md 조합

#### 1. 작업 완료 시마다 즉시 커밋
```bash
# 각 Phase 또는 주요 작업 완료 시
git add .
git commit -m "feat: Phase 1 완료 - Next.js 프로젝트 초기화"
git commit -m "feat: OrderSummary 컴포넌트 구현"
```

#### 2. TODO.md 체크리스트 업데이트
- 작업 시작 전: 해당 항목을 `[ ]`에서 `[🔄]`로 변경
- 작업 완료 후: `[🔄]`에서 `[x]`로 변경

#### 3. 새 세션 시작 시 빠른 상황 파악
```bash
# 터미널에서 실행
git log --oneline -10        # 최근 10개 커밋 확인
cat docs/toss-integration/TODO.md  # 체크리스트 확인
git status                   # 현재 변경 사항 확인
```

이 3가지 명령어로 다음을 파악할 수 있습니다:
- **git log**: 어떤 작업이 완료되었는지
- **TODO.md**: 전체 로드맵에서 현재 위치
- **git status**: 진행 중인 작업 (커밋되지 않은 변경사항)

---

## 다음 단계 (즉시 실행 가능)

### Option A: 단계별 실행
```
사용자: "Phase 1 시작해줘"
→ 3개 에이전트 병렬 실행
→ Phase 1 완료 후 커밋
```

### Option B: 전체 자동 실행
```
사용자: "전체 프로젝트 자동으로 진행해줘"
→ Phase 1-5 순차적 실행
→ 각 Phase 완료 시 커밋
```

### Option C: 특정 작업만 실행
```
사용자: "OrderSummary 컴포넌트만 먼저 만들어줘"
→ tasks/phase2-ui-order.md 실행
→ 해당 작업만 완료 후 커밋
```

---

## 예상 소요 시간

| 실행 방식 | 순차 실행 | 병렬 실행 |
|----------|----------|----------|
| Phase 1  | 1.5시간  | 30분     |
| Phase 2  | 3시간    | 1시간    |
| Phase 3  | 6시간    | 2시간    |
| Phase 4  | 4.5시간  | 1.5시간  |
| Phase 5  | 1시간    | 1시간    |
| **총합** | **16시간** | **6시간** |

**병렬 실행으로 약 62% 시간 단축 가능**

---

## 참고 문서

- **기술 명세**: `/docs/toss-integration/techspec.md`
- **진행 체크리스트**: `/docs/toss-integration/TODO.md`
- **세부 태스크**: `/docs/toss-integration/tasks/*.md`
- **Toss Payments 문서**: https://docs.tosspayments.com/

---

## 주의 사항

1. **각 에이전트는 반드시 작업 전에 `techspec.md`를 먼저 읽어야 함**
2. **테스트는 TDD 방식으로 진행** (테스트 작성 → 구현 → 리팩토링)
3. **환경 변수는 절대 커밋하지 않음** (.env.local을 .gitignore에 추가)
4. **각 Phase 완료 후 반드시 빌드 검증** (`npm run build`)
5. **보안 이슈 발견 시 즉시 수정** (다음 Phase로 진행하지 않음)

---

**생성일**: 2025-11-01
**최종 수정일**: 2025-11-01
**버전**: 1.0.0
