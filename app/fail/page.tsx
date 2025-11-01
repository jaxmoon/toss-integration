/**
 * Fail Page
 *
 * 결제 실패 페이지입니다.
 * URL 쿼리 파라미터에서 에러 정보를 받아 사용자에게 표시하고,
 * 다시 시도할 수 있도록 안내합니다.
 *
 * @route /fail?code=...&message=...
 */
'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/LoadingSpinner'

/**
 * FailContent 컴포넌트
 *
 * useSearchParams를 사용하므로 Suspense로 감싸야 합니다.
 */
function FailContent() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('code')
  const errorMessage = searchParams.get('message')

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div
        role="alert"
        aria-live="assertive"
        className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full"
      >
        {/* 실패 아이콘 */}
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4"
            aria-hidden="true"
          >
            <span className="text-white text-3xl font-bold">✕</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">결제 실패</h1>
        </div>

        {/* 에러 정보 */}
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
          {errorCode && (
            <div className="mb-2">
              <span className="text-sm text-red-700 font-semibold">
                에러 코드:
              </span>
              <span className="ml-2 text-sm text-red-900 font-mono">
                {errorCode}
              </span>
            </div>
          )}
          {errorMessage && (
            <div>
              <span className="text-sm text-red-700 font-semibold">사유:</span>
              <p className="mt-1 text-sm text-red-900">{errorMessage}</p>
            </div>
          )}
          {!errorCode && !errorMessage && (
            <p className="text-sm text-red-900">
              결제 처리 중 오류가 발생했습니다.
            </p>
          )}
        </div>

        {/* 안내 메시지 */}
        <div className="mb-6 text-sm text-gray-600">
          <p>결제가 정상적으로 완료되지 않았습니다.</p>
          <p className="mt-2">다시 시도하거나 다른 결제 수단을 이용해주세요.</p>
        </div>

        {/* 액션 버튼들 */}
        <div className="space-y-3">
          <Link
            href="/checkout"
            className="block w-full py-3 bg-blue-600 text-white text-center font-medium rounded-lg hover:bg-blue-700 transition focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            다시 시도
          </Link>
          <Link
            href="/"
            className="block w-full py-3 bg-gray-100 text-gray-700 text-center font-medium rounded-lg hover:bg-gray-200 transition focus:outline-none focus:ring-4 focus:ring-gray-300"
          >
            홈으로 돌아가기
          </Link>
        </div>

        {/* 고객 지원 안내 */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            문제가 지속되면 고객센터로 문의해주세요.
          </p>
        </div>
      </div>
    </main>
  )
}

/**
 * FailPage 래퍼
 *
 * useSearchParams를 사용하는 컴포넌트를 Suspense로 감쌉니다.
 */
export default function FailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoadingSpinner message="페이지를 불러오는 중..." size="lg" />
        </main>
      }
    >
      <FailContent />
    </Suspense>
  )
}
