import React, { FC, useCallback, useMemo } from 'react';
import {
  ChartResourceType,
  filterNumericChartSummaryItemSpecs,
  NumberContext,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import {
  useRAQIV2TranslationDependencies,
  AnalyticsMetricsOverview,
  TWatchlistTileStyleConfig,
  useAnalyticsCurrentDateRangeBundle,
  RAQIV2ChartSpec,
  computeRAQIV2SpecOverride,
  makeRAQIV2Request,
  FetchComparisonSeriesMode,
  RAQIV2MetricGranularityToSeriesIntervalMeaning,
  useMappedApiRequest,
  useRAQIV2Client,
  generateAnalyticsNumberFormattingSpec,
  genericRAQIV2SeriesSummaryAdapter,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { Typography } from '@rbx/ui';
import {
  WatchlistExperienceTileMetricKeyConfig,
  WatchlistExperienceTileMetricKeys,
  WatchlistExperienceTileMetricsOrder,
  WatchlistExperienceTileMetricTranslationKeys,
} from './WatchlistExperienceTileMetrics';

type WatchlistExperienceTileMetricsContentSpec = {
  universeId: number;
  styleConfig: TWatchlistTileStyleConfig;
};

const WatchlistExperienceTileMetricsContentV2: FC<WatchlistExperienceTileMetricsContentSpec> = ({
  universeId,
  styleConfig,
}) => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { client } = useRAQIV2Client(false);
  const { startDate, endDate } = useAnalyticsCurrentDateRangeBundle();

  const specByKey = useMemo(() => {
    return new Map(
      WatchlistExperienceTileMetricsOrder.map((key) => {
        const { metric, overrides } = WatchlistExperienceTileMetricKeyConfig[key];
        const tableContext: RAQIV2ChartSpec = {
          resource: {
            type: ChartResourceType.Universe,
            id: universeId,
          },
          metric,
          timeSpec: {
            startTime: startDate,
            endTime: endDate,
          },
          // TODO: https://roblox.atlassian.net/browse/DSA-3817
          // use granularity None once we can get comparison date from it
          granularity: RAQIV2MetricGranularity.OneDay,
          // The watchlist tiles shouldn't have a shared time axis since the retention cards are shifted
          timeAxisBounds: null,
        };
        return [key, computeRAQIV2SpecOverride({ ...tableContext }, overrides ?? {})];
      }),
    );
  }, [endDate, startDate, universeId]);

  const makeRequests = useCallback(
    (ids: WatchlistExperienceTileMetricKeys[]) => {
      const requests = ids.map((key) => {
        const spec = specByKey.get(key);
        if (!spec) {
          throw new Error(`Watchlist spec not found for key: ${key}`);
        }

        return makeRAQIV2Request(spec, client, {
          fetchTotalSeries: true,
          fetchComparison: {
            mode: FetchComparisonSeriesMode.Combined,
            seriesIntervalMeaning: RAQIV2MetricGranularityToSeriesIntervalMeaning(spec.granularity),
          },
          allowComputedMetrics: false,
        });
      });

      return Promise.all(requests).then((responses) => {
        return new Map(responses.map((response, index) => [ids[index], response]));
      });
    },
    [client, specByKey],
  );
  const { data, isUserForbidden } = useMappedApiRequest(
    WatchlistExperienceTileMetricsOrder,
    makeRequests,
  );

  const metricValues = useMemo(() => {
    return Array.from(specByKey.entries()).map(([key, spec]) => {
      const responses = data.get(key);
      const summaries = filterNumericChartSummaryItemSpecs(
        genericRAQIV2SeriesSummaryAdapter({
          responses: responses ?? {
            response: null,
          },
          spec,
          translationDependencies,
        }),
      );

      return {
        metricKey: key,
        metricTitle: translationDependencies.translate(
          WatchlistExperienceTileMetricTranslationKeys[key],
        ),
        value: {
          value: summaries.length ? summaries[0].value : null,
          comparisonChipSpec: summaries.length ? summaries[0].comparisonChipSpec : undefined,
          analyticsFormattingSpec: generateAnalyticsNumberFormattingSpec({
            metric: spec.metric,
            context: NumberContext.CardSummary,
          }),
        },
      };
    });
  }, [data, specByKey, translationDependencies]);

  if (isUserForbidden) {
    return (
      <EmptyGrid>
        <Typography
          color='secondary'
          align='center'
          variant='body2'
          data-testid='forbidden-permission'>
          {translationDependencies.translate(
            translationKey(
              'Message.ExperienceNoAnalyticsPermission',
              TranslationNamespace.Analytics,
            ),
          )}
        </Typography>
      </EmptyGrid>
    );
  }

  return <AnalyticsMetricsOverview metrics={metricValues} styleConfig={styleConfig} />;
};

export default WatchlistExperienceTileMetricsContentV2;
