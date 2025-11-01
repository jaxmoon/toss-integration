'use client'

import { useState, useCallback } from 'react'
import { createPaymentWidget } from '@/lib/tossPayments'
import type { PaymentRequest } from '@/types/payment'

/**
 * 결제 상태 인터페이스
 */
interface PaymentState {
  /** 결제 진행 중 여부 */
  isLoading: boolean
  /** 에러 메시지 */
  error: string | null
  /** 결제 성공 여부 */
  isSuccess: boolean
}

/**
 * usePayment Hook
 *
 * Toss Payments 결제 요청을 관리하는 커스텀 훅입니다.
 * 결제 상태(로딩, 에러, 성공)를 추적하고 결제 요청 함수를 제공합니다.
 *
 * @example
 * ```tsx
 * function CheckoutPage() {
 *   const { isLoading, error, requestPayment } = usePayment()
 *
 *   const handlePay = () => {
 *     requestPayment({
 *       orderId: 'order-123',
 *       orderName: '샘플 상품',
 *       amount: 50000,
 *       customerName: '홍길동',
 *       customerEmail: 'test@example.com',
 *       customerMobilePhone: '01012345678',
 *       successUrl: window.location.origin + '/success',
 *       failUrl: window.location.origin + '/fail',
 *     })
 *   }
 *
 *   return (
 *     <button onClick={handlePay} disabled={isLoading}>
 *       {isLoading ? '결제 진행 중...' : '결제하기'}
 *     </button>
 *   )
 * }
 * ```
 *
 * @returns 결제 상태와 결제 요청 함수
 */
export function usePayment() {
  const [state, setState] = useState<PaymentState>({
    isLoading: false,
    error: null,
    isSuccess: false,
  })

  /**
   * 결제 요청 함수
   *
   * @param paymentData - 결제 요청 데이터
   */
  const requestPayment = useCallback(
    async (paymentData: PaymentRequest) => {
      setState({ isLoading: true, error: null, isSuccess: false })

      try {
        const widgets = await createPaymentWidget()

        // 금액 설정
        await widgets.setAmount({
          currency: 'KRW',
          value: paymentData.amount,
        })

        // 결제 요청
        await widgets.requestPayment({
          orderId: paymentData.orderId,
          orderName: paymentData.orderName,
          successUrl: paymentData.successUrl,
          failUrl: paymentData.failUrl,
          customerName: paymentData.customerName,
          customerEmail: paymentData.customerEmail,
          customerMobilePhone: paymentData.customerMobilePhone,
        })

        setState({ isLoading: false, error: null, isSuccess: true })
      } catch (error: unknown) {
        console.error('Payment request failed:', error)
        const errorMessage = error instanceof Error
          ? error.message
          : '결제 요청에 실패했습니다'

        setState({
          isLoading: false,
          error: errorMessage,
          isSuccess: false,
        })
      }
    },
    []
  )

  return {
    ...state,
    requestPayment,
  }
}
