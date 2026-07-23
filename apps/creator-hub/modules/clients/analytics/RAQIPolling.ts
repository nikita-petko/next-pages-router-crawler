import {
  AnalyticsQueryGatewayAPIOperationMetadata,
  AnalyticsQueryGatewayAPIQueryError,
} from './analyticsQueryGateway';
import exponentialBackoffWithJitter from './exponentialBackoffWithJitter';

export type RAQIClientOptions = {
  maxAttempts: number;
  intialPollingInterval: number;
  maxAccumulativeDelayToStartBackoff: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type TRAQIOperation<TResult> = {
  path?: string;
  metadata?: AnalyticsQueryGatewayAPIOperationMetadata;
  done?: boolean;
  error?: AnalyticsQueryGatewayAPIQueryError;
} & TResult;

export async function poll<TFinalResult, TOperationResult>(
  makeRequest: () => Promise<TRAQIOperation<TOperationResult>>,
  options: RAQIClientOptions,
  operationToResult: (operation: TRAQIOperation<TOperationResult>) => TFinalResult,
): Promise<TFinalResult> {
  let operation = await makeRequest();

  const { maxAttempts, intialPollingInterval, maxAccumulativeDelayToStartBackoff } = options;
  let attempts = 1;
  let accumulativeDelay = 0;

  while (!operation.done) {
    if (attempts > maxAttempts) {
      throw new Error('Error: reached out max number of attempts');
    }

    // use exponential backoff with jitter after accumulative delay exceeds the threshold
    const delay =
      accumulativeDelay > maxAccumulativeDelayToStartBackoff
        ? exponentialBackoffWithJitter(
            intialPollingInterval,
            2,
            attempts,
            maxAttempts * intialPollingInterval,
          )
        : intialPollingInterval;

    // eslint-disable-next-line no-await-in-loop -- sleep in between requests to provide time for the op to resolve
    await sleep(delay);
    accumulativeDelay += delay;

    // eslint-disable-next-line no-await-in-loop -- make requests serially until one succeeds
    operation = await makeRequest();
    attempts += 1;
  }

  const result = operationToResult(operation);
  if (!result) {
    throw new Error(`Error ${operation.error?.code}: ${operation.error?.message}`);
  }
  return result;
}
