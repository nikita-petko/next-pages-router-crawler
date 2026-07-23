import { NonEmptyArray, TLabeledExplicitTimeRangeSpec, ChartUnit } from '@modules/charts-generic';
import { virtualEventsClient } from '@modules/clients';
import {
  GenericRAQIV2TabbedTimeComparatorCharts,
  GenericRAQIV2TabbedTimeComparatorChartSpec,
  TRAQIV2NumericUIMetric,
  UIFilters,
} from '@modules/experience-analytics-shared';
import { FormattedText } from '@modules/analytics-translations';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { Grid, RobuxIcon, Typography } from '@rbx/ui';
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { VirtualEventResponse } from '@rbx/clients/virtualEventsApi';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import {
  RAQIV2MetricGranularity,
  RAQIV2Dimension,
  RAQIV2IsNewUser,
  RAQIV2Metric,
} from '@rbx/creator-hub-analytics-config';

type LabeledTimeRange = {
  label: string;
  startTime: Date;
  endTime: Date;
};

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

        const parsedResponse: VirtualEventResponse[] = [];
        result.data?.forEach((event) => {
          const parsedEvent = event;
          parsedResponse.push(parsedEvent);
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
    loadEventList('');
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

  const tabs: NonEmptyArray<GenericRAQIV2TabbedTimeComparatorChartSpec<TRAQIV2NumericUIMetric>> =
    useMemo(() => {
      const metrics = [
        {
          key: 'DailyActiveUsers',
          metric: RAQIV2Metric.DailyActiveUsers as TRAQIV2NumericUIMetric,
          unit: ChartUnit.Robux,
          filter: [],
          label: translate('Label.Metric.DailyActiveUsers') as FormattedText,
        },
        {
          key: 'NewUsers',
          metric: RAQIV2Metric.DailyActiveUsers as TRAQIV2NumericUIMetric,
          unit: ChartUnit.Robux,
          filter: [
            {
              dimension: RAQIV2Dimension.IsNewUser,
              values: [RAQIV2IsNewUser.New],
            },
          ],
          label: translate('Title.NewUsers') as FormattedText,
        },
        {
          key: 'ReturningUsers',
          metric: RAQIV2Metric.DailyActiveUsers as TRAQIV2NumericUIMetric,
          unit: ChartUnit.Robux,
          filter: [
            {
              dimension: RAQIV2Dimension.IsNewUser,
              values: [RAQIV2IsNewUser.Returning],
            },
          ],
          label: translate('Title.ReturningUsers') as FormattedText,
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
          metric: RAQIV2Metric.AveragePlayTimeMinutesPerDAU as TRAQIV2NumericUIMetric,
          filter: [],
          label:
            `${translate('Label.Metric.AveragePlayMinutesPerDAU')} (${translate('Label.MinsSuffix')})` as FormattedText,
        },
        {
          key: 'AverageRevenuePerUser',
          metric: RAQIV2Metric.AverageRevenuePerUser as TRAQIV2NumericUIMetric,
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
      return metrics.map((metric) => {
        const tabSpec = {
          metric: metric.metric as TRAQIV2NumericUIMetric,
          filter: [...(filters ?? []), ...metric.filter],
          labeledTimeSpecs: timeSpec,
          ...specBase,
        };
        return {
          key: metric.key,
          label: metric.label,
          spec: tabSpec,
          chartKeyOrConfig: null,
          onSelectChartRegion: () => 0,
        } as GenericRAQIV2TabbedTimeComparatorChartSpec<TRAQIV2NumericUIMetric>;
      }) as NonEmptyArray<GenericRAQIV2TabbedTimeComparatorChartSpec<TRAQIV2NumericUIMetric>>;
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
          title={translate('Heading.Compare') as FormattedText}
          onDateRangeConfirm={setTimeSpec}
          ignoreCache
        />
      )}
    </Grid>
  );
};

export default EventCompareChartContainer;
