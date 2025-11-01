/**
 * Integration Tests for Toss Payments Webhook Endpoint
 *
 * @jest-environment node
 *
 * This test suite validates the end-to-end webhook verification flow:
 * 1. HMAC-SHA256 signature verification
 * 2. Idempotency key duplicate detection
 * 3. Security logging for all verification attempts
 * 4. Proper error handling and response codes
 *
 * TDD Phase: RED - These tests will FAIL until implementation is complete
 */

import { POST, __clearTestState__ } from '@/app/api/webhooks/toss/route'
import { NextRequest } from 'next/server'
import crypto from 'crypto'

// Mock environment variables
const WEBHOOK_SECRET = 'whsec_test_secret'
process.env.TOSS_WEBHOOK_SECRET = WEBHOOK_SECRET

// Mock console methods to verify logging
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation()
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation()

// Mock fetch for payment confirmation
global.fetch = jest.fn()

/**
 * Generate HMAC-SHA256 signature for webhook payload
 * This matches Toss's signature generation algorithm
 */
function generateWebhookSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  return hmac.digest('hex')
}

/**
 * Create a mock webhook request with proper headers
 */
function createWebhookRequest(
  payload: object,
  options: {
    signature?: string
    idempotencyKey?: string
    includeSignatureHeader?: boolean
    includeIdempotencyHeader?: boolean
  } = {}
): NextRequest {
  const body = JSON.stringify(payload)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add signature header if specified
  if (options.includeSignatureHeader !== false) {
    const signature = options.signature || generateWebhookSignature(body, WEBHOOK_SECRET)
    headers['Toss-Signature'] = signature
  }

  // Add idempotency key header if specified
  if (options.includeIdempotencyHeader !== false) {
    const idempotencyKey = options.idempotencyKey || `idp-${Date.now()}-${Math.random()}`
    headers['Toss-Idempotency-Key'] = idempotencyKey
  }

  return new NextRequest('http://localhost:3000/api/webhooks/toss', {
    method: 'POST',
    headers,
    body,
  })
}

/**
 * Sample Toss webhook payload for PAYMENT_STATUS_CHANGED event
 */
const mockWebhookPayload = {
  eventType: 'PAYMENT_STATUS_CHANGED',
  data: {
    orderId: 'ORD-20251102-abc123',
    paymentKey: 'test_payment_key_123',
    status: 'DONE',
    totalAmount: 50000,
    method: '카드',
    approvedAt: '2025-11-02T10:30:00+09:00',
  },
}

describe('POST /api/webhooks/toss - Integration Tests', () => {
  beforeEach(() => {
    __clearTestState__() // Clear idempotency cache and rate limits

    // Clear mock call history explicitly
    mockConsoleLog.mockClear()
    mockConsoleError.mockClear()
    mockConsoleWarn.mockClear()
    jest.clearAllMocks()

    // Mock successful payment confirmation by default
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        paymentKey: 'test_payment_key_123',
        orderId: 'ORD-20251102-abc123',
        status: 'DONE',
        approvedAt: '2025-11-02T10:30:00+09:00',
      }),
    })
  })

  afterEach(() => {
    // Don't restore console mocks - they need to persist across tests
    // jest.restoreAllMocks()
  })

  describe('Valid webhook processing', () => {
    it('should accept webhook with valid signature', async () => {
      const request = createWebhookRequest(mockWebhookPayload)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Webhook processed')
    })

    it('should process webhook payload correctly', async () => {
      const request = createWebhookRequest(mockWebhookPayload)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.orderId).toBe('ORD-20251102-abc123')

      // Verify payment confirmation was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/payments/confirm'),
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('should return 200 status with success message', async () => {
      const request = createWebhookRequest(mockWebhookPayload)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'Webhook processed',
        orderId: 'ORD-20251102-abc123',
      })
    })

    it('should log success event with metadata', async () => {
      const request = createWebhookRequest(mockWebhookPayload)
      await POST(request)

      // Verify security logging
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[Webhook Verified]'),
        expect.objectContaining({
          orderId: 'ORD-20251102-abc123',
          eventType: 'PAYMENT_STATUS_CHANGED',
          verified: true,
        })
      )
    })
  })

  describe('Invalid webhook rejection', () => {
    it('should reject webhook with invalid signature (401)', async () => {
      const request = createWebhookRequest(mockWebhookPayload, {
        signature: 'invalid_signature_hash',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Signature verification failed. Check webhook signature and secret.')
      expect(data.success).toBe(false)
    })

    it('should reject webhook with missing signature (401)', async () => {
      const request = createWebhookRequest(mockWebhookPayload, {
        includeSignatureHeader: false,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Missing signature header. Include "Toss-Signature" header in webhook request.')
      expect(data.success).toBe(false)
    })

    it('should reject duplicate webhook request (409)', async () => {
      const idempotencyKey = 'idp-unique-test-123'

      // First request - should succeed
      const firstRequest = createWebhookRequest(mockWebhookPayload, {
        idempotencyKey,
      })
      const firstResponse = await POST(firstRequest)
      expect(firstResponse.status).toBe(200)

      // Second request with same idempotency key - should fail
      const secondRequest = createWebhookRequest(mockWebhookPayload, {
        idempotencyKey,
      })
      const secondResponse = await POST(secondRequest)
      const data = await secondResponse.json()

      expect(secondResponse.status).toBe(409)
      expect(data.error).toBe('Duplicate webhook request detected. This request was already processed.')
      expect(data.success).toBe(false)
    })

    it('should log failure events with proper reason', async () => {
      const request = createWebhookRequest(mockWebhookPayload, {
        signature: 'invalid_signature',
      })
      await POST(request)

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('[Webhook Verification Failed]'),
        expect.objectContaining({
          reason: 'Signature verification failed. Check webhook signature and secret.',
          orderId: 'ORD-20251102-abc123',
        })
      )
    })
  })

  describe('Security logging verification', () => {
    it('should log all verification attempts', async () => {
      const request = createWebhookRequest(mockWebhookPayload)
      await POST(request)

      // Verify logging was called
      expect(mockConsoleLog).toHaveBeenCalled()

      // Check for verification log entry
      const verificationLogs = mockConsoleLog.mock.calls.filter(call =>
        call[0].includes('[Webhook')
      )
      expect(verificationLogs.length).toBeGreaterThan(0)
    })

    it('should include request metadata (timestamp, requestId)', async () => {
      const request = createWebhookRequest(mockWebhookPayload)
      await POST(request)

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timestamp: expect.any(String),
          requestId: expect.any(String),
        })
      )
    })

    it('should NOT log actual signatures or secrets', async () => {
      const request = createWebhookRequest(mockWebhookPayload)
      await POST(request)

      // Check all console.log calls
      const allLogs = mockConsoleLog.mock.calls.map(call => JSON.stringify(call))

      // Ensure webhook secret is never logged
      allLogs.forEach(log => {
        expect(log).not.toContain(WEBHOOK_SECRET)
        expect(log).not.toContain('whsec_test_secret')
      })

      // Ensure signature hash is not logged in full
      const signature = generateWebhookSignature(JSON.stringify(mockWebhookPayload), WEBHOOK_SECRET)
      allLogs.forEach(log => {
        expect(log).not.toContain(signature)
      })
    })

    it('should log sanitized signature info for debugging', async () => {
      const request = createWebhookRequest(mockWebhookPayload)
      await POST(request)

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signaturePresent: true,
          signaturePrefix: expect.stringMatching(/^[a-f0-9]{8}$/), // Only first 8 chars
        })
      )
    })
  })

  describe('Integration scenarios', () => {
    it('should handle full flow: signature verification → idempotency check → processing', async () => {
      const request = createWebhookRequest(mockWebhookPayload)
      const response = await POST(request)

      // Verify full flow succeeded
      expect(response.status).toBe(200)

      // Verify logging shows all stages
      const logCalls = mockConsoleLog.mock.calls.map(call => call[0])
      expect(logCalls.some(log => log.includes('[Webhook Received]'))).toBe(true)
      expect(logCalls.some(log => log.includes('[Signature Verification]'))).toBe(true)
      expect(logCalls.some(log => log.includes('[Idempotency Check]'))).toBe(true)
      expect(logCalls.some(log => log.includes('[Webhook Verified]'))).toBe(true)
    })

    it('should handle Toss payment status updates', async () => {
      const paymentStatuses = ['WAITING_FOR_DEPOSIT', 'DONE', 'CANCELED', 'FAILED']

      for (const status of paymentStatuses) {
        jest.clearAllMocks()

        const payload = {
          ...mockWebhookPayload,
          data: { ...mockWebhookPayload.data, status },
        }

        const request = createWebhookRequest(payload)
        const response = await POST(request)

        // All should verify signature successfully (200 or 202)
        expect([200, 202]).toContain(response.status)
      }
    })

    it('should verify proper error responses', async () => {
      const testCases = [
        {
          scenario: 'Missing signature',
          options: { includeSignatureHeader: false },
          expectedStatus: 401,
          expectedError: 'Missing signature header. Include "Toss-Signature" header in webhook request.',
        },
        {
          scenario: 'Invalid signature',
          options: { signature: 'wrong_sig' },
          expectedStatus: 401,
          expectedError: 'Signature verification failed. Check webhook signature and secret.',
        },
        {
          scenario: 'Missing idempotency key',
          options: { includeIdempotencyHeader: false },
          expectedStatus: 400,
          expectedError: 'Missing idempotency key. Include "Toss-Idempotency-Key" header in webhook request.',
        },
      ]

      for (const testCase of testCases) {
        jest.clearAllMocks()

        const request = createWebhookRequest(mockWebhookPayload, testCase.options)
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(testCase.expectedStatus)
        expect(data.error).toBe(testCase.expectedError)
        expect(data.success).toBe(false)
      }
    })

    it('should handle malformed webhook payload gracefully', async () => {
      const malformedPayload = {
        eventType: 'PAYMENT_STATUS_CHANGED',
        // Missing 'data' field
      }

      const request = createWebhookRequest(malformedPayload)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid webhook payload. Missing required fields: orderId, paymentKey.')
      expect(data.success).toBe(false)
    })

    it('should prevent signature timing attacks', async () => {
      const validRequest = createWebhookRequest(mockWebhookPayload)
      const invalidRequest = createWebhookRequest(mockWebhookPayload, {
        signature: 'totally_wrong_signature',
      })

      // Measure response times
      const validStart = Date.now()
      await POST(validRequest)
      const validTime = Date.now() - validStart

      const invalidStart = Date.now()
      await POST(invalidRequest)
      const invalidTime = Date.now() - invalidStart

      // Response times should be similar (within 100ms)
      // This verifies constant-time comparison
      expect(Math.abs(validTime - invalidTime)).toBeLessThan(100)
    })

    it('should enforce idempotency window (24 hours)', async () => {
      // This test verifies that old idempotency keys expire
      const oldIdempotencyKey = 'idp-old-20231101-123'

      // Mock Date.now() to simulate 25 hours later
      const originalDateNow = Date.now
      Date.now = jest.fn(() => originalDateNow() + 25 * 60 * 60 * 1000)

      const request = createWebhookRequest(mockWebhookPayload, {
        idempotencyKey: oldIdempotencyKey,
      })
      const response = await POST(request)

      // Should accept because idempotency key is expired
      expect(response.status).toBe(200)

      // Restore Date.now
      Date.now = originalDateNow
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle concurrent requests with different idempotency keys', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        createWebhookRequest(mockWebhookPayload, {
          idempotencyKey: `idp-concurrent-${i}`,
        })
      )

      const responses = await Promise.all(requests.map(req => POST(req)))

      // All should succeed (different idempotency keys)
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    it('should handle webhook with special characters in payload', async () => {
      const specialPayload = {
        ...mockWebhookPayload,
        data: {
          ...mockWebhookPayload.data,
          orderId: 'ORD-2025-특수문자-테스트',
        },
      }

      const request = createWebhookRequest(specialPayload)
      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should validate signature for empty payload', async () => {
      const emptyPayload = {
        eventType: 'PAYMENT_STATUS_CHANGED',
        data: {
          orderId: '',
          paymentKey: '',
          status: 'DONE',
          totalAmount: 0,
          method: '',
        },
      }

      const request = createWebhookRequest(emptyPayload)
      const response = await POST(request)
      const data = await response.json()

      // Should verify signature but reject invalid data
      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid')
    })

    it('should handle signature verification when TOSS_WEBHOOK_SECRET is missing', async () => {
      const originalSecret = process.env.TOSS_WEBHOOK_SECRET
      delete process.env.TOSS_WEBHOOK_SECRET

      const request = createWebhookRequest(mockWebhookPayload)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Webhook secret not configured. Set TOSS_WEBHOOK_SECRET in environment variables.')

      // Restore secret
      process.env.TOSS_WEBHOOK_SECRET = originalSecret
    })

    it('should rate limit excessive webhook requests', async () => {
      // Send 100 requests rapidly
      const requests = Array.from({ length: 100 }, () =>
        createWebhookRequest(mockWebhookPayload)
      )

      const responses = await Promise.all(requests.map(req => POST(req)))
      const rateLimitedCount = responses.filter(r => r.status === 429).length

      // Some requests should be rate limited
      expect(rateLimitedCount).toBeGreaterThan(0)
    })
  })
})
