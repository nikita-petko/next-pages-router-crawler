import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { useMemo } from 'react';
import { useRAQIV2Request, type RAQIV2UIQueryRequest } from '@modules/experience-analytics-shared';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import {
  DEFAULT_AGGREGATION_DURATION_MS,
  DEFAULT_LOW_PAYER_PENETRATION_THRESHOLD,
} from '../constants';

type UseLowPayerPenetrationCountriesParams = {
  universeId: number;
  /** The threshold below which a country is considered having low payer penetration. Defaults to 0.05 (5%). */
  lowPayerPenetrationThreshold?: number;
  /** Timeframe for the data aggregation. */
  aggregationDurationMs?: number;
};

function extractCountryValue(
  breakdownValues: { dimension?: string; value?: string }[] | undefined,
): string | undefined {
  return breakdownValues?.find((bv) => bv.dimension === RAQIV2Dimension.Country)?.value;
}

/**
 * Identifies countries with low payer penetration and computes
 * what proportion of the experience's total users resides in those countries.
 * @param universeId - The ID of the universe to query.
 * @param lowPayerPenetrationThreshold - The threshold below which a country is considered having low payer penetration. Defaults to 0.05 (5%).
 * @param aggregationDurationMs - Timeframe for the data aggregation.
 * @returns The proportion of the universe's total users who reside in countries with low payer penetration.
 */
function useLowPayerPenetrationCountries({
  universeId,
  lowPayerPenetrationThreshold = DEFAULT_LOW_PAYER_PENETRATION_THRESHOLD,
  aggregationDurationMs = DEFAULT_AGGREGATION_DURATION_MS,
}: UseLowPayerPenetrationCountriesParams) {
  const timeSpec = useMemo(
    () => ({
      startTime: new Date(Date.now() - aggregationDurationMs),
      endTime: new Date(),
    }),
    [aggregationDurationMs],
  );

  const payerPenetrationByCountryRequest: RAQIV2UIQueryRequest = useMemo(
    () => ({
      resource: { type: RAQIV2ChartResourceType.Universe, id: universeId },
      metric: RAQIV2Metric.PayingUsersCVR,
      granularity: RAQIV2MetricGranularity.None,
      breakdown: [RAQIV2Dimension.Country],
      timeSpec,
    }),
    [universeId, timeSpec],
  );

  const dauByCountryRequest: RAQIV2UIQueryRequest = useMemo(
    () => ({
      resource: { type: RAQIV2ChartResourceType.Universe, id: universeId },
      metric: RAQIV2Metric.DailyActiveUsers,
      granularity: RAQIV2MetricGranularity.None,
      breakdown: [RAQIV2Dimension.Country],
      timeSpec,
    }),
    [universeId, timeSpec],
  );

  const {
    data: payerPenetrationData,
    isDataLoading: isPayerPenetrationLoading,
    isResponseFailed: isPayerPenetrationFailed,
  } = useRAQIV2Request(payerPenetrationByCountryRequest);

  const {
    data: dauData,
    isDataLoading: isDauLoading,
    isResponseFailed: isDauFailed,
  } = useRAQIV2Request(dauByCountryRequest);

  const lowPayerPenetrationCountries = useMemo(() => {
    const values = payerPenetrationData?.response?.values;
    if (!values?.length) {
      return new Set<string>();
    }

    return new Set<string>(
      values
        .filter((mv) => {
          const payerPenetration = mv.dataPoints?.[0]?.value;
          return payerPenetration !== undefined && payerPenetration < lowPayerPenetrationThreshold;
        })
        .map((mv) => extractCountryValue(mv.breakdownValue))
        .filter((code): code is string => code !== undefined),
    );
  }, [payerPenetrationData, lowPayerPenetrationThreshold]);

  const lowPayerPenetrationProportion = useMemo(() => {
    const values = dauData?.response?.values;
    if (!values?.length || lowPayerPenetrationCountries.size === 0) {
      return 0;
    }

    const { totalDau, lowPayerPenetrationDau } = values.reduce(
      (acc, mv) => {
        const countryCode = extractCountryValue(mv.breakdownValue);
        const countryDau = mv.dataPoints?.[0]?.value ?? 0;
        return {
          totalDau: acc.totalDau + countryDau,
          lowPayerPenetrationDau:
            acc.lowPayerPenetrationDau +
            (countryCode && lowPayerPenetrationCountries.has(countryCode) ? countryDau : 0),
        };
      },
      { totalDau: 0, lowPayerPenetrationDau: 0 },
    );

    return totalDau > 0 ? lowPayerPenetrationDau / totalDau : 0;
  }, [dauData, lowPayerPenetrationCountries]);

  return {
    lowPayerPenetrationProportion,
    isLoading: isPayerPenetrationLoading || isDauLoading,
    isError: isPayerPenetrationFailed || isDauFailed,
  };
}

export default useLowPayerPenetrationCountries;
