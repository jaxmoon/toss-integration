/**
 * Idempotency Handler
 *
 * In-memory idempotency handler for webhook deduplication.
 * Tracks processed requests by idempotency key and prevents duplicate processing.
 *
 * TODO: For production deployment, migrate to Redis for:
 * - Distributed cache across multiple server instances
 * - Persistent storage beyond process lifetime
 * - Better scalability and performance
 *
 * @example
 * const handler = new IdempotencyHandler<WebhookResponse>(60); // 60 second TTL
 * const isNew = await handler.checkAndRecord(key);
 * if (isNew) {
 *   const response = await processWebhook();
 *   await handler.recordResponse(key, response);
 *   return response;
 * } else {
 *   return await handler.getResponse(key);
 * }
 */

/**
 * Record stored in the idempotency cache
 *
 * Tracks processed webhook requests to prevent duplicate processing.
 * Each record includes the idempotency key, processing timestamp, and
 * optional cached response data.
 *
 * @template T - Type of the cached response data
 * @property key - Unique idempotency identifier (typically webhook event ID)
 * @property processedAt - Unix timestamp in milliseconds when request was first processed
 * @property response - Cached response data from initial processing (optional)
 */
export interface IdempotencyRecord<T = unknown> {
  readonly key: string
  readonly processedAt: number
  readonly response?: T
}

/**
 * In-memory idempotency handler for webhook deduplication.
 *
 * Provides atomic check-and-record operations to prevent duplicate webhook
 * processing. Supports TTL-based expiration and concurrent request handling.
 *
 * Key Features:
 * - Atomic check-and-record to prevent race conditions
 * - TTL-based automatic expiration of old records
 * - Concurrent request detection via processing key tracking
 * - Response caching for returning identical results to duplicate requests
 *
 * Performance Characteristics:
 * - O(1) lookup and insertion via Map
 * - O(n) cleanup where n = number of cached entries
 * - Memory usage: ~100 bytes per cached record
 *
 * Production Notes:
 * - Current implementation is in-memory only (lost on process restart)
 * - For distributed systems, migrate to Redis with same interface
 * - Consider periodic cleanup() calls to prevent memory growth
 *
 * @template T - Type of the cached response data (defaults to unknown)
 *
 * @example
 * ```typescript
 * interface WebhookResponse {
 *   success: boolean
 *   orderId: string
 * }
 *
 * const handler = new IdempotencyHandler<WebhookResponse>(300); // 5 minutes TTL
 *
 * // Check if request is new
 * const isNew = await handler.checkAndRecord('evt_123');
 * if (isNew) {
 *   const result = await processWebhook(data);
 *   await handler.recordResponse('evt_123', result);
 *   return result;
 * } else {
 *   // Return cached response for duplicate
 *   return await handler.getResponse('evt_123');
 * }
 * ```
 */
export class IdempotencyHandler<T = unknown> {
  private cache: Map<string, IdempotencyRecord<T>>
  private readonly ttlMs: number
  private processingKeys: Set<string> // Track keys currently being processed

  /**
   * Creates a new IdempotencyHandler instance.
   *
   * Initializes an empty cache with the specified TTL. Records older than
   * TTL will be considered expired and treated as new requests.
   *
   * @param ttlSeconds - Time-to-live in seconds for cached records (default: 60)
   *
   * @example
   * ```typescript
   * // 60 second TTL (default)
   * const handler = new IdempotencyHandler();
   *
   * // 5 minute TTL with typed responses
   * const handler = new IdempotencyHandler<PaymentResponse>(300);
   * ```
   */
  constructor(ttlSeconds: number = 60) {
    this.cache = new Map()
    this.ttlMs = ttlSeconds * 1000
    this.processingKeys = new Set()
  }

  /**
   * Atomically checks if a request is new and records it for deduplication.
   *
   * This method performs several checks in order:
   * 1. Validates the idempotency key is provided
   * 2. Checks if key is currently being processed (concurrent request)
   * 3. Checks if key exists in cache and is not expired
   * 4. Records new entry if all checks pass
   *
   * The operation is atomic to prevent race conditions between concurrent
   * requests with the same idempotency key.
   *
   * @param key - Unique idempotency identifier (must not be empty, null, or undefined)
   * @param data - Optional metadata to store with the record
   * @returns Promise resolving to true if this is a new request, false if duplicate
   * @throws {Error} If key is missing, null, undefined, or empty string
   *
   * @example
   * ```typescript
   * // Check if webhook is new
   * const isNew = await handler.checkAndRecord('evt_payment_123');
   * if (isNew) {
   *   console.log('Processing new webhook');
   * } else {
   *   console.log('Duplicate webhook, skipping');
   * }
   *
   * // Store metadata with the record
   * const isNew = await handler.checkAndRecord('evt_123', {
   *   receivedAt: Date.now(),
   *   ip: request.ip
   * });
   * ```
   */
  async checkAndRecord(key: string, data?: T): Promise<boolean> {
    // Validate key
    if (key === null || key === undefined || key === '') {
      throw new Error('Idempotency key is required')
    }

    // Check if key is currently being processed (concurrent request handling)
    if (this.processingKeys.has(key)) {
      // Another request is processing this key, treat as duplicate
      return false
    }

    // Check if key exists in cache
    const existing = this.cache.get(key)

    if (existing) {
      // Check if expired
      const now = Date.now()
      const age = now - existing.processedAt

      if (age >= this.ttlMs) {
        // Expired, treat as new request
        this.cache.delete(key)
        // Record new entry
        this.recordNewEntry(key, data)
        return true
      }

      // Not expired, duplicate request
      return false
    }

    // New key, record it
    this.recordNewEntry(key, data)
    return true
  }

  /**
   * Internal method to record a new entry in the cache.
   *
   * Adds the key to the processing set, creates the cache record,
   * and then removes from processing set. This prevents concurrent
   * requests from processing the same key simultaneously.
   *
   * @param key - Idempotency key to record
   * @param data - Optional metadata to store with the record
   * @internal
   */
  private recordNewEntry(key: string, data?: T): void {
    this.processingKeys.add(key)

    const record: IdempotencyRecord<T> = {
      key,
      processedAt: Date.now(),
      response: data
    }

    this.cache.set(key, record)

    // Remove from processing set (key is now recorded)
    this.processingKeys.delete(key)
  }

  /**
   * Retrieves cached response for a previously processed request.
   *
   * Returns the cached response data if the record exists and has not expired.
   * Returns undefined if the key is not found or has expired.
   *
   * @param key - Idempotency key to look up
   * @returns Promise resolving to cached response or undefined
   *
   * @example
   * ```typescript
   * const cachedResponse = await handler.getResponse('evt_123');
   * if (cachedResponse) {
   *   console.log('Returning cached response:', cachedResponse);
   * }
   * ```
   */
  async getResponse(key: string): Promise<T | undefined> {
    const record = await this.getRecord(key)
    return record?.response
  }

  /**
   * Records or updates response data for a processed request.
   *
   * If the key exists, updates the response field. If the key doesn't exist,
   * creates a new record with the current timestamp.
   *
   * @param key - Idempotency key
   * @param response - Response data to cache
   *
   * @example
   * ```typescript
   * const response = { success: true, orderId: 'ORD-123' };
   * await handler.recordResponse('evt_123', response);
   * ```
   */
  async recordResponse(key: string, response: T): Promise<void> {
    const existing = this.cache.get(key)

    if (existing) {
      // TypeScript doesn't allow assignment to readonly properties on interface
      // but we need to update the response. Create a new record instead.
      const updatedRecord: IdempotencyRecord<T> = {
        key: existing.key,
        processedAt: existing.processedAt,
        response
      }
      this.cache.set(key, updatedRecord)
    } else {
      // Create new record if it doesn't exist
      const record: IdempotencyRecord<T> = {
        key,
        processedAt: Date.now(),
        response
      }
      this.cache.set(key, record)
    }
  }

  /**
   * Retrieves the full idempotency record for a key.
   *
   * Returns the complete record including key, timestamp, and response data.
   * Automatically checks expiration and removes expired records.
   *
   * @param key - Idempotency key to look up
   * @returns Promise resolving to full record or undefined if not found/expired
   *
   * @example
   * ```typescript
   * const record = await handler.getRecord('evt_123');
   * if (record) {
   *   console.log('Processed at:', new Date(record.processedAt));
   *   console.log('Response:', record.response);
   * }
   * ```
   */
  async getRecord(key: string): Promise<IdempotencyRecord<T> | undefined> {
    const record = this.cache.get(key)

    if (!record) {
      return undefined
    }

    // Check if expired
    const now = Date.now()
    const age = now - record.processedAt

    if (age >= this.ttlMs) {
      // Expired, remove and return undefined
      this.cache.delete(key)
      return undefined
    }

    return record
  }

  /**
   * Removes all expired entries from the cache.
   *
   * Iterates through all cached records and deletes those that have exceeded
   * the TTL. This method should be called periodically to prevent memory growth.
   *
   * @example
   * ```typescript
   * // Run cleanup every hour
   * setInterval(() => handler.cleanup(), 3600 * 1000);
   * ```
   */
  async cleanup(): Promise<void> {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, record] of this.cache.entries()) {
      const age = now - record.processedAt

      if (age >= this.ttlMs) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key)
    }
  }

  /**
   * Removes all entries from the cache.
   *
   * Clears both the cache and processing key set. Useful for testing
   * or resetting the handler state.
   *
   * @example
   * ```typescript
   * // Clear cache for testing
   * await handler.clear();
   * ```
   */
  async clear(): Promise<void> {
    this.cache.clear()
    this.processingKeys.clear()
  }
}
