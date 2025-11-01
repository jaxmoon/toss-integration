/**
 * Order Creation API
 *
 * 서버에서 안전하게 주문을 생성하고 고유한 Order ID를 발급합니다.
 *
 * POST /api/orders
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

/**
 * Order 생성 요청 타입
 */
interface CreateOrderRequest {
  amount: number
  orderName: string
  customerName: string
  customerEmail: string
  customerMobilePhone?: string
}

/**
 * Order 생성 응답 타입
 */
interface CreateOrderResponse {
  orderId: string
  amount: number
  orderName: string
  createdAt: string
}

/**
 * Order ID 생성
 * 형식: ORD-YYYYMMDD-UUID
 */
function generateOrderId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const uuid = randomUUID().slice(0, 8)
  return `ORD-${date}-${uuid}`
}

/**
 * 주문 정보 검증
 */
function validateOrderRequest(data: Partial<CreateOrderRequest>): {
  valid: boolean
  error?: string
} {
  if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
    return { valid: false, error: 'Invalid amount' }
  }

  if (!data.orderName || typeof data.orderName !== 'string') {
    return { valid: false, error: 'Invalid orderName' }
  }

  if (!data.customerName || typeof data.customerName !== 'string') {
    return { valid: false, error: 'Invalid customerName' }
  }

  if (!data.customerEmail || typeof data.customerEmail !== 'string') {
    return { valid: false, error: 'Invalid customerEmail' }
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.customerEmail)) {
    return { valid: false, error: 'Invalid email format' }
  }

  return { valid: true }
}

/**
 * POST /api/orders - Order 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body: Partial<CreateOrderRequest> = await request.json()

    // 1. 요청 검증
    const validation = validateOrderRequest(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // 2. 고유한 Order ID 생성
    const orderId = generateOrderId()

    // 3. Order 데이터 생성
    const orderData: CreateOrderResponse = {
      orderId,
      amount: body.amount!,
      orderName: body.orderName!,
      createdAt: new Date().toISOString(),
    }

    // TODO: 실제 프로덕션 환경에서는 데이터베이스에 저장
    // await db.orders.create({
    //   orderId,
    //   amount: body.amount,
    //   orderName: body.orderName,
    //   customerName: body.customerName,
    //   customerEmail: body.customerEmail,
    //   customerMobilePhone: body.customerMobilePhone,
    //   status: 'PENDING',
    //   createdAt: new Date(),
    // })

    console.log('[Order Created]', orderData)

    // 4. 응답 반환
    return NextResponse.json(orderData, { status: 201 })
  } catch (error) {
    console.error('[Order Creation Error]', error)

    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/orders/[orderId] - Order 조회
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const orderId = url.searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId parameter' },
        { status: 400 }
      )
    }

    // TODO: 데이터베이스에서 Order 조회
    // const order = await db.orders.findUnique({ where: { orderId } })
    //
    // if (!order) {
    //   return NextResponse.json(
    //     { error: 'Order not found' },
    //     { status: 404 }
    //   )
    // }
    //
    // return NextResponse.json(order)

    return NextResponse.json(
      { error: 'Not implemented - Database integration required' },
      { status: 501 }
    )
  } catch (error) {
    console.error('[Order Fetch Error]', error)

    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
