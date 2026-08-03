import { useCallback, useEffect, useRef } from 'react';
import type { QuestionnaireViewTiming } from '../utils/questionnaireEvents';

const useTimedQuestionnaireView = (
  isActive: boolean,
  onViewEnd?: (timing: QuestionnaireViewTiming) => void,
): void => {
  const onViewEndRef = useRef(onViewEnd);
  const startedAtRef = useRef<{ iso: string; milliseconds: number } | null>(null);

  useEffect(() => {
    onViewEndRef.current = onViewEnd;
  }, [onViewEnd]);

  const startView = useCallback(() => {
    if (!onViewEndRef.current || startedAtRef.current) {
      return;
    }
    const milliseconds = Date.now();
    startedAtRef.current = { iso: new Date(milliseconds).toISOString(), milliseconds };
  }, []);

  const endView = useCallback(() => {
    const startedAt = startedAtRef.current;
    if (!startedAt) {
      return;
    }
    startedAtRef.current = null;
    onViewEndRef.current?.({
      clientTimestamp: startedAt.iso,
      durationMs: Date.now() - startedAt.milliseconds,
    });
  }, []);

  useEffect(() => {
    if (isActive) {
      startView();
    } else {
      endView();
    }
  }, [endView, isActive, startView]);

  useEffect(() => {
    const handlePageHide = () => endView();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        endView();
      } else if (isActive) {
        startView();
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      endView();
    };
  }, [endView, isActive, startView]);
};

export default useTimedQuestionnaireView;
