import { useCallback, useRef } from 'react';

/**
 * Convert progress from decimal (0-1) to percentage (0-100).
 * Backend always returns progress as a decimal between 0 and 1.
 * When backend returns 1, we show 100% (operation is complete).
 */
const convertToPercentage = (progress: number): number => {
  const percentage = progress * 100;
  return Math.min(Math.max(percentage, 0), 100); // Clamp to 0-100%
};

/**
 * Calculate fallback progress based on polling attempts.
 * Used when real progress metadata is not yet available.
 */
const calculateFallbackProgress = (attemptCount: number, maxAttempts: number): number => {
  return Math.min((attemptCount / maxAttempts) * 99, 99);
};

/**
 * Custom hook to manage progress tracking with hybrid fallback/real progress.
 *
 * Problem: Backend progress metadata takes several polls to become available.
 * Solution: Show estimated progress initially, then seamlessly switch to real progress.
 *
 * Timeline example:
 * - Poll 1-10 (0-20s):   metadata=undefined → Show fallback (0.05%, 0.10%, ...)
 * - Poll 11+ (20s+):     metadata={progress: 0.08} → Switch to real (8%, 12%, ...)
 * - Final poll:          metadata={progress: 1} → Show 100% (operation complete)
 *
 * Key features:
 * 1. Immediate feedback: Shows progress from first poll (better UX)
 * 2. Accurate later: Switches to real backend progress when available (decimal 0-1)
 * 3. Never backwards: Progress only moves forward (prevents confusion)
 * 4. Reaches 100%: When backend returns progress=1, we show 100%
 */
const useProgressTracker = (onProgress?: (progress: number) => void) => {
  // Track whether we've received real progress from backend
  const hasRealProgressRef = useRef(false);
  // Track last reported progress to prevent backwards movement
  const lastReportedProgressRef = useRef(0);

  /**
   * Update progress only if it's moving forward.
   * Prevents progress bar from jumping backwards when switching from fallback to real.
   */
  const updateProgress = useCallback(
    (newProgress: number) => {
      if (newProgress > lastReportedProgressRef.current) {
        lastReportedProgressRef.current = newProgress;
        onProgress?.(newProgress);
      }
    },
    [onProgress],
  );

  /**
   * Handle real progress from backend metadata.
   * Once real progress is available, we stop using fallback.
   * Backend returns progress as a decimal (0-1), we convert to percentage (0-100).
   * When progress=1, the operation is complete and we show 100%.
   */
  const handleRealProgress = useCallback(
    (progress: number | undefined) => {
      if (progress === undefined) {
        return;
      }

      hasRealProgressRef.current = true;
      const percentage = convertToPercentage(progress);
      updateProgress(percentage);
    },
    [updateProgress],
  );

  /**
   * Handle fallback progress based on polling attempts.
   * Only used when real progress is not yet available.
   */
  const handleFallbackProgress = useCallback(
    (attemptCount: number, maxAttempts: number) => {
      if (hasRealProgressRef.current) {
        return;
      }

      const fallback = calculateFallbackProgress(attemptCount, maxAttempts);
      updateProgress(fallback);
    },
    [updateProgress],
  );

  /**
   * Report 100% progress on completion.
   */
  const reportComplete = useCallback(() => {
    onProgress?.(100);
  }, [onProgress]);

  /**
   * Reset tracker state for next operation.
   */
  const reset = useCallback(() => {
    hasRealProgressRef.current = false;
    lastReportedProgressRef.current = 0;
  }, []);

  return {
    handleRealProgress,
    handleFallbackProgress,
    reportComplete,
    reset,
  };
};

export default useProgressTracker;
