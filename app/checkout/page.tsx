/**
 * Checkout Page
 *
 * 주문 및 결제 페이지입니다.
 * 주문 정보와 결제 위젯을 표시하며, 사용자가 결제를 진행할 수 있도록 합니다.
 *
 * @route /checkout
 */
'use client'

import { useState } from 'react'
import { OrderSummary } from '@/components/OrderSummary'
import { PaymentWidget } from '@/components/PaymentWidget'
import { DEFAULT_ORDER, TEST_CUSTOMER, APP_CONFIG } from '@/config/constants'

/**
 * CheckoutPage 컴포넌트
 *
 * 좌측에 주문 요약을, 우측에 결제 위젯을 배치하는 2단 레이아웃입니다.
 * 모바일에서는 세로로 배치됩니다.
 */
export default function CheckoutPage() {
  // 주문 정보 (샘플 데이터) - readonly를 mutable로 변환
  const [order] = useState({
    orderId: DEFAULT_ORDER.orderId,
    orderName: DEFAULT_ORDER.orderName,
    amount: DEFAULT_ORDER.amount,
    items: [...DEFAULT_ORDER.items],
  })

  // 결제 요청 데이터 구성
  const paymentData = {
    orderId: order.orderId,
    orderName: order.orderName,
    amount: order.amount,
    customerName: TEST_CUSTOMER.name,
    customerEmail: TEST_CUSTOMER.email,
    customerMobilePhone: TEST_CUSTOMER.phone,
    successUrl: APP_CONFIG.successUrl,
    failUrl: APP_CONFIG.failUrl,
  }

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
