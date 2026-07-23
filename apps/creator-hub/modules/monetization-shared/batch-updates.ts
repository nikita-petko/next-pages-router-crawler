import { retryAsync, type RetryOptions } from './retry';
import { partition } from './arrays';

/** Default delay between batches (in ms). */
export const BATCH_DELAY_MS = 50;

/** Default retry attempts for each individual batch call. */
export const DEFAULT_BATCH_RETRIES = 4 satisfies RetryOptions['retry'];

/**
 * Default retry delay function for each batch call.
 * Uses linear backoff with jitter.
 */
export const DEFAULT_BATCH_RETRY_DELAY = (retryAttempt: number) =>
  Math.ceil(500 * (Math.random() + 1) * retryAttempt) satisfies RetryOptions['retryDelay'];

/**
 * Configuration for how batches are sized, delayed, and retried.
 *
 * @example
 * ```ts
 * const config: BatchExecutionConfig = {
 *   batchLimit: 30,
 *   batchDelay: 50,
 *   totalLimit: 3000,
 *   retry: 4,
 *   retryDelay: (attempt) => Math.ceil(500 * (Math.random() + 1) * attempt),
 * };
 * ```
 */
export type BatchExecutionConfig = {
  /**
   * Maximum number of items per batch.
   *
   * Items are evenly distributed across batches using {@link partition},
   * so actual batch sizes may be smaller than this limit.
   */
  batchLimit: number;

  /**
   * Maximum total items allowed. If the number of updates exceeds this value,
   * the function throws before making any API calls.
   */
  totalLimit?: number;

  /**
   * Delay in milliseconds between dispatching each batch. Batch `i` is delayed
   * by `batchDelay * i` ms, so the first batch always starts immediately.
   *
   * Defaults to {@link BATCH_DELAY_MS}.
   */
  batchDelay?: number;

  /**
   * Number of retry attempts for each individual batch call.
   * Passed through to {@link retryAsync}. Defaults to {@link DEFAULT_BATCH_RETRIES}.
   */
  retry?: RetryOptions['retry'];

  /**
   * Delay between retries for each individual batch call, in ms or as a
   * function of `(retryAttempt, error)`. Passed through to {@link retryAsync}.
   * Defaults to {@link DEFAULT_BATCH_RETRY_DELAY}.
   */
  retryDelay?: RetryOptions['retryDelay'];
};

/**
 * Callbacks that adapt the generic batch engine to a specific API.
 *
 * @template TUpdate - Shape of a single update item sent to the API (e.g., `DeveloperProductUpdate`).
 * @template TError - Shape of a per-item error returned by the API (e.g., `DeveloperProductUpdateError`).
 * @template TResponse - Shape of the API response for a single batch call.
 *
 * @example
 * ```ts
 * const callbacks: BatchCallbacks<DeveloperProductUpdate, DeveloperProductUpdateError, BulkUpdateDeveloperProductsResponse> = {
 *   executeBatch: (chunk) => client.updateDeveloperProducts({ universeId, body: { developerProductUpdates: chunk } }),
 *   getPartialErrors: (response) => response.errors ?? [],
 *   createBatchFailureError: (update, reason) => ({
 *     productId: update.productId,
 *     error: { errorCode: ErrorCode.UnknownError, errorMessage: reason instanceof Error ? reason.message : 'Unknown error' },
 *   }),
 * };
 * ```
 */
export type BatchCallbacks<TUpdate, TError, TResponse> = {
  /**
   * Executes a single batch of updates against the API.
   *
   * @param batch - The subset of update items for this batch.
   * @returns The API response for this batch.
   */
  executeBatch: (batch: TUpdate[]) => Promise<TResponse>;

  /**
   * Extracts per-item errors from a successful (fulfilled) batch response.
   *
   * A batch call can succeed at the HTTP level but still report that some
   * individual items failed. This callback extracts those per-item errors.
   *
   * @param response - The API response from a fulfilled batch call.
   * @returns An array of per-item errors, or an empty array if all items succeeded.
   *
   * @example
   * ```ts
   * // Both developer products and game passes follow the same pattern:
   * getPartialErrors: (response) => response.errors ?? []
   * ```
   */
  getPartialErrors: (response: TResponse) => TError[];

  /**
   * Creates a per-item error when an entire batch call fails.
   *
   * When a batch call is rejected (e.g., network error, timeout after exhausting
   * retries), the API does not return per-item error details. This callback
   * synthesizes an error for each item in the failed batch, allowing callers to
   * treat batch-level failures the same as per-item failures.
   *
   * @param update - The update item that was part of the failed batch.
   * @param reason - The rejection reason. Typed as `unknown` since Promise
   *   rejections are not guaranteed to be `Error` instances.
   * @returns A domain-specific error entry for this item.
   *
   * @example
   * ```ts
   * createBatchFailureError: (update, reason) => ({
   *   productId: update.productId,
   *   error: {
   *     errorCode: ErrorCode.UnknownError,
   *     errorMessage: reason instanceof Error ? reason.message : 'Unknown error',
   *   },
   * })
   * ```
   */
  createBatchFailureError: (update: TUpdate, reason: unknown) => TError;
};

/**
 * Normalized result of a batched update operation.
 *
 * @template TError - Shape of a per-item error.
 */
export type BatchUpdateResult<TError> = {
  /** Accumulated per-item errors from all batches (both API-reported and synthesized from batch failures). */
  errors: TError[];
};

/**
 * Executes a bulk update by partitioning items into batches, dispatching them
 * with staggered delays, retrying failures, and aggregating per-item errors.
 *
 * This is the core batch execution engine used by domain-specific bulk update
 * functions (e.g., developer products, game passes) to handle large-scale
 * updates reliably.
 *
 * **Behavior:**
 * - Items are evenly partitioned into batches of up to `config.batchLimit`.
 * - Batches are dispatched in parallel with a staggered delay (`batchDelay * batchIndex`).
 * - Each batch is independently retried per `retry` / `retryDelay`.
 * - If at least one batch succeeds, per-item errors are accumulated and returned.
 * - If **all** batches fail, the first rejection reason is thrown (triggers the mutation's `onError`).
 *
 * **Centralized defaults (when not provided in config):**
 * - `batchDelay = 50ms`
 * - `retry = 4`
 * - `retryDelay = DEFAULT_BATCH_RETRY_DELAY`
 *
 * @template TUpdate - Shape of a single update item sent to the API.
 * @template TError - Shape of a per-item error.
 * @template TResponse - Shape of the API response for a single batch call.
 *
 * @param updates - The full list of update items to process.
 * @param callbacks - Domain-specific adapters for executing batches and handling errors.
 * @param config - Batch sizing, delay, and retry configuration.
 * @returns A normalized result containing all accumulated per-item errors.
 *
 * @throws {Error} If `updates.length` exceeds `config.totalLimit`.
 * @throws The first batch rejection reason if **all** batches fail.
 *
 * @example
 * ```ts
 * // Developer products: batch 3000 products into groups of 30 with retries
 * const result = await executeBatchedUpdates(
 *   productIds.map(id => ({ productId: id, changedProperties: { isRegionalPricingEnabled: true } })),
 *   {
 *     executeBatch: (chunk) => client.updateDeveloperProducts({
 *       universeId,
 *       body: { developerProductUpdates: chunk },
 *     }),
 *     getPartialErrors: (response) => response.errors ?? [],
 *     createBatchFailureError: (update, reason) => ({
 *       productId: update.productId,
 *       error: { errorCode: ErrorCode.UnknownError, errorMessage: reason instanceof Error ? reason.message : 'Unknown error' },
 *     }),
 *   },
 *   { batchLimit: 30, batchDelay: 50, totalLimit: 3000, retry: 4 },
 * );
 *
 * // Game passes: same engine, different payload shape
 * const result = await executeBatchedUpdates(
 *   passIds.map(id => ({ gamePassId: id, changedProperties: { regionalPricing: true } })),
 *   {
 *     executeBatch: (chunk) => client.updatePasses({
 *       universeId,
 *       gamePassesBulkUpdateRequest: { gamePassUpdates: chunk },
 *     }),
 *     getPartialErrors: (response) => response.errors ?? [],
 *     createBatchFailureError: (update, reason) => ({
 *       gamePassId: update.gamePassId,
 *       error: { errorMessage: reason instanceof Error ? reason.message : 'Unknown error' },
 *     }),
 *   },
 *   { batchLimit: 30, batchDelay: 50, retry: 4 },
 * );
 * ```
 */
export async function executeBatchedUpdates<TUpdate, TError, TResponse>(
  updates: TUpdate[],
  callbacks: BatchCallbacks<TUpdate, TError, TResponse>,
  config: BatchExecutionConfig,
): Promise<BatchUpdateResult<TError>> {
  const {
    batchLimit,
    batchDelay = BATCH_DELAY_MS,
    totalLimit,
    retry = DEFAULT_BATCH_RETRIES,
    retryDelay = DEFAULT_BATCH_RETRY_DELAY,
  } = config;

  if (totalLimit !== undefined && updates.length > totalLimit) {
    throw new Error(`Cannot update more than ${totalLimit} items at once.`);
  }

  if (updates.length === 0) {
    return { errors: [] };
  }

  const batches = partition(updates, batchLimit);
  const responses = await Promise.allSettled(
    batches.map((chunk, index) => {
      const delayMs = Math.ceil(batchDelay * index);
      return new Promise((resolve) => setTimeout(resolve, delayMs)).then(() =>
        retryAsync(() => callbacks.executeBatch(chunk), { retry, retryDelay }),
      );
    }),
  );

  const hasSuccess = responses.some((r) => r.status === 'fulfilled');
  if (!hasSuccess) {
    const firstRejection = responses.find(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );
    if (firstRejection) {
      throw firstRejection.reason;
    }
  }

  let errors: TError[] = [];
  for (let i = 0; i < responses.length; i += 1) {
    const result = responses[i];
    if (result.status === 'fulfilled') {
      const partialErrors = callbacks.getPartialErrors(result.value);
      if (partialErrors.length > 0) {
        errors = errors.concat(partialErrors);
      }
    } else {
      errors = errors.concat(
        batches[i].map((update) => callbacks.createBatchFailureError(update, result.reason)),
      );
    }
  }

  return { errors };
}
