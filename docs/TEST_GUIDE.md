# Toss Payments 테스트 가이드

## 현재 설정

프로젝트에는 Toss Payments **테스트 키**가 설정되어 있습니다:
- Client Key: `test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm`
- Secret Key: `test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6`

## 테스트 서버 실행

```bash
# 개발 서버 시작 (포트 3002)
PORT=3002 npm run dev

# 브라우저에서 열기
open http://localhost:3002/checkout
```

## 테스트 결제 수단

### 1. 카드 결제 테스트

Toss Payments는 테스트 모드에서 실제 카드 입력 없이 테스트할 수 있습니다.

**테스트 카드 번호:**
- **성공 케이스**: 아무 16자리 숫자 (예: `4111111111111111`)
- **실패 케이스**: Toss 위젯에서 "실패 케이스" 선택 가능

**테스트 정보:**
- 유효기간: 미래의 아무 날짜 (예: `12/25`)
- CVC: 아무 3자리 숫자 (예: `123`)
- 비밀번호: 아무 2자리 숫자 (예: `12`)
- 생년월일: 6자리 (예: `901201`)

### 2. 간편결제 테스트

- 카카오페이
- 네이버페이
- 토스페이

테스트 모드에서는 실제 로그인 없이 테스트 가능합니다.

### 3. 계좌이체 테스트

- 은행 선택 가능
- 실제 이체 없이 승인 완료

## 테스트 플로우

### 정상 결제 플로우

1. **체크아웃 페이지 접속**
   ```
   http://localhost:3002/checkout
   ```

2. **주문 정보 확인**
   - 상품명: "Toss Payments 위젯 통합 가이드"
   - 금액: 50,000원

3. **결제 수단 선택**
   - 위젯에서 원하는 결제 수단 선택 (카드, 간편결제, 계좌이체 등)

4. **결제 정보 입력**
   - 테스트 카드 정보 입력 또는 간편결제 선택

5. **결제하기 버튼 클릭**
   - 테스트 모드: 바로 승인 완료
   - 실제 모드: Toss 결제창 → 카드사 승인

6. **결제 성공 페이지**
   ```
   http://localhost:3002/success?paymentKey=xxx&orderId=xxx&amount=50000
   ```
   - 결제 정보 자동 검증 및 표시

### 실패 케이스 테스트

1. **사용자 취소**
   - 결제창에서 "취소" 버튼 클릭
   - → `/fail` 페이지로 리다이렉트

2. **결제 실패**
   - 테스트 위젯에서 "실패 케이스" 선택
   - → `/fail` 페이지로 리다이렉트 + 에러 메시지 표시

## API 엔드포인트 테스트

### 결제 승인 API

```bash
curl -X POST http://localhost:3002/api/payments/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "paymentKey": "test_payment_key_123",
    "orderId": "order-test-001",
    "amount": 50000
  }'
```

**예상 응답 (테스트 모드):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "유효하지 않은 paymentKey입니다."
  }
}
```

실제로는 Toss API에서 받은 `paymentKey`를 사용해야 합니다.

## 위젯이 안 보이는 경우

### 1. 브라우저 개발자 도구 확인

**Chrome/Edge:**
- `Cmd+Option+I` (Mac) 또는 `F12` (Windows)
- Console 탭에서 에러 메시지 확인

**예상 에러:**
```
Error: NEXT_PUBLIC_TOSS_CLIENT_KEY 환경 변수가 설정되지 않았습니다.
```

### 2. 환경 변수 확인

```bash
# .env.local 파일 확인
cat .env.local

# 서버 재시작 필요
PORT=3002 npm run dev
```

### 3. 네트워크 문제

- Toss SDK CDN 접근 가능한지 확인
- 회사 방화벽/프록시가 `js.tosspayments.com` 차단하는지 확인

## 주의사항

⚠️ **테스트 키는 실제 결제가 되지 않습니다!**

- 테스트 키로는 실제 카드 청구 불가
- 실제 서비스 배포 시 반드시 **실제 키**로 교체 필요
- 실제 키 발급: [Toss Payments 개발자센터](https://developers.tosspayments.com/)

## 다음 단계

### 실제 운영 배포 전 체크리스트

- [ ] Toss Payments 개발자센터에서 실제 키 발급
- [ ] `.env.local` → `.env.production`에 실제 키 설정
- [ ] 환경변수를 배포 환경에 안전하게 설정
- [ ] `NEXT_PUBLIC_BASE_URL` 실제 도메인으로 변경
- [ ] 테스트 환경에서 전체 플로우 재검증
- [ ] 실제 소액 결제로 최종 검증
- [ ] 에러 로깅 및 모니터링 설정

## 참고 자료

- [Toss Payments 개발자 문서](https://docs.tosspayments.com/)
- [Widget SDK 레퍼런스](https://docs.tosspayments.com/reference/widget-sdk)
- [결제창 연동 가이드](https://docs.tosspayments.com/guides/payment-widget/integration)
- [테스트 카드 정보](https://docs.tosspayments.com/guides/v2/payment-widget/test)
