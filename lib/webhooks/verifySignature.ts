/**
 * Webhook Signature Verification
 *
 * GREEN Phase Implementation
 * Verifies webhook signatures using HMAC-SHA256 with timing-safe comparison.
 */

import { createHmac, timingSafeEqual } from 'crypto'
import {
  HMAC_ALGORITHM,
  VERIFICATION_FAILURE_REASONS,
  EMPTY_STRING,
  ERROR_MESSAGES,
} from './constants'

/**
 * Result of webhook signature verification
 *
 * Contains validation status, optional failure reason, and metadata for audit logging.
 *
 * @property isValid - Whether the signature is valid
 * @property reason - Failure reason (only present when isValid is false)
 * @property metadata - Additional verification metadata (timestamp, performance)
 * @property metadata.timestamp - Unix timestamp when verification started
 * @property metadata.durationMs - Execution time in milliseconds (for performance monitoring)
 */
export interface VerificationResult {
  isValid: boolean
  reason?: keyof typeof VERIFICATION_FAILURE_REASONS
  metadata?: {
    timestamp: number
    durationMs?: number
  }
}

/**
 * Verifies webhook signature using HMAC-SHA256 with timing-safe comparison.
 *
 * This function implements secure webhook signature verification following
 * cryptographic best practices:
 * - Uses HMAC-SHA256 for signature generation
 * - Employs timing-safe comparison to prevent timing attacks
 * - Validates all inputs before processing
 * - Returns detailed verification results for audit logging
 *
 * Security Notes:
 * - The secret key should be stored securely (environment variable)
 * - Failed verifications are logged but don't expose sensitive data
 * - Uses constant-time comparison via Node.js timingSafeEqual
 *
 * @param payload - Request body as string (must be the raw body, not parsed JSON)
 * @param signature - Signature from request header (hex-encoded HMAC-SHA256)
 * @param secret - Webhook secret key (must not be empty)
 * @returns Promise resolving to verification result with status and metadata
 * @throws {Error} When secret is empty or missing
 * @throws {Error} When payload is not a valid string
 *
 * @example
 * ```typescript
 * // Successful verification
 * const result = await verifyWebhookSignature(
 *   '{"event":"payment.confirmed"}',
 *   'a1b2c3d4...',
 *   process.env.WEBHOOK_SECRET
 * )
 * // { isValid: true, metadata: { timestamp: 1234567890 } }
 *
 * // Failed verification
 * const result = await verifyWebhookSignature(
 *   '{"event":"payment.confirmed"}',
 *   'invalid_signature',
 *   process.env.WEBHOOK_SECRET
 * )
 * // { isValid: false, reason: 'INVALID_SIGNATURE', metadata: { timestamp: 1234567890 } }
 * ```
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<VerificationResult> {
  const startTime = Date.now()

  // Validate inputs
  if (!secret || secret.trim() === EMPTY_STRING) {
    throw new Error(ERROR_MESSAGES.WEBHOOK_SECRET_REQUIRED)
  }

  if (payload === null || payload === undefined || typeof payload !== 'string') {
    throw new Error(`${ERROR_MESSAGES.PAYLOAD_MUST_BE_STRING}, received ${typeof payload}`)
  }

  // Check for missing signature
  if (
    signature === null ||
    signature === undefined ||
    signature.trim() === EMPTY_STRING
  ) {
    return {
      isValid: false,
      reason: VERIFICATION_FAILURE_REASONS.MISSING_SIGNATURE,
      metadata: {
        timestamp: startTime,
        durationMs: Date.now() - startTime
      },
    }
  }

  // Trim whitespace from signature
  const trimmedSignature = signature.trim()

  // Calculate expected signature
  const expectedSignature = createHmac(HMAC_ALGORITHM, secret)
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

  // Calculate execution time for performance monitoring (NFR-1: must be < 100ms)
  const durationMs = Date.now() - startTime

  if (isValid) {
    return {
      isValid: true,
      metadata: { timestamp: startTime, durationMs },
    }
  }

  return {
    isValid: false,
    reason: VERIFICATION_FAILURE_REASONS.INVALID_SIGNATURE,
    metadata: { timestamp: startTime, durationMs },
  }
}
