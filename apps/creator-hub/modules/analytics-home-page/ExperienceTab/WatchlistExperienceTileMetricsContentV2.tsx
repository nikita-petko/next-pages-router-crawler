import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { Typography } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { filterNumericChartSummaryItemSpecs } from '@modules/charts-generic/charts/ChartSummaryItem';
import { NumberContext } from '@modules/charts-generic/charts/numberFormatters';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import genericRAQIV2SeriesSummaryAdapter from '@modules/experience-analytics-shared/adapters/genericRAQIV2SeriesSummaryAdapter';
import AnalyticsMetricsOverview from '@modules/experience-analytics-shared/components/AnalyticsMetricsOverview/AnalyticsMetricsOverview';
import type { TWatchlistTileStyleConfig } from '@modules/experience-analytics-shared/constants/tileConstants';
import { useRAQIV2Client } from '@modules/experience-analytics-shared/context/RAQIV2ClientProvider';
import useMappedApiRequest from '@modules/experience-analytics-shared/hooks/useMappedApiRequest';
import useRAQIV2RequestFlags from '@modules/experience-analytics-shared/hooks/useRAQIV2RequestFlags';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartSpec from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import { generateAnalyticsNumberFormattingSpec } from '@modules/experience-analytics-shared/utils/analyticsNumberFormattingSpec';
import computeRAQIV2SpecOverride from '@modules/experience-analytics-shared/utils/computeRAQIV2SpecOverride';
import makeRAQIV2Request, {
  FetchComparisonSeriesMode,
} from '@modules/experience-analytics-shared/utils/makeRAQIV2Request';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { WatchlistExperienceTileMetricKeys } from './WatchlistExperienceTileMetrics';
import {
  WatchlistExperienceTileMetricKeyConfig,
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
  const { ready: requestFlagsReady, enableComparisonRangePolicy } = useRAQIV2RequestFlags();
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
            rangeType: RAQIV2DateRangeType.Custom,
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
          enableComparisonRangePolicy,
          fetchTotalSeries: true,
          fetchComparison: {
            mode: FetchComparisonSeriesMode.Combined,
            granularity: spec.granularity,
          },
        });
      });

      return Promise.all(requests).then((responses) => {
        return new Map(responses.map((response, index) => [ids[index], response]));
      });
    },
    [client, enableComparisonRangePolicy, specByKey],
  );
  const { data, isUserForbidden } = useMappedApiRequest(
    WatchlistExperienceTileMetricsOrder,
    makeRequests,
    requestFlagsReady,
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
