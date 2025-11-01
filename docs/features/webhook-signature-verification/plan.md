# Webhook Signature Verification - Implementation Plan

**Feature**: `webhook-signature-verification`
**Branch**: `feature/webhook-signature-verification`
**Techspec**: `docs/webhook-signature-verification/techspec.md`
**Methodology**: Test-Driven Development (TDD)
**Total**: 13 tasks
**Estimated**: ~4.5 hours

## Overview

Implement HMAC-SHA256 signature verification for Toss Payments webhooks to prevent forged requests. This includes signature validation, idempotency handling, and security logging.

**Success Criteria**:
- 100% valid webhook requests verified successfully
- 100% forged requests rejected
- Verification time < 100ms
- All verification failures logged

## Implementation Phases

### Phase 1: RED - Write Failing Tests

Write comprehensive test suites before any implementation. All tests must FAIL initially.

| Task | Component | Agent | Files | Estimated Time |
|------|-----------|-------|-------|----------------|
| 1.1 | Signature Verification Tests | `test-engineer-specialist` | `__tests__/lib/webhooks/verifySignature.test.ts` | 30min |
| 1.2 | Idempotency Handler Tests | `test-engineer-specialist` | `__tests__/lib/webhooks/idempotencyHandler.test.ts` | 30min |
| 1.3 | Webhook Integration Tests | `test-engineer-specialist` | `__tests__/api/webhooks/toss.test.ts` | 45min |

**Phase 1 Deliverables**:
- [ ] 3 test files created
- [ ] All tests FAIL when run
- [ ] Test coverage plan defined
- [ ] RED commits: `test: Add {component} tests (RED phase)`

---

### Phase 2: GREEN - Implement Minimum Code

Implement minimal code to make tests pass. Focus on functionality, not elegance.

| Task | Component | Agent | Files | Estimated Time |
|------|-----------|-------|-------|----------------|
| 2.1 | HMAC Signature Utility | `security-engineer-specialist` | `lib/webhooks/crypto.ts` | 30min |
| 2.2 | Verification Middleware | `security-engineer-specialist` | `lib/webhooks/verifySignature.ts` | 45min |
| 2.3 | Idempotency Handler | `backend-specialist` | `lib/webhooks/idempotencyHandler.ts` | 45min |
| 2.4 | Security Logger | `backend-specialist` | `lib/webhooks/securityLogger.ts` | 30min |
| 2.5 | Update Webhook Route | `backend-api-specialist` | `app/api/webhooks/toss/route.ts` | 30min |

**Phase 2 Deliverables**:
- [ ] 4 new files created
- [ ] 1 existing file updated
- [ ] All tests PASS when run
- [ ] GREEN commits: `feat: Implement {component}`

**Implementation Notes**:
- Use Node.js built-in `crypto` module for HMAC-SHA256
- Implement timing-safe comparison to prevent timing attacks
- Use in-memory cache for idempotency (MVP, upgrade to Redis for production)
- Add `TOSS_WEBHOOK_SECRET` to environment variables

---

### Phase 3: REFACTOR - Clean & Optimize

Improve code quality while maintaining passing tests.

| Task | Component | Agent | Files | Estimated Time |
|------|-----------|-------|-------|----------------|
| 3.1 | Extract Constants | `code-review-specialist` | All implementation files | 15min |
| 3.2 | Add JSDoc Comments | `code-review-specialist` | All public APIs | 20min |
| 3.3 | Optimize Performance | `code-review-specialist` | `lib/webhooks/crypto.ts` | 20min |
| 3.4 | Error Messages | `code-review-specialist` | All error paths | 15min |
| 3.5 | TypeScript Types | `code-review-specialist` | Add strict types | 20min |

**Phase 3 Deliverables**:
- [ ] Code adheres to project conventions
- [ ] All functions documented
- [ ] Performance optimized (< 100ms)
- [ ] Comprehensive error handling
- [ ] REFACTOR commits: `refactor: Clean up {component}`

---

## Dependencies

### Technical Dependencies
- `crypto` (Node.js built-in)
- `@types/node` (already in project)

### Environment Variables
```bash
# Add to .env.local
TOSS_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### System Requirements
- Tests must run in existing Jest environment
- Must not break existing webhook handler

---

## Task Dependencies

```
Phase 1 (All tasks can run in parallel)
  ├─ 1.1 Signature Verification Tests
  ├─ 1.2 Idempotency Handler Tests
  └─ 1.3 Webhook Integration Tests
       ↓
Phase 2
  ├─ 2.1 HMAC Signature Utility (independent)
  ├─ 2.2 Verification Middleware (depends on 2.1)
  ├─ 2.3 Idempotency Handler (independent)
  ├─ 2.4 Security Logger (independent)
  └─ 2.5 Update Webhook Route (depends on 2.2, 2.3, 2.4)
       ↓
Phase 3 (All tasks can run in parallel after Phase 2)
```

---

## Execution Strategy

### Phase 1 Execution
- **Parallel**: Launch all 3 test tasks simultaneously using `test-engineer-specialist`
- **Validation**: Run `npm test` - all new tests must FAIL
- **Commit**: Create RED commit for each test file

### Phase 2 Execution
- **Batch 1** (parallel): Tasks 2.1, 2.3, 2.4 (independent)
- **Batch 2** (sequential): Task 2.2 (after 2.1)
- **Batch 3** (sequential): Task 2.5 (after 2.2, 2.3, 2.4)
- **Validation**: Run `npm test` - all tests must PASS
- **Validation**: Run `npm run build` - must succeed
- **Commit**: Create GREEN commit for each implementation

### Phase 3 Execution
- **Parallel**: Launch all 5 refactoring tasks simultaneously using `code-review-specialist`
- **Validation**: Run `npm test` - all tests must still PASS
- **Validation**: Run `npm run build` - must succeed
- **Commit**: Create REFACTOR commit(s)

---

## Success Metrics

- [ ] 13 tasks completed
- [ ] Test coverage ≥ 95% for new code
- [ ] Signature verification < 100ms
- [ ] Zero false positives/negatives in tests
- [ ] All security events logged
- [ ] Documentation complete

---

## Rollback Plan

If implementation fails:
1. Tests remain (Phase 1 complete)
2. Revert implementation commits (Phase 2)
3. Keep tests as specification for future attempt

---

## Post-Implementation

After completion:
- [ ] Run full test suite: `npm test`
- [ ] Run build: `npm run build`
- [ ] Manual testing with test webhook
- [ ] Security review
- [ ] Update main CLAUDE.md with new patterns
- [ ] Deploy to staging environment

---

**Generated**: 2025-11-02
**Status**: Ready for execution
