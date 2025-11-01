# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 + React 19 application integrating Toss Payments Widget SDK for payment processing. This is a **test/learning project** implementing TDD methodology with Jest and Playwright.

## Essential Commands

### Development
```bash
# Start dev server (default port 3000, or specify PORT=3002)
npm run dev
# or with custom port
PORT=3002 npm run dev

# Build and verify (ALWAYS run after code changes)
npm run build

# Production server
npm start
```

### Testing
```bash
# Run all unit tests
npm test

# Watch mode (for TDD development)
npm run test:watch

# Coverage report
npm run test:coverage

# CI mode (for verification)
npm run test:ci

# E2E tests
npm run test:e2e
npm run test:e2e:ui          # Interactive UI
npm run test:e2e:headed      # Show browser
npm run test:e2e:report      # View test report
```

### Testing Individual Files
```bash
# Run specific test file
npm test -- __tests__/components/PaymentWidget.test.tsx

# Run specific test suite
npm test -- --testNamePattern="PaymentWidget"

# Run with coverage for specific file
npm test -- --coverage --collectCoverageFrom="components/PaymentWidget.tsx"
```

### Bundle Analysis
```bash
ANALYZE=true npm run build
```

## Architecture & Structure

### Payment Flow Architecture

The application follows a **client-server payment verification pattern**:

1. **Client-side**: `/app/checkout/page.tsx` renders `PaymentWidget`
2. **Widget Initialization**: `lib/tossPayments.ts` loads Toss SDK and creates widget instance
3. **Order Creation**: Client calls `POST /api/orders` to get server-generated `orderId`
4. **Payment Request**: Widget submits payment to Toss with `orderId`, `amount`, `orderName`
5. **Payment Confirmation**: Success redirects to `/success` → calls `POST /api/payments/confirm` with `paymentKey`
6. **Server Verification**: API route verifies payment with Toss servers using `TOSS_SECRET_KEY`
7. **Webhook Handling**: `POST /api/webhooks/toss` receives async payment status updates

**Critical Security Pattern**:
- `TOSS_SECRET_KEY` is **ONLY** used server-side in API routes (`app/api/**`)
- Client only uses `NEXT_PUBLIC_TOSS_CLIENT_KEY` from `config/constants.ts`
- Order IDs are generated server-side via `crypto.randomUUID()` to prevent collisions
- Amount validation happens server-side, never trust client-provided amounts

### Key Files & Responsibilities

**Payment Core:**
- `lib/tossPayments.ts` - SDK loader with SSR guards and singleton pattern
- `components/PaymentWidget.tsx` - Widget wrapper with proper cleanup and error handling
- `config/constants.ts` - Client-safe constants (NO secrets!)
- `config/server-config.ts` - Server-only config with secret keys

**API Routes (Server-only):**
- `app/api/orders/route.ts` - Server-side order creation with UUID generation
- `app/api/payments/confirm/route.ts` - Payment verification using secret key
- `app/api/webhooks/toss/route.ts` - Webhook handler for async payment updates

**Pages:**
- `app/checkout/page.tsx` - Checkout page that consumes PaymentWidget
- `app/success/page.tsx` - Post-payment success handler
- `app/fail/page.tsx` - Payment failure handler

**UI Components (TDD-developed):**
- `components/OrderSummary.tsx` - Order details display
- `components/LoadingSpinner.tsx` - Loading state indicator
- `components/TermsAgreement.tsx` - Terms checkbox component

### Configuration Files

**Environment Variables** (`.env.local` - not committed):
```bash
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_docs_...  # Client-side SDK key
TOSS_SECRET_KEY=test_gsk_docs_...              # Server-side verification key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Jest** (`jest.config.js`):
- `testEnvironment: 'jest-environment-jsdom'` for React components
- Module alias: `@/` maps to project root
- Coverage threshold: 70% (branches, functions, lines, statements)
- Timeout: 10s for payment API tests

**Playwright** (`playwright.config.ts`):
- E2E test directory: `./e2e/`
- Base URL: `http://localhost:3000`
- Runs dev server automatically before tests
- CI optimized with retries and single worker

**Next.js** (`next.config.ts`):
- Bundle analyzer enabled via `ANALYZE=true`
- Turbopack enabled (Next.js 16+)
- Webpack code splitting for `commons` and `lib` chunks
- Security headers including CSP for Toss domains

### Test Structure

Tests follow **TDD Red-Green-Refactor** pattern documented in git history:
- Unit tests: `__tests__/components/`, `__tests__/lib/`, `__tests__/api/`
- Integration tests: `__tests__/integration/`
- E2E tests: `e2e/` (Playwright)

## Development Workflow

### TDD Pattern (Red-Green-Refactor)

This project was built using strict TDD. When adding features:

1. **Red**: Write failing test first
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code while tests stay green
4. **Commit**: Document TDD cycle in commit message

Example commit messages in history:
```
feat: Phase 2 완료 - 기본 UI 컴포넌트 개발 (TDD)
feat: Phase 3 완료 - 코어 기능 구현 (TDD)
```

### Before Committing

```bash
# Verify build succeeds
npm run build

# Run all tests
npm test

# Check coverage
npm run test:coverage

# Optional: Run E2E tests
npm run test:e2e
```

### Branch Strategy

- `main` - Production-ready code
- `feat/*` - Feature branches

### Security Checklist Before Deployment

From `docs/CODE_REVIEW.md`, address these critical issues:

1. **Secret Key Protection**:
   - ✅ Verify `TOSS_SECRET_KEY` is NEVER in `config/constants.ts`
   - ✅ Only use in `app/api/**` routes
   - ❌ Do NOT use `process.env.TOSS_SECRET_KEY` in client components

2. **Order ID Generation**:
   - ✅ Generate server-side via `POST /api/orders` using `crypto.randomUUID()`
   - ❌ Never use static/build-time generated IDs
   - Format: `ORD-YYYYMMDD-UUID`

3. **Payment Verification**:
   - ✅ Always verify payments server-side in `POST /api/payments/confirm`
   - ✅ Check amount matches between client request and Toss response
   - ❌ Never trust client-provided amounts for fulfillment

4. **Error Handling**:
   - ✅ Map SDK errors to user-friendly messages
   - ✅ Log detailed errors server-side only
   - ❌ Never expose raw error messages to users

## Important Patterns & Conventions

### Server vs Client Code

**Client-side** (`components/`, `app/**/page.tsx`):
- Use `NEXT_PUBLIC_*` environment variables only
- Import from `config/constants.ts`
- Call API routes for sensitive operations

**Server-side** (`app/api/`, `config/server-config.ts`):
- Use any environment variable
- Access `TOSS_SECRET_KEY` safely
- Perform payment verification and order creation

### React Component Cleanup

The project uses proper cleanup patterns. When working with async operations in components:

```typescript
useEffect(() => {
  let isMounted = true

  async function initialize() {
    // async work
    if (isMounted) {
      // update state
    }
  }

  initialize()

  return () => {
    isMounted = false
    // cleanup resources
  }
}, [deps])
```

See `components/PaymentWidget.tsx` for reference implementation.

### Type Safety

- Avoid `any` types (use proper interfaces from `lib/tossPayments.ts`)
- Define request/response types for API routes
- Use `as const` for constant objects

## Project Documentation

**Critical Reading**:
- `docs/CODE_REVIEW.md` - Security audit findings (READ BEFORE DEPLOYMENT)
- `docs/TEST_GUIDE.md` - Testing workflow and test data
- `docs/toss-integration/README.md` - Original project plan and phase structure
- `docs/toss-integration/techspec.md` - Technical specifications

**Development Guides**:
- `docs/toss-integration/plan.md` - Multi-phase implementation plan
- `docs/toss-integration/tasks/*.md` - Agent-specific task breakdowns

## Known Issues & TODOs

From `docs/CODE_REVIEW.md`:

1. **Database Integration Missing** - Order and payment data not persisted
   - Orders API returns 501 for GET requests
   - Need to implement database schema and ORM

2. **Webhook Verification** - `app/api/webhooks/toss/route.ts` needs signature validation
   - Must verify requests actually come from Toss servers
   - Add HMAC signature check

3. **CSP Hardening** - Current CSP allows `unsafe-inline` and `unsafe-eval`
   - Consider using nonces for inline scripts/styles
   - Remove unsafe directives if possible

4. **Production Logging** - Console logs should be conditional
   - Add feature flag or logger abstraction
   - Prevent PII exposure in production logs

## Deployment Checklist

Before going to production:

- [ ] Replace test keys with production Toss API keys
- [ ] Set `NEXT_PUBLIC_BASE_URL` to actual domain
- [ ] Implement database for order/payment persistence
- [ ] Add webhook signature verification
- [ ] Set up error monitoring (Sentry, Datadog, etc.)
- [ ] Rotate secret keys (assume test keys compromised)
- [ ] Run full E2E test suite
- [ ] Perform security penetration testing
- [ ] Test with real payment (small amount)
- [ ] Configure rate limiting on payment endpoints
- [ ] Set up alerting for payment failures

## References

- [Toss Payments Documentation](https://docs.tosspayments.com/)
- [Widget SDK Reference](https://docs.tosspayments.com/reference/widget-sdk)
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Testing Library Best Practices](https://testing-library.com/docs/react-testing-library/intro)
