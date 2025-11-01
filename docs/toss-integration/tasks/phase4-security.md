# Phase 4-2: 보안 검토 및 개선

## ⚠️ 작업 전 필수 확인

### 1. TechSpec 문서 읽기
**반드시 먼저 읽을 것**: `/docs/toss-integration/techspec.md`

- Risks & Mitigations (Section 7)
- Non-Functional Requirements - 보안 (Section 2)
- 환경 변수 관리 (Section 10)

### 2. OWASP 및 보안 베스트 프랙티스 확인

```
Web Security Best Practices 검색
- OWASP Top 10
- Next.js Security
- Payment Security Standards
```

---

## 에이전트

**담당**: `security-engineer-specialist`

---

## 목표

결제 시스템의 보안 취약점을 점검하고 개선합니다.

---

## 구체적 작업

### 1. 보안 체크리스트 실행

`docs/security-checklist.md` 생성:

```markdown
# Security Checklist

## 환경 변수 보안
- [ ] `.env.local` 파일이 .gitignore에 포함됨
- [ ] 시크릿 키가 Git 히스토리에 없음
- [ ] 클라이언트 키만 `NEXT_PUBLIC_*`로 노출
- [ ] 서버 전용 환경 변수는 API 라우트에서만 사용

## API 보안
- [ ] HTTPS 사용 (프로덕션)
- [ ] API 인증 헤더 구현 (Basic Auth)
- [ ] 결제 금액 서버 측 검증
- [ ] CORS 설정 확인
- [ ] Rate Limiting 고려 (프로덕션)

## 입력 검증
- [ ] 모든 사용자 입력 검증 (금액, 주문 ID 등)
- [ ] TypeScript 타입 검증
- [ ] SQL Injection 방지 (DB 사용 시)
- [ ] XSS 방지 (입력값 이스케이프)

## 데이터 보안
- [ ] 민감 정보 로깅 금지
- [ ] 결제 키 클라이언트 노출 방지
- [ ] 에러 메시지에 민감 정보 미포함

## 프론트엔드 보안
- [ ] CSP (Content Security Policy) 설정
- [ ] 안전한 쿠키 설정 (httpOnly, secure)
- [ ] XSS 방지
- [ ] CSRF 방지

## 체크 완료
- [ ] 모든 항목 검토 완료
- [ ] 발견된 이슈 수정 완료
```

### 2. 환경 변수 검증

`.env.local` 및 `.env.example` 확인:

```bash
# .env.local이 .gitignore에 있는지 확인
grep -q "^\.env\.local$" .gitignore && echo "✅ .env.local in .gitignore" || echo "❌ Missing"

# Git 히스토리에 시크릿 키가 없는지 확인
git log -p | grep -i "test_gsk" && echo "⚠️  Secret key in git history!" || echo "✅ No secrets in history"

# .env.example 파일 존재 확인
test -f .env.example && echo "✅ .env.example exists" || echo "❌ Missing .env.example"
```

### 3. API 보안 강화

`app/api/payments/confirm/route.ts` 검토 및 개선:

```typescript
// 1. IP Rate Limiting (선택적 - 프로덕션)
// 2. 요청 크기 제한
// 3. 타임아웃 설정

// 개선 예시: 금액 검증 강화
if (amount <= 0 || amount > 100000000) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INVALID_AMOUNT',
        message: '유효하지 않은 결제 금액입니다',
      },
    },
    { status: 400 }
  )
}

// orderId 형식 검증
if (!/^order-[\w-]+$/.test(orderId)) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INVALID_ORDER_ID',
        message: '유효하지 않은 주문 ID입니다',
      },
    },
    { status: 400 }
  )
}
```

### 4. CSP 헤더 설정

`next.config.js` 수정:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.tosspayments.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.tosspayments.com",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### 5. 로깅 검토

민감한 정보가 로그에 출력되지 않도록 확인:

```bash
# 코드베이스에서 console.log로 민감 정보 출력하는지 검색
grep -r "console.log.*paymentKey" . --exclude-dir=node_modules || echo "✅ No paymentKey logging"
grep -r "console.log.*secretKey" . --exclude-dir=node_modules || echo "✅ No secretKey logging"
```

### 6. 의존성 취약점 검사

```bash
# npm audit 실행
npm audit

# 고위험/중간위험 취약점 수정
npm audit fix

# 결과 확인
npm audit --audit-level=moderate
```

---

## 출력물

```
docs/
└── security-checklist.md

next.config.js (업데이트)
app/api/payments/confirm/route.ts (보안 개선)
```

---

## 완료 조건

- [ ] techspec.md 보안 요구사항 확인
- [ ] 보안 체크리스트 모든 항목 검토
- [ ] 환경 변수 보안 검증
- [ ] API 입력 검증 강화
- [ ] CSP 헤더 설정
- [ ] 민감 정보 로깅 제거
- [ ] npm audit 취약점 0건 (high/critical)
- [ ] 발견된 보안 이슈 모두 수정

---

## Git 커밋

```bash
git add docs/security-checklist.md next.config.js app/api/payments/confirm/route.ts
git commit -m "fix(security): 보안 강화 및 검토

- 보안 체크리스트 작성 및 검토
- API 입력 검증 강화
- CSP 헤더 설정
- 민감 정보 로깅 제거
- npm 의존성 취약점 수정
- 환경 변수 보안 검증

Related to: Phase 4-2"
```

---

## 참고

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Next.js Security: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
- PCI DSS: https://www.pcisecuritystandards.org/
