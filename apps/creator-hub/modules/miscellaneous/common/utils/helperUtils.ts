import { getPrettifiedNumber } from '@rbx/core';
import { Locale } from '@rbx/intl';
import seedrandom from 'seedrandom';

export const dayToMs = (day: number): number => {
  return day * 60 * 60 * 24 * 1000;
};

export const debounce = <T extends Array<unknown>>(
  func: (...args: T) => void,
  timeout = 300,
): [(...args: T) => void, () => void] => {
  let timer: ReturnType<typeof setTimeout>;
  return [
    (...args: T) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, args);
      }, timeout);
    },
    () => {
      clearTimeout(timer);
    },
  ];
};

export enum ThrottleType {
  LEADING = 'leading',
  TRAILING = 'trailing',
  LEADING_AND_TRAILING = 'leading_and_trailing',
}

// utility that can be used to throttle the execution of a function with default to leading and trailing
export const throttle = <TArgs extends Array<unknown>>(
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

// NOTE (jcountryman): See https://stackoverflow.com/questions/16801687/javascript-random-ordering-with-seed
// This is Mike Bostock's implementation of the Fisher–Yates algorithm
export const shuffle = <T>(array: Array<T>, seed: string) => {
  const random = seedrandom(seed);
  const shuffledArray = [...array];
  let currentIndex = array.length;

  // If there are elements to shuffle
  while (currentIndex) {
    // Pick a remaining element to shuffle with
    const randomIndex = Math.floor(random() * currentIndex);
    currentIndex -= 1;

    // Swap it with the current element
    const replacedIndex = shuffledArray[currentIndex];
    shuffledArray[currentIndex] = shuffledArray[randomIndex];
    shuffledArray[randomIndex] = replacedIndex;
  }

  return shuffledArray;
};

type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>;
type IntRange<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>;
export const alpha = (hex: string, opacity: IntRange<0, 256>): string => {
  if (opacity < 16) {
    return `${hex}0${opacity.toString(16)}`;
  }
  return `${hex}${opacity.toString(16)}`;
};

export const formatNumber = (number: number): string => {
  if (number < 1) {
    return number.toFixed(1);
  }
  if (number < 1000) {
    return Math.round(number).toString();
  }

  return getPrettifiedNumber(number).toString();
};

export const arrayToChunks = <T>(arr: Array<T>, chunkSize: number) => {
  const res = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    res.push(chunk);
  }
  return res;
};

export const snakeToPascalCase = (input: string): string => {
  const parsedInput = input.split('-');
  return parsedInput.reduce((acc, curr) => acc + (curr[0] ?? '').toUpperCase() + curr.slice(1), '');
};

export const isSetsEqual = <T>(a: Set<T>, b: Set<T>) =>
  a.size === b.size && Array.from(a.values()).every((element) => b.has(element));

export const capitalizeFirstLetter = (locale: Locale | null, input: string): string => {
  if (input.length === 0) {
    return input;
  }
  return (
    input.charAt(0).toLocaleUpperCase(locale || 'en-US') +
    input.slice(1).toLocaleLowerCase(locale || 'en-US')
  );
};

export const getRecordEntries = <K extends string, V>(
  record: Partial<Record<K, V>>,
): Array<[K, V]> => {
  return Object.entries(record) as Array<[K, V]>;
};

export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};
