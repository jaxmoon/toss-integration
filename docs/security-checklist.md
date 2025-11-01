# Security Checklist

## 환경 변수 보안
- [x] `.env.local` 파일이 .gitignore에 포함됨
- [⚠️] 시크릿 키가 Git 히스토리에 있음 (테스트 키이므로 허용 가능)
- [x] 클라이언트 키만 `NEXT_PUBLIC_*`로 노출
- [x] 서버 전용 환경 변수는 API 라우트에서만 사용

## API 보안
- [x] HTTPS 사용 (프로덕션 배포 시 필수)
- [x] API 인증 헤더 구현 (Basic Auth)
- [x] 결제 금액 서버 측 검증
- [x] CORS 설정 확인 (Next.js 기본값 사용)
- [⚠️] Rate Limiting 고려 필요 (프로덕션 배포 시 구현 권장)

## 입력 검증
- [x] 모든 사용자 입력 검증 (금액, 주문 ID 등)
- [x] TypeScript 타입 검증
- [N/A] SQL Injection 방지 (DB 미사용)
- [⚠️] XSS 방지 강화 필요 (입력값 이스케이프)

## 데이터 보안
- [x] 민감 정보 로깅 금지
- [x] 결제 키 클라이언트 노출 방지
- [x] 에러 메시지에 민감 정보 미포함

## 프론트엔드 보안
- [🔄] CSP (Content Security Policy) 설정 필요
- [N/A] 안전한 쿠키 설정 (인증 미사용)
- [⚠️] XSS 방지 강화 필요
- [N/A] CSRF 방지 (상태 없는 API)

## 보안 헤더
- [🔄] Content-Security-Policy
- [🔄] X-Frame-Options
- [🔄] X-Content-Type-Options
- [🔄] Referrer-Policy
- [🔄] Strict-Transport-Security (프로덕션)

## 의존성 보안
- [🔄] npm audit 실행
- [🔄] 고위험/중간위험 취약점 수정

## 체크 완료
- [🔄] 모든 항목 검토 진행 중
- [🔄] 발견된 이슈 수정 진행 중

---

## 범례
- [x] 완료
- [🔄] 진행 중
- [⚠️] 개선 필요
- [N/A] 해당 없음

---

## 발견된 보안 이슈

### 1. Git 히스토리에 시크릿 키 노출
**심각도**: 낮음 (테스트 키)
**상태**: 허용됨
**설명**: Git 히스토리에 테스트 시크릿 키가 커밋되어 있음. 테스트 키이므로 보안 위험은 낮으나, 프로덕션 키는 절대 커밋하지 말 것.
**조치**: .env.local이 .gitignore에 포함되어 향후 실수 방지됨.

### 2. CSP 헤더 미설정
**심각도**: 중간
**상태**: 수정 필요
**설명**: Content Security Policy 헤더가 설정되지 않아 XSS 공격에 취약할 수 있음.
**조치**: next.config.ts에 CSP 헤더 추가 예정.

### 3. 금액 상한선 미설정
**심각도**: 중간
**상태**: 수정 필요
**설명**: API에서 결제 금액 하한선(> 0)만 검증하고 상한선이 없음.
**조치**: 합리적인 금액 상한선(예: 1억 원) 추가 예정.

### 4. orderId 형식 검증 미흡
**심각도**: 낮음
**상태**: 수정 필요
**설명**: orderId의 길이와 타입만 검증하고 형식 검증이 없음.
**조치**: orderId 형식 검증 (예: /^order-[\w-]+$/) 추가 예정.

### 5. Rate Limiting 미구현
**심각도**: 중간 (프로덕션)
**상태**: 프로덕션 배포 시 구현 필요
**설명**: API Rate Limiting이 없어 DDoS 공격에 취약할 수 있음.
**조치**: 프로덕션 배포 시 @upstash/ratelimit 또는 유사 라이브러리 도입 권장.

---

## 권장 사항

### 즉시 적용
1. CSP 헤더 설정
2. API 입력 검증 강화 (금액 상한선, orderId 형식)
3. 보안 헤더 추가 (X-Frame-Options, X-Content-Type-Options 등)

### 프로덕션 배포 시
1. HTTPS 강제 적용
2. Rate Limiting 구현
3. 에러 로깅 및 모니터링 시스템 구축
4. 프로덕션 키로 전환 (Git 히스토리 주의)
5. Strict-Transport-Security 헤더 추가

### 장기 개선
1. WAF (Web Application Firewall) 도입 고려
2. DDoS 방어 솔루션 검토
3. PCI DSS 컴플라이언스 검토 (실제 카드 정보 처리 시)
4. 보안 감사 정기 실시
