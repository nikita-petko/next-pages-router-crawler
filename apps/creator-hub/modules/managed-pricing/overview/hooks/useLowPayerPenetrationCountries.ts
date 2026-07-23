import { useMemo } from 'react';
import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import useRAQIV2Request from '@modules/experience-analytics-shared/hooks/useRAQIV2Request';
import type { RAQIV2UIQueryRequest } from '@modules/experience-analytics-shared/types/RAQIV2UIQueryRequest';
import type { RAQIV2QueryResponses } from '@modules/experience-analytics-shared/utils/combineRAQIV2QueryResponses';
import { DEFAULT_AGGREGATION_DURATION_MS } from '../constants';
import getManagedPricingAnalyticsTimeSpec from '../getManagedPricingAnalyticsTimeSpec';
import { useHighTierCountries } from './useHighTierCountries';

type UseLowPayerPenetrationCountriesParams = {
  universeId: number;
  /** Timeframe for the data aggregation. */
  aggregationDurationMs?: number;
};

type CountryData = Map<string, { payerPenetration: number | undefined; dau: number | undefined }>;

function extractCountryValue(
  breakdownValues: { dimension?: string; value?: string }[] | undefined,
): string | undefined {
  return breakdownValues?.find((bv) => bv.dimension === RAQIV2Dimension.Country)?.value;
}

// Combine responses into a map of country -> { payerPenetration, dau }
function parseCountryMetrics(
  payerPenetrationData: RAQIV2QueryResponses | null,
  dauData: RAQIV2QueryResponses | null,
) {
  const countryData: CountryData = new Map();
  for (const mv of dauData?.response?.values ?? []) {
    const country = extractCountryValue(mv.breakdownValue);
    if (country !== undefined) {
      countryData.set(country, {
        payerPenetration: undefined,
        dau: mv.dataPoints?.[0]?.value,
      });
    }
  }
  for (const mv of payerPenetrationData?.response?.values ?? []) {
    const country = extractCountryValue(mv.breakdownValue);
    if (country !== undefined) {
      countryData.set(country, {
        dau: countryData.get(country)?.dau,
        payerPenetration: mv.dataPoints?.[0]?.value,
      });
    }
  }
  return countryData;
}

// Calculate threshold: Payer penetration of high-tier countries combined, weighted by their DAU
function calculateLowPayerPenetrationThreshold(
  countryData: CountryData,
  highTierCountries: Set<string>,
) {
  let totalHighTierDau = 0;
  let weightedCvr = 0;
  for (const [country, { payerPenetration, dau }] of countryData) {
    if (highTierCountries.has(country) && payerPenetration !== undefined) {
      totalHighTierDau += dau ?? 0;
      weightedCvr += payerPenetration * (dau ?? 0);
    }
  }
  const threshold = totalHighTierDau > 0 ? weightedCvr / totalHighTierDau : 0;
  return threshold;
}

function determineLowPayerPenetrationCountries(
  countryData: CountryData,
  threshold: number,
): Set<string> {
  return new Set<string>(
    [...countryData.entries()]
      .filter(
        ([, { payerPenetration }]) =>
          payerPenetration !== undefined && payerPenetration < threshold,
      )
      .map(([country]) => country),
  );
}

// Calculate the proportion of total DAU in low payer penetration countries
function calculateLowPayerPenetrationProportion(
  countryData: CountryData,
  lowPayerPenetrationCountries: Set<string>,
) {
  let totalDau = 0;
  let lowPayerDau = 0;
  for (const [country, { dau }] of countryData) {
    totalDau += dau ?? 0;
    if (lowPayerPenetrationCountries.has(country)) {
      lowPayerDau += dau ?? 0;
    }
  }

  return totalDau > 0 ? lowPayerDau / totalDau : 0;
}

/**
 * Identifies countries with low payer penetration and computes
 * what proportion of the experience's total users resides in those countries.
 * The threshold is determined dynamically as the DAU-weighted payer penetration
 * across high-tier countries (countries with no regional pricing discount).
 * @param universeId - The ID of the universe to query.
 * @param aggregationDurationMs - Timeframe for the data aggregation.
 * @returns The proportion of the universe's total users who reside in countries with low payer penetration.
 */
export function useLowPayerPenetrationCountries({
  universeId,
  aggregationDurationMs = DEFAULT_AGGREGATION_DURATION_MS,
}: UseLowPayerPenetrationCountriesParams) {
  const timeSpec = useMemo(
    () => getManagedPricingAnalyticsTimeSpec(aggregationDurationMs),
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

  const {
    data: highTierCountries = new Set<string>(),
    isLoading: isHighTierLoading,
    isError: isHighTierError,
  } = useHighTierCountries({ universeId });

  const { lowPayerPenetrationThreshold, lowPayerPenetrationProportion } = useMemo(() => {
    const countryData = parseCountryMetrics(payerPenetrationData, dauData);

    const threshold = calculateLowPayerPenetrationThreshold(countryData, highTierCountries);

    const lowPayerPenetrationCountries = determineLowPayerPenetrationCountries(
      countryData,
      threshold,
    );

    if (lowPayerPenetrationCountries.size === 0) {
      return { lowPayerPenetrationThreshold: threshold, lowPayerPenetrationProportion: 0 };
    }

    const proportion = calculateLowPayerPenetrationProportion(
      countryData,
      lowPayerPenetrationCountries,
    );

    return {
      lowPayerPenetrationThreshold: threshold,
      lowPayerPenetrationProportion: proportion,
    };
  }, [payerPenetrationData, dauData, highTierCountries]);

  return {
    lowPayerPenetrationThreshold,
    lowPayerPenetrationProportion,
    isLoading: isPayerPenetrationLoading || isDauLoading || isHighTierLoading,
    isError: isPayerPenetrationFailed || isDauFailed || isHighTierError,
  };
}
