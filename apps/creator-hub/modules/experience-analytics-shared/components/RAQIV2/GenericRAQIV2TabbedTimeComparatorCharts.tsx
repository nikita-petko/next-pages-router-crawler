import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { TabbedTimeComparatorChartsCardContainer } from '@rbx/analytics-ui';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import { Grid } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import { brandUntranslatableText } from '@modules/analytics-translations/wrapperFunctions';
import type { ChartSummaryItemSpec } from '@modules/charts-generic/charts/ChartSummaryItem';
import type GenericCsvExporter from '@modules/charts-generic/charts/exporters/GenericCsvExporter';
import TimeSeriesChartExporter from '@modules/charts-generic/charts/exporters/TimeSeriesChartExporter';
import { useDownloadAction } from '@modules/charts-generic/charts/GenericChartExportButton';
import type {
  GenericChartState,
  TLabeledExplicitTimeRangeSpec,
} from '@modules/charts-generic/charts/types/ChartTypes';
import {
  ChartUnit,
  ChartUnitAggregationType,
} from '@modules/charts-generic/charts/types/ChartTypes';
import type { NonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import type { GenericRAQIV2TimeComparatorChartProps } from '../../types/GenericRAQIV2ChartProps';
import type { LabeledDateRange } from '../../types/LabeledDateRange';
import { getMetricLabelFromMetricLike } from '../../utils/metricLikeSemantics';
import LabeledDateRangeSelectorsContainer from '../LabeledDateRangeSelector/LabeledDateRangeSelectorsContainer';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import GenericRAQIV2TimeComparatorColumnChart from './GenericRAQIV2TimeComparatorColumnChart';
import useMetricOwnershipWatermarkSlots from './useMetricOwnershipWatermarkSlots';

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
      rangeType: RAQIV2DateRangeType.Custom,
    },
    label: timeRange.label,
  };
};

const NOOP_ON_DATE_RANGE_CONFIRM = () => {};

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
  onDateRangeConfirm = NOOP_ON_DATE_RANGE_CONFIRM,
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
          tPendingTranslation: translationDependencies.tPendingTranslation,
        }),
      };
    });
  }, [
    tabs,
    tabChartData,
    translationDependencies.translate,
    translationDependencies.tPendingTranslation,
  ]);

  const { activeTab, activeTabIndex } = useMemo(() => {
    const result = tabs.findIndex((t) => t.key === activeTabKey);
    if (result === -1) {
      throw new Error(`No tab found for key: ${activeTabKey}`);
    }
    return { activeTab: tabs[result], activeTabIndex: result };
  }, [activeTabKey, tabs]);
  const activeTabMetricLabel = useMemo(
    () => getMetricLabelFromMetricLike(activeTab.spec.metric, translationDependencies),
    [activeTab.spec.metric, translationDependencies],
  );
  const ownershipWatermarkSlots = useMetricOwnershipWatermarkSlots(activeTab.spec);

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
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Tab callbacks only receive keys from this component's TTabKey-backed tab list.
    setActiveTabKey(tabKey as TTabKey);
  }, []);

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
          display: brandUntranslatableText(''),
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
          downloadAction={downloadAction}
          slots={ownershipWatermarkSlots}>
          {chartComponent}
        </TabbedTimeComparatorChartsCardContainer>
      </Grid>
    </Grid>
  );
};

export default GenericRAQIV2TabbedTimeComparatorCharts;
