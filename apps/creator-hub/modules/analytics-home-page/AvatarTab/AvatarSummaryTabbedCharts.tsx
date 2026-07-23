import AvatarItemChartWithProvider from '@modules/avatar-analytics/components/AvatarItemChartWithProvider';
import { AvatarItemChartKey } from '@modules/avatar-analytics/types/AvatarItemChartTypes';
import { useAvatarAnalyticsMetricsRevenueComparisonData } from '@modules/avatar-analytics/context/AvatarAnalyticsMetricsRevenueComparisonProvider';
import { useAvatarAnalyticsMetricsRevenueData } from '@modules/avatar-analytics/context/AvatarAnalyticsMetricsRevenueProvider';
import { useAvatarAnalyticsMetricsSalesComparisonData } from '@modules/avatar-analytics/context/AvatarAnalyticsMetricsSalesComparisonProvider';
import { useAvatarAnalyticsMetricsSalesData } from '@modules/avatar-analytics/context/AvatarAnalyticsMetricsSalesProvider';
import {
  ChartUnit,
  ChartUnitAggregationType,
  DailyTimeSeriesAlignedToUTCMidnight,
  FormattingSpec,
  NonEmptyArray,
  NumberContext,
  TabbedChartSpec,
  getComparisonChipTooltip,
  getComparisonTimeRange,
  getRAQISumTotalValueWithComparison,
  useLocale,
  getSummarySpec,
  GenericChartState,
  SummaryValueType,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import {
  useExperienceAnalyticsCurrentDateRangeBundle,
  useRAQIV2TranslationDependencies,
  genericChartStateToChartAbnormalState,
} from '@modules/experience-analytics-shared';
import React, { useCallback, useMemo, useState } from 'react';
import { AvatarItemMetric, RAQIResponse } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Grid } from '@rbx/ui';
import { TabbedChartsCardContainer } from '@rbx/analytics-ui';

enum AvatarSummaryTabs {
  Revenue = 'Revenue',
  Sales = 'Sales',
}

const formattingSpecs: Record<AvatarSummaryTabs, FormattingSpec> = {
  [AvatarSummaryTabs.Sales]: {
    unit: ChartUnit.Sales,
    type: ChartUnitAggregationType.Sum,
    context: NumberContext.TabSummary,
  },
  [AvatarSummaryTabs.Revenue]: {
    unit: ChartUnit.Robux,
    type: ChartUnitAggregationType.Sum,
    context: NumberContext.TabSummary,
  },
};

const AvatarSummaryTabbedCharts = () => {
  const locale = useLocale();
  const { translate } = useRAQIV2TranslationDependencies();
  const { startDate, endDate } = useExperienceAnalyticsCurrentDateRangeBundle();
  const [activeTabKey, setActiveTabKey] = useState<AvatarSummaryTabs>(AvatarSummaryTabs.Revenue);

  const { comparisonStartDate, comparisonEndDate } = useMemo(
    () => getComparisonTimeRange(startDate, endDate, DailyTimeSeriesAlignedToUTCMidnight),
    [startDate, endDate],
  );

  const comparisonChipTooltip = useMemo(
    () =>
      getComparisonChipTooltip({
        translate,
        startDate,
        endDate,
        comparisonStartDate,
        comparisonEndDate,
      }),
    [comparisonEndDate, comparisonStartDate, endDate, startDate, translate],
  );

  const { data: revenueData } = useAvatarAnalyticsMetricsRevenueData();
  const { data: revenueComparisonData } = useAvatarAnalyticsMetricsRevenueComparisonData();
  const { data: salesData } = useAvatarAnalyticsMetricsSalesData();
  const { data: salesComparisonData } = useAvatarAnalyticsMetricsSalesComparisonData();

  const getSummaryValue = useCallback(
    (
      data: RAQIResponse<'Product'> | null,
      previousData: RAQIResponse<'Product'> | null,
      tab: AvatarSummaryTabs,
    ) => {
      const isPositiveGood = true;
      const { value, comparisonChipSpec } = getRAQISumTotalValueWithComparison(
        data,
        previousData,
        isPositiveGood,
      );
      return {
        value,
        formattingSpec: formattingSpecs[tab],
        comparisonChipSpec: comparisonChipSpec
          ? {
              ...comparisonChipSpec,
              tooltip: comparisonChipTooltip,
              contained: true,
              hasBackground: true,
            }
          : undefined,
        showComparisonChipAfterValue: true,
      };
    },
    [comparisonChipTooltip],
  );

  const revenueSummaryValue = useMemo(
    () => getSummaryValue(revenueData, revenueComparisonData, AvatarSummaryTabs.Revenue),
    [getSummaryValue, revenueComparisonData, revenueData],
  );

  const salesSummaryValue = useMemo(
    () => getSummaryValue(salesData, salesComparisonData, AvatarSummaryTabs.Sales),
    [getSummaryValue, salesComparisonData, salesData],
  );

  const tabs = useMemo(
    (): NonEmptyArray<TabbedChartSpec<AvatarSummaryTabs> & GenericChartState> => [
      {
        key: AvatarSummaryTabs.Revenue,
        label: translate(
          translationKey('Label.TotalRevenue', TranslationNamespace.AvatarAnalytics),
        ),
        summaryValue: revenueSummaryValue,
        content: (
          <AvatarItemChartWithProvider
            spec={{
              startDate,
              endDate,
              chartKey: AvatarItemChartKey.Revenue,
              metric: AvatarItemMetric.Revenue,
            }}
          />
        ),
        isDataLoading: false,
        isResponseFailed: false,
        isUserForbidden: false,
        isNoDataAvailable: !revenueData,
      },
      {
        key: AvatarSummaryTabs.Sales,
        label: translate(translationKey('Label.TotalSales', TranslationNamespace.AvatarAnalytics)),
        summaryValue: salesSummaryValue,
        content: (
          <AvatarItemChartWithProvider
            spec={{
              startDate,
              endDate,
              chartKey: AvatarItemChartKey.Sales,
              metric: AvatarItemMetric.SalesCount,
            }}
          />
        ),
        isDataLoading: false,
        isResponseFailed: false,
        isUserForbidden: false,
        isNoDataAvailable: !salesData,
      },
    ],
    [endDate, revenueSummaryValue, salesSummaryValue, startDate, translate, revenueData, salesData],
  );

  const tabSpecs = useMemo(
    () =>
      tabs.map((tab) => {
        const { key, label, summaryValue } = tab;
        const {
          value,
          comparisonChipSpec,
          showComparisonChipAfterValue,
          formattingSpec,
          numberContextMetadata,
        } = summaryValue;

        const summarySpec =
          value !== null && formattingSpec
            ? getSummarySpec({
                item: {
                  summaryValueType: SummaryValueType.Numeric,
                  unit: formattingSpec.unit,
                  value,
                  numberContextMetadata,
                  comparisonChipSpec,
                  type: formattingSpec.type,
                  correspondingBreakdowns: [],
                },
                translate,
                locale,
                summaryValueContext: NumberContext.TabSummary,
              })
            : null;

        return {
          key,
          summaryValue: summarySpec?.summaryValue ?? '',
          description: label?.toString() ?? '',
          comparisonChipSpec: showComparisonChipAfterValue
            ? summarySpec?.comparisonChipSpec
            : undefined,
          abnormalState: genericChartStateToChartAbnormalState({
            state: {
              isDataLoading: tab.isDataLoading,
              isUserForbidden: tab.isUserForbidden,
              isResponseFailed: tab.isResponseFailed,
              error: tab.error,
            },
            translate,
          }),
        };
      }),
    [locale, tabs, translate],
  );

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.key === activeTabKey) ?? tabs[0],
    [activeTabKey, tabs],
  );

  const onActiveTabChanged = useCallback((tabKey: string | number) => {
    setActiveTabKey(tabKey as AvatarSummaryTabs);
  }, []);

  return (
    <Grid item container direction='column'>
      <Grid item>
        <TabbedChartsCardContainer
          tabSpecs={tabSpecs}
          activeTabKey={activeTabKey}
          onActiveTabChanged={onActiveTabChanged}
          titleLabel=''>
          {activeTab.content}
        </TabbedChartsCardContainer>
      </Grid>
    </Grid>
  );
};

export default AvatarSummaryTabbedCharts;
