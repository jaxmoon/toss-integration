# Code Review Report - Toss Payments Integration

**Project:** Toss Payments Integration (Next.js 16 + React 19)
**Review Date:** 2025-11-02
**Reviewer:** OpenAI Codex CLI (codex-review skill)
**Review Type:** Security, Code Quality, Architecture, Performance
**Scope:** Payment Widget, Checkout Flow, Configuration

---

## Executive Summary

The Toss Payments integration has been reviewed comprehensively for security vulnerabilities, code quality, architecture, and performance. The review identified **3 High-severity issues** that require immediate attention, particularly around payment security and secret key handling.

**Overall Status:** 🔴 Critical Issues Found

**Key Metrics:**
- Total Findings: 10
- **Critical/High: 3** 🔴
- Medium: 2 🟡
- Low: 5 🟢

**Critical Concerns:**
1. **Secret key exposed to client** - TOSS_SECRET_KEY is bundled into client-side code
2. **No server-side verification** - Payment amounts and order IDs can be manipulated client-side
3. **Shared order IDs** - All users share the same build-time generated order ID

---

## 🔴 High Priority Findings

### 1. Secret Key Exposed to Client Bundle

**Severity:** 🔴 Critical
**Category:** Security - Secret Exposure
**Location:** `config/constants.ts:20` → `lib/tossPayments.ts:61-94`

**Description:**
`TOSS_SECRET_KEY` is imported from `config/constants.ts` and consumed by client-only widget utilities. This means **anyone with DevTools can read the live secret key** from the bundled JavaScript.

**Impact:**
- Attackers can intercept and read the secret key
- Compromised key allows unauthorized payment API access
- Potential for fraudulent transactions and data breaches

**Recommendation:**
```typescript
// ❌ WRONG - Current implementation
// config/constants.ts
export const TOSS_PAYMENTS_CONFIG = {
  secretKey: process.env.TOSS_SECRET_KEY || '', // This gets bundled!
}

// ✅ CORRECT - Move to server-side only
// app/api/payments/route.ts (Server Action or API Route)
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY // Server-side only

// Client should only use NEXT_PUBLIC_* variables
export const TOSS_CLIENT_CONFIG = {
  clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '',
}
```

**Action Items:**
- [ ] Remove `secretKey` from `config/constants.ts`
- [ ] Create server action/API route for server-side operations
- [ ] Rotate the current secret key (assume it's compromised)
- [ ] Add lint rule to prevent non-`NEXT_PUBLIC_*` vars in client code

**Priority:** Immediate (before deployment)
**Effort:** Medium

---

### 2. Client-Side Order Data Manipulation

**Severity:** 🔴 Critical
**Category:** Security - Payment Tampering
**Location:** `app/checkout/page.tsx:24-41`, `components/PaymentWidget.tsx:87-155`

**Description:**
The checkout flow **never pulls signed order data from a trusted backend**. Users can modify `amount`, `orderId`, or callback URLs in DevTools before calling `requestPayment()`. There is no server-side verification step.

**Impact:**
- Users can change payment amounts (e.g., pay ₩1 for ₩50,000 order)
- Order IDs can be manipulated causing reconciliation issues
- Success/fail URLs can be redirected to phishing sites

**Current Vulnerable Flow:**
```typescript
// ❌ Client controls everything
const paymentData = {
  amount: 50000,  // User can change this in DevTools!
  orderId: 'order-123',
  // ... other fields
}

await widgetRef.current.requestPayment(paymentData)
```

**Recommendation:**
```typescript
// ✅ Server-side order creation and validation

// 1. Create order server-side
// app/api/orders/route.ts
export async function POST(req: Request) {
  const { items, customerId } = await req.json()

  // Calculate amount server-side
  const amount = calculateTotal(items)
  const orderId = generateUniqueOrderId()

  // Save to database with signature
  const order = await db.orders.create({
    orderId,
    amount,
    customerId,
    status: 'pending',
    signature: signOrder({ orderId, amount })
  })

  return Response.json({ orderId, amount, signature: order.signature })
}

// 2. Client fetches immutable order data
const { orderId, amount, signature } = await fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify({ items, customerId })
}).then(r => r.json())

// 3. Verify payment webhook server-side before fulfillment
// app/api/webhooks/toss/route.ts
export async function POST(req: Request) {
  const payload = await req.json()

  // Verify signature from Toss
  if (!verifyTossSignature(payload)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Verify order exists and amount matches
  const order = await db.orders.findOne({ orderId: payload.orderId })
  if (order.amount !== payload.amount) {
    return Response.json({ error: 'Amount mismatch' }, { status: 400 })
  }

  // Update order status
  await db.orders.update({ orderId: payload.orderId }, { status: 'paid' })

  return Response.json({ success: true })
}
```

**Action Items:**
- [ ] Create `/api/orders` endpoint for server-side order creation
- [ ] Implement order signature/validation system
- [ ] Create `/api/webhooks/toss` for payment verification
- [ ] Remove client-side amount/orderId generation
- [ ] Add database schema for order tracking

**Priority:** Immediate (payment security)
**Effort:** High

---

### 3. Build-Time Static Order ID Collision

**Severity:** 🔴 Critical
**Category:** Data Integrity - Order Collision
**Location:** `config/constants.ts:91-96`

**Description:**
`DEFAULT_ORDER.orderId` is calculated **once at build time**, meaning every shopper shares the same `orderId`. Toss requires unique order IDs per payment attempt. This will cause:
- Payment reuse bugs
- Order reconciliation failures
- Transaction collisions

**Current Implementation:**
```typescript
// ❌ Generated at build time - ALL users get the same ID!
export const DEFAULT_ORDER = {
  orderId: `order-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
  // ...
}
```

**Impact:**
- Multiple customers get the same order ID
- Toss API will reject duplicate order IDs
- Payments fail or get attributed to wrong customers
- Impossible to track individual transactions

**Recommendation:**
```typescript
// ✅ Generate per request on the server

// app/api/orders/route.ts
import { randomUUID } from 'crypto'

export async function POST() {
  const orderId = `order-${Date.now()}-${randomUUID().slice(0, 8)}`

  // Or use a more robust ID generation
  const orderId = `ORD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${randomUUID()}`
  // Example: ORD-20251102-a1b2c3d4-e5f6-7890-abcd-ef1234567890

  return Response.json({ orderId })
}
```

**Action Items:**
- [ ] Remove static `DEFAULT_ORDER` from constants
- [ ] Create server endpoint to generate unique order IDs
- [ ] Implement order ID validation in database (unique constraint)
- [ ] Add order ID format documentation

**Priority:** Immediate (before any production use)
**Effort:** Low

---

## 🟡 Medium Priority Findings

### 4. Missing Component Cleanup - Memory Leak Risk

**Severity:** 🟡 Medium
**Category:** Code Quality - React Best Practices
**Location:** `components/PaymentWidget.tsx:55-126`

**Description:**
The widget bootstrap uses `let isMounted = true` inside a ref callback but never sets it to `false` when the component unmounts. Pending promises can still call `setState()`, triggering React warnings and potential memory leaks.

**Current Implementation:**
```typescript
// ❌ isMounted never gets set to false
const containerRefCallback = useCallback((node: HTMLDivElement | null) => {
  if (node) {
    let isMounted = true  // Never cleaned up!

    async function initializeWidget() {
      // ... async operations
      if (isMounted) {
        setIsLoading(false)
      }
    }
    initializeWidget()
  }
}, [])
```

**Impact:**
- React warnings: "Can't perform state update on unmounted component"
- Potential memory leaks from uncancelled promises
- Widget instance not properly destroyed

**Recommendation:**
```typescript
// ✅ Proper cleanup with useEffect
useEffect(() => {
  let isMounted = true
  let widgetInstance: PaymentWidgetInstance | null = null

  async function initializeWidget() {
    try {
      const widgets = await createPaymentWidget()
      widgetInstance = widgets

      if (isMounted) {
        // ... setup widget
      }
    } catch (err) {
      if (isMounted) {
        setError(err.message)
      }
    }
  }

  initializeWidget()

  return () => {
    isMounted = false
    // Destroy widget instance if SDK provides cleanup method
    widgetInstance?.destroy?.()
  }
}, [paymentData.amount])
```

**Action Items:**
- [ ] Add proper cleanup in `useEffect` return function
- [ ] Set `isMounted = false` on unmount
- [ ] Check if Toss SDK provides widget destruction method
- [ ] Test rapid navigation away from checkout page

**Priority:** High (address in next sprint)
**Effort:** Low

---

### 5. Raw Error Messages Exposed to Users

**Severity:** 🟡 Medium
**Category:** UX/Security - Information Disclosure
**Location:** `components/PaymentWidget.tsx:156-170`

**Description:**
Raw SDK error messages are shown verbatim to end users, which can:
- Surface implementation details
- Confuse shoppers with technical jargon
- Leak internal system information

**Current Implementation:**
```typescript
// ❌ Raw error shown to user
catch (err: any) {
  setError(err.message || '위젯 로드 실패')
}
```

**Recommendation:**
```typescript
// ✅ User-friendly error mapping

const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  INVALID_AMOUNT: '결제 금액이 유효하지 않습니다.',
  WIDGET_LOAD_FAILED: '결제 시스템을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.',
  PAYMENT_CANCELLED: '결제가 취소되었습니다.',
  UNKNOWN_ERROR: '결제 처리 중 오류가 발생했습니다. 고객센터로 문의해주세요.',
}

function mapErrorToUserMessage(error: Error): string {
  // Log detailed error for debugging
  console.error('[Payment Error]', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  })

  if (error.message.includes('network')) return ERROR_MESSAGES.NETWORK_ERROR
  if (error.message.includes('amount')) return ERROR_MESSAGES.INVALID_AMOUNT
  if (error.message.includes('cancelled')) return ERROR_MESSAGES.PAYMENT_CANCELLED

  return ERROR_MESSAGES.UNKNOWN_ERROR
}

// Usage
catch (err: any) {
  const userMessage = mapErrorToUserMessage(err)
  setError(userMessage)
}
```

**Action Items:**
- [ ] Create error message mapping dictionary
- [ ] Log detailed errors server-side for monitoring
- [ ] Display user-friendly messages to customers
- [ ] Add error code system for support tracking

**Priority:** Medium
**Effort:** Low

---

## 🟢 Low Priority Findings

### 6. Type Safety: `useRef<any>` Loses Type Safety

**Location:** `components/PaymentWidget.tsx:49`
**Issue:** `useRef<any>` undermines TypeScript safety and loses autocompletion.

**Fix:**
```typescript
// ❌ Before
const widgetRef = useRef<any>(null)

// ✅ After
const widgetRef = useRef<PaymentWidgetInstance | null>(null)
```

---

### 7. Excessive Console Logging in Production

**Location:** `components/PaymentWidget.tsx:57-118`
**Issue:** Intensive `console.log`/`console.error` usage will:
- Leak PII to shared consoles
- Bloat bundle size
- Impact performance

**Fix:**
```typescript
// Create a conditional logger
const logger = process.env.NODE_ENV === 'development' ? console : {
  log: () => {},
  error: () => {},
  warn: () => {},
}

// Or use a proper logging library
import { createLogger } from '@/lib/logger'
const logger = createLogger('PaymentWidget')
```

---

### 8. SSR Safety Check Missing

**Location:** `lib/tossPayments.ts:55-94`
**Issue:** Widget helper is callable during SSR, which would crash when trying to access `window`.

**Fix:**
```typescript
export async function createPaymentWidget() {
  if (typeof window === 'undefined') {
    throw new Error('createPaymentWidget can only be called on the client side')
  }

  // ... rest of implementation
}
```

---

### 9. Weak CSP with unsafe-inline and unsafe-eval

**Location:** `next.config.ts:75-84`
**Issue:** CSP allows `'unsafe-inline'` and `'unsafe-eval'`, defeating much of CSP's security value.

**Fix:**
```typescript
// Use Next.js's built-in nonce support
const cspHeader = `
  default-src 'self';
  script-src 'self' 'nonce-{NONCE}' https://js.tosspayments.com https://*.tosspayments.com;
  style-src 'self' 'nonce-{NONCE}';
  img-src 'self' data: https:;
  connect-src 'self' https://*.tosspayments.com;
  frame-src 'self' https://*.tosspayments.com;
`
```

---

### 10. Unnecessary Re-renders from useState

**Location:** `app/checkout/page.tsx:24-29`
**Issue:** `useState` simply clones static data, causing new object on every render.

**Fix:**
```typescript
// ❌ Before - Creates new object every render
const [paymentData, setPaymentData] = useState({
  ...DEFAULT_ORDER,
  ...TEST_CUSTOMER,
  // ...
})

// ✅ After - Memoize or use constant directly
const paymentData = useMemo(() => ({
  ...DEFAULT_ORDER,
  ...TEST_CUSTOMER,
  successUrl: `${APP_CONFIG.baseUrl}/success`,
  failUrl: `${APP_CONFIG.baseUrl}/fail`,
}), [])
```

---

## Open Questions

1. **Is there a backend endpoint or webhook handler?**
   - Do you have server infrastructure ready for order creation and payment verification?
   - If not, this needs to be built before going live.

2. **Production logging requirements?**
   - Do you need verbose widget logging in production?
   - Can it be hidden behind an environment flag for QA only?

3. **Current secret key status?**
   - Has the current `TOSS_SECRET_KEY` been used in production?
   - If yes, it should be rotated immediately (assume compromised).

---

## Recommendations by Priority

### Immediate Actions (This Week)

1. **🔴 Fix secret key exposure**
   - Remove `secretKey` from client-accessible constants
   - Create server-side API routes for sensitive operations
   - Rotate current secret key

2. **🔴 Implement server-side order verification**
   - Create `/api/orders` endpoint for order creation
   - Add payment webhook handler
   - Implement order signature/validation

3. **🔴 Fix order ID generation**
   - Generate unique order IDs per request server-side
   - Remove static `DEFAULT_ORDER` constant

### Short-term Actions (Next Sprint)

4. **🟡 Add component cleanup logic**
   - Implement proper `useEffect` cleanup
   - Test unmounting scenarios

5. **🟡 Improve error handling**
   - Create user-friendly error messages
   - Add error logging and monitoring

### Long-term Actions (Backlog)

6. **🟢 Improve type safety** - Replace `any` types
7. **🟢 Add production logging controls** - Feature flags for console logs
8. **🟢 Strengthen CSP** - Remove `unsafe-inline`/`unsafe-eval`
9. **🟢 Add SSR guards** - Prevent server-side widget calls
10. **🟢 Optimize renders** - Use `useMemo` for static data

---

## Security Assessment

**Security Posture:** 🔴 Critical - Immediate Action Required

### Vulnerabilities Found

- [x] **Secret key exposure** - Critical
- [x] **Client-side payment tampering** - Critical
- [x] **Order ID collisions** - Critical
- [ ] SQL Injection - Not applicable (no direct DB queries shown)
- [ ] XSS vulnerabilities - Low risk (React escapes by default)
- [x] **Information disclosure** - Medium (raw errors)
- [x] **Weak CSP** - Low (unsafe directives)

### Security Recommendations

1. **Implement server-side payment verification** (Critical)
2. **Rotate secret keys immediately** (Critical)
3. **Add rate limiting to payment endpoints** (High)
4. **Enable security monitoring and alerting** (High)
5. **Conduct penetration testing before launch** (High)

---

## Next Steps

**Before Production Deployment:**

- [ ] Fix all 3 critical security issues
- [ ] Implement server-side order creation and verification
- [ ] Rotate secret keys
- [ ] Add comprehensive error logging
- [ ] Conduct end-to-end payment testing
- [ ] Perform security audit/penetration testing

**Follow-up Review Date:** After implementing critical fixes

**Re-review Required For:**
- [ ] Server-side payment verification implementation
- [ ] Secret key handling
- [ ] Order ID generation system
- [ ] Error handling and logging

---

## Appendix

### Tools Used
- OpenAI Codex CLI (v0.53.0)
- codex-review skill for Claude Code

### Review Methodology
Read-only sandbox mode review covering:
- Security vulnerabilities (OWASP focus)
- React/Next.js best practices
- Payment integration security
- Code quality and architecture

### References
- [Toss Payments Security Guide](https://docs.tosspayments.com/guides/security)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Best Practices](https://react.dev/learn)

---

**Report Generated:** 2025-11-02 01:58 KST
**Powered by:** codex-review skill for Claude Code
**Session ID:** 019a405a-ef66-7dd3-bf4d-7f9b31fe1da8

---

## Notes

This is a **test/development project** for learning Toss Payments integration. The critical security issues identified (secret exposure, client-side verification, order ID collisions) are **blocking issues for production deployment**.

**Do not deploy to production** until all High-severity issues are resolved and server-side verification is implemented.
