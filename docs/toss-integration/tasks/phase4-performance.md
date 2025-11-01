# Phase 4-3: 성능 최적화

## ⚠️ 작업 전 필수 확인

### 1. TechSpec 문서 읽기
**반드시 먼저 읽을 것**: `/docs/toss-integration/techspec.md`

- Non-Functional Requirements - 성능 (Section 2 - NFR-2)
- 위젯 로딩 시간 목표: 2초 이내
- Implementation Plan - 성능 최적화 (Section 4 - Phase 3)

### 2. 최신 문서 확인 (context7 사용)

```
1. Next.js Performance
   mcp__context7__get-library-docs
     → "nextjs"
     → topic: "performance optimization, code splitting, caching"

2. React Performance
   mcp__context7__get-library-docs
     → "react"
     → topic: "performance, useMemo, useCallback, React.memo"
```

---

## 에이전트

**담당**: `frontend-performance-specialist`

---

## 목표

Core Web Vitals 기준을 충족하고 사용자 경험을 개선합니다.

---

## 구체적 작업

### 1. Core Web Vitals 측정

Lighthouse 실행:

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드로 측정
npm run build
npm start

# Lighthouse CLI 설치 (선택)
npm install -g lighthouse

# Lighthouse 실행
lighthouse http://localhost:3000/checkout --view
```

**목표 지표**:
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1

### 2. 컴포넌트 최적화

#### OrderSummary 최적화

`components/OrderSummary.tsx`:

```typescript
import { memo } from 'react'
import type { Order } from '@/types/payment'
import { formatCurrency } from '@/lib/format'

export interface OrderSummaryProps {
  order: Order
}

// React.memo로 불필요한 리렌더링 방지
export const OrderSummary = memo(function OrderSummary({
  order,
}: OrderSummaryProps) {
  // 기존 코드...
})
```

#### PaymentWidget 최적화

`components/PaymentWidget.tsx`:

```typescript
import { useEffect, useRef, useState, useCallback } from 'react'

export function PaymentWidget({ paymentData, onPaymentRequest }: PaymentWidgetProps) {
  // ... 기존 상태 ...

  // useCallback으로 함수 메모이제이션
  const handlePayment = useCallback(async () => {
    if (!widgetRef.current) {
      setError('위젯이 초기화되지 않았습니다')
      return
    }

    try {
      onPaymentRequest?.()
      await widgetRef.current.requestPayment({
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        successUrl: paymentData.successUrl,
        failUrl: paymentData.failUrl,
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        customerMobilePhone: paymentData.customerMobilePhone,
      })
    } catch (err: any) {
      console.error('Payment request failed:', err)
      setError(err.message || '결제 요청 실패')
    }
  }, [paymentData, onPaymentRequest])

  // ... 나머지 코드 ...
}
```

### 3. 코드 스플리팅

`app/checkout/page.tsx`:

```typescript
import dynamic from 'next/dynamic'

// PaymentWidget을 동적 import (코드 스플리팅)
const PaymentWidget = dynamic(() =>
  import('@/components/PaymentWidget').then((mod) => mod.PaymentWidget),
  {
    loading: () => <LoadingSpinner message="결제 위젯 로딩 중..." />,
    ssr: false, // 클라이언트에서만 로드
  }
)

export default function CheckoutPage() {
  // ... 나머지 코드 ...
}
```

### 4. 이미지 최적화

Next.js Image 컴포넌트 사용:

```typescript
import Image from 'next/image'

// OrderSummary에서 상품 이미지 표시 시
{item.imageUrl && (
  <Image
    src={item.imageUrl}
    alt={item.name}
    width={80}
    height={80}
    className="rounded"
    priority={false}
    loading="lazy"
  />
)}
```

### 5. 폰트 최적화

`app/layout.tsx`:

```typescript
import { Inter } from 'next/font/google'

// 폰트 최적화
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

### 6. 캐싱 전략

`next.config.js` 업데이트:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... 기존 설정 ...

  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },

  // 번들 분석 (개발 시)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name: 'lib',
              chunks: 'all',
            },
          },
        },
      }
    }
    return config
  },
}

module.exports = nextConfig
```

### 7. 번들 사이즈 분석

```bash
# @next/bundle-analyzer 설치
npm install --save-dev @next/bundle-analyzer

# 분석 실행
ANALYZE=true npm run build
```

`next.config.js`에 추가:

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
```

### 8. 성능 측정 리포트

`docs/performance-report.md` 생성:

```markdown
# Performance Report

## Lighthouse Scores
- Performance: XX/100
- Accessibility: XX/100
- Best Practices: XX/100
- SEO: XX/100

## Core Web Vitals
- LCP: X.Xs
- FID: XXms
- CLS: 0.XX

## Bundle Sizes
- Main bundle: XXX KB
- Total JavaScript: XXX KB
- Total CSS: XXX KB

## Optimizations Applied
- [ ] React.memo
- [ ] Dynamic imports
- [ ] Image optimization
- [ ] Font optimization
- [ ] Code splitting
- [ ] Bundle analysis

## Target vs Actual
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Widget Load | < 2s | X.Xs | ✅/❌ |
| LCP | < 2.5s | X.Xs | ✅/❌ |
| FID | < 100ms | XXms | ✅/❌ |
| CLS | < 0.1 | 0.XX | ✅/❌ |
```

---

## 출력물

```
components/ (최적화됨)
├── OrderSummary.tsx (React.memo)
├── PaymentWidget.tsx (useCallback)
└── LoadingSpinner.tsx

app/
├── layout.tsx (폰트 최적화)
└── checkout/page.tsx (dynamic import)

next.config.js (이미지, 번들 최적화)

docs/
└── performance-report.md
```

---

## 검증 방법

### 1. Lighthouse 실행

```bash
npm run build
npm start
# Chrome DevTools > Lighthouse 실행
```

### 2. 번들 사이즈 확인

```bash
ANALYZE=true npm run build
```

### 3. 로딩 시간 측정

Chrome DevTools > Network 탭에서:
- Toss SDK 로드 시간
- 페이지 로드 시간
- API 응답 시간

---

## 완료 조건

- [ ] techspec.md 성능 요구사항 확인
- [ ] Lighthouse 실행 및 점수 기록
- [ ] Core Web Vitals 측정
- [ ] React.memo 적용
- [ ] useCallback/useMemo 적용
- [ ] Dynamic import 적용
- [ ] Image 최적화
- [ ] 폰트 최적화
- [ ] 번들 사이즈 분석
- [ ] 성능 리포트 작성
- [ ] 위젯 로딩 시간 < 2초

---

## Git 커밋

```bash
git add components/ app/ next.config.js docs/performance-report.md
git commit -m "perf: 성능 최적화

- React.memo로 불필요한 리렌더링 방지
- useCallback/useMemo 메모이제이션
- Dynamic import로 코드 스플리팅
- Next.js Image 최적화
- 폰트 최적화
- 번들 사이즈 분석 및 최적화
- Core Web Vitals 기준 충족

Related to: Phase 4-3"
```

---

## 참고

- Web Vitals: https://web.dev/vitals/
- Next.js Performance: https://nextjs.org/docs/app/building-your-application/optimizing
- React Performance: https://react.dev/learn/render-and-commit
