/**
 * Webhook Security Constants
 *
 * Centralized constants for webhook signature verification,
 * idempotency handling, rate limiting, and security logging.
 *
 * REFACTOR phase: Extracted from implementation files
 */

// ============================================================================
// HMAC Signature Verification
// ============================================================================

/** HMAC algorithm used for webhook signature verification */
export const HMAC_ALGORITHM = 'sha256' as const

/** Length of signature prefix to log (first N characters) */
export const SIGNATURE_PREFIX_LENGTH = 8

// ============================================================================
// Idempotency Configuration
// ============================================================================

/** Default TTL for idempotency records in seconds */
export const DEFAULT_IDEMPOTENCY_TTL_SECONDS = 60

/** Idempotency TTL for webhook processing (24 hours) */
export const WEBHOOK_IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60 // 86400 seconds

/** Milliseconds per second conversion factor */
export const MS_PER_SECOND = 1000

// ============================================================================
// Security Logging
// ============================================================================

/** Maximum number of security log entries to retain in memory */
export const MAX_SECURITY_LOGS = 100

/** Security log event types */
export const SECURITY_LOG_EVENTS = {
  VERIFICATION_SUCCESS: 'WEBHOOK_VERIFICATION_SUCCESS',
  VERIFICATION_FAILURE: 'WEBHOOK_VERIFICATION_FAILURE',
} as const

// ============================================================================
// Rate Limiting
// ============================================================================

/** Rate limit window duration in milliseconds (1 minute) */
export const RATE_LIMIT_WINDOW_MS = 60 * 1000

/** Maximum webhook requests per IP per rate limit window */
export const RATE_LIMIT_MAX_REQUESTS = 50

// ============================================================================
// Validation
// ============================================================================

/** Empty string constant for validation checks */
export const EMPTY_STRING = ''

/** First element index for array access */
export const FIRST_ELEMENT_INDEX = 0

// ============================================================================
// HTTP Status Codes
// ============================================================================

/** HTTP status codes for webhook responses */
export const HTTP_STATUS = {
  OK: 200,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const

// ============================================================================
// Error Reasons
// ============================================================================

/** Webhook verification failure reasons */
export const VERIFICATION_FAILURE_REASONS = {
  MISSING_SIGNATURE: 'MISSING_SIGNATURE',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
} as const

/** Error messages for webhook processing */
export const ERROR_MESSAGES = {
  WEBHOOK_SECRET_REQUIRED: 'Webhook secret not configured. Set TOSS_WEBHOOK_SECRET in environment variables.',
  PAYLOAD_MUST_BE_STRING: 'Invalid webhook payload: expected string body',
  IDEMPOTENCY_KEY_REQUIRED: 'Idempotency key is required. Include "Toss-Idempotency-Key" header in webhook request.',
  RATE_LIMIT_EXCEEDED: 'Too many webhook requests. Rate limit: 50 requests per minute per IP.',
  INVALID_JSON: 'Invalid JSON payload. Ensure request body contains valid JSON.',
  WEBHOOK_NOT_CONFIGURED: 'Webhook secret not configured. Set TOSS_WEBHOOK_SECRET in environment variables.',
  SIGNATURE_VERIFICATION_FAILED: 'Signature verification failed. Check webhook signature and secret.',
  MISSING_SIGNATURE_HEADER: 'Missing signature header. Include "Toss-Signature" header in webhook request.',
  DUPLICATE_REQUEST: 'Duplicate webhook request detected. This request was already processed.',
  MISSING_IDEMPOTENCY_KEY: 'Missing idempotency key. Include "Toss-Idempotency-Key" header in webhook request.',
  INVALID_PAYLOAD: 'Invalid webhook payload. Missing required fields: orderId, paymentKey.',
  UNSUPPORTED_EVENT_TYPE: 'Unsupported event type. Only PAYMENT_STATUS_CHANGED events are supported.',
  PAYMENT_CONFIRMATION_FAILED: 'Payment confirmation failed. Unable to verify payment with Toss servers.',
  INTERNAL_ERROR: 'Internal server error. Request ID available for support.',
} as const
