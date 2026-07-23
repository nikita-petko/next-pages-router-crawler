import type { FC } from 'react';
import React, { useState, useCallback, useMemo } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2MetricGranularity,
  RAQIV2Metric,
} from '@rbx/creator-hub-analytics-config';
import {
  Container,
  Tabs,
  Tab,
  makeStyles,
  Grid,
  Typography,
  Tooltip,
  InfoOutlinedIcon,
} from '@rbx/ui';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TableSortOrder } from '@modules/charts-generic/tables/types/TableSort';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import {
  snapToLatestEndTime,
  snapToLatestStartTime,
} from '@modules/experience-analytics-shared/utils/snapToLatestTimestep';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import CohortTimeIntervalSelector from './CohortTimeIntervalSelector';
import { orderedDownFunnelColumnKeys, orderedRetentionColumnKeys } from './configs';
import NewUserDownFunnelTable from './NewUserDownFunnelTable';
import NewUserRetentionTable from './NewUserRetentionTable';
import type { CohortTimeInterval } from './useRetentionCohortPagination';
import useRetentionCohortPagination from './useRetentionCohortPagination';

enum CohortAnalysisTab {
  NewUsersRetention = 'new-users-retention',
  NewUserDownFunnel = 'new-user-down-funnel',
}

const tabSpecs: Array<{ key: CohortAnalysisTab; labelTranslationKey: TranslationKey }> = [
  {
    key: CohortAnalysisTab.NewUsersRetention,
    labelTranslationKey: translationKey('Label.NewUsersRetention', TranslationNamespace.Analytics),
  },
  {
    key: CohortAnalysisTab.NewUserDownFunnel,
    labelTranslationKey: translationKey('Label.NewUserDownFunnel', TranslationNamespace.Analytics),
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

type CohortAnalysisTabbedTablesProps = {
  chartContext: RAQIV2ChartContext;
};

const CohortAnalysisTabbedTables: FC<CohortAnalysisTabbedTablesProps> = ({ chartContext }) => {
  const {
    classes: { controlsContainer, tabLabel, tooltipIcon },
  } = useStyles();
  const { translate } = useRAQIV2TranslationDependencies();

  const [activeTabKey, setActiveTabKey] = useState<CohortAnalysisTab>(
    CohortAnalysisTab.NewUsersRetention,
  );
  const handleTabChange = useCallback(
    (_: React.ChangeEvent<object>, newValue: CohortAnalysisTab) => {
      setActiveTabKey(newValue);
    },
    [],
  );

  const [timeInterval, setTimeInterval] = useState<CohortTimeInterval>(
    RAQIV2MetricGranularity.OneDay,
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
  // When pagination changes in one table, it updates in both tables. Similarly,
  // changing the cohort column sort order in one table affects both tables.
  const [cohortOrder, setCohortOrder] = useState<TableSortOrder>(TableSortOrder.desc);
  const toggleOrder = useCallback(() => {
    setCohortOrder((order) =>
      order === TableSortOrder.asc ? TableSortOrder.desc : TableSortOrder.asc,
    );
  }, []);
  const tableContext = useMemo(
    () => ({
      ...chartContext,
      granularity: timeInterval,
      timeSpec: {
        ...chartContext.timeSpec,
        rangeType: RAQIV2DateRangeType.Custom,
        startTime: snapToLatestStartTime(chartContext.timeSpec.startTime, timeInterval),
        endTime: snapToLatestEndTime(chartContext.timeSpec.endTime, timeInterval),
      },
      breakdown: [], // Cohort tables should ignore page-level breakdown
    }),
    [chartContext, timeInterval],
  );
  const pagination = useRetentionCohortPagination({
    startTime: tableContext.timeSpec.startTime,
    endTime: tableContext.timeSpec.endTime,
    granularity: tableContext.granularity,
  });

  const table = useMemo(() => {
    switch (activeTabKey) {
      case CohortAnalysisTab.NewUsersRetention:
        return (
          <NewUserRetentionTable
            tableContext={tableContext}
            pagination={pagination}
            cohortOrder={cohortOrder}
            toggleOrder={toggleOrder}
          />
        );
      case CohortAnalysisTab.NewUserDownFunnel:
        return (
          <NewUserDownFunnelTable
            tableContext={tableContext}
            pagination={pagination}
            cohortOrder={cohortOrder}
            toggleOrder={toggleOrder}
          />
        );
      default: {
        const exhaustiveCheck: never = activeTabKey;
        throw new Error(`Unhandled tab: ${String(exhaustiveCheck)}`);
      }
    }
  }, [activeTabKey, tableContext, pagination, cohortOrder, toggleOrder]);

  return (
    <Grid container item>
      <Grid item XSmall={12}>
        <Typography variant='h5'>
          {translate(translationKey('Title.CohortAnalysis', TranslationNamespace.Analytics))}
          <Tooltip
            title={translate(
              translationKey('Description.CohortAnalysis', TranslationNamespace.Analytics),
            )}
            arrow>
            <InfoOutlinedIcon classes={{ root: tooltipIcon }} />
          </Tooltip>
        </Typography>
      </Grid>
      {controls}
      {table}
    </Grid>
  );
};

const componentConfigCohortAnalysisTabbedTables = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: Array.from(
    new Set(
      [
        ...orderedDownFunnelColumnKeys,
        ...orderedRetentionColumnKeys,
        RAQIV2Metric.DailyCohortRetention,
        RAQIV2Metric.WeeklyCohortRetention,
      ].filter((key) => isValidEnumValue(RAQIV2Metric, key)),
    ),
  ),
  renderer: {
    type: 'withChartContext',
    render: (chartContext) => <CohortAnalysisTabbedTables chartContext={chartContext} />,
  },
} as const satisfies ArbitraryComponentConfig;

export default componentConfigCohortAnalysisTabbedTables;
