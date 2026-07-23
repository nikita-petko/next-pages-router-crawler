import { useEffect, useState } from 'react';
import type { PublishingMetadata } from '@modules/clients/analytics/universeConfigs';

const ONE_SECOND_IN_MS = 1000;
const ONE_MINUTE_IN_MS = 60000;

export const publishRemainingMsToTimeStr = (ms: number) => {
  const minutes = Math.floor(ms / ONE_MINUTE_IN_MS);
  const seconds = Math.floor((ms % ONE_MINUTE_IN_MS) / ONE_SECOND_IN_MS);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const computePublishRemainingMs = (publishingMetadata: PublishingMetadata | undefined) => {
  const estimatedCompletionTime = publishingMetadata?.estimatedCompletionTime;
  if (!estimatedCompletionTime) {
    return 0;
  }
  return new Date(estimatedCompletionTime).getTime() - Date.now();
};

const usePublishRemainingMs = (
  publishingMetadata: PublishingMetadata | undefined,
  onComplete?: () => void,
) => {
  const [publishRemainingMs, setPublishRemainingMs] = useState(() =>
    computePublishRemainingMs(publishingMetadata),
  );
  useEffect(() => {
    const estimatedCompletionTime = publishingMetadata?.estimatedCompletionTime;
    if (!estimatedCompletionTime) {
      setPublishRemainingMs(0);
      return () => {};
    }

    let interval: NodeJS.Timeout | null = null;
    const updatePublishRemainingMs = () => {
      const msRemaining = new Date(estimatedCompletionTime).getTime() - Date.now();
      setPublishRemainingMs(msRemaining);
      if (msRemaining <= 0 && interval) {
        clearInterval(interval);
        onComplete?.();
      }
    };
    interval = setInterval(updatePublishRemainingMs, ONE_SECOND_IN_MS);
    updatePublishRemainingMs();
    return () => clearInterval(interval);
  }, [publishingMetadata, onComplete]);
  return publishRemainingMs;
};

export default usePublishRemainingMs;
