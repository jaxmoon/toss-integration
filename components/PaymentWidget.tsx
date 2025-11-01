/**
 * PaymentWidget Component
 *
 * Toss Payments 위젯을 렌더링하고 결제를 요청하는 컴포넌트입니다.
 * 결제 수단 선택 UI와 약관 동의 UI를 표시하며, 결제 버튼을 통해 결제를 시작합니다.
 *
 * @example
 * ```tsx
 * <PaymentWidget
 *   paymentData={{
 *     orderId: 'order-123',
 *     orderName: '토스 티셔츠 외 2건',
 *     amount: 50000,
 *     customerName: '홍길동',
 *     customerEmail: 'test@example.com',
 *     customerMobilePhone: '01012345678',
 *     successUrl: 'http://localhost:3000/success',
 *     failUrl: 'http://localhost:3000/fail'
 *   }}
 * />
 * ```
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { createPaymentWidget } from '@/lib/tossPayments'
import { LoadingSpinner } from './LoadingSpinner'
import type { PaymentRequest } from '@/types/payment'

export interface PaymentWidgetProps {
  /** 결제 요청 데이터 */
  paymentData: PaymentRequest
  /** 결제 요청 시작 시 호출되는 콜백 (선택사항) */
  onPaymentRequest?: () => void
}

/**
 * PaymentWidget 컴포넌트
 *
 * Toss Payments Widget SDK를 사용하여 결제 UI를 렌더링하고
 * 결제 요청을 처리합니다.
 */
export function PaymentWidget({
  paymentData,
  onPaymentRequest,
}: PaymentWidgetProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const widgetRef = useRef<any>(null)
  const paymentMethodRef = useRef<HTMLDivElement>(null)
  const agreementRef = useRef<HTMLDivElement>(null)

  /**
   * 위젯 초기화 및 렌더링
   *
   * useEffect를 사용하여 컴포넌트 마운트 시 위젯을 초기화하고
   * 결제 수단 UI와 약관 UI를 렌더링합니다.
   */
  useEffect(() => {
    let isMounted = true

    async function initializeWidget() {
      try {
        // 위젯 생성
        const widgets = await createPaymentWidget()
        widgetRef.current = widgets

        // 결제 금액 설정
        await widgets.setAmount({
          currency: 'KRW',
          value: paymentData.amount,
        })

        // 결제 수단 렌더링
        if (paymentMethodRef.current) {
          await widgets.renderPaymentMethods({
            selector: '#payment-method',
            variantKey: 'DEFAULT',
          })
        }

        // 약관 렌더링
        if (agreementRef.current) {
          await widgets.renderAgreement({
            selector: '#agreement',
            variantKey: 'AGREEMENT',
          })
        }

        if (isMounted) {
          setIsLoading(false)
        }
      } catch (err: any) {
        console.error('Widget initialization failed:', err)
        if (isMounted) {
          setError(err.message || '위젯 로드 실패')
          setIsLoading(false)
        }
      }
    }

    initializeWidget()

    // 클린업: 컴포넌트 언마운트 시 상태 업데이트 방지
    return () => {
      isMounted = false
    }
  }, [paymentData.amount])

  /**
   * 결제 요청 핸들러
   *
   * 위젯의 requestPayment 메서드를 호출하여 결제 창을 엽니다.
   * 결제 완료 시 successUrl로, 실패 시 failUrl로 리다이렉트됩니다.
   */
  const handlePayment = async () => {
    if (!widgetRef.current) {
      setError('위젯이 초기화되지 않았습니다')
      return
    }

    try {
      // 결제 요청 시작 콜백 호출
      onPaymentRequest?.()

      // 결제 요청
      await widgetRef.current.requestPayment({
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        successUrl: paymentData.successUrl,
        failUrl: paymentData.failUrl,
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        customerMobilePhone: paymentData.customerMobilePhone,
      })
    } catch (err: any) {
      console.error('Payment request failed:', err)
      setError(err.message || '결제 요청 실패')
    }
  }

  // 로딩 상태
  if (isLoading) {
    return <LoadingSpinner message="결제 위젯을 불러오는 중..." size="md" />
  }

  // 에러 상태
  if (error) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="text-center p-8 bg-red-50 rounded-lg"
      >
        <p className="text-red-600 font-medium mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          aria-label="페이지 새로고침"
        >
          새로고침
        </button>
      </div>
    )
  }

  // 위젯 렌더링
  return (
    <div className="space-y-6">
      {/* 결제 수단 선택 */}
      <div
        id="payment-method"
        ref={paymentMethodRef}
        role="region"
        aria-label="결제 수단 선택"
      />

      {/* 약관 동의 */}
      <div
        id="agreement"
        ref={agreementRef}
        role="region"
        aria-label="이용약관 동의"
      />

      {/* 결제 버튼 */}
      <button
        onClick={handlePayment}
        className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        aria-label="결제하기"
        type="button"
      >
        결제하기
      </button>
    </div>
  )
}
