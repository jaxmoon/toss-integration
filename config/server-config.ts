/**
 * 서버 사이드 전용 설정
 *
 * ⚠️ 주의: 이 파일은 서버에서만 import해야 합니다!
 * - 클라이언트 컴포넌트에서 import하면 번들에 포함될 수 있습니다
 * - API Routes, Server Actions, Server Components에서만 사용하세요
 */

/**
 * Toss Payments 서버 설정
 */
export const TOSS_PAYMENTS_SERVER_CONFIG = {
  /**
   * 시크릿 키 (서버 전용)
   * @env TOSS_SECRET_KEY
   */
  secretKey: process.env.TOSS_SECRET_KEY || '',

  /**
   * 웹훅 시크릿 키 (서버 전용)
   * @env TOSS_WEBHOOK_SECRET
   */
  webhookSecret: process.env.TOSS_WEBHOOK_SECRET || '',

  /**
   * API Base URL
   */
  apiUrl: 'https://api.tosspayments.com/v1',

  /**
   * API 기본 헤더 생성
   */
  getAuthHeaders(): HeadersInit {
    if (!this.secretKey) {
      throw new Error('TOSS_SECRET_KEY is not configured')
    }

    // Base64 인코딩 (시크릿 키 + 콜론)
    const encodedKey = Buffer.from(`${this.secretKey}:`, 'utf-8').toString(
      'base64'
    )

    return {
      Authorization: `Basic ${encodedKey}`,
      'Content-Type': 'application/json',
    }
  },
} as const

/**
 * 환경 변수 검증
 * 서버 시작 시 필수 환경 변수가 설정되었는지 확인
 */
export function validateServerConfig(): void {
  const requiredEnvVars = {
    TOSS_SECRET_KEY: process.env.TOSS_SECRET_KEY,
    NEXT_PUBLIC_TOSS_CLIENT_KEY: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
  }

  const missing = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env.local file.'
    )
  }
}
