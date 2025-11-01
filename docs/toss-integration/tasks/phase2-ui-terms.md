# Phase 2-3: 약관 동의 UI 컴포넌트 구현

## ⚠️ 작업 전 필수 확인

### 1. TechSpec 문서 읽기
**반드시 먼저 읽을 것**: `/docs/toss-integration/techspec.md`

- Functional Requirements - FR-5 (이용약관 동의 UI)
- Component Design (Section 3)

### 2. 최신 문서 확인 (context7 사용)

```
React Forms & Accessibility
mcp__context7__get-library-docs
  → context7CompatibleLibraryID: "react"
  → topic: "forms, controlled components, accessibility"
```

---

## 에이전트

**담당**: `frontend-ui-specialist`

---

## 목표

결제 진행을 위한 필수/선택 약관 동의 UI를 구현합니다.

---

## 구체적 작업

### 1. 🔴 RED: 실패하는 테스트 작성

`__tests__/components/TermsAgreement.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import { TermsAgreement } from '@/components/TermsAgreement'

describe('TermsAgreement', () => {
  it('should render all required terms', () => {
    render(<TermsAgreement onAgreementChange={jest.fn()} />)
    expect(screen.getByText(/개인정보 수집 및 이용/)).toBeInTheDocument()
    expect(screen.getByText(/결제대행 서비스 이용약관/)).toBeInTheDocument()
  })

  it('should call onChange when term is checked', () => {
    const handleChange = jest.fn()
    render(<TermsAgreement onAgreementChange={handleChange} />)

    const checkbox = screen.getByLabelText(/개인정보 수집/)
    fireEvent.click(checkbox)

    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      allAgreed: false,
    }))
  })

  it('should check all when "전체 동의" is clicked', () => {
    const handleChange = jest.fn()
    render(<TermsAgreement onAgreementChange={handleChange} />)

    const allAgree = screen.getByLabelText(/전체 동의/)
    fireEvent.click(allAgree)

    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      allAgreed: true,
    }))
  })

  it('should disable submit when required terms not agreed', () => {
    const handleChange = jest.fn()
    render(<TermsAgreement onAgreementChange={handleChange} />)

    // Initially all unchecked
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      canProceed: false,
    }))
  })
})
```

**테스트 실행 (❌ 실패 확인):**
```bash
npm test -- TermsAgreement
# 예상: FAIL
```

---

### 2. 🟢 GREEN: 테스트를 통과하는 코드 작성

#### 2-1. 타입 정의

`types/terms.ts`:

```typescript
export interface TermsAgreementState {
  personalInfo: boolean      // 개인정보 수집 (필수)
  paymentService: boolean     // 결제대행 서비스 (필수)
  marketing: boolean          // 마케팅 정보 수신 (선택)
  allAgreed: boolean          // 전체 동의
  canProceed: boolean         // 결제 진행 가능 여부
}
```

#### 2-2. TermsAgreement 컴포넌트 구현

`components/TermsAgreement.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import type { TermsAgreementState } from '@/types/terms'

export interface TermsAgreementProps {
  onAgreementChange: (state: TermsAgreementState) => void
}

export function TermsAgreement({ onAgreementChange }: TermsAgreementProps) {
  const [agreement, setAgreement] = useState({
    personalInfo: false,
    paymentService: false,
    marketing: false,
  })

  // 상태 계산
  const allAgreed = agreement.personalInfo && agreement.paymentService && agreement.marketing
  const canProceed = agreement.personalInfo && agreement.paymentService

  useEffect(() => {
    onAgreementChange({
      ...agreement,
      allAgreed,
      canProceed,
    })
  }, [agreement, allAgreed, canProceed])

  const handleAllAgree = () => {
    const newValue = !allAgreed
    setAgreement({
      personalInfo: newValue,
      paymentService: newValue,
      marketing: newValue,
    })
  }

  const handleTermChange = (term: keyof typeof agreement) => {
    setAgreement((prev) => ({
      ...prev,
      [term]: !prev[term],
    }))
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      {/* 전체 동의 */}
      <label className="flex items-center gap-3 p-3 bg-white rounded border-2 border-gray-200 cursor-pointer hover:border-blue-300">
        <input
          type="checkbox"
          checked={allAgreed}
          onChange={handleAllAgree}
          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          aria-label="전체 동의"
        />
        <span className="font-bold text-gray-900">전체 동의</span>
      </label>

      <div className="space-y-2 pl-2">
        {/* 필수 - 개인정보 */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreement.personalInfo}
            onChange={() => handleTermChange('personalInfo')}
            className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            aria-label="개인정보 수집 및 이용 동의 (필수)"
          />
          <span className="text-sm text-gray-700">
            [필수] 개인정보 수집 및 이용 동의
          </span>
        </label>

        {/* 필수 - 결제대행 */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreement.paymentService}
            onChange={() => handleTermChange('paymentService')}
            className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            aria-label="결제대행 서비스 이용약관 동의 (필수)"
          />
          <span className="text-sm text-gray-700">
            [필수] 결제대행 서비스 이용약관 동의
          </span>
        </label>

        {/* 선택 - 마케팅 */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreement.marketing}
            onChange={() => handleTermChange('marketing')}
            className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            aria-label="마케팅 정보 수신 동의 (선택)"
          />
          <span className="text-sm text-gray-500">
            [선택] 마케팅 정보 수신 동의
          </span>
        </label>
      </div>

      {!canProceed && (
        <p className="text-xs text-red-600 mt-2">
          * 필수 약관에 모두 동의해주세요
        </p>
      )}
    </div>
  )
}
```

**테스트 실행 (✅ 통과 확인):**
```bash
npm test -- TermsAgreement
# 예상: PASS - 4 tests passed
```

---

### 3. 🔵 REFACTOR: 코드 개선

테스트 통과 후 개선:
- 상태 관리 로직 최적화
- 접근성 속성 보강
- 약관 링크 추가 (선택적)

**테스트 재실행:**
```bash
npm test -- TermsAgreement
# 여전히 PASS 확인
```

---

## 출력물

```
components/
└── TermsAgreement.tsx

types/
└── terms.ts

__tests__/
└── components/
    └── TermsAgreement.test.tsx
```

---

## 완료 조건

- [ ] techspec.md 확인
- [ ] 🔴 RED: 테스트 작성 → 실행 → ❌ 실패 확인
- [ ] 🟢 GREEN: `types/terms.ts` 및 컴포넌트 구현
- [ ] 🟢 GREEN: 테스트 실행 → ✅ 통과 (4 tests)
- [ ] 🔵 REFACTOR: 코드 개선 → 테스트 → ✅ 여전히 통과
- [ ] 필수/선택 약관 구분
- [ ] 유효성 검사 로직 (canProceed)
- [ ] 접근성 지원

---

## Git 커밋

```bash
git add components/TermsAgreement.tsx types/terms.ts __tests__/components/TermsAgreement.test.tsx
git commit -m "feat(ui): TermsAgreement 컴포넌트 구현

- 약관 동의 UI (필수/선택 구분)
- 전체 동의 기능
- 유효성 검사 (canProceed)
- React 상태 관리

Related to: Phase 2-3"
```
