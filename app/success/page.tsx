/**
 * Success Page
 *
 * 결제 성공 페이지입니다.
 * URL 쿼리 파라미터에서 결제 정보를 받아 백엔드 API로 검증하고,
 * 검증 완료 후 결제 완료 화면을 표시합니다.
 *
 * @route /success?paymentKey=...&orderId=...&amount=...
 */
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import type { PaymentConfirmation } from '@/types/payment'

/**
 * SuccessContent 컴포넌트
 *
 * useSearchParams를 사용하므로 Suspense로 감싸야 합니다.
 */
function SuccessContent() {
  const searchParams = useSearchParams()
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<PaymentConfirmation | null>(null)

  useEffect(() => {
    // URL 파라미터 추출
    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')
    const amount = searchParams.get('amount')

    // 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount) {
      setError('결제 정보가 올바르지 않습니다.')
      setIsVerifying(false)
      return
    }

    // 결제 검증 API 호출
    async function verifyPayment() {
      try {
        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(
            data.error?.message || '결제 검증에 실패했습니다.'
          )
        }

        setPaymentInfo(data.data)
        setIsVerifying(false)
      } catch (err: any) {
        console.error('Payment verification failed:', err)
        setError(err.message || '결제 검증 중 오류가 발생했습니다.')
        setIsVerifying(false)
      }
    }

    verifyPayment()
  }, [searchParams])

  // 검증 중 로딩
  if (isVerifying) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner message="결제를 확인하는 중..." size="lg" />
      </main>
    )
  }

  // 검증 실패 에러
  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div
          role="alert"
          aria-live="assertive"
          className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full"
        >
          <div className="text-center">
            <div
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4"
              aria-hidden="true"
            >
              <span className="text-white text-3xl font-bold">✕</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              결제 검증 실패
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <a
              href="/checkout"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              다시 시도
            </a>
          </div>
        </div>
      </main>
    )
  }

  // 결제 성공
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* 성공 아이콘 */}
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
            aria-hidden="true"
          >
            <span className="text-white text-3xl font-bold">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">결제 완료</h1>
        </div>

        {/* 결제 정보 */}
        {paymentInfo && (
          <div
            className="space-y-3 mb-6"
            role="region"
            aria-label="결제 상세 정보"
          >
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600 text-sm">주문번호</span>
              <span className="font-medium text-gray-900">
                {paymentInfo.orderId}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600 text-sm">결제금액</span>
              <span className="font-bold text-lg text-gray-900">
                {paymentInfo.totalAmount.toLocaleString()}원
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600 text-sm">결제수단</span>
              <span className="font-medium text-gray-900">
                {paymentInfo.method}
              </span>
            </div>
            {paymentInfo.approvedAt && (
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600 text-sm">승인시간</span>
                <span className="font-medium text-gray-900 text-sm">
                  {new Date(paymentInfo.approvedAt).toLocaleString('ko-KR')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 홈으로 버튼 */}
        <div className="text-center">
          <a
            href="/"
            className="inline-block w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    </main>
  )
}

/**
 * SuccessPage 래퍼
 *
 * useSearchParams를 사용하는 컴포넌트를 Suspense로 감쌉니다.
 */
export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoadingSpinner message="페이지를 불러오는 중..." size="lg" />
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
