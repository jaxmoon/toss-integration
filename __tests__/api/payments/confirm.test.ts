/**
 * @jest-environment node
 */
import { POST } from '@/app/api/payments/confirm/route'
import { mockPaymentConfirmRequest } from '@/__tests__/mocks/payment-data'
import { NextRequest } from 'next/server'

// axios mock
jest.mock('axios')
const axios = require('axios')

describe('POST /api/payments/confirm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should confirm payment successfully', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        paymentKey: 'test_key',
        orderId: 'order-001',
        status: 'DONE',
        totalAmount: 10000,
        method: '카드',
        requestedAt: '2024-01-01T00:00:00+09:00',
        approvedAt: '2024-01-01T00:00:10+09:00',
      },
    })

    const request = new NextRequest('http://localhost:3000/api/payments/confirm', {
      method: 'POST',
      body: JSON.stringify(mockPaymentConfirmRequest),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('DONE')
  })

  it('should return 400 for missing parameters', async () => {
    const request = new NextRequest('http://localhost:3000/api/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should handle API errors', async () => {
    const axiosError = {
      response: {
        data: {
          code: 'INVALID_PAYMENT_KEY',
          message: '잘못된 결제 키입니다',
        },
        status: 400,
      },
      isAxiosError: true,
    }
    axios.isAxiosError = jest.fn().mockReturnValue(true)
    axios.post.mockRejectedValueOnce(axiosError)

    const request = new NextRequest('http://localhost:3000/api/payments/confirm', {
      method: 'POST',
      body: JSON.stringify(mockPaymentConfirmRequest),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error?.code).toBe('INVALID_PAYMENT_KEY')
  })
})
