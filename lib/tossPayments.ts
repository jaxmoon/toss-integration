/**
 * Toss Payments Widget SDK 초기화 및 관리
 *
 * Toss Payments의 Payment Widget SDK를 로드하고 초기화하는 유틸리티입니다.
 * 클라이언트 사이드에서만 사용되어야 합니다.
 *
 * @see https://docs.tosspayments.com/reference/widget-sdk
 */

import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import { TOSS_PAYMENTS_CONFIG } from '@/config/constants'

/**
 * Payment Widget 타입 정의
 * SDK에서 반환되는 위젯 인스턴스의 타입
 */
interface PaymentWidgetInstance {
  setAmount(amount: { currency: string; value: number }): Promise<void>
  renderPaymentMethods(options: {
    selector: string
    variantKey: string
  }): Promise<any>
  renderAgreement(options: { selector: string; variantKey: string }): Promise<any>
  requestPayment(params: {
    orderId: string
    orderName: string
    successUrl: string
    failUrl: string
    customerName: string
    customerEmail: string
    customerMobilePhone: string
  }): Promise<void>
}

/**
 * TossPayments SDK 인스턴스
 */
interface TossPaymentsSDK {
  widgets(options: { customerKey: string }): PaymentWidgetInstance
}

/**
 * 싱글톤 SDK 인스턴스
 * 한 번만 로드하고 재사용합니다.
 */
let tossPaymentsInstance: TossPaymentsSDK | null = null

/**
 * Toss Payments SDK 로드 및 초기화
 *
 * @returns TossPayments SDK 인스턴스
 * @throws SDK 로드 실패 시 에러
 */
export async function loadTossPaymentsSDK(): Promise<TossPaymentsSDK> {
  // 이미 로드된 경우 재사용
  if (tossPaymentsInstance) {
    return tossPaymentsInstance
  }

  // 환경 변수 검증
  const clientKey = TOSS_PAYMENTS_CONFIG.clientKey
  if (!clientKey) {
    throw new Error(
      'NEXT_PUBLIC_TOSS_CLIENT_KEY 환경 변수가 설정되지 않았습니다.'
    )
  }

  try {
    // SDK 로드
    const tossPayments = await loadTossPayments(clientKey)
    tossPaymentsInstance = tossPayments
    return tossPayments
  } catch (error) {
    console.error('Toss Payments SDK 로드 실패:', error)
    throw new Error('Toss Payments SDK를 로드하지 못했습니다.')
  }
}

/**
 * Payment Widget 생성
 *
 * @param customerKey - 고객 식별 키 (선택사항, 기본값: ANONYMOUS)
 * @returns Payment Widget 인스턴스
 */
export async function createPaymentWidget(
  customerKey?: string
): Promise<PaymentWidgetInstance> {
  const tossPayments = await loadTossPaymentsSDK()

  // 고객 키가 없으면 ANONYMOUS 사용
  const key = customerKey || TOSS_PAYMENTS_CONFIG.customerKey

  return tossPayments.widgets({ customerKey: key })
}

/**
 * SDK 인스턴스 초기화 (메모리 정리 용)
 *
 * 주로 테스트나 개발 환경에서 사용됩니다.
 */
export function resetTossPaymentsSDK(): void {
  tossPaymentsInstance = null
}
