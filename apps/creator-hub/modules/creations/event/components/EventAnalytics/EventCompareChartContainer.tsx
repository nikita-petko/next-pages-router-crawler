import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RAQIV2MetricGranularity,
  RAQIV2Dimension,
  RAQIV2IsNewUser,
  RAQIV2Metric,
} from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import { Grid, RobuxIcon, Typography } from '@rbx/ui';
import { brandPretranslatedText } from '@modules/analytics-translations/wrapperFunctions';
import type { TLabeledExplicitTimeRangeSpec } from '@modules/charts-generic/charts/types/ChartTypes';
import { mapNonEmptyArray, type NonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import type { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import virtualEventsClient from '@modules/clients/virtualEvents';
import GenericRAQIV2TabbedTimeComparatorCharts, {
  type GenericRAQIV2TabbedTimeComparatorChartSpec,
} from '@modules/experience-analytics-shared/components/RAQIV2/GenericRAQIV2TabbedTimeComparatorCharts';
import type { TRAQIV2NumericUIMetric } from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import type { UIFilters } from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import type { RAQIV2TimeComparatorChartSpec } from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { useCurrentGame } from '@modules/providers/game/GameProvider';

type LabeledTimeRange = {
  label: string;
  startTime: Date;
  endTime: Date;
};

type EventCompareTabKey =
  | 'DailyActiveUsers'
  | 'NewUsers'
  | 'ReturningUsers'
  | 'DailyRevenue'
  | 'AveragePlayMinutesPerDau'
  | 'AverageRevenuePerUser';

type EventCompareTab = GenericRAQIV2TabbedTimeComparatorChartSpec<EventCompareTabKey>;

type EventCompareChartContainerProps = {
  resource: {
    id: number;
    type: RAQIV2ChartResourceType;
    isLoading: boolean;
  };
  filters: UIFilters;
  setEmptyState: (empty: boolean) => void;
};

const EventCompareChartContainer: FunctionComponent<EventCompareChartContainerProps> = ({
  resource,
  filters,
  setEmptyState,
}) => {
  const { gameDetails } = useCurrentGame();
  const { translate } = useTranslation();
  const [loading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState(false);
  const [eventsList, setEventsList] = useState<LabeledTimeRange[]>([]);
  const [timeSpec, setTimeSpec] = useState<TLabeledExplicitTimeRangeSpec[]>([]);

  const loadEventList = useCallback(
    async (cursor: string) => {
      setIsLoading(true);
      try {
        const result = await virtualEventsClient.getUniverseEventOccurances({
          cursor,
          universeId: Number(gameDetails?.id),
          limit: 100,
        });

        if (!result.data) {
          return;
        }

        setEventsList(
          result.data.map((experienceEvent) => {
            const start = experienceEvent.eventTime?.startUtc;
            const end = experienceEvent.eventTime?.endUtc;
            return {
              label: experienceEvent.title ?? '',
              startTime: start ?? new Date(),
              endTime: end ?? new Date(),
            };
          }),
        );
        if (result.data.length === 0) {
          setEmptyState(true);
        } else {
          setEmptyState(false);
        }
        setErrorState(false);
      } catch {
        setErrorState(true);
      } finally {
        setIsLoading(false);
      }
    },
    [gameDetails, setEmptyState],
  );

  // For now, only grab the first page
  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- Legacy initial-load effect; refactoring the request lifecycle is outside this migration.
    void loadEventList('');
  }, [loadEventList]);

  // The parts of the RAQIV2 spec that do not change
  const specBase = useMemo(() => {
    return {
      resource,
      granularity: RAQIV2MetricGranularity.OneDay,
      // The event compare chart doesn't have a normal time axis;
      // it's denominated in relative time units so it wouldn't make sense to have a pinned page-wide time-axis
      timeAxisBounds: null,
    };
  }, [resource]);

  const tabs: NonEmptyArray<EventCompareTab> = useMemo(() => {
    const metrics: NonEmptyArray<{
      key: EventCompareTabKey;
      metric: TRAQIV2NumericUIMetric;
      filter: NonNullable<RAQIV2TimeComparatorChartSpec['filter']>;
      label: EventCompareTab['label'];
    }> = [
      {
        key: 'DailyActiveUsers',
        metric: RAQIV2Metric.DailyActiveUsers,
        filter: [],
        label: brandPretranslatedText(translate('Label.Metric.DailyActiveUsers')),
      },
      {
        key: 'NewUsers',
        metric: RAQIV2Metric.DailyActiveUsers,
        filter: [
          {
            dimension: RAQIV2Dimension.IsNewUser,
            values: [RAQIV2IsNewUser.New],
          },
        ],
        label: brandPretranslatedText(translate('Title.NewUsers')),
      },
      {
        key: 'ReturningUsers',
        metric: RAQIV2Metric.DailyActiveUsers,
        filter: [
          {
            dimension: RAQIV2Dimension.IsNewUser,
            values: [RAQIV2IsNewUser.Returning],
          },
        ],
        label: brandPretranslatedText(translate('Title.ReturningUsers')),
      },
      {
        key: 'DailyRevenue',
        metric: RAQIV2Metric.DailyRevenue,
        filter: [],
        label: {
          arbitrary: (
            <Grid direction='row' display='flex' alignItems='center'>
              <Typography>{`${translate('Title.Robux')} (`}</Typography>
              <RobuxIcon />
              <Typography>)</Typography>
            </Grid>
          ),
        },
      },
      {
        key: 'AveragePlayMinutesPerDau',
        metric: RAQIV2Metric.AveragePlayTimeMinutesPerDAU,
        filter: [],
        label: brandPretranslatedText(
          `${translate('Label.Metric.AveragePlayMinutesPerDAU')} (${translate('Label.MinsSuffix')})`,
        ),
      },
      {
        key: 'AverageRevenuePerUser',
        metric: RAQIV2Metric.AverageRevenuePerUser,
        filter: [],
        label: {
          arbitrary: (
            <Grid direction='row' display='flex' alignItems='center'>
              <Typography>{`${translate('Title.AvgRevenuePerDau')} (`}</Typography>
              <RobuxIcon />
              <Typography>)</Typography>
            </Grid>
          ),
        },
      },
    ];
    const raqiFilters = (filters ?? []).flatMap(({ dimension, values }) =>
      isValidEnumValue(RAQIV2Dimension, dimension) ? [{ dimension, values }] : [],
    );
    return mapNonEmptyArray(metrics, (metric) => {
      const tabSpec = {
        metric: metric.metric,
        filter: [...raqiFilters, ...metric.filter],
        labeledTimeSpecs: timeSpec,
        ...specBase,
      };
      return {
        key: metric.key,
        label: metric.label,
        spec: tabSpec,
        chartKeyOrConfig: null,
        onSelectChartRegion: () => 0,
      } satisfies EventCompareTab;
    });
  }, [filters, specBase, timeSpec, translate]);

  if (errorState) {
    return <FailureView message={translate('Error.Unknown')} />;
  }

  return (
    <Grid>
      {!loading && (
        <GenericRAQIV2TabbedTimeComparatorCharts
          tabs={tabs}
          dateRangeOptions={eventsList}
          title={brandPretranslatedText(translate('Heading.Compare'))}
          onDateRangeConfirm={setTimeSpec}
          ignoreCache
        />
      )}
    </Grid>
  );
};

export default EventCompareChartContainer;
