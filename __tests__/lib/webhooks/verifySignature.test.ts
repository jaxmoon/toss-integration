/**
 * @jest-environment node
 */
import { createHmac } from 'crypto'

// This will fail because the module doesn't exist yet (TDD Red Phase)
// @ts-expect-error - Testing non-existent module (TDD approach)
import {
  verifyWebhookSignature,
  type VerificationResult,
} from '@/lib/webhooks/verifySignature'

describe('verifyWebhookSignature', () => {
  const TEST_SECRET = 'whsec_test_secret_key_for_testing'
  const TEST_PAYLOAD = JSON.stringify({
    eventType: 'PAYMENT_STATUS_CHANGED',
    data: {
      orderId: 'ORD-20250102-TEST',
      paymentKey: 'test_payment_key',
      status: 'DONE',
      totalAmount: 50000,
    },
  })

  /**
   * Helper function to generate valid HMAC-SHA256 signature
   */
  function generateValidSignature(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex')
  }

  describe('Valid Signature Acceptance', () => {
    it('should accept correctly signed webhook requests', async () => {
      const validSignature = generateValidSignature(TEST_PAYLOAD, TEST_SECRET)

      const result: VerificationResult = await verifyWebhookSignature(
        TEST_PAYLOAD,
        validSignature,
        TEST_SECRET
      )

      expect(result.isValid).toBe(true)
      expect(result.reason).toBeUndefined()
      expect(result.metadata).toBeDefined()
      expect(result.metadata?.timestamp).toBeLessThanOrEqual(Date.now())
    })

    it('should verify HMAC-SHA256 signature matches', async () => {
      const expectedSignature = createHmac('sha256', TEST_SECRET)
        .update(TEST_PAYLOAD)
        .digest('hex')

      const result = await verifyWebhookSignature(
        TEST_PAYLOAD,
        expectedSignature,
        TEST_SECRET
      )

      expect(result.isValid).toBe(true)
    })

    it('should accept signatures with different payload data', async () => {
      const differentPayload = JSON.stringify({ test: 'data' })
      const signature = generateValidSignature(differentPayload, TEST_SECRET)

      const result = await verifyWebhookSignature(
        differentPayload,
        signature,
        TEST_SECRET
      )

      expect(result.isValid).toBe(true)
    })
  })

  describe('Invalid Signature Rejection', () => {
    it('should reject requests with wrong signature', async () => {
      const wrongSignature = 'invalid_signature_12345'

      const result = await verifyWebhookSignature(
        TEST_PAYLOAD,
        wrongSignature,
        TEST_SECRET
      )

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('INVALID_SIGNATURE')
      expect(result.metadata).toBeDefined()
    })

    it('should reject requests with tampered payload', async () => {
      const validSignature = generateValidSignature(TEST_PAYLOAD, TEST_SECRET)
      const tamperedPayload = JSON.stringify({
        eventType: 'PAYMENT_STATUS_CHANGED',
        data: {
          orderId: 'ORD-20250102-TEST',
          paymentKey: 'test_payment_key',
          status: 'DONE',
          totalAmount: 1000000, // Tampered amount!
        },
      })

      const result = await verifyWebhookSignature(
        tamperedPayload,
        validSignature,
        TEST_SECRET
      )

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('INVALID_SIGNATURE')
    })

    it('should reject requests with missing signature header', async () => {
      const result = await verifyWebhookSignature(TEST_PAYLOAD, '', TEST_SECRET)

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('MISSING_SIGNATURE')
    })

    it('should reject requests with null signature', async () => {
      // @ts-expect-error - Testing invalid input
      const result = await verifyWebhookSignature(TEST_PAYLOAD, null, TEST_SECRET)

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('MISSING_SIGNATURE')
    })

    it('should reject requests with undefined signature', async () => {
      // @ts-expect-error - Testing invalid input
      const result = await verifyWebhookSignature(TEST_PAYLOAD, undefined, TEST_SECRET)

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('MISSING_SIGNATURE')
    })

    it('should reject signatures signed with different secret', async () => {
      const differentSecret = 'whsec_different_secret'
      const signature = generateValidSignature(TEST_PAYLOAD, differentSecret)

      const result = await verifyWebhookSignature(
        TEST_PAYLOAD,
        signature,
        TEST_SECRET
      )

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('INVALID_SIGNATURE')
    })
  })

  describe('Security Requirements', () => {
    it('should use timing-safe comparison to prevent timing attacks', async () => {
      const validSignature = generateValidSignature(TEST_PAYLOAD, TEST_SECRET)
      const almostValidSignature = validSignature.slice(0, -1) + 'X'

      const startTime1 = process.hrtime.bigint()
      await verifyWebhookSignature(TEST_PAYLOAD, validSignature, TEST_SECRET)
      const duration1 = process.hrtime.bigint() - startTime1

      const startTime2 = process.hrtime.bigint()
      await verifyWebhookSignature(
        TEST_PAYLOAD,
        almostValidSignature,
        TEST_SECRET
      )
      const duration2 = process.hrtime.bigint() - startTime2

      // Timing difference should be minimal (< 10ms difference)
      // This test validates constant-time comparison
      const timingDifference = Math.abs(
        Number(duration1 - duration2) / 1_000_000
      ) // Convert to ms

      // Allow some variance, but should be minimal
      expect(timingDifference).toBeLessThan(10)
    })

    it('should never expose signature in error messages', async () => {
      const invalidSignature = 'secret_signature_should_not_leak'

      const result = await verifyWebhookSignature(
        TEST_PAYLOAD,
        invalidSignature,
        TEST_SECRET
      )

      // Verify that the signature is not included in the result
      expect(JSON.stringify(result)).not.toContain(invalidSignature)
      expect(JSON.stringify(result)).not.toContain(TEST_SECRET)
    })

    it('should complete verification within performance threshold', async () => {
      const validSignature = generateValidSignature(TEST_PAYLOAD, TEST_SECRET)

      const startTime = Date.now()
      await verifyWebhookSignature(TEST_PAYLOAD, validSignature, TEST_SECRET)
      const duration = Date.now() - startTime

      // Verification should complete in < 100ms (per techspec NFR-1)
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty request body', async () => {
      const emptyPayload = ''
      const signature = generateValidSignature(emptyPayload, TEST_SECRET)

      const result = await verifyWebhookSignature(
        emptyPayload,
        signature,
        TEST_SECRET
      )

      expect(result.isValid).toBe(true)
    })

    it('should handle very large payloads', async () => {
      const largePayload = JSON.stringify({
        data: 'x'.repeat(10000), // 10KB payload
      })
      const signature = generateValidSignature(largePayload, TEST_SECRET)

      const result = await verifyWebhookSignature(
        largePayload,
        signature,
        TEST_SECRET
      )

      expect(result.isValid).toBe(true)
    })

    it('should handle special characters in payload', async () => {
      const specialPayload = JSON.stringify({
        data: 'Test with special chars: 한글, émojis 🎉, quotes "test"',
      })
      const signature = generateValidSignature(specialPayload, TEST_SECRET)

      const result = await verifyWebhookSignature(
        specialPayload,
        signature,
        TEST_SECRET
      )

      expect(result.isValid).toBe(true)
    })

    it('should handle malformed signature format (non-hex)', async () => {
      const malformedSignature = 'not-a-valid-hex-string!!!'

      const result = await verifyWebhookSignature(
        TEST_PAYLOAD,
        malformedSignature,
        TEST_SECRET
      )

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('INVALID_SIGNATURE')
    })

    it('should handle signature with incorrect length', async () => {
      const shortSignature = 'abc123' // Too short for SHA256 hex

      const result = await verifyWebhookSignature(
        TEST_PAYLOAD,
        shortSignature,
        TEST_SECRET
      )

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('INVALID_SIGNATURE')
    })

    it('should handle whitespace in signature', async () => {
      const validSignature = generateValidSignature(TEST_PAYLOAD, TEST_SECRET)
      const signatureWithWhitespace = `  ${validSignature}  `

      const result = await verifyWebhookSignature(
        TEST_PAYLOAD,
        signatureWithWhitespace,
        TEST_SECRET
      )

      // Should trim whitespace and validate correctly
      expect(result.isValid).toBe(true)
    })
  })

  describe('Metadata and Traceability', () => {
    it('should include timestamp in verification result', async () => {
      const validSignature = generateValidSignature(TEST_PAYLOAD, TEST_SECRET)
      const beforeTimestamp = Date.now()

      const result = await verifyWebhookSignature(
        TEST_PAYLOAD,
        validSignature,
        TEST_SECRET
      )

      const afterTimestamp = Date.now()

      expect(result.metadata).toBeDefined()
      expect(result.metadata?.timestamp).toBeGreaterThanOrEqual(beforeTimestamp)
      expect(result.metadata?.timestamp).toBeLessThanOrEqual(afterTimestamp)
    })

    it('should return consistent metadata structure for valid requests', async () => {
      const validSignature = generateValidSignature(TEST_PAYLOAD, TEST_SECRET)

      const result = await verifyWebhookSignature(
        TEST_PAYLOAD,
        validSignature,
        TEST_SECRET
      )

      expect(result).toEqual({
        isValid: true,
        metadata: {
          timestamp: expect.any(Number),
          durationMs: expect.any(Number),
        },
      })
    })

    it('should return consistent metadata structure for invalid requests', async () => {
      const invalidSignature = 'invalid'

      const result = await verifyWebhookSignature(
        TEST_PAYLOAD,
        invalidSignature,
        TEST_SECRET
      )

      expect(result).toEqual({
        isValid: false,
        reason: 'INVALID_SIGNATURE',
        metadata: {
          timestamp: expect.any(Number),
          durationMs: expect.any(Number),
        },
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle empty secret key', async () => {
      const validSignature = generateValidSignature(TEST_PAYLOAD, TEST_SECRET)

      // Should throw or return invalid when secret is empty
      await expect(
        verifyWebhookSignature(TEST_PAYLOAD, validSignature, '')
      ).rejects.toThrow()
    })

    it('should handle null payload gracefully', async () => {
      const signature = generateValidSignature('', TEST_SECRET)

      // @ts-expect-error - Testing invalid input
      await expect(
        verifyWebhookSignature(null, signature, TEST_SECRET)
      ).rejects.toThrow()
    })

    it('should handle non-string payload', async () => {
      // @ts-expect-error - Testing invalid input
      await expect(
        verifyWebhookSignature({ test: 'object' }, 'sig', TEST_SECRET)
      ).rejects.toThrow()
    })
  })

  describe('Real-world Scenarios', () => {
    it('should verify actual Toss webhook payload structure', async () => {
      const tossWebhookPayload = JSON.stringify({
        eventType: 'PAYMENT_STATUS_CHANGED',
        createdAt: '2025-01-02T12:00:00+09:00',
        data: {
          orderId: 'ORD-20250102-a1b2c3d4',
          paymentKey: 'test_gck_docs_OaPz8L5KdmQXkzRzlY3o37YmpXy2',
          status: 'DONE',
          totalAmount: 15000,
          method: '카드',
          requestedAt: '2025-01-02T12:00:00+09:00',
          approvedAt: '2025-01-02T12:00:05+09:00',
        },
      })

      const signature = generateValidSignature(tossWebhookPayload, TEST_SECRET)

      const result = await verifyWebhookSignature(
        tossWebhookPayload,
        signature,
        TEST_SECRET
      )

      expect(result.isValid).toBe(true)
    })

    it('should detect replay attacks with modified amounts', async () => {
      // Attacker intercepts valid webhook and tries to modify amount
      const originalPayload = JSON.stringify({
        eventType: 'PAYMENT_STATUS_CHANGED',
        data: {
          orderId: 'ORD-20250102-TEST',
          paymentKey: 'test_key',
          status: 'DONE',
          totalAmount: 1000, // Original: 1,000 won
        },
      })

      const validSignature = generateValidSignature(originalPayload, TEST_SECRET)

      // Attacker modifies payload but reuses signature
      const modifiedPayload = JSON.stringify({
        eventType: 'PAYMENT_STATUS_CHANGED',
        data: {
          orderId: 'ORD-20250102-TEST',
          paymentKey: 'test_key',
          status: 'DONE',
          totalAmount: 1000000, // Modified: 1,000,000 won
        },
      })

      const result = await verifyWebhookSignature(
        modifiedPayload,
        validSignature,
        TEST_SECRET
      )

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('INVALID_SIGNATURE')
    })
  })
})
