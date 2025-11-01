/**
 * Toss Payments Webhook Handler
 *
 * Toss로부터 결제 완료 알림을 받고 서버에서 검증합니다.
 *
 * POST /api/webhooks/toss
 *
 * @see https://docs.tosspayments.com/reference/webhook
 */

import { NextRequest, NextResponse } from 'next/server'
import { TOSS_PAYMENTS_SERVER_CONFIG } from '@/config/server-config'

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

/**
 * POST /api/webhooks/toss - Toss Webhook 처리
 */
export async function POST(request: NextRequest) {
  try {
    const event: TossWebhookEvent = await request.json()

    console.log('[Toss Webhook Received]', {
      eventType: event.eventType,
      orderId: event.data.orderId,
      status: event.data.status,
    })

    // 1. 이벤트 타입 확인
    if (event.eventType !== 'PAYMENT_STATUS_CHANGED') {
      return NextResponse.json(
        { error: 'Unsupported event type' },
        { status: 400 }
      )
    }

    // 2. 결제 완료 상태인지 확인
    if (event.data.status !== 'DONE') {
      console.log(`[Webhook] Payment not completed. Status: ${event.data.status}`)
      return NextResponse.json({ received: true })
    }

    const { orderId, paymentKey, totalAmount } = event.data

    // TODO: 3. 데이터베이스에서 주문 조회
    // const order = await db.orders.findUnique({
    //   where: { orderId },
    // })
    //
    // if (!order) {
    //   return NextResponse.json(
    //     { error: 'Order not found' },
    //     { status: 404 }
    //   )
    // }

    // TODO: 4. 금액 검증 (중요!)
    // if (order.amount !== totalAmount) {
    //   console.error('[Amount Mismatch]', {
    //     expected: order.amount,
    //     received: totalAmount,
    //   })
    //
    //   return NextResponse.json(
    //     { error: 'Amount mismatch' },
    //     { status: 400 }
    //   )
    // }

    // 5. Toss에 결제 승인 요청
    try {
      const confirmation = await confirmPayment(paymentKey, orderId, totalAmount)

      console.log('[Payment Confirmed]', {
        orderId,
        paymentKey,
        approvedAt: confirmation.approvedAt,
      })

      // TODO: 6. 데이터베이스 업데이트
      // await db.orders.update({
      //   where: { orderId },
      //   data: {
      //     status: 'PAID',
      //     paymentKey,
      //     paidAt: new Date(confirmation.approvedAt),
      //     paymentMethod: confirmation.method,
      //   },
      // })

      // TODO: 7. 주문 처리 로직 (상품 배송, 이메일 발송 등)
      // await processOrder(orderId)

      return NextResponse.json({
        success: true,
        orderId,
      })
    } catch (confirmError) {
      console.error('[Payment Confirmation Error]', confirmError)

      // TODO: 실패한 주문 상태 업데이트
      // await db.orders.update({
      //   where: { orderId },
      //   data: {
      //     status: 'FAILED',
      //     failureReason: String(confirmError),
      //   },
      // })

      return NextResponse.json(
        { error: 'Payment confirmation failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Webhook Processing Error]', error)

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
