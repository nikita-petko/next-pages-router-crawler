import { useCallback, useEffect } from 'react';
import {
  pauseQuestionnaireAttemptTiming,
  startQuestionnaireAttemptTiming,
} from '../utils/questionnaireEvents';

/**
 * Accumulates the time an attempt is actively being worked on. Segments are banked to storage when
 * the user leaves, so time away between segments is excluded from the total.
 */
const useQuestionnaireAttemptTiming = (
  universeId: number,
  questionnaireId: string | undefined,
  isActive: boolean,
): void => {
  const startTiming = useCallback(() => {
    if (!questionnaireId) {
      return;
    }
    startQuestionnaireAttemptTiming(universeId, questionnaireId);
  }, [questionnaireId, universeId]);

  const pauseTiming = useCallback(() => {
    if (!questionnaireId) {
      return;
    }
    pauseQuestionnaireAttemptTiming(universeId, questionnaireId);
  }, [questionnaireId, universeId]);

  useEffect(() => {
    if (isActive) {
      startTiming();
    } else {
      pauseTiming();
    }
  }, [isActive, pauseTiming, startTiming]);

  useEffect(() => {
    const handlePageHide = () => pauseTiming();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pauseTiming();
      } else if (isActive) {
        startTiming();
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      pauseTiming();
    };
  }, [isActive, pauseTiming, startTiming]);
};

export default useQuestionnaireAttemptTiming;
