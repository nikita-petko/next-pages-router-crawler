import React, { FC, useState, useCallback, useMemo } from 'react';
import { Container, Tabs, Tab, makeStyles, Grid, Typography } from '@rbx/ui';
import {
  RAQIV2MetricGranularity,
  RAQIV2Metric,
  RAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey, TranslationKey } from '@modules/analytics-translations';
import {
  AnalyticsComponentType,
  ArbitraryComponentConfig,
  RAQIV2ChartContext,
  RAQIV2MetricGranularityToSeriesIntervalMeaning,
  snapToLatestEndTime,
  snapToLatestStartTime,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { TableSortOrder } from '@modules/charts-generic';
import { TQueryFilter } from '@modules/clients/analytics/analyticsRAQIShared';
import useRetentionCohortPagination, {
  CohortTimeInterval,
} from '../RetentionPage/useRetentionCohortPagination';
import CohortTimeIntervalSelector from '../RetentionPage/CohortTimeIntervalSelector';
import { orderedAudienceExpansionFunnelColumnKeys } from './cohortTableConfigs';
import AudienceExpansionFunnelTable from './AudienceExpansionFunnelTable';

export enum AudienceExpansionFunnelTab {
  Overview = 'overview',
  Signups = 'signups',
  Reactivations = 'reactivations',
}

const tabSpecs: Array<{ key: AudienceExpansionFunnelTab; labelTranslationKey: TranslationKey }> = [
  {
    key: AudienceExpansionFunnelTab.Overview,
    labelTranslationKey: translationKey('Heading.AEFunnelOverview', TranslationNamespace.Analytics),
  },
  {
    key: AudienceExpansionFunnelTab.Signups,
    labelTranslationKey: translationKey(
      'Label.Metric.CreatorRewardsAudienceExpansionFunnelSignups',
      TranslationNamespace.Analytics,
    ),
  },
  {
    key: AudienceExpansionFunnelTab.Reactivations,
    labelTranslationKey: translationKey(
      'Label.Metric.LifetimeQualifiedReactivationsV3',
      TranslationNamespace.Analytics,
    ),
  },
] as const;

const useStyles = makeStyles()(() => ({
  controlsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabLabel: {
    textTransform: 'none', // MUI Tab auto capitalizes text, so we need to override it
  },
  tooltipIcon: {
    verticalAlign: 'middle',
    margin: '0 0 2px 4px',
  },
}));

type TabbedAudienceExpansionFunnelTableProps = {
  chartContext: RAQIV2ChartContext;
};

const TabbedAudienceExpansionFunnelTable: FC<TabbedAudienceExpansionFunnelTableProps> = ({
  chartContext,
}) => {
  const {
    classes: { controlsContainer, tabLabel },
  } = useStyles();
  const { translate } = useRAQIV2TranslationDependencies();

  const [activeTabKey, setActiveTabKey] = useState<AudienceExpansionFunnelTab>(
    AudienceExpansionFunnelTab.Overview,
  );
  const handleTabChange = useCallback(
    (_: React.ChangeEvent<object>, newValue: AudienceExpansionFunnelTab) => {
      setActiveTabKey(newValue);
    },
    [],
  );

  const [timeInterval, setTimeInterval] = useState<CohortTimeInterval>(
    RAQIV2MetricGranularity.OneWeek,
  );

  const controls = useMemo(() => {
    return (
      <Container disableGutters maxWidth={false} classes={{ root: controlsContainer }}>
        <Tabs
          value={activeTabKey}
          variant='scrollable'
          onChange={handleTabChange}
          aria-label='tabs'
          scrollButtons={false}>
          {tabSpecs.map(({ key, labelTranslationKey }) => {
            return (
              <Tab
                label={
                  <Typography classes={{ root: tabLabel }}>
                    {translate(labelTranslationKey)}
                  </Typography>
                }
                value={key}
                key={key}
              />
            );
          })}
        </Tabs>
        <CohortTimeIntervalSelector
          timeInterval={timeInterval}
          onTimeIntervalUpdate={setTimeInterval}
        />
      </Container>
    );
  }, [controlsContainer, activeTabKey, handleTabChange, timeInterval, tabLabel, translate]);

  // The cohort tables share synchronized pagination and cohort column sorting state.
  // When pagination changes in one table, it updates in all tables. Similarly,
  // changing the cohort column sort order in one table affects all tables.
  const [cohortOrder, setCohortOrder] = useState<TableSortOrder>(TableSortOrder.desc);
  const toggleOrder = useCallback(() => {
    setCohortOrder((order) =>
      order === TableSortOrder.asc ? TableSortOrder.desc : TableSortOrder.asc,
    );
  }, []);
  const tableContext = useMemo(() => {
    let filter: TQueryFilter[] = [];
    switch (activeTabKey) {
      case AudienceExpansionFunnelTab.Signups:
        filter = [
          {
            dimension: RAQIV2Dimension.CreatorRewardsAudienceExpansionFunnelIsSignup,
            values: ['true'],
          },
        ];
        break;
      case AudienceExpansionFunnelTab.Reactivations:
        filter = [
          {
            dimension: RAQIV2Dimension.CreatorRewardsAudienceExpansionFunnelIsReactivation,
            values: ['true'],
          },
        ];
        break;
      case AudienceExpansionFunnelTab.Overview:
      default:
        filter = [];
        break;
    }
    return {
      ...chartContext,
      granularity: timeInterval,
      timeSpec: {
        ...chartContext.timeSpec,
        startTime: snapToLatestStartTime(chartContext.timeSpec.startTime, timeInterval),
        endTime: snapToLatestEndTime(chartContext.timeSpec.endTime, timeInterval),
      },
      breakdown: [], // Cohort tables should ignore page-level breakdown
      filter,
    };
  }, [chartContext, timeInterval, activeTabKey]);
  const pagination = useRetentionCohortPagination({
    startTime: tableContext.timeSpec.startTime,
    endTime: tableContext.timeSpec.endTime,
    seriesIntervalMeaning: RAQIV2MetricGranularityToSeriesIntervalMeaning(tableContext.granularity),
  });

  const table = useMemo(
    () => (
      <AudienceExpansionFunnelTable
        tableContext={tableContext}
        pagination={pagination}
        activeTabKey={activeTabKey}
        cohortOrder={cohortOrder}
        toggleOrder={toggleOrder}
      />
    ),
    [activeTabKey, tableContext, pagination, cohortOrder, toggleOrder],
  );

  return (
    <Grid container item>
      <Grid item XSmall={12}>
        <Typography variant='h5'>
          {translate(translationKey('Heading.AcquisitionFunnel', TranslationNamespace.Analytics))}
        </Typography>
      </Grid>
      {controls}
      {table}
    </Grid>
  );
};

const componentConfigTabbedAudienceExpansionFunnelTable = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: Array.from(
    new Set(
      [...orderedAudienceExpansionFunnelColumnKeys].filter((key) =>
        isValidEnumValue(RAQIV2Metric, key),
      ),
    ),
  ),
  renderer: {
    type: 'withChartContext',
    render: (chartContext) => <TabbedAudienceExpansionFunnelTable chartContext={chartContext} />,
  },
} as const satisfies ArbitraryComponentConfig;

export default componentConfigTabbedAudienceExpansionFunnelTable;
