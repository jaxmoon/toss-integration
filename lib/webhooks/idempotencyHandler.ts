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
 * const handler = new IdempotencyHandler(60); // 60 second TTL
 * const isNew = await handler.checkAndRecord(key);
 * if (isNew) {
 *   const response = await processWebhook();
 *   await handler.recordResponse(key, response);
 *   return response;
 * } else {
 *   return await handler.getResponse(key);
 * }
 */

export interface IdempotencyRecord {
  key: string
  processedAt: number
  response?: any
}

export class IdempotencyHandler {
  private cache: Map<string, IdempotencyRecord>
  private ttlMs: number
  private processingKeys: Set<string> // Track keys currently being processed

  /**
   * Creates a new IdempotencyHandler
   * @param ttlSeconds - Time-to-live in seconds (default: 60)
   */
  constructor(ttlSeconds: number = 60) {
    this.cache = new Map()
    this.ttlMs = ttlSeconds * 1000
    this.processingKeys = new Set()
  }

  /**
   * Checks if a request is new and records it atomically
   * @param key - Idempotency key (required)
   * @param data - Optional request data to store
   * @returns true if this is a new request, false if duplicate
   * @throws Error if key is missing/null/undefined
   */
  async checkAndRecord(key: string, data?: any): Promise<boolean> {
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
   * Records a new entry in cache
   * @param key - Idempotency key
   * @param data - Optional request data
   */
  private recordNewEntry(key: string, data?: any): void {
    this.processingKeys.add(key)

    const record: IdempotencyRecord = {
      key,
      processedAt: Date.now(),
      response: data
    }

    this.cache.set(key, record)

    // Remove from processing set (key is now recorded)
    this.processingKeys.delete(key)
  }

  /**
   * Gets cached response for a key
   * @param key - Idempotency key
   * @returns Cached response or undefined if not found/expired
   */
  async getResponse(key: string): Promise<any> {
    const record = await this.getRecord(key)
    return record?.response
  }

  /**
   * Records response data for a processed request
   * @param key - Idempotency key
   * @param response - Response data to cache
   */
  async recordResponse(key: string, response: any): Promise<void> {
    const existing = this.cache.get(key)

    if (existing) {
      // Update existing record with response
      existing.response = response
      this.cache.set(key, existing)
    } else {
      // Create new record if it doesn't exist
      const record: IdempotencyRecord = {
        key,
        processedAt: Date.now(),
        response
      }
      this.cache.set(key, record)
    }
  }

  /**
   * Gets full idempotency record
   * @param key - Idempotency key
   * @returns Record or undefined if not found/expired
   */
  async getRecord(key: string): Promise<IdempotencyRecord | undefined> {
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
   * Removes expired entries from cache
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
   * Clears all entries from cache
   */
  async clear(): Promise<void> {
    this.cache.clear()
    this.processingKeys.clear()
  }
}
