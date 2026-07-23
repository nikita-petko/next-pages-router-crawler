import React, { ReactNode, useCallback, useMemo, useState } from 'react';

import {
  ChartSummaryItemSpec,
  ChartUnit,
  ChartUnitAggregationType,
  DateRangeType,
  GenericChartState,
  GenericCsvExporter,
  NonEmptyArray,
  TimeSeriesChartExporter,
  TLabeledExplicitTimeRangeSpec,
  useDownloadAction,
} from '@modules/charts-generic';
import { FormattedText } from '@modules/analytics-translations';
import { TabbedTimeComparatorChartsCardContainer } from '@rbx/analytics-ui';
import { Grid } from '@rbx/ui';
import { GenericRAQIV2TimeComparatorChartProps } from '../../types/GenericRAQIV2ChartProps';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import GenericRAQIV2TimeComparatorColumnChart from './GenericRAQIV2TimeComparatorColumnChart';
import LabeledDateRangeSelectorsContainer from '../LabeledDateRangeSelector/LabeledDateRangeSelectorsContainer';
import {
  getExportLabelFromMetricLike,
  getMetricLabelFromMetricLike,
} from '../../utils/metricLikeSemantics';

export type LabeledDateRange = {
  label?: string;
  startTime: Date;
  endTime: Date;
};

export type GenericRAQIV2TabbedTimeComparatorChartSpec<TTabKey> = {
  key: TTabKey;
  label: FormattedText | { arbitrary: ReactNode };
} & GenericRAQIV2TimeComparatorChartProps;

export type GenericRAQIV2TabbedChartsProps<TTabKey extends string | number> = {
  tabs: NonEmptyArray<GenericRAQIV2TabbedTimeComparatorChartSpec<TTabKey>>;
  title: FormattedText;
  dateRangeOptions?: LabeledDateRange[];
  onDateRangeConfirm?: (labeledTimeSpecs: TLabeledExplicitTimeRangeSpec[]) => void;
  definitionTooltip?: FormattedText;
  ignoreCache?: boolean;
};

const labeledTimeRangeToTimeSpec = (timeRange: LabeledDateRange) => {
  return {
    timeSpec: {
      startTime: timeRange.startTime,
      endTime: timeRange.endTime,
      rangeType: DateRangeType.Custom,
    },
    label: timeRange.label,
  };
};

/**
 * A wrapped version of the GenericRAQIV2TimeComparatorColumnChart that adds tabs and an
 * optional date selector UI to the chart card.  If dateRangeOptions is undefined, only the tabs
 * will be rendered.
 */
const GenericRAQIV2TabbedTimeComparatorCharts = <TTabKey extends string | number>({
  tabs,
  title,
  definitionTooltip,
  dateRangeOptions,
  onDateRangeConfirm = () => {},
  ignoreCache,
}: GenericRAQIV2TabbedChartsProps<TTabKey>) => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const [activeTabKey, setActiveTabKey] = useState<TTabKey>(tabs[0].key);
  const [tabChartData, setTabChartData] = useState<
    Map<
      TTabKey,
      {
        chartState: GenericChartState;
        exporter: GenericCsvExporter;
      }
    >
  >(new Map());

  const tabSpecs = useMemo(() => {
    return tabs.map((tab) => {
      const chartData = tabChartData.get(tab.key);
      const chartState = chartData?.chartState ?? {
        isDataLoading: true,
        isUserForbidden: false,
        isResponseFailed: false,
        isNoDataAvailable: false,
      };

      return {
        key: tab.key,
        label: typeof tab.label === 'string' ? tab.label : tab.label.arbitrary,
        abnormalState: genericChartStateToChartAbnormalState({
          state: chartState,
          hasNoData: !chartState.isDataLoading && chartData?.exporter.hasEmptyData,
          translate: translationDependencies.translate,
        }),
      };
    });
  }, [tabs, tabChartData, translationDependencies.translate]);

  const { activeTab, activeTabIndex } = useMemo(() => {
    const result = tabs.findIndex((t) => t.key === activeTabKey);
    if (result === -1) {
      throw new Error(`No tab found for key: ${activeTabKey}`);
    }
    return { activeTab: tabs[result], activeTabIndex: result };
  }, [activeTabKey, tabs]);
  const activeTabMetricLabel = useMemo(
    () => getMetricLabelFromMetricLike(activeTab.spec.metric),
    [activeTab.spec.metric],
  );
  const activeTabExportMetric = useMemo(
    () => getExportLabelFromMetricLike(activeTab.spec.metric),
    [activeTab.spec.metric],
  );

  const onChartDataUpdatedCallbacks = useMemo(() => {
    return tabs.map(({ key }) => {
      return ({
        chartState,
        exporter,
      }: {
        chartState: GenericChartState;
        summaryItems: ChartSummaryItemSpec[];
        exporter: GenericCsvExporter;
      }) => {
        setTabChartData((prev) => {
          const newMap = new Map(prev);
          newMap.set(key, { chartState, exporter });
          return newMap;
        });
      };
    });
  }, [tabs]);

  const chartComponent = useMemo(() => {
    return (
      <GenericRAQIV2TimeComparatorColumnChart
        {...activeTab}
        titleKey={undefined}
        definitionTooltipKey={undefined}
        renderWithoutPeripherals
        onChartDataUpdated={onChartDataUpdatedCallbacks[activeTabIndex]}
        ignoreCache={ignoreCache}
      />
    );
  }, [activeTab, activeTabIndex, ignoreCache, onChartDataUpdatedCallbacks]);

  const onActiveTabChanged = useCallback((tabKey: string | number) => {
    setActiveTabKey(tabKey as TTabKey);
  }, []);

  const exporter = useMemo(() => {
    const activeTabChartData = tabChartData.get(activeTab.key);
    if (activeTabChartData) {
      return activeTabChartData.exporter;
    }

    // If the active tab is not loaded yet, we need to create a dummy exporter with no data
    return new TimeSeriesChartExporter(
      activeTabExportMetric,
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
  }, [
    tabChartData,
    activeTab.key,
    activeTabExportMetric,
    translationDependencies.translate,
    title,
  ]);

  const downloadAction = useDownloadAction({
    kpiType: activeTabMetricLabel,
    exporter,
  });

  const onDatePickerChange = useCallback(
    (newRanges: LabeledDateRange[]) => {
      onDateRangeConfirm(newRanges.map((timeRange) => labeledTimeRangeToTimeSpec(timeRange)));
    },
    [onDateRangeConfirm],
  );

  const datePickerComponent = useMemo(
    () =>
      dateRangeOptions ? (
        <LabeledDateRangeSelectorsContainer
          translate={translationDependencies.translate}
          labeledDateRangeOptions={dateRangeOptions}
          onChange={onDatePickerChange}
        />
      ) : undefined,
    [dateRangeOptions, onDatePickerChange, translationDependencies.translate],
  );

  return (
    <Grid item container direction='column'>
      <Grid item>
        <TabbedTimeComparatorChartsCardContainer
          titleLabel={title}
          titleTooltipLabel={definitionTooltip}
          tabSpecs={tabSpecs}
          activeTabKey={activeTabKey}
          onActiveTabChanged={onActiveTabChanged}
          subtitleComponent={datePickerComponent}
          downloadAction={downloadAction}>
          {chartComponent}
        </TabbedTimeComparatorChartsCardContainer>
      </Grid>
    </Grid>
  );
};

export default GenericRAQIV2TabbedTimeComparatorCharts;
