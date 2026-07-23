import React, { useCallback, useMemo, useState } from 'react';

import {
  ChartSummaryItemSpec,
  ChartType,
  ChartUnit,
  ChartUnitAggregationType,
  GenericChartState,
  GenericCsvExporter,
  getSummarySpec,
  NonEmptyArray,
  NumberContext,
  TimeSeriesChartExporter,
  useDownloadAction,
  useLocale,
} from '@modules/charts-generic';
import { FormattedText } from '@modules/analytics-translations';
import { TabbedChartsCardContainer } from '@rbx/analytics-ui';
import { Grid, makeStyles } from '@rbx/ui';
import useExploreModeAction from '../../exploreMode/useExploreModeAction';
import {
  getDefaultSummarySpec,
  noSummarySpec,
  RAQIV2SummarySpec,
} from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import chartTypeToGenericRAQIV2Chart from './chartTypeToGenericRAQIV2Chart';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import RAQIV2ChartSpec from '../../types/RAQIV2ChartSpec';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import {
  getExportLabelFromMetricLike,
  getMetricLabelFromMetricLike,
} from '../../utils/metricLikeSemantics';

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
        isNoDataAvailable: false,
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
        }),
        chartBanner: tab.chartBanner,
      };
    });
  }, [tabs, tabChartData, translationDependencies.translate, locale]);

  const activeTab = useMemo(() => {
    const result = tabs.find((t) => t.key === activeTabKey);
    if (!result) {
      throw new Error(`No tab found for key: ${activeTabKey}`);
    }
    return result;
  }, [activeTabKey, tabs]);
  const activeTabMetric = activeTab.spec.metric;
  const activeTabMetricLabel = useMemo(
    () => getMetricLabelFromMetricLike(activeTabMetric),
    [activeTabMetric],
  );

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

  const secondaryAction = useExploreModeAction(
    activeTab?.chartKeyOrConfig ?? null,
    activeTab?.spec,
  );

  const exporter = useMemo(() => {
    const activeTabChartData = tabChartData.get(activeTab.key);
    if (activeTabChartData) {
      return activeTabChartData.exporter;
    }

    // If the active tab is not loaded yet, we need to create a dummy exporter with no data
    return new TimeSeriesChartExporter(
      getExportLabelFromMetricLike(activeTabMetric),
      {
        unit: {
          display: '' as FormattedText,
          unit: ChartUnit.Unknown,
          type: ChartUnitAggregationType.Unknown,
        },
        series: [],
        timestamps: [],
      },
      translationDependencies.translate,
      title,
    );
  }, [tabChartData, activeTab.key, activeTabMetric, translationDependencies.translate, title]);

  const downloadAction = useDownloadAction({
    kpiType: activeTabMetricLabel,
    exporter,
  });

  return (
    <Grid item container direction='column'>
      <Grid item>
        <TabbedChartsCardContainer
          titleLabel={title}
          titleTooltipLabel={definitionTooltip}
          titleSuffix={titleSuffix}
          tabSpecs={tabSpecs}
          activeTabKey={activeTabKey}
          onActiveTabChanged={onActiveTabChanged}
          secondaryAction={secondaryAction}
          downloadAction={downloadAction}
          chartControl={chartControl}
          footerContent={footerContent}>
          {chartComponent}
        </TabbedChartsCardContainer>
      </Grid>
    </Grid>
  );
};

export default GenericRAQIV2TabbedChartsV2;
