import type {
  BatchRequestProperties,
  BatchIdSerializer,
  BatchItemProcessor,
  BatchRequestParameters,
} from './batchRequestConstants';
import { DefaultProcessBatchWaitTime, DefaultMaxConcurrentBatches } from './batchRequestConstants';
import BatchRequestProcessor from './batchRequestProcessor';
import { createExponentialBackoffCooldown } from './batchRequestUtil';

class BatchRequestProcessorFactory<T> {
  public readonly createExponentialBackoffCooldown = createExponentialBackoffCooldown;

  // ! WHOEVER READING THIS, PLEASE FIX THE BELOW LINT ERROR AND REMOVE NEXT LINE
  createQueueProcessor = (
    itemsProcessor: BatchItemProcessor<T>,
    itemSerializer: BatchIdSerializer,
    properties: BatchRequestProperties,
  ) => {
    const batchRequestProcessor = new BatchRequestProcessor<T>();
    return {
      queueItem: (item: number): Promise<T> => {
        return batchRequestProcessor.queueItem(item, itemsProcessor, itemSerializer, properties);
      },
      invalidateItem: (item: number) => {
        return batchRequestProcessor.invalidateItem(item, itemSerializer);
      },
    };
  };

  createRequestProcessor(
    itemsProcessor: BatchItemProcessor<T>,
    itemSerializer: BatchIdSerializer,
    properties: BatchRequestParameters,
  ) {
    const batchProperties = {
      processBatchWaitTime: DefaultProcessBatchWaitTime,
      maxConcurrentBatches: DefaultMaxConcurrentBatches,
      ...properties,
    } as BatchRequestProperties;
    return this.createQueueProcessor(itemsProcessor, itemSerializer, batchProperties);
  }
}

export default BatchRequestProcessorFactory;
