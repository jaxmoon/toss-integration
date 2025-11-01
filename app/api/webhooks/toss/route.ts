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
import {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  ERROR_MESSAGES,
  HTTP_STATUS,
  WEBHOOK_IDEMPOTENCY_TTL_SECONDS,
  FIRST_ELEMENT_INDEX,
  SIGNATURE_PREFIX_LENGTH,
} from '@/lib/webhooks/constants'
import { PaymentConfirmation } from '@/types/payment'
import crypto from 'crypto'

/**
 * Toss Payments Webhook 이벤트 타입
 */
/**
 * Webhook processing response
 * Returned to Toss Payments after successful webhook processing
 */
interface WebhookResponse {
  readonly success: boolean
  readonly message: string
  readonly orderId: string
}

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
): Promise<PaymentConfirmation> {
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
const idempotencyHandler = new IdempotencyHandler<WebhookResponse>(WEBHOOK_IDEMPOTENCY_TTL_SECONDS)

// Rate limiting state (in-memory)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

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
  const ip = request.headers.get('x-forwarded-for')?.split(',')[FIRST_ELEMENT_INDEX] || 'unknown'

  try {
    // Step 1: Rate limiting
    if (!checkRateLimit(ip)) {
      console.warn('[Rate Limit Exceeded]', { ip, requestId })
      return NextResponse.json(
        { error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED, success: false },
        { status: HTTP_STATUS.TOO_MANY_REQUESTS }
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
        { error: ERROR_MESSAGES.INVALID_JSON, success: false },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Step 3: Verify webhook secret is configured
    // Read from env directly to support test mocking
    const webhookSecret = process.env.TOSS_WEBHOOK_SECRET || TOSS_PAYMENTS_SERVER_CONFIG.webhookSecret
    if (!webhookSecret || webhookSecret.trim() === '') {
      console.error('[Config Error]', { requestId, error: 'Webhook secret not configured' })
      return NextResponse.json(
        { error: ERROR_MESSAGES.WEBHOOK_NOT_CONFIGURED, success: false },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
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

    const signaturePrefix = signature ? signature.substring(0, SIGNATURE_PREFIX_LENGTH) : undefined

    if (!verificationResult.isValid) {
      const reason = verificationResult.reason === 'MISSING_SIGNATURE'
        ? ERROR_MESSAGES.MISSING_SIGNATURE_HEADER
        : ERROR_MESSAGES.SIGNATURE_VERIFICATION_FAILED

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
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Step 5: Idempotency check
    console.log('[Idempotency Check]', { requestId })
    const idempotencyKey = request.headers.get('Toss-Idempotency-Key')

    if (!idempotencyKey || idempotencyKey.trim() === '') {
      console.warn('[Missing Idempotency Key]', { requestId, orderId: event.data?.orderId })
      return NextResponse.json(
        { error: ERROR_MESSAGES.MISSING_IDEMPOTENCY_KEY, success: false },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const isNewRequest = await idempotencyHandler.checkAndRecord(idempotencyKey)

    if (!isNewRequest) {
      console.warn('[Duplicate Request]', { requestId, idempotencyKey, orderId: event.data?.orderId })
      return NextResponse.json(
        { error: ERROR_MESSAGES.DUPLICATE_REQUEST, success: false },
        { status: HTTP_STATUS.CONFLICT }
      )
    }

    // Step 6: Validate event data
    if (!event.data || !event.data.orderId || !event.data.paymentKey) {
      console.error('[Invalid Payload]', { requestId, event })
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_PAYLOAD, success: false },
        { status: HTTP_STATUS.BAD_REQUEST }
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
        { error: ERROR_MESSAGES.UNSUPPORTED_EVENT_TYPE, success: false },
        { status: HTTP_STATUS.BAD_REQUEST }
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
        { error: ERROR_MESSAGES.PAYMENT_CONFIRMATION_FAILED, success: false },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }
  } catch (error) {
    console.error('[Webhook Processing Error]', { requestId, error })
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR, success: false },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}
