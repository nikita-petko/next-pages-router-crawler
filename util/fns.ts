import moment from 'moment-timezone';

import { TODOFIXANY } from 'app/shared/types';

export const arrayHasSameMembers = (arr1: TODOFIXANY, arr2: TODOFIXANY) => {
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);
  return (
    arr1.every((item: TODOFIXANY) => set2.has(item)) &&
    arr2.every((item: TODOFIXANY) => set1.has(item))
  );
};

interface PollWithRetryLimitAndCancelCallbackParams {
  fn: () => Promise<TODOFIXANY>;
  internalState?: {
    keepRetrying: boolean;
    numberOfRetries: number;
  };
  interval: number;
  maxRetries?: number;
  onCancelCb?: () => void;
  onMaxRetriesReached?: () => void;
  successCb: (arg0: TODOFIXANY) => void;
}

/* eslint-disable */
export const PollWithRetryLimitAndCancelCallback = ({
  fn,
  successCb,
  interval,
  maxRetries,
  onMaxRetriesReached,
  onCancelCb,
  internalState,
}: PollWithRetryLimitAndCancelCallbackParams) => {
  if (!internalState) {
    // @ts-ignore
    internalState = {
      keepRetrying: true,
      numberOfRetries: 0,
    };
  }

  fn().then((result: TODOFIXANY) => {
    if (result) {
      successCb(result);
    } else {
      if (maxRetries) {
        // ?? checks for undefined, do not use || because numberOfRetries can be 0 and valid
        if ((internalState?.numberOfRetries ?? Infinity) >= maxRetries) {
          if (onMaxRetriesReached) {
            onMaxRetriesReached();
          }
          return;
        }
      }
      if (internalState?.keepRetrying) {
        setTimeout(() => {
          if (internalState && internalState.numberOfRetries) {
            internalState.numberOfRetries += 1;
          } else {
            if (internalState) {
              internalState.numberOfRetries = 1;
            }
          }
          PollWithRetryLimitAndCancelCallback({
            fn,
            successCb,
            interval,
            maxRetries,
            onMaxRetriesReached,
            onCancelCb,
            internalState,
          });
        }, interval);
      }
    }
  });

  const cancelRetrying = () => {
    if (onCancelCb) {
      onCancelCb();
    }
    if (internalState && internalState.keepRetrying) {
      internalState.keepRetrying = false;
    }
  };

  /* eslint-enable */
  return cancelRetrying;
};

export const getHumanDateWithTimezone = (dateStr: TODOFIXANY) => {
  return `${moment(new Date(dateStr)).format('MMMM DD, YYYY hh:MM A')} ${moment
    .tz(moment.tz.guess())
    .zoneAbbr()}`;
};

export const IsValidDate = (d: Date | null) => {
  return d instanceof Date && !Number.isNaN(d.getTime());
};

const ellipsis = '...';

export const toMaxLengthWithEllipsis = (str: string, maxLen: number) => {
  if (str.length <= maxLen) {
    return str;
  }

  return `${str.slice(0, maxLen - ellipsis.length)}${ellipsis}`;
};

const special_characters_regex = /[&<>"']/g;

export const sanitizeOfSpecialCharacters = (inputToSanitize: string) => {
  return inputToSanitize.replace(special_characters_regex, '');
};

export const detectSpecialCharacters = (inputToSanitize: string) => {
  return special_characters_regex.test(inputToSanitize);
};

const tab_regex = /\t/g;

export const removeTabsAndLeadingSpaces = (inputToSub = '') => {
  const inputWithoutTabs = inputToSub.replace(tab_regex, '');
  return inputWithoutTabs.trim();
};
