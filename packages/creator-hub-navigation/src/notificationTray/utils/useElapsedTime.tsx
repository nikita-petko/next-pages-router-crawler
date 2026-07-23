import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@rbx/intl';
import { calculateElapsedTime, getRefreshIntervalInMS } from './elapsedTime';

const useElapsedTime = (
  timestampInSeconds: number,
  translationKeyPrefix: string = 'Label.ElapsedTime',
) => {
  const { translate } = useTranslation();
  const getElapsedTimeString = useCallback(() => {
    const elapsedTime = calculateElapsedTime(Math.round(timestampInSeconds));
    const translationParameters: Record<string, string> = {};
    if (elapsedTime.translationKeyParam && elapsedTime.paramValue) {
      translationParameters[elapsedTime.translationKeyParam] = elapsedTime.paramValue.toString();
    }
    return translate(`${translationKeyPrefix}${elapsedTime.translationKey}`, translationParameters);
  }, [timestampInSeconds, translate, translationKeyPrefix]);

  const [currentElapsedTime, setCurrentElapsedTime] = useState(() => getElapsedTimeString());

  const updateElapsedTime = useCallback(() => {
    setCurrentElapsedTime(getElapsedTimeString());
  }, [getElapsedTimeString]);

  useEffect(() => {
    updateElapsedTime();
  }, [updateElapsedTime]);

  useEffect(() => {
    const refreshInterval = getRefreshIntervalInMS(Math.round(timestampInSeconds));
    let timerId: NodeJS.Timeout;
    if (refreshInterval != null) {
      timerId = setTimeout(() => {
        updateElapsedTime();
      }, refreshInterval);
    }

    return () => {
      clearTimeout(timerId);
    };
  }, [timestampInSeconds, updateElapsedTime, currentElapsedTime]);

  return currentElapsedTime;
};

export default useElapsedTime;
