import { useEffect, useMemo, useState } from 'react';

import { RevenueShareEffectiveDateMs } from '@constants/adIntegrations';
import {
  getRevenueShareEstimatePreviewBatch,
  RevenueShareEstimatePreviewBatchEntry,
} from '@services/ads/adIntegrationCampaignService';
import { RevenueShareEstimatePreview } from '@type/adIntegrations';
import { CaptureException } from '@utils/error';
import { computeBillableDays, computeMaxRevenueShareMicroUsd } from '@utils/revenueShareEstimate';

const FETCH_DEBOUNCE_MS = 300;

export interface PerUniverseRevenueShareEstimate {
  avgDailyVisits?: number;
  maxRevenueShareMicroUsd?: number;
  universeId: number;
  weightedCptvMicroUsd?: number;
}

interface UseMultiRevenueShareEstimatePreviewParams {
  endTimestampMs?: number;
  savedSignals?: RevenueShareEstimatePreview[];
  startTimestampMs?: number;
  universeIds?: number[];
}

interface UseMultiRevenueShareEstimatePreviewResult {
  billableDays?: number;
  isError: boolean;
  isLoading: boolean;
  perUniverse: PerUniverseRevenueShareEstimate[];
  totalAvgDailyVisits?: number;
  totalMaxRevenueShareMicroUsd?: number;
  totalWeightedCptvMicroUsd?: number;
}

const useMultiRevenueShareEstimatePreview = ({
  endTimestampMs,
  savedSignals,
  startTimestampMs,
  universeIds,
}: UseMultiRevenueShareEstimatePreviewParams): UseMultiRevenueShareEstimatePreviewResult => {
  const [fetchedByUniverse, setFetchedByUniverse] = useState<
    Record<number, RevenueShareEstimatePreviewBatchEntry>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  const isBeforeEffectiveDate =
    startTimestampMs !== undefined && startTimestampMs < RevenueShareEffectiveDateMs;
  const validUniverseIds = useMemo(
    () => Array.from(new Set((universeIds ?? []).filter((universeId) => universeId > 0))),
    [universeIds],
  );
  const savedSignalsByUniverse = useMemo(
    () =>
      Object.fromEntries(
        (savedSignals ?? []).map((signal) => [signal.universeId, signal]),
      ) as Record<number, RevenueShareEstimatePreview>,
    [savedSignals],
  );
  const universesToFetch = useMemo(
    () => validUniverseIds.filter((universeId) => !savedSignalsByUniverse[universeId]),
    [savedSignalsByUniverse, validUniverseIds],
  );
  const universesToFetchKey = useMemo(
    () => [...universesToFetch].sort((left, right) => left - right).join(','),
    [universesToFetch],
  );

  useEffect(() => {
    if (
      validUniverseIds.length === 0 ||
      startTimestampMs === undefined ||
      endTimestampMs === undefined ||
      isBeforeEffectiveDate
    ) {
      setFetchedByUniverse({});
      setIsError(false);
      setIsLoading(false);
      return undefined;
    }

    if (universesToFetch.length === 0) {
      setFetchedByUniverse({});
      setIsError(false);
      setIsLoading(false);
      return undefined;
    }

    let isActive = true;
    const controller = new AbortController();
    // Drop the previous response before refetching. The batch endpoint computes
    // each universe's max cost for the requested date range, so keeping the old
    // entries would render a confident campaign total built from the previous
    // dates for the whole debounce + request window.
    setFetchedByUniverse({});
    setIsError(false);
    setIsLoading(true);

    const timeoutId = setTimeout(() => {
      getRevenueShareEstimatePreviewBatch(
        universesToFetch,
        startTimestampMs,
        endTimestampMs,
        controller.signal,
      )
        .then((result) => {
          if (!isActive || controller.signal.aborted) {
            return;
          }
          setFetchedByUniverse(
            Object.fromEntries(result.breakdown.map((entry) => [entry.universeId, entry])),
          );
          setIsError(false);
          setIsLoading(false);
        })
        .catch((error) => {
          if (!isActive || controller.signal.aborted) {
            return;
          }
          CaptureException(error, { context: 'useMultiRevenueShareEstimatePreview' });
          setFetchedByUniverse({});
          setIsError(true);
          setIsLoading(false);
        });
    }, FETCH_DEBOUNCE_MS);

    return () => {
      isActive = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
    // The key represents the fetch set independent of selection ordering.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTimestampMs, isBeforeEffectiveDate, startTimestampMs, universesToFetchKey]);

  const billableDays = useMemo(() => {
    if (isBeforeEffectiveDate || startTimestampMs === undefined || endTimestampMs === undefined) {
      return undefined;
    }
    return computeBillableDays(startTimestampMs, endTimestampMs);
  }, [endTimestampMs, isBeforeEffectiveDate, startTimestampMs]);

  const perUniverse = useMemo<PerUniverseRevenueShareEstimate[]>(
    () =>
      validUniverseIds.map((universeId) => {
        // Each universe reads from exactly one source: a persisted snapshot
        // (max computed locally from the current dates) or the batch response
        // (max computed by the backend). Mixing the two within a universe would
        // pair one date range's visits with another's cost.
        const saved = savedSignalsByUniverse[universeId];
        if (saved) {
          return {
            avgDailyVisits: saved.avgDailyVisits,
            maxRevenueShareMicroUsd:
              billableDays !== undefined && billableDays > 0
                ? computeMaxRevenueShareMicroUsd(
                    saved.avgDailyVisits,
                    saved.weightedCptvMicroUsd,
                    billableDays,
                  )
                : undefined,
            universeId,
            weightedCptvMicroUsd: saved.weightedCptvMicroUsd,
          };
        }

        const fetched = fetchedByUniverse[universeId];
        return {
          avgDailyVisits: fetched?.avgDailyVisits,
          maxRevenueShareMicroUsd: fetched?.maxRevenueShareMicroUsd,
          universeId,
          weightedCptvMicroUsd: fetched?.weightedCptvMicroUsd,
        };
      }),
    [billableDays, fetchedByUniverse, savedSignalsByUniverse, validUniverseIds],
  );

  const hasCompleteEstimates =
    perUniverse.length > 0 &&
    perUniverse.every(
      (estimate) =>
        estimate.avgDailyVisits !== undefined &&
        estimate.maxRevenueShareMicroUsd !== undefined &&
        estimate.weightedCptvMicroUsd !== undefined,
    );
  const totalAvgDailyVisits = hasCompleteEstimates
    ? perUniverse.reduce((sum, estimate) => sum + (estimate.avgDailyVisits ?? 0), 0)
    : undefined;
  const totalMaxRevenueShareMicroUsd = hasCompleteEstimates
    ? perUniverse.reduce((sum, estimate) => sum + (estimate.maxRevenueShareMicroUsd ?? 0), 0)
    : undefined;
  const totalWeightedCptvMicroUsd =
    hasCompleteEstimates && totalAvgDailyVisits !== undefined && totalAvgDailyVisits > 0
      ? Math.round(
          perUniverse.reduce(
            (sum, estimate) =>
              sum + (estimate.avgDailyVisits ?? 0) * (estimate.weightedCptvMicroUsd ?? 0),
            0,
          ) / totalAvgDailyVisits,
        )
      : undefined;

  return {
    billableDays,
    isError,
    isLoading,
    perUniverse,
    totalAvgDailyVisits,
    totalMaxRevenueShareMicroUsd,
    totalWeightedCptvMicroUsd,
  };
};

export default useMultiRevenueShareEstimatePreview;
