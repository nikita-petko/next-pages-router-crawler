import type { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { AnalyticsQueryGatewayAPIQueryResult as RAQIV2QueryResult } from '@modules/clients/analytics/analyticsQueryGateway';

/**
 * Wire/sentinel value for the synthetic TopN remainder bucket.
 *
 * This is intentionally not localized here: chart/table adapters and dimension
 * renderers treat this sentinel as data and translate it at display time
 * (e.g. `Label.Other` in pie/series adapters, place-version-specific labels in
 * `getDimensionRenderer`). Localizing in the query-result layer would break
 * sentinel matching and filter exclusion of the synthetic bucket.
 */
export const TOP_N_OTHER_BREAKDOWN_VALUE = 'Other';

/**
 * Labels an un-broken-down remainder response as the synthetic TopN Other
 * bucket.
 *
 * Takes the remainder dimensions directly rather than the `NotContains` filters
 * that produced them: only the dimension names matter here, and asking for the
 * whole filter forces callers that have no real filter list (the ACE rank path,
 * where the remainder comes from a dynamic binding) to fabricate placeholder
 * filters just to pass the dimension through.
 */
export const processUngroupedOtherResponse = (
  otherResponse: RAQIV2QueryResult | undefined | null,
  otherDimensions: readonly RAQIV2Dimension[],
): RAQIV2QueryResult | null => {
  if (!otherResponse) {
    return null;
  }

  // Append an Other sentinel breakdown entry for every remainder dimension to
  // each series in the response. When the request had no additional breakdowns
  // the response contains a single un-broken-down series and we end up with one
  // row representing Other. When there ARE additional breakdowns (e.g. Platform,
  // OS) the response contains one series per unique combination of those
  // breakdowns and each one gets its own Other entry appended for the
  // topN/otherSeries dimensions.
  const otherBreakdownEntries = otherDimensions.map((dimension) => ({
    dimension,
    value: TOP_N_OTHER_BREAKDOWN_VALUE,
  }));
  const values = otherResponse.values ?? [];
  if (values.length === 0) {
    return null;
  }

  const otherSeries = values.map((value) => ({
    ...value,
    breakdownValue: [...(value.breakdownValue ?? []), ...otherBreakdownEntries],
  }));
  return { values: otherSeries };
};
