import type {
  BatchRequestProperties,
  BatchIdSerializer,
  BatchItemProcessor,
  QueueItem,
  ItemProcessorResult,
} from './batchRequestConstants';
import { BatchRequestError } from './batchRequestConstants';
import { getFailureCooldown } from './batchRequestUtil';

class BatchRequestProcessor<T> {
  private completeItems: Map<string, T> = new Map();

  private requestQueue: Array<QueueItem<T>> = [];

  private runningBatchCount = 0;

  private handleBatchResult(
    itemsProcessor: BatchItemProcessor<T>,
    batch: Array<QueueItem<T>>,
    error: BatchRequestError,
    properties: BatchRequestProperties,
  ) {
    let minimumCooldown = 0;
    const currentDate = Date.now();
    batch.forEach((request: QueueItem<T>) => {
      if (this.completeItems.has(request.key)) {
        request.resolve(this.completeItems.get(request.key));
      } else if (
        properties.maxRetryAttempts &&
        properties.maxRetryAttempts > 0 &&
        error !== BatchRequestError.unretriableFailure
      ) {
        const itemCooldown = getFailureCooldown(request.retryAttempts, properties);

        if (minimumCooldown > 0) {
          minimumCooldown = Math.min(minimumCooldown, itemCooldown);
        } else {
          minimumCooldown = itemCooldown;
        }

        if (request.retryAttempts + 1 <= properties.maxRetryAttempts) {
          request.retryAttempts += 1;
          request.queueAfter = currentDate + itemCooldown;
          // Put in front of the queue to make sure duplicate items
          // don't get processed without the cooldown time.
          this.requestQueue.unshift(request);
        } else {
          request.reject(BatchRequestError.maxAttemptsReached);
        }
      } else {
        request.reject(error);
      }
    });
    this.runningBatchCount -= 1;
    if (minimumCooldown > 0) {
      setTimeout(
        () => this.processQueue(itemsProcessor, properties),
        minimumCooldown + properties.processBatchWaitTime,
      );
    } else {
      this.processQueue(itemsProcessor, properties);
    }
  }

  private processQueue(itemsProcessor: BatchItemProcessor<T>, properties: BatchRequestProperties) {
    if (this.runningBatchCount >= properties.maxConcurrentBatches) {
      return;
    }
    const batch: Array<QueueItem<T>> = [];
    const batchKeys: Map<string, QueueItem<T>> = new Map();
    const requeueRequests: Array<QueueItem<T>> = [];
    const currentDate = Date.now();

    while (batch.length < properties.batchSize && this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        if (request.queueAfter > currentDate) {
          batchKeys.set(request.key, request);
          requeueRequests.push(request);
        } else if (this.completeItems.has(request.key)) {
          request.resolve(this.completeItems.get(request.key));
        } else if (batchKeys.has(request.key)) {
          // Requeue to make sure duplicate requests still get resolved once they're completed.
          requeueRequests.push(request);
        } else {
          batchKeys.set(request.key, request);
          batch.push(request);
        }
      }
    }

    this.requestQueue.push(...requeueRequests);

    if (batch.length <= 0) {
      return;
    }

    this.runningBatchCount += 1;

    itemsProcessor(batch).then(
      (data: ItemProcessorResult<T>) => {
        Object.keys(data).forEach((key) => {
          this.saveCompleteItem(key, data[key], properties);
        });

        this.handleBatchResult(itemsProcessor, batch, BatchRequestError.processFailure, properties);
      },
      (error) => {
        this.handleBatchResult(itemsProcessor, batch, error, properties);
      },
    );
  }

  private saveCompleteItem(key: string, data: T, properties: BatchRequestProperties) {
    this.completeItems.set(key, data);
    if (properties.getItemExpiration) {
      setTimeout(() => {
        this.completeItems.delete(key);
      }, properties.getItemExpiration(key));
    }
  }

  queueItem(
    itemId: number,
    itemProcessor: BatchItemProcessor<T>,
    itemSerializer: BatchIdSerializer,
    properties: BatchRequestProperties,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        key: itemSerializer(itemId),
        itemId,
        retryAttempts: 0,
        queueAfter: 0,
        startTime: new Date(),
        resolve,
        reject,
      });
      setTimeout(
        () => this.processQueue(itemProcessor, properties),
        properties.processBatchWaitTime,
      );
    });
  }

  invalidateItem(itemId: number, itemSerializer: BatchIdSerializer) {
    this.completeItems.delete(itemSerializer(itemId));
  }
}

export default BatchRequestProcessor;
