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

import { useLayoutEffect, useRef, useState } from 'react'
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
  const isInitializedRef = useRef(false)

  /**
   * 위젯 초기화 및 cleanup
   */
  useLayoutEffect(() => {
    // 이미 초기화되었다면 중복 실행 방지
    if (isInitializedRef.current) {
      console.log('⏭️ 이미 초기화됨 - 스킵')
      return
    }

    let isMounted = true

    async function initializeWidget() {
      try {
        console.log('🔄 위젯 초기화 시작...')

        // DOM 요소 존재 확인
        const paymentMethodEl = document.querySelector('#payment-method')
        const agreementEl = document.querySelector('#agreement')

        console.log('🔍 DOM 요소 검색:', {
          paymentMethodEl: paymentMethodEl ? '✅' : '❌',
          agreementEl: agreementEl ? '✅' : '❌'
        })

        if (!paymentMethodEl || !agreementEl) {
          throw new Error('결제 UI 요소를 찾을 수 없습니다.')
        }

        console.log('✅ DOM 요소 확인 완료')

        // 위젯 생성
        const widgets = await createPaymentWidget()
        console.log('✅ 위젯 생성 완료')

        if (!isMounted) return
        widgetRef.current = widgets

        // 결제 금액 설정
        console.log('💰 금액 설정 중:', paymentData.amount)
        await widgets.setAmount({
          currency: 'KRW',
          value: paymentData.amount,
        })
        console.log('✅ 금액 설정 완료')

        // 결제 수단 렌더링
        console.log('🎨 결제 수단 렌더링 시작...')
        await widgets.renderPaymentMethods({
          selector: '#payment-method',
          variantKey: 'DEFAULT',
        })
        console.log('✅ 결제 수단 렌더링 완료')

        // 약관 렌더링
        console.log('📄 약관 렌더링 시작...')
        await widgets.renderAgreement({
          selector: '#agreement',
          variantKey: 'AGREEMENT',
        })
        console.log('✅ 약관 렌더링 완료')

        if (isMounted) {
          console.log('✅ 위젯 초기화 완료!')
          isInitializedRef.current = true
          setIsLoading(false)
        }
      } catch (err: any) {
        console.error('❌ Widget initialization failed:', err)
        if (isMounted) {
          setError(err.message || '위젯 로드 실패')
          setIsLoading(false)
        }
      }
    }

    initializeWidget()

    // Cleanup: 컴포넌트 언마운트 시 위젯 정리
    return () => {
      console.log('🧹 위젯 정리 중...')
      isMounted = false
      isInitializedRef.current = false
      widgetRef.current = null
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
      {isLoading && (
        <div className="text-center p-4">
          <LoadingSpinner message="결제 위젯을 불러오는 중..." size="md" />
        </div>
      )}

      {/* 결제 수단 선택 */}
      <div
        id="payment-method"
        role="region"
        aria-label="결제 수단 선택"
        className="min-h-[200px]"
      />

      {/* 약관 동의 */}
      <div
        id="agreement"
        role="region"
        aria-label="이용약관 동의"
        className="min-h-[100px]"
      />

      {/* 결제 버튼 */}
      <button
        onClick={handlePayment}
        className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        aria-label="결제하기"
        type="button"
        disabled={isLoading}
      >
        결제하기
      </button>
    </div>
  )
}
