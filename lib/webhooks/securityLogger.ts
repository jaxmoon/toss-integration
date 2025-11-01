/**
 * Webhook Security Event Logger
 *
 * Structured logging for webhook verification events with security best practices:
 * - Never logs sensitive data (secrets, full signatures)
 * - Includes metadata for debugging (timestamp, request ID, IP)
 * - Provides audit trail for security analysis
 *
 * TDD Phase: GREEN - Implementation to pass integration tests
 */


import {
  MAX_SECURITY_LOGS,
  SECURITY_LOG_EVENTS,
  SIGNATURE_PREFIX_LENGTH,
} from './constants'
/**
 * Security audit log entry for webhook verification events.
 *
 * Captures essential information for security monitoring and debugging
 * while ensuring no sensitive data (secrets, full signatures) is logged.
 *
 * All properties are readonly to ensure log immutability after creation,
 * which is critical for audit trail integrity.
 *
 * @property timestamp - ISO 8601 timestamp of the event (e.g., "2024-01-15T10:30:45.123Z")
 * @property event - Type of security event (success or failure)
 * @property requestId - Unique identifier for request tracing across systems
 * @property reason - Failure reason (only present for FAILURE events, e.g., "INVALID_SIGNATURE")
 * @property metadata - Additional context for debugging (IP, user agent, signature prefix)
 * @property metadata.ip - Client IP address (if available from request headers)
 * @property metadata.userAgent - Client user agent string (if available from request headers)
 * @property metadata.signaturePrefix - First 8 characters of signature for debugging (never full signature)
 */
export interface SecurityLogEntry {
  readonly timestamp: string
  readonly event: typeof SECURITY_LOG_EVENTS.VERIFICATION_SUCCESS | typeof SECURITY_LOG_EVENTS.VERIFICATION_FAILURE
  readonly requestId: string
  readonly reason?: string
  readonly metadata: {
    readonly ip?: string
    readonly userAgent?: string
    readonly signaturePrefix?: string // Only first 8 chars
  }
}

/**
 * Metadata input for security logging.
 *
 * Provides flexible input format for logging metadata from various sources
 * (Express requests, Next.js API routes, etc.). The signature field is
 * automatically sanitized to only store the first 8 characters.
 *
 * @property ip - Client IP address from request headers
 * @property userAgent - Client user agent string from request headers
 * @property signature - Full signature string (will be sanitized to first 8 chars before logging)
 *
 * @example
 * ```typescript
 * const metadata: SecurityLogMetadata = {
 *   ip: request.headers['x-forwarded-for'] || request.socket.remoteAddress,
 *   userAgent: request.headers['user-agent'],
 *   signature: request.headers['x-webhook-signature']
 * }
 * ```
 */
export interface SecurityLogMetadata {
  readonly ip?: string
  readonly userAgent?: string
  readonly signature?: string
}

/**
 * In-memory security log storage
 * In production, this would integrate with logging service (Datadog, Sentry, etc.)
 * Uses circular buffer for O(1) insertions (avoiding O(n) Array.shift())
 */
const securityLogs: SecurityLogEntry[] = new Array(100) // Pre-allocate circular buffer
let logIndex = 0 // Current write position in circular buffer


/**
 * Webhook Security Logger for audit trail and security monitoring.
 *
 * Provides structured, immutable logging for webhook verification events
 * with automatic sanitization of sensitive data. Designed for compliance
 * with security audit requirements while preventing data exposure.
 *
 * Key Features:
 * - Immutable log entries for audit trail integrity
 * - Automatic signature sanitization (only first 8 chars logged)
 * - Non-blocking async logging via setImmediate()
 * - O(1) circular buffer for efficient log storage
 * - Chronological ordering even after buffer wraparound
 *
 * Security Best Practices:
 * - NEVER logs full signatures or secret keys
 * - Readonly properties prevent tampering
 * - Structured JSON format for SIEM integration
 *
 * Performance:
 * - O(1) log insertion (circular buffer)
 * - O(n) log retrieval where n = number of logs requested
 * - Memory bound: ~10KB for 100 log entries
 * - Non-blocking: Console output deferred to next tick
 *
 * Production Integration:
 * - Replace console.log with proper logging service (Datadog, Sentry)
 * - Configure log retention policies
 * - Set up alerting for verification failures
 *
 * @example
 * ```typescript
 * const logger = new WebhookSecurityLogger();
 *
 * // Log successful verification
 * logger.logSuccess('req_123', {
 *   ip: '192.168.1.1',
 *   userAgent: 'Toss-Webhook/1.0',
 *   signature: 'a1b2c3d4e5f6...' // Only first 8 chars will be logged
 * });
 *
 * // Log failed verification
 * logger.logFailure('INVALID_SIGNATURE', 'req_124', {
 *   ip: '10.0.0.1',
 *   userAgent: 'curl/7.68.0',
 *   signature: 'invalid_sig'
 * });
 *
 * // Retrieve logs for analysis
 * const recentLogs = logger.getRecentLogs(50);
 * ```
 */
export class WebhookSecurityLogger {
  /**
   * Logs a successful webhook signature verification event.
   *
   * Creates an immutable audit log entry with sanitized metadata and
   * stores it in the circular buffer. The signature is automatically
   * truncated to the first 8 characters for debugging purposes.
   *
   * The logging operation is non-blocking - console output is deferred
   * to the next event loop tick via setImmediate() to prevent delays
   * in webhook processing.
   *
   * @param requestId - Unique request identifier for correlation across logs
   * @param metadata - Request context including IP, user agent, and signature
   *
   * @example
   * ```typescript
   * logger.logSuccess('req_abc123', {
   *   ip: '192.168.1.1',
   *   userAgent: 'Toss-Webhook/1.0',
   *   signature: 'a1b2c3d4e5f6g7h8...'
   * });
   * // Logs: {"timestamp":"2024-01-15T10:30:45.123Z","event":"WEBHOOK_VERIFICATION_SUCCESS",...}
   * ```
   */
  logSuccess(requestId: string, metadata: SecurityLogMetadata): void {
    const entry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      event: SECURITY_LOG_EVENTS.VERIFICATION_SUCCESS,
      requestId,
      metadata: {
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        signaturePrefix: this.sanitizeSignature(metadata.signature),
      },
    }

    this.storeLog(entry)
    this.outputLog('[SECURITY]', entry)
  }

  /**
   * Logs a failed webhook signature verification event.
   *
   * Creates an immutable audit log entry including the failure reason
   * and sanitized metadata. This is critical for security monitoring
   * and detecting potential attacks or misconfigurations.
   *
   * Common failure reasons:
   * - "INVALID_SIGNATURE": Signature verification failed (potential attack or wrong secret)
   * - "MISSING_SIGNATURE": No signature header provided
   * - "EXPIRED_TIMESTAMP": Request too old (if timestamp verification implemented)
   *
   * The logging operation is non-blocking to prevent delays in webhook
   * rejection responses.
   *
   * @param reason - Specific failure reason for categorization and alerting
   * @param requestId - Unique request identifier for correlation
   * @param metadata - Request context including IP, user agent, and signature
   *
   * @example
   * ```typescript
   * logger.logFailure('INVALID_SIGNATURE', 'req_xyz789', {
   *   ip: '203.0.113.1',
   *   userAgent: 'curl/7.68.0',
   *   signature: 'wrongsig'
   * });
   * // Logs: {"event":"WEBHOOK_VERIFICATION_FAILURE","reason":"INVALID_SIGNATURE",...}
   * ```
   */
  logFailure(reason: string, requestId: string, metadata: SecurityLogMetadata): void {
    const entry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      event: SECURITY_LOG_EVENTS.VERIFICATION_FAILURE,
      requestId,
      reason,
      metadata: {
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        signaturePrefix: this.sanitizeSignature(metadata.signature),
      },
    }

    this.storeLog(entry)
    this.outputLog('[SECURITY]', entry)
  }

  /**
   * Retrieves recent security logs in chronological order.
   *
   * Returns logs from oldest to newest, properly handling circular
   * buffer wraparound. Useful for debugging, security audits, and
   * generating reports on verification patterns.
   *
   * Performance: O(n) where n = total cached logs (not the limit).
   * Filters undefined entries and reorders if buffer has wrapped.
   *
   * @param limit - Maximum number of logs to return (default: MAX_SECURITY_LOGS)
   * @returns Array of log entries sorted chronologically (oldest first)
   *
   * @example
   * ```typescript
   * // Get last 10 logs
   * const recentLogs = logger.getRecentLogs(10);
   * recentLogs.forEach(log => {
   *   console.log(`${log.timestamp}: ${log.event} - ${log.requestId}`);
   * });
   *
   * // Analyze failure rate
   * const logs = logger.getRecentLogs(100);
   * const failures = logs.filter(l => l.event === 'WEBHOOK_VERIFICATION_FAILURE');
   * console.log(`Failure rate: ${failures.length}/${logs.length}`);
   * ```
   */
  getRecentLogs(limit: number = MAX_SECURITY_LOGS): SecurityLogEntry[] {
    // Filter out undefined entries (from pre-allocated array)
    const validLogs = securityLogs.filter((log): log is SecurityLogEntry => log !== undefined)

    // If we've wrapped around the buffer, need to reorder
    if (logIndex > MAX_SECURITY_LOGS) {
      // Circular buffer has wrapped - reorder to chronological
      const startIdx = logIndex % MAX_SECURITY_LOGS
      const reordered = [
        ...validLogs.slice(startIdx),
        ...validLogs.slice(0, startIdx)
      ]
      return reordered.slice(-limit)
    }

    // Haven't wrapped yet - logs are already in order
    return validLogs.slice(-limit)
  }

  /**
   * Sanitizes signature to prevent sensitive data exposure.
   *
   * Returns only the first N characters (defined by SIGNATURE_PREFIX_LENGTH)
   * of the signature for debugging purposes. NEVER logs the full signature
   * or secret key to prevent security breaches.
   *
   * This is a critical security measure - even if logs are compromised,
   * attackers cannot use partial signatures to forge requests.
   *
   * @param signature - Full signature string (typically 64+ hex characters for HMAC-SHA256)
   * @returns First SIGNATURE_PREFIX_LENGTH characters, or undefined if signature not provided
   * @internal
   *
   * @example
   * ```typescript
   * sanitizeSignature('a1b2c3d4e5f6g7h8...') // Returns: 'a1b2c3d4' (8 chars)
   * sanitizeSignature(undefined) // Returns: undefined
   * ```
   */
  private sanitizeSignature(signature?: string): string | undefined {
    if (!signature) return undefined
    return signature.substring(0, SIGNATURE_PREFIX_LENGTH)
  }

  /**
   * Stores log entry in the circular buffer.
   *
   * Uses modulo arithmetic to wrap around when the buffer is full,
   * automatically overwriting the oldest entries. This provides O(1)
   * insertion performance compared to O(n) for array shift operations.
   *
   * The circular buffer maintains a constant memory footprint of
   * MAX_SECURITY_LOGS entries regardless of total log volume.
   *
   * @param entry - Security log entry to store
   * @internal
   */
  private storeLog(entry: SecurityLogEntry): void {
    // Write to current position in circular buffer (O(1) operation)
    securityLogs[logIndex % MAX_SECURITY_LOGS] = entry
    logIndex++
  }

  /**
   * Outputs log to console in structured JSON format.
   *
   * Defers console output to the next event loop tick using setImmediate()
   * to ensure webhook verification completes quickly (<100ms) even if
   * console.log is slow (e.g., writing to disk, network logging).
   *
   * In production, replace console.log with proper logging service:
   * - Datadog: Use datadog-logger
   * - Sentry: Use Sentry.captureMessage()
   * - CloudWatch: Use aws-sdk or winston-cloudwatch
   *
   * @param prefix - Log prefix for filtering/categorization (e.g., "[SECURITY]")
   * @param entry - Security log entry to output
   * @internal
   */
  private outputLog(prefix: string, entry: SecurityLogEntry): void {
    // Defer console output to next event loop tick (non-blocking)
    setImmediate(() => {
      console.log(`${prefix} ${JSON.stringify(entry)}`)
    })
  }

  /**
   * Clears all stored logs from memory.
   *
   * Resets the circular buffer to its initial state. Use with caution
   * in production as this permanently deletes all audit trail data.
   *
   * Primary use cases:
   * - Test cleanup (afterEach/afterAll hooks)
   * - Application shutdown/restart
   * - Manual log rotation (if not using external logging service)
   *
   * @example
   * ```typescript
   * // Clear logs in test cleanup
   * afterEach(() => {
   *   logger.clearLogs();
   * });
   * ```
   */
  clearLogs(): void {
    // Reset circular buffer to initial state
    securityLogs.length = 0
    securityLogs.length = MAX_SECURITY_LOGS
    logIndex = 0
  }
}

/**
 * Singleton instance for application-wide use.
 *
 * Import and use this instance throughout your application to maintain
 * a centralized security log. The singleton pattern ensures all webhook
 * verification events are logged to the same circular buffer.
 *
 * @example
 * ```typescript
 * import { webhookSecurityLogger } from '@/lib/webhooks/securityLogger';
 *
 * webhookSecurityLogger.logSuccess(requestId, metadata);
 * ```
 */
export const webhookSecurityLogger = new WebhookSecurityLogger()
