import React, { useCallback, useMemo, useState } from 'react';
import { TabbedChartsCardContainer } from '@rbx/analytics-ui';
import { Grid, makeStyles } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import type { ChartSummaryItemSpec } from '@modules/charts-generic/charts/ChartSummaryItem';
import type GenericCsvExporter from '@modules/charts-generic/charts/exporters/GenericCsvExporter';
import TimeSeriesChartExporter from '@modules/charts-generic/charts/exporters/TimeSeriesChartExporter';
import { getSummarySpec } from '@modules/charts-generic/charts/hooks/useChartSummarySpecs';
import { NumberContext } from '@modules/charts-generic/charts/numberFormatters';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import {
  ChartType,
  ChartUnit,
  ChartUnitAggregationType,
} from '@modules/charts-generic/charts/types/ChartTypes';
import useLocale from '@modules/charts-generic/context/useLocale';
import type { NonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import type { RAQIV2SummarySpec } from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import {
  getDefaultSummarySpec,
  noSummarySpec,
} from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import useChartTimeSeriesAnnotations from '../../hooks/useChartTimeSeriesAnnotations';
import useCurrentAnnotationsBundleProvider from '../../hooks/useCurrentAnnotationsBundleProvider';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import type GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import type RAQIV2ChartSpec from '../../types/RAQIV2ChartSpec';
import {
  brandUserSuppliedText,
  getMetricLabelFromMetricLike,
} from '../../utils/metricLikeSemantics';
import ChartActionsSlot from './ChartActionsSlot';
import chartTypeToGenericRAQIV2Chart from './chartTypeToGenericRAQIV2Chart';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import useMetricOwnershipWatermarkSlots from './useMetricOwnershipWatermarkSlots';

export type GenericRAQIV2TabbedChartSpec<TTabKey> = {
  key: TTabKey;
  chartType: ChartType;
  tabLabel: FormattedText;
} & GenericRAQIV2ChartProps;

export type GenericRAQIV2TabbedChartsProps<TTabKey extends string | number> = {
  tabs: NonEmptyArray<GenericRAQIV2TabbedChartSpec<TTabKey>>;
  title: FormattedText;
  definitionTooltip?: FormattedText;
  titleSuffix?: React.ReactNode;
  ignoreCache?: boolean;
  chartControl?: React.JSX.Element | null;
  footerContent?: React.ReactNode;
};

// Pick one summary type to use for tab summary from the summary spec
export const getTabSummarySpec = (
  summarySpec: RAQIV2SummarySpec | undefined,
  spec: RAQIV2ChartSpec,
): RAQIV2SummarySpec => {
  if (summarySpec === undefined) {
    return getDefaultSummarySpec(spec);
  }
  if (summarySpec.totalSummaryTypes.length > 0) {
    return {
      totalSummaryTypes: summarySpec.totalSummaryTypes.slice(0, 1),
      perBreakdownSummaryTypes: [],
      aggregatedBreakdownSummaryTypes: [],
    };
  }
  if (summarySpec.perBreakdownSummaryTypes.length > 0) {
    return {
      totalSummaryTypes: [],
      perBreakdownSummaryTypes: summarySpec.perBreakdownSummaryTypes.slice(0, 1),
      aggregatedBreakdownSummaryTypes: [],
    };
  }
  return noSummarySpec;
};

const useStyles = makeStyles()(() => ({
  nonActiveChartContainer: {
    display: 'none',
  },
}));

const GenericRAQIV2TabbedChartsV2 = <TTabKey extends string | number>({
  tabs,
  title,
  definitionTooltip,
  titleSuffix,
  chartControl,
  footerContent,
}: GenericRAQIV2TabbedChartsProps<TTabKey>) => {
  const {
    classes: { nonActiveChartContainer },
  } = useStyles();
  const locale = useLocale();
  const translationDependencies = useRAQIV2TranslationDependencies();
  const [activeTabKey, setActiveTabKey] = useState<TTabKey>(tabs[0].key);
  const onActiveTabChanged = useCallback((tabKey: string | number) => {
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Tab callbacks only receive keys from this component's TTabKey-backed tab list.
    setActiveTabKey(tabKey as TTabKey);
  }, []);

  const [tabChartData, setTabChartData] = useState<
    Map<
      TTabKey,
      {
        chartState: GenericChartState;
        summaryItems: ChartSummaryItemSpec[];
        exporter: GenericCsvExporter;
      }
    >
  >(new Map());

  const tabSpecs = useMemo(() => {
    return tabs.map((tab) => {
      const chartData = tabChartData.get(tab.key);

      // NOTE(shumingxu, 02/20/2024): getTabSummarySpec prioritizes totalSummaryTypes over perBreakdownSummaryTypes
      // so most charts will only have one summary value. In the case of perBreakdownSummaryTypes, we will only use the first breakdown.
      const summarySpec = chartData?.summaryItems.length
        ? getSummarySpec({
            item: chartData.summaryItems[0],
            translate: translationDependencies.translate,
            locale,
            summaryValueContext: NumberContext.TabSummary,
          })
        : null;

      const chartState = chartData?.chartState ?? {
        isDataLoading: true,
        isUserForbidden: false,
        isResponseFailed: false,
      };

      return {
        key: tab.key,
        summaryValue: summarySpec?.summaryValue ?? '',
        description: tab.tabLabel,
        comparisonChipSpec: summarySpec?.comparisonChipSpec,
        abnormalState: genericChartStateToChartAbnormalState({
          state: chartState,
          hasNoData: !chartState.isDataLoading && chartData?.exporter.hasEmptyData,
          translate: translationDependencies.translate,
          tPendingTranslation: translationDependencies.tPendingTranslation,
        }),
        chartBanner: tab.chartBanner,
      };
    });
  }, [
    tabs,
    tabChartData,
    translationDependencies.translate,
    translationDependencies.tPendingTranslation,
    locale,
  ]);

  const activeTab = useMemo(() => {
    const result = tabs.find((t) => t.key === activeTabKey);
    if (!result) {
      throw new Error(`No tab found for key: ${activeTabKey}`);
    }
    return result;
  }, [activeTabKey, tabs]);
  const activeTabMetric = activeTab.spec.metric;
  const activeTabMetricLabel = useMemo(
    () => getMetricLabelFromMetricLike(activeTabMetric, translationDependencies),
    [activeTabMetric, translationDependencies],
  );
  const ownershipWatermarkSlots = useMetricOwnershipWatermarkSlots(activeTab.spec);
  const { getCurrentSupportedAnnotations } = useCurrentAnnotationsBundleProvider(
    activeTab.spec.resource.type,
  );
  const { timeSeriesAnnotations: activeTabTimeSeriesAnnotations } = useChartTimeSeriesAnnotations({
    metric: activeTabMetric,
    getCurrentSupportedAnnotations,
    chartBreakdown: activeTab.spec.breakdown,
    chartFilter: activeTab.spec.filter,
  });

  const onChartDataUpdatedCallbacks = useMemo(() => {
    return tabs.map(({ key }) => {
      return ({
        chartState,
        summaryItems,
        exporter,
      }: {
        chartState: GenericChartState;
        summaryItems: ChartSummaryItemSpec[];
        exporter: GenericCsvExporter;
      }) => {
        setTabChartData((prev) => {
          const newMap = new Map(prev);
          newMap.set(key, { chartState, summaryItems, exporter });
          return newMap;
        });
      };
    });
  }, [tabs]);

  const chartComponent = useMemo(() => {
    return tabs.map(({ key, ...tab }, idx) => {
      if (tab.chartType === ChartType.MultipleMetricSpline) {
        throw new Error('MultipleMetricSpline is not supported in GenericRAQIV2TabbedCharts');
      }
      if (tab.chartType === ChartType.Table) {
        throw new Error('Table is not supported in GenericRAQIV2TabbedCharts');
      }
      const Chart = chartTypeToGenericRAQIV2Chart(tab.chartType);

      return (
        <div key={key} className={key === activeTabKey ? undefined : nonActiveChartContainer}>
          <Chart
            {...tab}
            titleKey={undefined}
            definitionTooltipKey={undefined}
            summarySpec={undefined}
            renderWithoutPeripherals
            onChartDataUpdated={onChartDataUpdatedCallbacks[idx]}
          />
        </div>
      );
    });
  }, [activeTabKey, nonActiveChartContainer, onChartDataUpdatedCallbacks, tabs]);

  const exporter = useMemo(() => {
    const activeTabChartData = tabChartData.get(activeTab.key);
    if (activeTabChartData) {
      return activeTabChartData.exporter;
    }

    // If the active tab is not loaded yet, we need to create a dummy exporter with no data
    return new TimeSeriesChartExporter(
      activeTabMetricLabel,
      {
        unit: {
          display: brandUserSuppliedText(''),
          unit: ChartUnit.Unknown,
          type: ChartUnitAggregationType.Unknown,
        },
        series: [],
        timestamps: [],
      },
      translationDependencies.translate,
      title,
    );
  }, [tabChartData, activeTab.key, activeTabMetricLabel, translationDependencies.translate, title]);

  return (
    <Grid item container direction='column'>
      <Grid item>
        <ChartActionsSlot
          chartKeyOrConfig={activeTab.chartKeyOrConfig ?? null}
          spec={activeTab.spec}
          kpiType={activeTabMetricLabel}
          exporter={exporter}
          chartLocation={activeTab.chartLocation}
          visibleTimeSeriesAnnotations={activeTabTimeSeriesAnnotations}>
          {({ headerActionItems }) => (
            <TabbedChartsCardContainer
              titleLabel={title}
              titleTooltipLabel={definitionTooltip}
              titleSuffix={titleSuffix}
              tabSpecs={tabSpecs}
              activeTabKey={activeTabKey}
              onActiveTabChanged={onActiveTabChanged}
              headerActionItems={headerActionItems}
              chartControl={chartControl}
              footerContent={footerContent}
              slots={ownershipWatermarkSlots}>
              {chartComponent}
            </TabbedChartsCardContainer>
          )}
        </ChartActionsSlot>
      </Grid>
    </Grid>
  );
};

export default GenericRAQIV2TabbedChartsV2;
