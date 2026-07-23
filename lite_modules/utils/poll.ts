interface PollWithRetryLimitAndCancelCallbackParams<T> {
  fn: () => Promise<T>;
  interval: number;
  maxRetries?: number;
  onCancelCb?: () => void;
  onMaxRetriesReached?: () => void;
  successCb: (result: T) => void;
}

export const PollWithRetryLimitAndCancelCallback = <T>({
  fn,
  interval,
  maxRetries,
  onCancelCb,
  onMaxRetriesReached,
  successCb,
}: PollWithRetryLimitAndCancelCallbackParams<T>) => {
  // Initialize internal state within the closure
  const internalState = { keepRetrying: true, numberOfRetries: 0 };

  const poll = () => {
    fn().then((result: T) => {
      if (result) {
        successCb(result);
      } else {
        if (maxRetries) {
          if (internalState.numberOfRetries >= maxRetries) {
            if (onMaxRetriesReached) {
              onMaxRetriesReached();
            }
            return;
          }
        }
        if (internalState.keepRetrying) {
          // ADS-7478: store result of setTimeout to clear it later if/when poll is canceled
          setTimeout(() => {
            internalState.numberOfRetries += 1;
            poll(); // Recursive call to the internal poll function
          }, interval);
        }
      }
    });
  };

  poll(); // Start the polling immediately

  const cancelRetrying = () => {
    if (onCancelCb) {
      onCancelCb();
    }
    internalState.keepRetrying = false; // Modify the local internalState
  };

  return cancelRetrying;
};
