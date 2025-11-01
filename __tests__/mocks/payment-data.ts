// __tests__/mocks/payment-data.ts
import type {
  Order,
  OrderItem,
  Customer,
  PaymentRequest,
  PaymentConfirmation,
} from '@/types/payment'

export const mockOrderItem: OrderItem = {
  id: 'item-001',
  name: '테스트 상품',
  price: 10000,
  quantity: 1,
  imageUrl: '/test-image.jpg',
}

export const mockOrder: Order = {
  orderId: 'order-test-001',
  orderName: '테스트 주문',
  amount: 10000,
  items: [mockOrderItem],
}

export const mockCustomer: Customer = {
  name: '홍길동',
  email: 'test@example.com',
  phone: '01012345678',
}

export const mockPaymentRequest: PaymentRequest = {
  orderId: 'order-test-001',
  orderName: '테스트 주문',
  amount: 10000,
  customerName: '홍길동',
  customerEmail: 'test@example.com',
  customerMobilePhone: '01012345678',
  successUrl: 'http://localhost:3000/success',
  failUrl: 'http://localhost:3000/fail',
}

export const mockPaymentConfirmation: PaymentConfirmation = {
  paymentKey: 'test_payment_key_123',
  orderId: 'order-test-001',
  status: 'DONE',
  totalAmount: 10000,
  method: '카드',
  requestedAt: '2024-01-01T00:00:00+09:00',
  approvedAt: '2024-01-01T00:00:10+09:00',
}
