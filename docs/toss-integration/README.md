# Toss Payments 통합 프로젝트

Next.js 14 + Toss Payments Widget SDK를 사용한 결제 시스템 구축 프로젝트

---

## 📚 문서 구조

```
docs/toss-integration/
├── README.md            # 👈 이 파일 (시작 가이드)
├── techspec.md          # 기술 명세서
├── plan.md              # 전체 실행 계획 및 병렬 전략
├── TODO.md              # 진행 체크리스트
└── tasks/               # 에이전트별 세부 태스크 (12개)
    ├── phase1-devops.md
    ├── phase1-database.md
    ├── phase1-test-setup.md
    ├── phase2-ui-order.md
    ├── phase2-ui-loading.md
    ├── phase2-ui-terms.md
    ├── phase3-backend-api.md
    ├── phase3-frontend-state.md
    ├── phase3-ui-widget.md
    ├── phase4-testing.md
    ├── phase4-security.md
    └── phase4-performance.md
```

---

## 🚀 빠른 시작 (새 세션)

### 1️⃣ 현재 진행 상황 파악

```bash
# 최근 커밋 확인
git log --oneline -10

# 체크리스트 확인
cat docs/toss-integration/TODO.md

# 현재 변경사항 확인
git status
```

### 2️⃣ Claude에게 작업 요청

**❌ 잘못된 요청 (맥락 없음)**
```
"Phase 1 시작해줘"
```
→ Claude가 Phase 1이 뭔지 모름

**✅ 올바른 요청 (명시적)**
```
docs/toss-integration/plan.md와 TODO.md를 읽고,
현재 진행 상황을 파악한 다음,
tasks/phase1-devops.md, tasks/phase1-database.md, tasks/phase1-test-setup.md를 읽어서
Phase 1을 병렬로 실행해줘.
```

---

## 📋 Phase별 실행 가이드

### Phase 1: 프로젝트 기반 구축

**Claude 요청 템플릿:**
```
다음 파일들을 읽어줘:
1. docs/toss-integration/plan.md
2. docs/toss-integration/TODO.md
3. docs/toss-integration/tasks/phase1-devops.md
4. docs/toss-integration/tasks/phase1-database.md
5. docs/toss-integration/tasks/phase1-test-setup.md

읽은 후, 3개 task를 병렬로 실행해줘:
- devops-infrastructure-specialist: phase1-devops.md 내용대로
- database-engineer-specialist: phase1-database.md 내용대로
- test-engineer-specialist: phase1-test-setup.md 내용대로

완료 후 TODO.md 업데이트하고 커밋해줘.
```

**예상 소요 시간:** 30분 (병렬 실행)

**출력물:**
- Next.js 프로젝트 초기화
- TypeScript 타입 정의
- Jest 테스트 환경 설정

---

### Phase 2: 기본 UI 컴포넌트 개발

**Claude 요청 템플릿:**
```
다음 파일들을 읽어줘:
1. docs/toss-integration/plan.md
2. docs/toss-integration/TODO.md
3. docs/toss-integration/tasks/phase2-ui-order.md
4. docs/toss-integration/tasks/phase2-ui-loading.md
5. docs/toss-integration/tasks/phase2-ui-terms.md

읽은 후, 3개 task를 병렬로 실행해줘:
- frontend-ui-specialist #1: phase2-ui-order.md (OrderSummary)
- frontend-ui-specialist #2: phase2-ui-loading.md (LoadingSpinner)
- frontend-ui-specialist #3: phase2-ui-terms.md (TermsAgreement)

완료 후 TODO.md 업데이트하고 커밋해줘.
```

**예상 소요 시간:** 1시간 (병렬 실행)

**출력물:**
- OrderSummary 컴포넌트
- LoadingSpinner 컴포넌트
- TermsAgreement 컴포넌트

---

### Phase 3: 코어 기능 구현

**Claude 요청 템플릿:**
```
다음 파일들을 읽어줘:
1. docs/toss-integration/plan.md
2. docs/toss-integration/TODO.md
3. docs/toss-integration/tasks/phase3-backend-api.md
4. docs/toss-integration/tasks/phase3-frontend-state.md
5. docs/toss-integration/tasks/phase3-ui-widget.md

읽은 후, 3개 task를 병렬로 실행해줘:
- backend-api-specialist: phase3-backend-api.md (결제 검증 API)
- frontend-state-specialist: phase3-frontend-state.md (Toss SDK)
- frontend-ui-specialist: phase3-ui-widget.md (PaymentWidget & Pages)

완료 후 TODO.md 업데이트하고 커밋해줘.
```

**예상 소요 시간:** 2시간 (병렬 실행)

**출력물:**
- 결제 검증 API
- Toss SDK 초기화
- PaymentWidget 및 결제 페이지

---

### Phase 4: 통합 및 검증

**Claude 요청 템플릿:**
```
다음 파일들을 읽어줘:
1. docs/toss-integration/plan.md
2. docs/toss-integration/TODO.md
3. docs/toss-integration/tasks/phase4-testing.md
4. docs/toss-integration/tasks/phase4-security.md
5. docs/toss-integration/tasks/phase4-performance.md

읽은 후, 3개 task를 병렬로 실행해줘:
- test-engineer-specialist: phase4-testing.md (통합/E2E 테스트)
- security-engineer-specialist: phase4-security.md (보안 검토)
- frontend-performance-specialist: phase4-performance.md (성능 최적화)

완료 후 TODO.md 업데이트하고 커밋해줘.
```

**예상 소요 시간:** 1.5시간 (병렬 실행)

**출력물:**
- 통합 및 E2E 테스트
- 보안 체크리스트 및 개선
- 성능 최적화 및 리포트

---

## 🔄 작업 재개 시나리오

### 시나리오 1: 아무것도 시작 안 했을 때

```
git log를 확인했더니 커밋이 없어.
docs/toss-integration/README.md, plan.md, TODO.md를 읽고
Phase 1부터 시작하자고 제안해줘.
```

### 시나리오 2: Phase 1 완료, Phase 2 시작하려고

```bash
# 먼저 확인
git log --oneline -5
cat docs/toss-integration/TODO.md
```

```
git log를 보니 Phase 1이 완료된 것 같아.
docs/toss-integration/TODO.md를 읽고 다음 할 Phase를 확인한 후,
해당 Phase의 task 문서들을 읽어서 병렬로 실행해줘.
```

### 시나리오 3: 특정 컴포넌트만 작업하고 싶을 때

```
docs/toss-integration/tasks/phase2-ui-order.md를 읽고
OrderSummary 컴포넌트만 구현해줘.
```

---

## 💡 팁 & 베스트 프랙티스

### ✅ DO

1. **항상 문서를 먼저 읽게 하기**
   ```
   "XXX.md를 읽고 ~ 해줘"
   ```

2. **진행 상황 파악 후 요청**
   ```
   git log + TODO.md 확인 → Claude에게 요청
   ```

3. **병렬 실행 명시**
   ```
   "3개 task를 병렬로 실행해줘"
   ```

4. **완료 후 TODO.md 업데이트 요청**
   ```
   "완료 후 TODO.md 체크박스 업데이트하고 커밋해줘"
   ```

### ❌ DON'T

1. **맥락 없이 요청하지 않기**
   ```
   ❌ "Phase 1 시작해줘"
   ✅ "plan.md 읽고 Phase 1 실행해줘"
   ```

2. **여러 Phase를 한 번에 요청하지 않기**
   ```
   ❌ "Phase 1~4 다 해줘"
   ✅ "Phase 1 완료 후 Phase 2 시작할게"
   ```

3. **task 문서 안 읽고 추측하지 않기**
   ```
   ❌ "Next.js 프로젝트 만들어줘"
   ✅ "phase1-devops.md 읽고 그대로 실행해줘"
   ```

---

## 📊 진행 상황 추적

### Git 커밋 패턴

각 Phase 완료 시 다음과 같은 커밋이 생성됩니다:

```
feat(setup): Next.js 프로젝트 초기화 및 의존성 설치
feat(types): TypeScript 타입 정의 및 상수 설정
feat(test): Jest 및 Testing Library 설정
feat(ui): OrderSummary 컴포넌트 구현
...
```

### TODO.md 체크리스트

- `[ ]` - 미완료
- `[🔄]` - 진행 중 (선택적)
- `[x]` - 완료

---

## 🎯 전체 자동 실행 (고급)

**한 번에 모든 Phase 실행:**

```
docs/toss-integration/plan.md와 TODO.md를 읽고,
Phase 1부터 Phase 4까지 순차적으로 자동 실행해줘.

각 Phase마다:
1. 해당 Phase의 task 문서들 읽기
2. 서브에이전트 병렬 실행
3. TODO.md 업데이트
4. Git 커밋
5. 다음 Phase로 진행

중간에 에러 발생 시 멈추고 보고해줘.
```

⚠️ **주의:** 전체 자동 실행은 6시간 이상 소요될 수 있으므로, Phase 단위로 나눠서 진행하는 것을 권장합니다.

---

## 📖 참고 문서

- **techspec.md**: 전체 기술 명세 및 요구사항
- **plan.md**: 병렬 실행 전략 및 예상 소요 시간
- **TODO.md**: 진행 체크리스트
- **tasks/*.md**: 각 작업의 구체적 실행 가이드

---

## 🆘 문제 해결

### Q: "Phase 1 시작해줘"라고 했는데 안 됩니다
A: task 문서들을 명시적으로 읽게 해주세요.

### Q: 어디까지 진행했는지 모르겠어요
A: `git log`와 `TODO.md`를 확인하세요.

### Q: 새 세션에서 어떻게 이어서 하나요?
A: 위의 "작업 재개 시나리오" 참고

### Q: 특정 컴포넌트만 만들고 싶어요
A: 해당 task 문서를 지정해서 읽게 하고 실행 요청

---

**생성일**: 2025-11-01
**버전**: 1.0.0
**관련 문서**: `techspec.md`, `plan.md`, `TODO.md`
