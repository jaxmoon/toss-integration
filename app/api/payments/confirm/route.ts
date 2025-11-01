import { NextRequest, NextResponse } from 'next/server'
import axios, { AxiosError } from 'axios'
import { TOSS_PAYMENTS_CONFIG, API_TIMEOUT } from '@/config/constants'
import type {
  PaymentConfirmRequest,
  PaymentConfirmation,
  ApiResponse,
  TossPaymentsError,
} from '@/types/payment'

/**
 * 결제 검증 API
 * POST /api/payments/confirm
 *
 * @description Toss Payments API를 호출하여 결제를 검증합니다.
 * @see https://docs.tosspayments.com/reference#authorize-payment
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 요청 바디 파싱
    const body: PaymentConfirmRequest = await request.json()
    const { paymentKey, orderId, amount } = body

    // 2. 필수 파라미터 검증
    const validationError = validatePaymentConfirmRequest(body)
    if (validationError) {
      return NextResponse.json<ApiResponse<null>>(validationError, {
        status: 400,
      })
    }

    // 3. 시크릿 키 확인
    const secretKey = TOSS_PAYMENTS_CONFIG.secretKey
    if (!secretKey) {
      console.error('TOSS_SECRET_KEY is not configured')
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: 'MISSING_CONFIG',
            message: '결제 시스템 설정이 올바르지 않습니다',
          },
        },
        { status: 500 }
      )
    }

    // 4. Toss Payments API 호출
    const url = `${TOSS_PAYMENTS_CONFIG.apiUrl}/payments/confirm`
    const authHeader = createBasicAuthHeader(secretKey)

    const response = await axios.post<PaymentConfirmation>(
      url,
      {
        paymentKey,
        orderId,
        amount,
      },
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        timeout: API_TIMEOUT.PAYMENT_CONFIRM,
      }
    )

    // 5. 성공 응답
    return NextResponse.json<ApiResponse<PaymentConfirmation>>(
      {
        success: true,
        data: response.data,
      },
      { status: 200 }
    )
  } catch (error) {
    return handlePaymentError(error)
  }
}

/**
 * 결제 확인 요청 파라미터 검증
 */
function validatePaymentConfirmRequest(
  body: PaymentConfirmRequest
): ApiResponse<null> | null {
  const { paymentKey, orderId, amount } = body

  // 필수 파라미터 검증
  if (!paymentKey || !orderId || amount === undefined || amount === null) {
    return {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'paymentKey, orderId, amount는 필수 파라미터입니다',
      },
    }
  }

  // paymentKey 검증
  if (typeof paymentKey !== 'string' || paymentKey.length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_PAYMENT_KEY',
        message: 'paymentKey는 유효한 문자열이어야 합니다',
      },
    }
  }

  // paymentKey 길이 검증 (보안: 비정상적으로 긴 문자열 차단)
  if (paymentKey.length > 200) {
    return {
      success: false,
      error: {
        code: 'INVALID_PAYMENT_KEY',
        message: 'paymentKey 형식이 올바르지 않습니다',
      },
    }
  }

  // orderId 검증
  if (typeof orderId !== 'string' || orderId.length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_ORDER_ID',
        message: 'orderId는 유효한 문자열이어야 합니다',
      },
    }
  }

  // orderId 형식 검증 (보안: 예상된 패턴만 허용)
  if (!/^order-[\w-]{1,100}$/.test(orderId)) {
    return {
      success: false,
      error: {
        code: 'INVALID_ORDER_ID',
        message: 'orderId 형식이 올바르지 않습니다',
      },
    }
  }

  // amount 검증
  if (typeof amount !== 'number' || amount <= 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_AMOUNT',
        message: 'amount는 0보다 큰 숫자여야 합니다',
      },
    }
  }

  // amount 상한선 검증 (보안: 비정상적으로 큰 금액 차단)
  // 최대 1억 원으로 제한
  if (amount > 100000000) {
    return {
      success: false,
      error: {
        code: 'INVALID_AMOUNT',
        message: '결제 금액이 허용 범위를 초과했습니다',
      },
    }
  }

  // amount 정수 검증 (원 단위이므로 소수점 불허)
  if (!Number.isInteger(amount)) {
    return {
      success: false,
      error: {
        code: 'INVALID_AMOUNT',
        message: 'amount는 정수여야 합니다',
      },
    }
  }

  return null
}

/**
 * Basic Auth 헤더 생성
 * @param secretKey - Toss Payments 시크릿 키
 * @returns Basic Auth 헤더 문자열
 */
function createBasicAuthHeader(secretKey: string): string {
  // Toss Payments API는 "{secretKey}:" 형식으로 Base64 인코딩
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`
}

/**
 * 결제 에러 처리
 */
function handlePaymentError(error: unknown): NextResponse<ApiResponse<null>> {
  // Axios 에러 처리
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<TossPaymentsError>

    // Toss API 에러 응답
    if (axiosError.response?.data) {
      const tossError = axiosError.response.data
      console.error('Toss API error:', {
        code: tossError.code,
        message: tossError.message,
        status: axiosError.response.status,
      })

      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: tossError.code || 'TOSS_API_ERROR',
            message: tossError.message || '결제 검증에 실패했습니다',
          },
        },
        { status: axiosError.response.status || 400 }
      )
    }

    // 네트워크 에러
    if (axiosError.code === 'ECONNABORTED') {
      console.error('Payment confirmation timeout')
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: '결제 검증 요청 시간이 초과되었습니다',
          },
        },
        { status: 504 }
      )
    }

    // 기타 Axios 에러
    console.error('Axios error:', axiosError.message)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '네트워크 오류가 발생했습니다',
        },
      },
      { status: 502 }
    )
  }

  // 일반 에러
  console.error('Unexpected error:', error)
  return NextResponse.json<ApiResponse<null>>(
    {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '서버 오류가 발생했습니다',
      },
    },
    { status: 500 }
  )
}
