/**
 * Toss Payments Webhook Handler
 *
 * Secure webhook endpoint with:
 * - HMAC-SHA256 signature verification
 * - Idempotency handling for duplicate prevention
 * - Security event logging
 * - Rate limiting
 *
 * POST /api/webhooks/toss
 *
 * @see https://docs.tosspayments.com/reference/webhook
 */

import { NextRequest, NextResponse } from 'next/server'
import { TOSS_PAYMENTS_SERVER_CONFIG } from '@/config/server-config'
import { verifyWebhookSignature } from '@/lib/webhooks/verifySignature'
import { IdempotencyHandler } from '@/lib/webhooks/idempotencyHandler'
import crypto from 'crypto'

/**
 * Toss Payments Webhook 이벤트 타입
 */
interface TossWebhookEvent {
  eventType: string // PAYMENT_STATUS_CHANGED
  data: {
    orderId: string
    paymentKey: string
    status: string
    totalAmount: number
    method: string
    approvedAt?: string
  }
}

/**
 * 결제 승인 API 호출
 * Toss Payments 서버에 결제를 확인하고 승인합니다.
 */
async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<any> {
  const url = `${TOSS_PAYMENTS_SERVER_CONFIG.apiUrl}/payments/confirm`

  const response = await fetch(url, {
    method: 'POST',
    headers: TOSS_PAYMENTS_SERVER_CONFIG.getAuthHeaders(),
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Payment confirmation failed: ${JSON.stringify(error)}`)
  }

  return response.json()
}

// Singleton idempotency handler (24 hour TTL)
const idempotencyHandler = new IdempotencyHandler(24 * 60 * 60) // 86400 seconds

// Rate limiting state (in-memory)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 50 // Max 50 requests per minute per IP

// Export for testing
export function __clearTestState__() {
  idempotencyHandler.clear()
  rateLimitStore.clear()
}

/**
 * Check rate limit for IP address
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (!record || now > record.resetAt) {
    // Create new window
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  record.count++
  rateLimitStore.set(ip, record)
  return true
}

/**
 * POST /api/webhooks/toss - Secure Webhook Handler
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  try {
    // Step 1: Rate limiting
    if (!checkRateLimit(ip)) {
      console.warn('[Rate Limit Exceeded]', { ip, requestId })
      return NextResponse.json(
        { error: 'Too many requests', success: false },
        { status: 429 }
      )
    }

    // Step 2: Read request body
    const body = await request.text()
    let event: TossWebhookEvent

    console.log('[Webhook Received]', { requestId, ip })

    try {
      event = JSON.parse(body)
    } catch (parseError) {
      console.error('[JSON Parse Error]', { requestId, error: parseError })
      return NextResponse.json(
        { error: 'Invalid JSON payload', success: false },
        { status: 400 }
      )
    }

    // Step 3: Verify webhook secret is configured
    // Read from env directly to support test mocking
    const webhookSecret = process.env.TOSS_WEBHOOK_SECRET || TOSS_PAYMENTS_SERVER_CONFIG.webhookSecret
    if (!webhookSecret || webhookSecret.trim() === '') {
      console.error('[Config Error]', { requestId, error: 'Webhook secret not configured' })
      return NextResponse.json(
        { error: 'Webhook secret not configured', success: false },
        { status: 500 }
      )
    }

    // Step 4: Signature verification
    console.log('[Signature Verification]', { requestId })
    const signature = request.headers.get('Toss-Signature') || ''

    const verificationResult = await verifyWebhookSignature(
      body,
      signature,
      webhookSecret
    )

    const signaturePrefix = signature ? signature.substring(0, 8) : undefined

    if (!verificationResult.isValid) {
      const reason = verificationResult.reason === 'MISSING_SIGNATURE'
        ? 'Missing signature'
        : 'Invalid signature'

      console.warn('[Webhook Verification Failed]', {
        reason,
        orderId: event.data?.orderId,
        requestId,
        timestamp: new Date().toISOString(),
        signaturePresent: !!signature,
        signaturePrefix,
      })

      return NextResponse.json(
        { error: reason, success: false },
        { status: 401 }
      )
    }

    // Step 5: Idempotency check
    console.log('[Idempotency Check]', { requestId })
    const idempotencyKey = request.headers.get('Toss-Idempotency-Key')

    if (!idempotencyKey || idempotencyKey.trim() === '') {
      console.warn('[Missing Idempotency Key]', { requestId, orderId: event.data?.orderId })
      return NextResponse.json(
        { error: 'Missing idempotency key', success: false },
        { status: 400 }
      )
    }

    const isNewRequest = await idempotencyHandler.checkAndRecord(idempotencyKey)

    if (!isNewRequest) {
      console.warn('[Duplicate Request]', { requestId, idempotencyKey, orderId: event.data?.orderId })
      return NextResponse.json(
        { error: 'Duplicate request', success: false },
        { status: 409 }
      )
    }

    // Step 6: Validate event data
    if (!event.data || !event.data.orderId || !event.data.paymentKey) {
      console.error('[Invalid Payload]', { requestId, event })
      return NextResponse.json(
        { error: 'Invalid webhook payload', success: false },
        { status: 400 }
      )
    }

    // Step 7: Log successful verification
    console.log('[Webhook Verified]', {
      orderId: event.data.orderId,
      eventType: event.eventType,
      verified: true,
      requestId,
      timestamp: new Date().toISOString(),
      signaturePresent: true,
      signaturePrefix,
    })

    // Step 8: Process webhook based on event type and status
    if (event.eventType !== 'PAYMENT_STATUS_CHANGED') {
      return NextResponse.json(
        { error: 'Unsupported event type', success: false },
        { status: 400 }
      )
    }

    // Return 202 for non-DONE statuses (acknowledged but not processed)
    if (event.data.status !== 'DONE') {
      console.log('[Webhook Acknowledged]', {
        status: event.data.status,
        orderId: event.data.orderId,
        requestId
      })
      return NextResponse.json(
        { success: true, acknowledged: true },
        { status: 202 }
      )
    }

    const { orderId, paymentKey, totalAmount } = event.data

    // Step 9: Confirm payment with Toss
    try {
      const confirmation = await confirmPayment(paymentKey, orderId, totalAmount)

      console.log('[Payment Confirmed]', {
        orderId,
        paymentKey,
        approvedAt: confirmation.approvedAt,
        requestId,
      })

      const response = {
        success: true,
        message: 'Webhook processed',
        orderId,
      }

      // Record response for idempotency
      await idempotencyHandler.recordResponse(idempotencyKey, response)

      return NextResponse.json(response, { status: 200 })
    } catch (confirmError) {
      console.error('[Payment Confirmation Error]', { requestId, error: confirmError })
      return NextResponse.json(
        { error: 'Payment confirmation failed', success: false },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Webhook Processing Error]', { requestId, error })
    return NextResponse.json(
      { error: 'Webhook processing failed', success: false },
      { status: 500 }
    )
  }
}
