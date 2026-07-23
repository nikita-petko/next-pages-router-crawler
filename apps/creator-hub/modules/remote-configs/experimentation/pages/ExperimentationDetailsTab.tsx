import React, { FC, useCallback, useMemo } from 'react';
import { Grid, makeStyles } from '@rbx/ui';
import {
  ChartType,
  GenericChartState,
  GenericSummaryCard,
  useLocale,
} from '@modules/charts-generic';
import { Locale, useTranslation } from '@rbx/intl';
import {
  FormattedText,
  TranslationKey,
  translationKey,
  useTranslationWrapper,
} from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  AnalyticsComponentType,
  ChartConfig,
  AnalyticsComponent,
  RAQIV2ChartContext,
  RAQIV2SummaryCardType,
  RAQIV2SummaryType,
  AnalyticsSummaryCardConfig,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { formatDate } from '@modules/miscellaneous/common/utils';
import { ChartAbnormalStatus, SingleChartCardContainer } from '@rbx/analytics-ui';
import {
  ExperimentProductType,
  ExperimentState,
} from '../../api/universeExperimentationClientEnums';
import { ValidExperiment } from '../../api/validExperimentationTypes';
import useExperiment from '../hooks/useExperiment';
import {
  getExperimentRunningDays,
  getExperimentTargetingConfigKey,
  getExperimentTimeSpec,
  hasExperimentStarted,
} from '../../utils/experimentProperties';
import Section from '../../components/Section';
import VariantTableForMatchmaking from '../components/VariantTableForMatchmaking';
import VariantsTable from '../configs/VariantsTable';
import SRMBanner from '../components/SRMBanner';
import useExperimentSRMDetected from '../hooks/useExperimentSRMDetected';

type ExperimentationDetailsTabProps = {
  experimentId: string;
};

type ExperimentDetailCard = {
  label: React.ComponentProps<typeof GenericSummaryCard>['label'];
  value: React.ComponentProps<typeof GenericSummaryCard>['value'];
} & GenericChartState;

const totalEnrollmentCardConfig = {
  type: AnalyticsComponentType.SummaryCard,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.UsersInExperiment,
  summaryType: {
    type: RAQIV2SummaryType.Total,
  },
  label: {
    key: translationKey(
      'Title.SummaryCard.TotalEnrollment',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    type: 'simple',
  },
  overrides: {
    granularity: {
      override: RAQIV2MetricGranularity.None,
    },
    timeSpec: {
      override: {
        snapGranularity: RAQIV2MetricGranularity.OneDay,
      },
    },
  },
} as const satisfies AnalyticsSummaryCardConfig;

const enrollmentBarChartConfig = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Title.SummaryCard.TotalEnrollment',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  chartType: ChartType.Bar,
  labelDataAsPercent: false,
  summarySpec: {
    totalSummaryTypes: [
      {
        type: RAQIV2SummaryType.Total,
      },
    ],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
  metric: RAQIV2Metric.UsersInExperiment,
  overrides: {
    granularity: {
      override: RAQIV2MetricGranularity.None,
    },
    timeSpec: {
      override: {
        snapGranularity: RAQIV2MetricGranularity.OneDay,
      },
    },
    breakdown: {
      override: [RAQIV2Dimension.ExperimentVariant],
    },
  },
  chartHeight: 130,
} as const satisfies ChartConfig;

const enrollmentColumnChartConfig = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Title.Chart.DailyEnrollment',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  chartType: ChartType.Column,
  stacking: false,
  summarySpec: {
    totalSummaryTypes: [],
    perBreakdownSummaryTypes: [
      {
        type: RAQIV2SummaryType.Total,
      },
    ],
    aggregatedBreakdownSummaryTypes: [],
  },
  metric: RAQIV2Metric.UsersInExperiment,
  overrides: {
    granularity: {
      override: RAQIV2MetricGranularity.OneDay,
    },
    breakdown: {
      override: [RAQIV2Dimension.ExperimentVariant],
    },
  },
  hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative: true,
  hideComparisonChip: true,
  chartHeight: 200,
} as const satisfies ChartConfig;

enum DetailCardKey {
  NumberOfVariants = 'number_of_variants',
  ConfigKey = 'config_key',
  PercentRollout = 'percent_rollout',
  StartDate = 'start_date',
}

const orderedDetailCardKeys = [
  DetailCardKey.StartDate,
  DetailCardKey.NumberOfVariants,
  DetailCardKey.ConfigKey,
  DetailCardKey.PercentRollout,
] as const;

const detailCardInfo: Record<
  DetailCardKey,
  {
    labelKey: TranslationKey;
    getValue: ({
      experiment,
      locale,
    }: {
      experiment?: ValidExperiment;
      locale: Locale;
    }) => FormattedText;
    allowedExperimentTypes: ExperimentProductType[];
  }
> = {
  [DetailCardKey.NumberOfVariants]: {
    labelKey: translationKey(
      'Label.NumberofVariants',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    getValue: ({ experiment }) =>
      (experiment?.variants?.length?.toString() ?? 'N/A') as FormattedText,
    allowedExperimentTypes: [ExperimentProductType.Configs, ExperimentProductType.Matchmaking],
  },
  [DetailCardKey.ConfigKey]: {
    labelKey: translationKey(
      'Label.ConfigKey',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    getValue: ({ experiment }) =>
      (experiment ? getExperimentTargetingConfigKey(experiment) : 'N/A') as FormattedText,
    allowedExperimentTypes: [ExperimentProductType.Configs],
  },
  [DetailCardKey.PercentRollout]: {
    labelKey: translationKey(
      'Label.PercentRollout',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    getValue: ({ experiment }) =>
      (experiment ? `${experiment.exposurePercent}%` : 'N/A') as FormattedText,
    allowedExperimentTypes: [ExperimentProductType.Configs, ExperimentProductType.Matchmaking],
  },
  [DetailCardKey.StartDate]: {
    labelKey: translationKey(
      'Label.StartDate',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    getValue: ({ experiment, locale }) => {
      if (!experiment) {
        return 'N/A' as FormattedText;
      }

      switch (experiment.state) {
        case ExperimentState.Scheduled:
          return formatDate(experiment.scheduledTime, locale) as FormattedText;
        case ExperimentState.Running:
        case ExperimentState.Completed:
        case ExperimentState.Cancelled:
          return formatDate(experiment.startedTime, locale) as FormattedText;
        case ExperimentState.Draft:
        case ExperimentState.Deleted:
          return 'N/A' as FormattedText;
        default: {
          const exhaustiveCheck: never = experiment;
          throw new Error(`Unhandled experiment state: ${exhaustiveCheck}`);
        }
      }
    },
    allowedExperimentTypes: [ExperimentProductType.Configs, ExperimentProductType.Matchmaking],
  },
};

const useStyles = makeStyles()((theme) => {
  const gap = '24px';
  return {
    enrollmentStatsContainer: {
      gap,
      [theme.breakpoints.up('Medium')]: {
        flexWrap: 'nowrap',
      },
    },
    enrollmentSummaryCardsContainer: {
      gap,
      [theme.breakpoints.up('XSmall')]: {
        width: 'fit-content',
      },
      [theme.breakpoints.up('Medium')]: {
        flexDirection: 'column',
        width: 'auto',
        flexBasis: 'auto',
        flexGrow: 0,
        flexShrink: 0,
      },
    },
    enrollmentBarChartContainer: {
      minWidth: 0,
      flexGrow: 1,
      flexShrink: 1,
    },
  };
});

const ExperimentationDetailsTab: FC<ExperimentationDetailsTabProps> = ({
  experimentId,
}: ExperimentationDetailsTabProps) => {
  const {
    classes: {
      enrollmentStatsContainer,
      enrollmentSummaryCardsContainer,
      enrollmentBarChartContainer,
    },
  } = useStyles();
  const { id: universeId } = useUniverseResource();
  const { translate } = useTranslationWrapper(useTranslation());
  const locale = useLocale();
  const { experiment, ...experimentQueryState } = useExperiment({
    experimentId,
  });

  const generalDetails = useMemo(() => {
    const results: Array<ExperimentDetailCard & { key: string }> = orderedDetailCardKeys
      .filter((key) => {
        const { allowedExperimentTypes } = detailCardInfo[key];
        if (experiment && !allowedExperimentTypes.includes(experiment.experimentType)) {
          return false;
        }
        return true;
      })
      .map((key) => {
        const { labelKey, getValue } = detailCardInfo[key];
        return {
          key,
          label: {
            labelText: translate(labelKey),
          },
          value: getValue({ experiment, locale }),
          ...experimentQueryState,
        };
      });

    return results;
  }, [experiment, experimentQueryState, locale, translate]);

  const chartContext: RAQIV2ChartContext = useMemo(() => {
    return {
      resource: {
        type: RAQIV2ChartResourceType.Universe,
        id: universeId,
      },
      timeSpec: getExperimentTimeSpec(experiment),
      granularity: RAQIV2MetricGranularity.OneDay,
      filter: [
        {
          dimension: RAQIV2Dimension.Experiment,
          values: [experimentId.toString()],
        },
      ],
      timeAxisBounds: 'disabled',
    };
  }, [universeId, experiment, experimentId]);

  const activeDaysSummaryCard = useMemo(() => {
    const label = {
      labelText: translate(
        translationKey(
          'Title.SummaryCard.DaysRunning',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
    };
    const value = (
      experiment && hasExperimentStarted(experiment.state)
        ? getExperimentRunningDays(experiment).toString()
        : 'N/A'
    ) as FormattedText;
    return <GenericSummaryCard {...experimentQueryState} label={label} value={value} />;
  }, [experiment, experimentQueryState, translate]);

  const totalEnrollmentCard = useMemo(() => {
    if (experiment && hasExperimentStarted(experiment.state)) {
      return (
        <AnalyticsComponent
          config={totalEnrollmentCardConfig}
          chartContext={chartContext}
          onSelectChartRegion={null}
        />
      );
    }
    return (
      <GenericSummaryCard
        {...experimentQueryState}
        label={{
          labelText: translate(totalEnrollmentCardConfig.label.key),
        }}
        value={'N/A' as FormattedText}
      />
    );
  }, [chartContext, experiment, experimentQueryState, translate]);

  // chart placeholder is used when experiment hasn't started yet
  const createChartPlaceholer = useCallback(
    (chartConfig: ChartConfig) => {
      let abnormalState: {
        status: ChartAbnormalStatus;
        description?: string;
        secondaryDescription?: string;
      };
      if (experimentQueryState.isUserForbidden) {
        abnormalState = {
          status: ChartAbnormalStatus.NoAccess,
          description: translate(
            translationKey('Message.UserHasNoPermission', TranslationNamespace.Analytics),
          ),
        };
      } else if (experimentQueryState.isResponseFailed) {
        abnormalState = {
          status: ChartAbnormalStatus.Error,
          description: translate(
            translationKey('Message.RequestFailure', TranslationNamespace.Analytics),
          ),
        };
      } else if (experimentQueryState.isDataLoading) {
        abnormalState = {
          status: ChartAbnormalStatus.Loading,
        };
      } else {
        abnormalState = {
          status: ChartAbnormalStatus.NoData,
          description: translate(
            translationKey('Message.NoData', TranslationNamespace.UniverseConfigAndExperimentation),
          ),
          secondaryDescription: translate(
            translationKey(
              'Message.EnrollmentDataWillPopulateOnceExperimentStarts',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
        };
      }

      return (
        <Grid item XSmall={12}>
          <SingleChartCardContainer
            titleLabel={translate(chartConfig.titleKey)}
            chartSummarySpecs={[]}
            abnormalState={abnormalState}>
            <div style={{ height: chartConfig.chartHeight }} />
          </SingleChartCardContainer>
        </Grid>
      );
    },
    [
      experimentQueryState.isDataLoading,
      experimentQueryState.isResponseFailed,
      experimentQueryState.isUserForbidden,
      translate,
    ],
  );

  const enrollmentBarChart = useMemo(() => {
    if (experiment && hasExperimentStarted(experiment.state)) {
      return (
        <AnalyticsComponent
          config={enrollmentBarChartConfig}
          chartContext={chartContext}
          onSelectChartRegion={null}
        />
      );
    }

    return createChartPlaceholer(enrollmentBarChartConfig);
  }, [chartContext, createChartPlaceholer, experiment]);

  const enrollmentColumnChart = useMemo(() => {
    if (experiment && hasExperimentStarted(experiment.state)) {
      return (
        <AnalyticsComponent
          config={enrollmentColumnChartConfig}
          chartContext={chartContext}
          onSelectChartRegion={null}
        />
      );
    }
    return createChartPlaceholer(enrollmentColumnChartConfig);
  }, [chartContext, createChartPlaceholer, experiment]);

  const VariantsDetails = useMemo(() => {
    if (!experiment) {
      return null;
    }

    let variantsTable: React.ReactNode;
    switch (experiment.experimentType) {
      case ExperimentProductType.Matchmaking:
        variantsTable = <VariantTableForMatchmaking validVariants={experiment.variants} />;
        break;
      case ExperimentProductType.Configs:
        variantsTable = <VariantsTable variants={experiment.variants} />;
        break;
      default: {
        const exhaustiveCheck: never = experiment;
        throw new Error(`Unknown experiment type: ${exhaustiveCheck}`);
      }
    }

    return (
      <Grid item XSmall={12}>
        {variantsTable}
      </Grid>
    );
  }, [experiment]);

  const { isSRMDetected } = useExperimentSRMDetected(experimentId);

  return (
    <Grid container item XSmall={12} gap='40px'>
      {isSRMDetected && <SRMBanner />}
      <Section
        title={translate(
          translationKey(
            'Title.Section.ExperimentDetails',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
        collapsible>
        {generalDetails.map(({ key, label, value, ...state }) => (
          <GenericSummaryCard key={key} label={label} value={value} {...state} />
        ))}
        {VariantsDetails}
      </Section>
      <Section
        title={translate(
          translationKey(
            'Title.Section.Enrollment',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}>
        <Grid container item classes={{ root: enrollmentStatsContainer }}>
          <Grid container item classes={{ root: enrollmentSummaryCardsContainer }}>
            {activeDaysSummaryCard}
            {totalEnrollmentCard}
          </Grid>
          <Grid container item classes={{ root: enrollmentBarChartContainer }}>
            {enrollmentBarChart}
          </Grid>
        </Grid>
        <Grid item XSmall={12}>
          {enrollmentColumnChart}
        </Grid>
      </Section>
    </Grid>
  );
};

export default ExperimentationDetailsTab;
