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

export interface SecurityLogEntry {
  timestamp: string
  event: 'WEBHOOK_VERIFICATION_SUCCESS' | 'WEBHOOK_VERIFICATION_FAILURE'
  requestId: string
  reason?: string
  metadata: {
    ip?: string
    userAgent?: string
    signaturePrefix?: string // Only first 8 chars
  }
}

/**
 * In-memory security log storage
 * In production, this would integrate with logging service (Datadog, Sentry, etc.)
 */
const securityLogs: SecurityLogEntry[] = []
const MAX_LOGS = 100 // Keep last 100 entries in memory

/**
 * WebhookSecurityLogger
 *
 * Provides structured logging for webhook security events
 * with proper sanitization of sensitive data
 */
export class WebhookSecurityLogger {
  /**
   * Log successful webhook verification
   *
   * @param requestId - Unique request identifier for tracing
   * @param metadata - Additional context (IP, user agent, signature prefix)
   */
  logSuccess(requestId: string, metadata: Record<string, any>): void {
    const entry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      event: 'WEBHOOK_VERIFICATION_SUCCESS',
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
   * Log failed webhook verification
   *
   * @param reason - Failure reason (e.g., "INVALID_SIGNATURE", "MISSING_SIGNATURE")
   * @param requestId - Unique request identifier for tracing
   * @param metadata - Additional context (IP, user agent, signature prefix)
   */
  logFailure(reason: string, requestId: string, metadata: Record<string, any>): void {
    const entry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      event: 'WEBHOOK_VERIFICATION_FAILURE',
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
   * Get recent security logs for testing/debugging
   *
   * @param limit - Maximum number of logs to return (default: 100)
   * @returns Array of security log entries
   */
  getRecentLogs(limit: number = MAX_LOGS): SecurityLogEntry[] {
    return securityLogs.slice(-limit)
  }

  /**
   * Sanitize signature to only include first 8 characters
   * NEVER log full signatures or secrets
   *
   * @param signature - Full signature string
   * @returns First 8 characters of signature or undefined
   */
  private sanitizeSignature(signature?: string): string | undefined {
    if (!signature) return undefined
    return signature.substring(0, 8)
  }

  /**
   * Store log entry in memory
   * Maintains circular buffer of last MAX_LOGS entries
   *
   * @param entry - Security log entry to store
   */
  private storeLog(entry: SecurityLogEntry): void {
    securityLogs.push(entry)

    // Keep only last MAX_LOGS entries
    if (securityLogs.length > MAX_LOGS) {
      securityLogs.shift()
    }
  }

  /**
   * Output log to console in structured format
   * In production, this would use proper logging service
   *
   * @param prefix - Log prefix (e.g., "[SECURITY]")
   * @param entry - Security log entry to output
   */
  private outputLog(prefix: string, entry: SecurityLogEntry): void {
    console.log(`${prefix} ${JSON.stringify(entry)}`)
  }

  /**
   * Clear all stored logs (for testing)
   */
  clearLogs(): void {
    securityLogs.length = 0
  }
}

/**
 * Singleton instance for application-wide use
 */
export const webhookSecurityLogger = new WebhookSecurityLogger()
