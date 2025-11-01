/**
 * Webhook Signature Verification
 *
 * STUB FILE - TDD Red Phase
 * This file contains only type definitions to allow tests to run and fail.
 * Implementation will be added in Phase 2 (Green).
 */

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
 *
 * TODO: Implement in Phase 2 (Green)
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<VerificationResult> {
  // STUB - Will fail all tests (Red phase)
  throw new Error('Not implemented - TDD Red Phase')
}
