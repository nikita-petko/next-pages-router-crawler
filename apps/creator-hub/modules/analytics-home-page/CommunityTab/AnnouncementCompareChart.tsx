import React, { useCallback, useMemo, useState } from 'react';
import {
  ChartStyleMode,
  LineChart,
  SeriesDataTypes,
  TabbedTimeComparatorChartsCardContainer,
} from '@rbx/analytics-ui';
import type { AxisType, SingleLineSeries } from '@rbx/analytics-ui';
import { numberFormatter } from '@rbx/core';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import {
  translationKey,
  brandUntranslatableText,
} from '@modules/analytics-translations/wrapperFunctions';
import { formatDurationInDay } from '@modules/charts-generic/charts/formatters/timeFormatters';
import { useDownloadAction } from '@modules/charts-generic/charts/GenericChartExportButton';
import type { Timestamp, Value } from '@modules/charts-generic/charts/types/TimeSeriesTypes';
import {
  integerFormattingSpec,
  percentageFormattingSpec,
} from '@modules/charts-generic/constants/analyticsNumberFormattingSpec';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import { useAnnouncementNameMapFromContext } from '@modules/experience-analytics-shared/context/AnnouncementNameMapProvider';
import { useRAQIV2Client } from '@modules/experience-analytics-shared/context/RAQIV2ClientProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AnnouncementCompareChartExporter from './AnnouncementCompareChartExporter';
import type { MetricTab } from './announcementCompareUtils';
import { formatAnnouncementLabel } from './announcementCompareUtils';
import LabeledAnnouncementSelectorsContainer from './LabeledAnnouncementSelector';
import type { AnnouncementOptionRaw, CompareSeriesData } from './useAnnouncementCompareData';
import { useAnnouncementCompareData } from './useAnnouncementCompareData';

const METRIC_TABS: MetricTab[] = [
  'totalViews',
  'uniqueViews',
  'totalEngagement',
  'uniqueEngagers',
  'pushCtr',
  'streamCtr',
];

function getLabel(
  option: AnnouncementOptionRaw,
  namesMap: ReadonlyMap<string, string>,
  translate: TranslationKeyToFormattedText,
  locale: string,
): string {
  const title = namesMap.get(option.id) ?? option.id;
  return formatAnnouncementLabel(
    option.publishDate,
    option.lastActiveDate,
    title,
    translate,
    locale,
  );
}

function buildLineSeries(
  seriesData: CompareSeriesData[],
  options: AnnouncementOptionRaw[],
  namesMap: ReadonlyMap<string, string>,
  translate: TranslationKeyToFormattedText,
  locale: string,
): Array<SingleLineSeries<number, number>> {
  return seriesData.map((series) => {
    const option = options.find((o) => o.id === series.announcementId);
    const label = option ? getLabel(option, namesMap, translate, locale) : series.announcementId;
    return {
      id: series.announcementId,
      name: label,
      dataPoints: series.dataPoints,
      type: SeriesDataTypes.Normal,
    };
  });
}

const AnnouncementCompareChartInner: React.FC<{
  chartContext: RAQIV2ChartContext;
}> = ({ chartContext }) => {
  const { client } = useRAQIV2Client(true);
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate } = useTranslationWrapper(useTranslation());
  const { announcementNamesMap, addAnnouncementIds } = useAnnouncementNameMapFromContext();

  const [activeTab, setActiveTab] = useState<MetricTab>('totalViews');
  const [userSelectedIds, setUserSelectedIds] = useState<Array<string | null>>([null, null]);
  const resetSelection = useCallback(() => setUserSelectedIds([null, null]), []);

  const {
    announcementOptionIds,
    isLoadingOptions,
    optionsError,
    seriesData,
    isLoadingSeries,
    seriesError,
    effectiveSelectedIds,
    maxDayCount,
  } = useAnnouncementCompareData(
    chartContext.resource,
    client,
    userSelectedIds,
    activeTab,
    addAnnouncementIds,
    resetSelection,
  );

  const selectedOptionObjects = useMemo(
    () =>
      effectiveSelectedIds
        .map((id) => announcementOptionIds.find((o) => o.id === id))
        .filter((o): o is AnnouncementOptionRaw => o != null),
    [effectiveSelectedIds, announcementOptionIds],
  );

  const handleSelectorChange = useCallback(
    (newSelected: Array<AnnouncementOptionRaw | undefined>) => {
      setUserSelectedIds(newSelected.map((o) => o?.id ?? null));
    },
    [],
  );

  const { locale } = translationDependencies;

  const getOptionLabel = useCallback(
    (opt: AnnouncementOptionRaw) => getLabel(opt, announcementNamesMap, translate, locale),
    [announcementNamesMap, translate, locale],
  );

  const lineSeries = useMemo(
    () =>
      buildLineSeries(seriesData, announcementOptionIds, announcementNamesMap, translate, locale),
    [seriesData, announcementOptionIds, announcementNamesMap, translate, locale],
  );

  const chartData = useMemo(() => ({ series: lineSeries }), [lineSeries]);

  const xAxisTickPositions = useMemo(() => {
    if (maxDayCount <= 0) {
      return undefined;
    }
    const step = maxDayCount > 30 ? Math.ceil(maxDayCount / 15) : 1;
    return Array.from({ length: Math.ceil(maxDayCount / step) }, (_, i) => i * step + 1);
  }, [maxDayCount]);

  const xAxisFormatter = useCallback(
    ({ value }: { value: string | number }) => formatDurationInDay(value, translationDependencies),
    [translationDependencies],
  );

  const xAxisType: AxisType = useMemo(() => ({ type: 'linear' as const }), []);

  const tooltipFormatters = useMemo(
    () => ({
      formatXForPoint: (x: string | number) => formatDurationInDay(x, translationDependencies),
      formatSeriesKeyForPoint: ({ seriesName }: { seriesName: string }) => seriesName,
      formatSeriesValueForPoint: ({ y }: { y: number }) => {
        if (activeTab === 'pushCtr' || activeTab === 'streamCtr') {
          return `${numberFormatter(y, 'percent')}`;
        }
        return y.toLocaleString(locale);
      },
    }),
    [activeTab, translationDependencies, locale],
  );

  const titleLabel = translate(
    translationKey('Heading.CompareAnnouncements', TranslationNamespace.Community),
  );
  const titleTooltipLabel = translate(
    translationKey('Description.AnnouncementDataAvailability', TranslationNamespace.Community),
  );

  const metricTabLabels: Record<MetricTab, string> = useMemo(
    () => ({
      totalViews: translate(translationKey('Label.TotalViews', TranslationNamespace.Community)),
      uniqueViews: translate(translationKey('Label.UniqueViews', TranslationNamespace.Community)),
      totalEngagement: translate(
        translationKey('Label.TotalEngagement', TranslationNamespace.Community),
      ),
      uniqueEngagers: translate(
        translationKey('Label.UniqueEngagers', TranslationNamespace.Community),
      ),
      pushCtr: translate(translationKey('Label.PushCtr', TranslationNamespace.Community)),
      streamCtr: translate(translationKey('Label.StreamCtr', TranslationNamespace.Community)),
    }),
    [translate],
  );

  const activeTabLabel = metricTabLabels[activeTab];

  const exporter = useMemo(() => {
    const unit =
      activeTab === 'pushCtr' || activeTab === 'streamCtr'
        ? {
            display: brandUntranslatableText('%'),
            formattingSpec: percentageFormattingSpec,
          }
        : {
            display: brandUntranslatableText(''),
            formattingSpec: integerFormattingSpec,
          };

    const labeledSeries = lineSeries.map((s) => ({
      seriesLabel: s.name,
      series: {
        name: brandUntranslatableText(s.name),
        /* oxlint-disable @typescript-eslint/no-unsafe-type-assertion -- Branded Timestamp/Value types require cast from plain numbers */
        dataPoints: s.dataPoints.map(([dayNum, y]): [Timestamp, Value] => [
          dayNum as Timestamp,
          y as Value,
        ]),
        /* oxlint-enable @typescript-eslint/no-unsafe-type-assertion */
        breakdownValues: [],
        isTotalSeries: false,
      },
    }));

    return new AnnouncementCompareChartExporter(
      brandUntranslatableText(activeTabLabel),
      { labeledSeries, unit },
      translate,
    );
  }, [lineSeries, activeTabLabel, translate, activeTab]);

  const yAxisConfigs = useMemo(() => {
    if (activeTab === 'pushCtr' || activeTab === 'streamCtr') {
      return [
        {
          yAxisFormatter: ({ value }: { value: string | number }) => {
            const num = typeof value === 'string' ? parseFloat(value) : value;
            return `${numberFormatter(num, 'percent')}`;
          },
        },
      ];
    }
    return undefined;
  }, [activeTab]);

  const downloadAction = useDownloadAction({ kpiType: activeTabLabel, exporter });

  const onActiveTabChanged = useCallback((tabKey: string | number) => {
    const tab = METRIC_TABS.find((t) => t === tabKey);
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  const tabSpecs = useMemo(
    () =>
      METRIC_TABS.map((tabKey) => ({
        key: tabKey,
        label: metricTabLabels[tabKey],
      })),
    [metricTabLabels],
  );

  const selectorComponent = useMemo(
    () => (
      <LabeledAnnouncementSelectorsContainer
        translate={translate}
        options={announcementOptionIds}
        selectedOptions={selectedOptionObjects}
        onChange={handleSelectorChange}
        getOptionLabel={getOptionLabel}
      />
    ),
    [translate, announcementOptionIds, selectedOptionObjects, handleSelectorChange, getOptionLabel],
  );

  const hasOptions = !isLoadingOptions && announcementOptionIds.length > 0;

  return (
    <TabbedTimeComparatorChartsCardContainer
      titleLabel={titleLabel}
      titleTooltipLabel={titleTooltipLabel}
      tabSpecs={tabSpecs}
      activeTabKey={activeTab}
      onActiveTabChanged={onActiveTabChanged}
      subtitleComponent={hasOptions ? selectorComponent : undefined}
      downloadAction={hasOptions ? downloadAction : undefined}>
      {isLoadingOptions || isLoadingSeries ? (
        <EmptyGrid>
          <CircularProgress />
        </EmptyGrid>
      ) : optionsError || seriesError ? (
        <EmptyGrid>
          <span>
            {translate(
              translationKey('Message.RequestFailedTitle', TranslationNamespace.Analytics),
            )}
          </span>
        </EmptyGrid>
      ) : announcementOptionIds.length < 1 ? (
        <EmptyGrid>
          <span>
            {translate(
              translationKey('Label.AnnouncementCompareEmpty', TranslationNamespace.Community),
            )}
          </span>
        </EmptyGrid>
      ) : lineSeries.length > 0 ? (
        <div style={{ minHeight: 300 }}>
          <LineChart
            data={chartData}
            chartStyleMode={ChartStyleMode.Normal}
            xAxisFormatter={xAxisFormatter}
            xAxisType={xAxisType}
            xAxisTickPositions={xAxisTickPositions}
            tooltipFormatters={tooltipFormatters}
            yAxisConfigs={yAxisConfigs}
            height={300}
          />
        </div>
      ) : (
        <EmptyGrid>
          <span>
            {translate(translationKey('Message.NoDataReturn', TranslationNamespace.Analytics))}
          </span>
        </EmptyGrid>
      )}
    </TabbedTimeComparatorChartsCardContainer>
  );
};

export function getAnnouncementCompareChartConfig(): ArbitraryComponentConfig {
  return {
    type: AnalyticsComponentType.NonGeneric,
    metrics: [
      RAQIV2Metric.CommunityAnnouncementEventCount,
      RAQIV2Metric.CommunityAnnouncementUniqueUsers,
      RAQIV2Metric.CommunityAnnouncementNotificationCTR,
    ],
    renderer: {
      type: 'withChartContext',
      render: (chartContext) => <AnnouncementCompareChartInner chartContext={chartContext} />,
    },
  };
}
