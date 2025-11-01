/**
 * Checkout Page
 *
 * 주문 및 결제 페이지입니다.
 * 주문 정보와 결제 위젯을 표시하며, 사용자가 결제를 진행할 수 있도록 합니다.
 *
 * @route /checkout
 */
'use client'

import { useState, useEffect } from 'react'
import { OrderSummary } from '@/components/OrderSummary'
import { PaymentWidget } from '@/components/PaymentWidget'
import { DEFAULT_ORDER_SAMPLE, TEST_CUSTOMER, APP_CONFIG } from '@/config/constants'

/**
 * CheckoutPage 컴포넌트
 *
 * 좌측에 주문 요약을, 우측에 결제 위젯을 배치하는 2단 레이아웃입니다.
 * 모바일에서는 세로로 배치됩니다.
 */
export default function CheckoutPage() {
  // 서버에서 생성된 주문 정보
  const [order, setOrder] = useState<{
    orderId: string
    orderName: string
    amount: number
    items: Array<{
      id: string
      name: string
      price: number
      quantity: number
      imageUrl: string
    }>
  } | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 컴포넌트 마운트 시 서버에서 주문 생성
  useEffect(() => {
    async function createOrder() {
      try {
        setIsLoading(true)

        // 서버 API 호출하여 주문 생성
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: DEFAULT_ORDER_SAMPLE.amount,
            orderName: DEFAULT_ORDER_SAMPLE.orderName,
            customerName: TEST_CUSTOMER.name,
            customerEmail: TEST_CUSTOMER.email,
            customerMobilePhone: TEST_CUSTOMER.phone,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '주문 생성 실패')
        }

        const orderData = await response.json()

        setOrder({
          orderId: orderData.orderId,
          orderName: orderData.orderName,
          amount: orderData.amount,
          items: [...DEFAULT_ORDER_SAMPLE.items],
        })
      } catch (err) {
        console.error('[Order Creation Error]', err)
        setError(err instanceof Error ? err.message : '주문 생성 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    createOrder()
  }, [])

  // 결제 요청 데이터 구성
  const paymentData = order
    ? {
        orderId: order.orderId,
        orderName: order.orderName,
        amount: order.amount,
        customerName: TEST_CUSTOMER.name,
        customerEmail: TEST_CUSTOMER.email,
        customerMobilePhone: TEST_CUSTOMER.phone,
        successUrl: APP_CONFIG.successUrl,
        failUrl: APP_CONFIG.failUrl,
      }
    : null

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:py-12">
      <div className="max-w-7xl mx-auto">
        {/* 페이지 헤더 */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            주문/결제
          </h1>
          <p className="text-gray-600">
            결제 정보를 확인하고 결제를 진행해주세요.
          </p>
        </header>

        {/* 주문 요약 및 결제 위젯 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">주문 정보를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold mb-2">주문 생성 실패</p>
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              다시 시도
            </button>
          </div>
        ) : order && paymentData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 주문 요약 */}
            <section aria-label="주문 정보">
              <OrderSummary order={order} />
            </section>

            {/* 결제 위젯 */}
            <section aria-label="결제 정보">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  결제 정보
                </h2>
                <PaymentWidget paymentData={paymentData} />
              </div>
            </section>
          </div>
        ) : null}

        {/* 테스트 안내 */}
        <aside
          className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          role="complementary"
          aria-label="테스트 안내"
        >
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            테스트 결제 안내
          </h3>
          <p className="text-sm text-blue-800">
            테스트 환경에서는 실제 결제가 발생하지 않습니다.
            <br />
            테스트 카드번호: <code className="font-mono bg-white px-1">4242 4242 4242 4242</code>
          </p>
        </aside>
      </div>
    </main>
  )
}
