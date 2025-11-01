import type { Order, OrderItem } from '@/types/payment'
import { formatCurrency } from '@/lib/format'

export interface OrderSummaryProps {
  order: Order
}

/**
 * OrderItem 컴포넌트 - 단일 주문 항목 표시
 */
function OrderItemRow({ item }: { item: OrderItem }) {
  const subtotal = item.price * item.quantity
  const showUnitPrice = item.quantity > 1

  return (
    <div
      className="flex items-start justify-between gap-4"
      role="listitem"
    >
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{item.name}</h3>
        <p className="text-sm text-gray-500 mt-1">
          수량: {item.quantity}개
        </p>
      </div>
      <div className="text-right">
        <p className="font-medium text-gray-900" aria-label={`소계 ${formatCurrency(subtotal)}`}>
          {formatCurrency(subtotal)}
        </p>
        {showUnitPrice && (
          <p className="text-sm text-gray-500" aria-label={`개당 ${formatCurrency(item.price)}`}>
            @{formatCurrency(item.price)}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * OrderSummary 컴포넌트 - 주문 요약 정보 표시
 *
 * 접근성:
 * - 시맨틱 HTML 사용 (section, header, ul)
 * - ARIA labels 제공
 * - 스크린 리더 친화적 구조
 *
 * 반응형:
 * - 모바일 우선 디자인
 * - Flexbox로 유연한 레이아웃
 */
export function OrderSummary({ order }: OrderSummaryProps) {
  const { orderName, amount, items } = order

  return (
    <section
      className="bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4"
      aria-labelledby="order-summary-title"
    >
      {/* 주문명 */}
      <header className="border-b pb-4">
        <h2
          id="order-summary-title"
          className="text-xl font-bold text-gray-900"
        >
          {orderName}
        </h2>
      </header>

      {/* 주문 상품 목록 */}
      <div
        className="space-y-3"
        role="list"
        aria-label="주문 상품 목록"
      >
        {items.map((item) => (
          <OrderItemRow key={item.id} item={item} />
        ))}
      </div>

      {/* 총 결제금액 */}
      <footer className="border-t pt-4">
        <div className="flex items-center justify-between">
          <span
            className="text-lg font-bold text-gray-900"
            id="total-amount-label"
          >
            총 결제금액
          </span>
          <span
            className="text-2xl font-bold text-blue-600"
            aria-labelledby="total-amount-label"
            aria-live="polite"
          >
            {formatCurrency(amount)}
          </span>
        </div>
      </footer>
    </section>
  )
}
