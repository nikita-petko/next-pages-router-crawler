import {
  BatchRequestProperties,
  BatchIdSerializer,
  BatchItemProcessor,
  DefaultProcessBatchWaitTime,
  DefaultMaxConcurrentBatches,
  BatchRequestParameters,
} from './batchRequestConstants';
import { createExponentialBackoffCooldown } from './batchRequestUtil';
import BatchRequestProcessor from './batchRequestProcessor';

class BatchRequestProcessorFactory<T> {
  public readonly createExponentialBackoffCooldown = createExponentialBackoffCooldown;

  // ! WHOEVER READING THIS, PLEASE FIX THE BELOW LINT ERROR AND REMOVE NEXT LINE
  // eslint-disable-next-line class-methods-use-this
  createQueueProcessor = (
    itemsProcessor: BatchItemProcessor<T>,
    itemSerializer: BatchIdSerializer,
    properties: BatchRequestProperties
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
    properties: BatchRequestParameters
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
