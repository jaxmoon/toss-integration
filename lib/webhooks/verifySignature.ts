/**
 * Webhook Signature Verification
 *
 * GREEN Phase Implementation
 * Verifies webhook signatures using HMAC-SHA256 with timing-safe comparison.
 */

import { createHmac, timingSafeEqual } from 'crypto'

export interface VerificationResult {
  isValid: boolean
  reason?: 'MISSING_SIGNATURE' | 'INVALID_SIGNATURE'
  metadata?: {
    timestamp: number
  }
}

/**
 * Verifies webhook signature using HMAC-SHA256
 *
 * @param payload - Request body as string
 * @param signature - Signature from request header
 * @param secret - Webhook secret key
 * @returns Verification result
 * @throws {Error} When secret is empty or payload is invalid
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<VerificationResult> {
  const timestamp = Date.now()

  // Validate inputs
  if (!secret || secret.trim() === '') {
    throw new Error('Webhook secret is required')
  }

  if (payload === null || payload === undefined || typeof payload !== 'string') {
    throw new Error('Payload must be a string')
  }

  // Check for missing signature
  if (
    signature === null ||
    signature === undefined ||
    signature.trim() === ''
  ) {
    return {
      isValid: false,
      reason: 'MISSING_SIGNATURE',
      metadata: { timestamp },
    }
  }

  // Trim whitespace from signature
  const trimmedSignature = signature.trim()

  // Calculate expected signature
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  // Timing-safe comparison
  let isValid = false
  try {
    // Ensure both strings are same length for timingSafeEqual
    if (trimmedSignature.length === expectedSignature.length) {
      isValid = timingSafeEqual(
        Buffer.from(trimmedSignature),
        Buffer.from(expectedSignature)
      )
    }
  } catch (error) {
    // timingSafeEqual throws if buffers are different lengths
    // or if there's an encoding issue
    isValid = false
  }

  if (isValid) {
    return {
      isValid: true,
      metadata: { timestamp },
    }
  }

  return {
    isValid: false,
    reason: 'INVALID_SIGNATURE',
    metadata: { timestamp },
  }
}
