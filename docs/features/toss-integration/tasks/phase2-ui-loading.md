# Phase 2-2: LoadingSpinner 컴포넌트 구현

## ⚠️ 작업 전 필수 확인

### 1. TechSpec 문서 읽기
**반드시 먼저 읽을 것**: `/docs/toss-integration/techspec.md`

- Component Design (Section 3)
- UX 요구사항 - 로딩 상태 관리 (Section 2 - NFR-3)

### 2. 최신 문서 확인 (context7 사용)

```
Tailwind CSS Animation
mcp__context7__get-library-docs
  → context7CompatibleLibraryID: "tailwindcss"
  → topic: "animation, spinner, loading states"
```

---

## 에이전트

**담당**: `frontend-ui-specialist`

---

## 목표

결제 처리 중 사용자에게 피드백을 제공하는 LoadingSpinner 컴포넌트를 구현합니다.

---

## 구체적 작업

### 1. 🔴 RED: 실패하는 테스트 작성

`__tests__/components/LoadingSpinner.test.tsx`:

```typescript
import { render, screen } from '@/__tests__/utils/test-utils'
import { LoadingSpinner } from '@/components/LoadingSpinner'

describe('LoadingSpinner', () => {
  it('should render spinner', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should display custom message', () => {
    render(<LoadingSpinner message="결제 처리 중..." />)
    expect(screen.getByText('결제 처리 중...')).toBeInTheDocument()
  })

  it('should display default message', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveAttribute('aria-live', 'polite')
  })
})
```

**테스트 실행 (❌ 실패 확인):**
```bash
npm test -- LoadingSpinner
# 예상: FAIL
```

---

### 2. 🟢 GREEN: 테스트를 통과하는 최소한의 코드 작성

`components/LoadingSpinner.tsx`:

```typescript
export interface LoadingSpinnerProps {
  /** 로딩 메시지 */
  message?: string
  /** 스피너 크기 */
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-6 h-6 border-2',
  md: 'w-10 h-10 border-3',
  lg: 'w-16 h-16 border-4',
}

export function LoadingSpinner({
  message = '로딩 중...',
  size = 'md',
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 p-8"
    >
      <div
        className={`
          ${sizeClasses[size]}
          border-blue-200
          border-t-blue-600
          rounded-full
          animate-spin
        `}
        aria-hidden="true"
      />
      <p className="text-sm text-gray-600 font-medium">{message}</p>
    </div>
  )
}
```

**테스트 실행 (✅ 통과 확인):**
```bash
npm test -- LoadingSpinner
# 예상: PASS - 4 tests passed
```

---

### 3. 🔵 REFACTOR: 코드 개선

테스트가 통과하는 상태에서 개선:
- CSS 애니메이션 성능 최적화
- 접근성 속성 보강
- 컴포넌트 Props 확장성 검토

**테스트 재실행:**
```bash
npm test -- LoadingSpinner
# 여전히 PASS 확인
```

---

## 출력물

```
components/
└── LoadingSpinner.tsx

__tests__/
└── components/
    └── LoadingSpinner.test.tsx
```

---

## 완료 조건

- [ ] techspec.md 확인
- [ ] 🔴 RED: 테스트 작성 → 실행 → ❌ 실패 확인
- [ ] 🟢 GREEN: 컴포넌트 구현 → 테스트 → ✅ 통과 (4 tests)
- [ ] 🔵 REFACTOR: 코드 개선 → 테스트 → ✅ 여전히 통과
- [ ] CSS 애니메이션 동작 확인
- [ ] 접근성 속성 포함

---

## Git 커밋

```bash
git add components/LoadingSpinner.tsx __tests__/components/LoadingSpinner.test.tsx
git commit -m "feat(ui): LoadingSpinner 컴포넌트 구현

- 로딩 상태 표시 컴포넌트
- 크기 및 메시지 커스터마이징
- Tailwind CSS 애니메이션
- 접근성 지원 (ARIA)

Related to: Phase 2-2"
```
