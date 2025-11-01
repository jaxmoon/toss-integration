/**
 * @jest-environment jsdom
 */
import {
  loadTossPaymentsSDK,
  createPaymentWidget,
  resetTossPaymentsSDK
} from '@/lib/tossPayments'

// Mock the config module to allow dynamic clientKey changes
jest.mock('@/config/constants', () => ({
  TOSS_PAYMENTS_CONFIG: {
    get clientKey() {
      return process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || ''
    },
    secretKey: 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6',
    customerKey: 'ANONYMOUS',
    apiUrl: 'https://api.tosspayments.com/v1',
  },
  APP_CONFIG: {
    baseUrl: 'http://localhost:3000',
    get successUrl() {
      return `${this.baseUrl}/success`
    },
    get failUrl() {
      return `${this.baseUrl}/fail`
    },
  },
}))

describe('loadTossPaymentsSDK', () => {
  // Reset SDK instance before each test to avoid singleton issues
  beforeEach(() => {
    resetTossPaymentsSDK()
  })

  it('should load Toss Payments SDK', async () => {
    const sdk = await loadTossPaymentsSDK()
    expect(sdk).toBeDefined()
  })

  it('should use client key from environment', async () => {
    expect(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY).toBeDefined()
  })

  it('should throw error if client key is missing', async () => {
    const originalKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
    delete process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY

    await expect(loadTossPaymentsSDK()).rejects.toThrow(
      'NEXT_PUBLIC_TOSS_CLIENT_KEY 환경 변수가 설정되지 않았습니다.'
    )

    process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY = originalKey
  })
})
