export enum ThrottleType {
  LEADING = 'leading',
  TRAILING = 'trailing',
  LEADING_AND_TRAILING = 'leading_and_trailing',
}

// utility that can be used to throttle the execution of a function with default to leading and trailing
const throttle = <TArgs extends Array<unknown>>(
  func: (...args: TArgs) => void,
  delay: number,
  type = ThrottleType.LEADING_AND_TRAILING,
): [(...args: TArgs) => void, () => void] => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: TArgs | null = null;
  let latestContext: unknown | null = null;

  const maybeExecute = () => {
    if (latestArgs) {
      func.call(latestContext, ...latestArgs);
      latestArgs = null;
      latestContext = null;
      return true;
    }
    return false;
  };

  const maybeExecuteLater = () => {
    timeoutId = null;
    if (
      (type === ThrottleType.TRAILING || type === ThrottleType.LEADING_AND_TRAILING) &&
      maybeExecute()
    ) {
      timeoutId = setTimeout(maybeExecuteLater, delay);
    }
  };

  function throttledFn(this: unknown, ...args: TArgs) {
    latestArgs = args;
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- this is needed to store the runtime context
    latestContext = this;

    if (timeoutId) {
      return;
    }

    if (type === ThrottleType.LEADING || type === ThrottleType.LEADING_AND_TRAILING) {
      maybeExecute();
    }

    timeoutId = setTimeout(maybeExecuteLater, delay);
  }

  return [
    throttledFn,
    () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  ];
};

export default throttle;
