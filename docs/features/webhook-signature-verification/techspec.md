# TechSpec: Webhook Signature Verification

## 1. Overview

**Purpose**: Toss Payments에서 전송하는 Webhook 요청이 실제로 Toss로부터 왔는지 검증하여 위조된 요청으로부터 시스템을 보호하는 보안 기능을 구현합니다.

**Success Criteria**:
- 100% 의 정상 Webhook 요청이 성공적으로 검증됨
- 100% 의 위조된 요청이 거부됨
- 검증 처리 시간 < 100ms
- 모든 검증 실패 사례가 로깅됨

## 2. Requirements

### Functional Requirements
- [FR-1] HMAC-SHA256 알고리즘을 사용한 서명 검증
- [FR-2] HTTP Header의 `Toss-Signature` 값과 계산된 서명 비교
- [FR-3] Idempotency Key를 통한 중복 요청 방지
- [FR-4] 검증 실패 시 HTTP 401 응답 반환
- [FR-5] 모든 검증 실패를 보안 로그에 기록

### Non-Functional Requirements
- [NFR-1] **성능**: 서명 검증 처리 시간 < 100ms
- [NFR-2] **보안**: Timing attack 방지를 위한 constant-time 비교
- [NFR-3] **가용성**: 검증 실패가 전체 시스템을 중단시키지 않음
- [NFR-4] **관측성**: 모든 검증 이벤트의 추적 가능한 로깅

## 3. Architecture & Design

### System Architecture

```
┌─────────────────┐      Webhook Request      ┌─────────────────┐
│                 │ ────────────────────────> │                 │
│  Toss Payments  │    Headers:               │   Next.js App   │
│     Server      │    - Toss-Signature       │  API Endpoint   │
│                 │    - Toss-Idempotency-Key │                 │
└─────────────────┘                           └────────┬────────┘
                                                        │
                                              ┌─────────▼─────────┐
                                              │   Verification    │
                                              │    Middleware     │
                                              └─────────┬─────────┘
                                                        │
                                              ┌─────────▼─────────┐
                                              │  Webhook Handler  │
                                              │  Business Logic   │
                                              └───────────────────┘
```

### Component Design

1. **Verification Middleware** (`lib/webhooks/verifySignature.ts`)
   - HMAC-SHA256 서명 계산
   - Header 서명과 비교
   - Timing-safe comparison

2. **Idempotency Handler** (`lib/webhooks/idempotencyHandler.ts`)
   - 메모리 기반 캐시 (프로덕션에서는 Redis 권장)
   - 중복 요청 감지 및 거부

3. **Security Logger** (`lib/webhooks/securityLogger.ts`)
   - 구조화된 로그 포맷
   - 실패 원인 분류

4. **Updated Webhook Route** (`app/api/webhooks/toss/route.ts`)
   - Middleware 통합
   - 에러 처리 개선

### Data Models

```typescript
// Webhook Signature Verification Types
interface WebhookHeaders {
  'toss-signature': string;
  'toss-idempotency-key': string;
  'content-type': string;
}

interface VerificationResult {
  isValid: boolean;
  reason?: 'MISSING_SIGNATURE' | 'INVALID_SIGNATURE' | 'DUPLICATE_REQUEST';
  metadata?: {
    requestId: string;
    timestamp: number;
    clientIp?: string;
  };
}

interface IdempotencyRecord {
  key: string;
  processedAt: number;
  response?: any;
}

// Security Log Entry
interface SecurityLogEntry {
  timestamp: string;
  event: 'WEBHOOK_VERIFICATION_SUCCESS' | 'WEBHOOK_VERIFICATION_FAILURE';
  requestId: string;
  reason?: string;
  metadata: {
    ip?: string;
    userAgent?: string;
    signature?: string;
  };
}
```

### API Design

#### Webhook Endpoint Enhancement
```typescript
POST /api/webhooks/toss

Headers:
  Toss-Signature: {HMAC-SHA256 signature}
  Toss-Idempotency-Key: {unique request ID}
  Content-Type: application/json

Response:
  Success (200): { success: true, message: "Webhook processed" }
  Unauthorized (401): { error: "Invalid signature" }
  Duplicate (409): { error: "Duplicate request" }
  Server Error (500): { error: "Internal server error" }
```

## 4. Implementation Plan (TDD Approach)

### Phase 1: Red (Write Failing Tests)
**Test Cases to Write First:**

1. **Signature Verification Tests** (`__tests__/lib/webhooks/verifySignature.test.ts`)
   ```typescript
   describe('verifySignature', () => {
     test('should accept valid signature');
     test('should reject invalid signature');
     test('should reject missing signature');
     test('should use timing-safe comparison');
     test('should handle empty body');
     test('should handle different content types');
   });
   ```

2. **Idempotency Tests** (`__tests__/lib/webhooks/idempotencyHandler.test.ts`)
   ```typescript
   describe('idempotencyHandler', () => {
     test('should accept first request');
     test('should reject duplicate request');
     test('should handle cache expiration');
     test('should isolate different keys');
   });
   ```

3. **Integration Tests** (`__tests__/api/webhooks/toss.test.ts`)
   ```typescript
   describe('Webhook Endpoint with Verification', () => {
     test('should process valid webhook');
     test('should reject webhook with invalid signature');
     test('should log security events');
     test('should handle idempotency correctly');
   });
   ```

### Phase 2: Green (Implement Minimum Code)
**Implementation Steps:**

1. **Create HMAC Signature Utility**
   ```typescript
   // lib/webhooks/crypto.ts
   function calculateHmacSignature(secret: string, payload: string): string
   function timingSafeCompare(a: string, b: string): boolean
   ```

2. **Implement Verification Middleware**
   ```typescript
   // lib/webhooks/verifySignature.ts
   function verifyWebhookSignature(req: Request): Promise<VerificationResult>
   ```

3. **Implement Idempotency Handler**
   ```typescript
   // lib/webhooks/idempotencyHandler.ts
   class IdempotencyHandler {
     checkAndRecord(key: string): Promise<boolean>
     getResponse(key: string): Promise<any>
   }
   ```

4. **Create Security Logger**
   ```typescript
   // lib/webhooks/securityLogger.ts
   class WebhookSecurityLogger {
     logSuccess(metadata: object): void
     logFailure(reason: string, metadata: object): void
   }
   ```

5. **Update Webhook Route**
   ```typescript
   // app/api/webhooks/toss/route.ts
   // Add verification before processing
   ```

### Phase 3: Refactor
**Refactoring Checklist:**
- [ ] Extract magic strings to constants
- [ ] Add JSDoc comments for all public functions
- [ ] Optimize signature calculation performance
- [ ] Add comprehensive error messages
- [ ] Implement proper TypeScript types
- [ ] Add request rate limiting consideration

## 5. Testing Strategy

### Unit Tests
**Coverage Goal**: 95%
- Cryptographic functions (100% coverage required)
- Idempotency logic
- Security logging
- Error handling paths

### Integration Tests
- Full webhook flow with valid signature
- Rejection flow with invalid signature
- Duplicate request handling
- Error recovery scenarios

### E2E Tests
- Simulate actual Toss webhook call
- Test with production-like payload
- Verify logging output
- Performance testing (< 100ms response time)

### Security Tests
- Timing attack resistance validation
- Signature tampering attempts
- Header injection attempts
- Replay attack prevention

## 6. Dependencies

### Technical Dependencies
```json
{
  "crypto": "Node.js built-in",
  "@types/node": "^20.0.0"
}
```

### System Dependencies
- Environment variable: `TOSS_WEBHOOK_SECRET`
- Logging system (console for development, structured logging for production)
- Optional: Redis for production idempotency storage

## 7. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Secret key compromise | High | Low | Regular key rotation, secure storage in env vars |
| Timing attacks on signature comparison | High | Medium | Use constant-time comparison algorithm |
| Memory leak from idempotency cache | Medium | Medium | Implement TTL and size limits |
| Performance degradation under load | Medium | Low | Add caching, optimize crypto operations |
| Missing webhook due to verification failure | High | Low | Comprehensive logging, alerting on failures |

## 8. Timeline & Milestones

- [ ] **Day 1**: TechSpec Review & Approval
- [ ] **Day 1**: Write all test cases (Red phase)
- [ ] **Day 2**: Implement verification logic (Green phase)
- [ ] **Day 2**: Implement idempotency handler
- [ ] **Day 3**: Integration and refactoring
- [ ] **Day 3**: Security audit and testing
- [ ] **Day 4**: Code review and documentation
- [ ] **Day 4**: Deployment to staging
- [ ] **Day 5**: Production deployment

## 9. Open Questions

1. **Key Rotation Strategy**: Should we support multiple active keys for zero-downtime rotation?
   - Current decision: Single key for MVP, consider multi-key support for production

2. **Idempotency Storage**: Should we use Redis from the start or begin with in-memory?
   - Current decision: In-memory for MVP with clear upgrade path to Redis

3. **Monitoring Integration**: Which monitoring service should receive security alerts?
   - To be decided based on existing infrastructure

4. **Rate Limiting**: Should we implement rate limiting per IP or per signature?
   - Consider for future enhancement

## 10. Implementation Notes

### Environment Configuration
```bash
# .env.local
TOSS_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Security Best Practices
1. Never log the actual signature or secret
2. Use structured logging for security events
3. Implement proper error boundaries
4. Add request ID for traceability
5. Consider implementing webhook retry mechanism

### Migration Path
For existing webhook handler:
1. Add verification as middleware (non-breaking)
2. Run in monitoring mode first (log but don't reject)
3. Enable rejection after validation period
4. Add idempotency handling last

## 11. Appendix

### HMAC-SHA256 Signature Format
```
HMAC-SHA256(
  secret: TOSS_WEBHOOK_SECRET,
  message: timestamp + "." + JSON.stringify(body)
)
```

### Sample Verification Code
```typescript
import { createHmac, timingSafeEqual } from 'crypto';

function verifySignature(
  secret: string,
  payload: string,
  signature: string
): boolean {
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### References
- [Toss Payments Webhook Documentation](https://docs.tosspayments.com/guides/webhook)
- [OWASP Webhook Security](https://owasp.org/www-project-webhooks-security/)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)