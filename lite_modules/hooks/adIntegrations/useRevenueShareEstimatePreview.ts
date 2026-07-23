import { useEffect, useMemo, useState } from 'react';

import { RevenueShareEffectiveDateMs } from '@constants/adIntegrations';
import { getRevenueShareEstimatePreview } from '@services/ads/adIntegrationCampaignService';
import { RevenueShareEstimatePreview } from '@type/adIntegrations';
import { CaptureException } from '@utils/error';
import { computeBillableDays, computeMaxRevenueShareMicroUsd } from '@utils/revenueShareEstimate';

const FETCH_DEBOUNCE_MS = 300;

interface UseRevenueShareEstimatePreviewParams {
  endTimestampMs?: number;
  // Persisted revenue share signals snapshot for an existing campaign (edit
  // mode). When provided and its universe matches the selected experience, the
  // hook reuses these signals instead of calling the Frost backend. Once the
  // user switches to a different experience, the snapshot no longer applies and
  // the hook fetches fresh signals.
  savedSignals?: RevenueShareEstimatePreview;
  startTimestampMs?: number;
  universeId?: number;
}

interface UseRevenueShareEstimatePreviewResult {
  avgDailyVisits?: number;
  billableDays?: number;
  isError: boolean;
  isLoading: boolean;
  maxRevenueShareMicroUsd?: number;
  weightedCptvMicroUsd?: number;
}

/**
 * Fetches the raw revenue share signals for the selected experience (debounced,
 * stale requests cancelled) and recomputes the max revenue share locally from
 * the current start/end timestamps. Signals are only refetched when the
 * universe changes; date-only edits recompute without a network request.
 */
const useRevenueShareEstimatePreview = ({
  endTimestampMs,
  savedSignals,
  startTimestampMs,
  universeId,
}: UseRevenueShareEstimatePreviewParams): UseRevenueShareEstimatePreviewResult => {
  const [signals, setSignals] = useState<RevenueShareEstimatePreview | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  // Revenue share costs only apply to campaigns starting on/after the effective
  // date (Q1 2027). For earlier start dates we suppress all estimate numbers so
  // the tile/drawer fall back to their placeholder ("--") state.
  const isBeforeEffectiveDate =
    startTimestampMs !== undefined && startTimestampMs < RevenueShareEffectiveDateMs;

  useEffect(() => {
    // Visits + weighted CPTV stay blank until a valid campaign start date is
    // selected (and that date is on/after the effective date). Selecting a
    // pre-2027 date clears them again. Without a start date we never fetch.
    if (!universeId || universeId <= 0 || startTimestampMs === undefined || isBeforeEffectiveDate) {
      setSignals(undefined);
      setIsLoading(false);
      setIsError(false);
      return undefined;
    }

    // Edit path: reuse the campaign's persisted snapshot when the selected
    // experience still matches the saved one, so we never hit Frost for a
    // campaign that already has an estimate.
    if (savedSignals && savedSignals.universeId === universeId) {
      setSignals(savedSignals);
      setIsLoading(false);
      setIsError(false);
      return undefined;
    }

    let isActive = true;
    const controller = new AbortController();
    setSignals(undefined);
    setIsLoading(true);
    setIsError(false);

    const timeoutId = setTimeout(() => {
      getRevenueShareEstimatePreview(universeId, controller.signal)
        .then((result) => {
          if (!isActive) {
            return;
          }
          setSignals(result);
          setIsLoading(false);
        })
        .catch((error) => {
          if (!isActive || controller.signal.aborted) {
            return;
          }
          CaptureException(error, { context: 'useRevenueShareEstimatePreview' });
          setSignals(undefined);
          setIsError(true);
          setIsLoading(false);
        });
    }, FETCH_DEBOUNCE_MS);

    return () => {
      isActive = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [universeId, isBeforeEffectiveDate, savedSignals, startTimestampMs]);

  const billableDays = useMemo(() => {
    if (isBeforeEffectiveDate || startTimestampMs === undefined || endTimestampMs === undefined) {
      return undefined;
    }
    return computeBillableDays(startTimestampMs, endTimestampMs);
  }, [endTimestampMs, isBeforeEffectiveDate, startTimestampMs]);

  const maxRevenueShareMicroUsd = useMemo(() => {
    if (!signals || billableDays === undefined || billableDays <= 0) {
      return undefined;
    }
    return computeMaxRevenueShareMicroUsd(
      signals.avgDailyVisits,
      signals.weightedCptvMicroUsd,
      billableDays,
    );
  }, [billableDays, signals]);

  return {
    avgDailyVisits: signals?.avgDailyVisits,
    billableDays,
    isError,
    isLoading,
    maxRevenueShareMicroUsd,
    weightedCptvMicroUsd: signals?.weightedCptvMicroUsd,
  };
};

export default useRevenueShareEstimatePreview;
