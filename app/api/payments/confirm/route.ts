/**
 * Payment Confirmation API
 *
 * 사용자가 결제를 완료한 후 Toss로부터 받은 결제 정보를 검증하고 승인합니다.
 *
 * POST /api/payments/confirm
 *
 * @see https://docs.tosspayments.com/reference#%EA%B2%B0%EC%A0%9C-%EC%8A%B9%EC%9D%B8
 */

import { NextRequest, NextResponse } from 'next/server'
import { TOSS_PAYMENTS_SERVER_CONFIG } from '@/config/server-config'

/**
 * 결제 승인 요청 타입
 */
interface ConfirmPaymentRequest {
  paymentKey: string
  orderId: string
  amount: number
}

/**
 * POST /api/payments/confirm - 결제 승인
 */
export async function POST(request: NextRequest) {
  try {
    const body: ConfirmPaymentRequest = await request.json()
    const { paymentKey, orderId, amount } = body

    // 1. 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    console.log('[Payment Confirm Request]', { orderId, amount })

    // TODO: 2. 데이터베이스에서 주문 조회
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
    //
    // // 3. 금액 검증 (매우 중요!)
    // if (order.amount !== amount) {
    //   console.error('[Amount Mismatch]', {
    //     expected: order.amount,
    //     received: amount,
    //   })
    //
    //   return NextResponse.json(
    //     { error: 'Amount mismatch - possible fraud attempt' },
    //     { status: 400 }
    //   )
    // }

    // 4. Toss Payments API 호출하여 결제 승인
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

      console.error('[Toss API Error]', error)

      return NextResponse.json(
        {
          error: 'Payment confirmation failed',
          details: error,
        },
        { status: response.status }
      )
    }

    const confirmation = await response.json()

    console.log('[Payment Confirmed]', {
      orderId,
      paymentKey,
      status: confirmation.status,
    })

    // TODO: 5. 데이터베이스 업데이트
    // await db.orders.update({
    //   where: { orderId },
    //   data: {
    //     status: 'PAID',
    //     paymentKey: confirmation.paymentKey,
    //     paidAt: new Date(confirmation.approvedAt),
    //     paymentMethod: confirmation.method,
    //   },
    // })

    // TODO: 6. 주문 처리 (상품 배송, 이메일 발송 등)
    // await processOrder(orderId)

    // 7. 응답 반환
    return NextResponse.json({
      success: true,
      orderId: confirmation.orderId,
      paymentKey: confirmation.paymentKey,
      status: confirmation.status,
      approvedAt: confirmation.approvedAt,
    })
  } catch (error) {
    console.error('[Payment Confirmation Error]', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
