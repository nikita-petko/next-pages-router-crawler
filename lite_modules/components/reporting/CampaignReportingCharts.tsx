import { LineChart, SeriesDataTypes, XAxisGranularity } from '@rbx/analytics-ui';
import type { LineChartZones } from '@rbx/analytics-ui';
import {
  Dropdown,
  Menu,
  MenuItem,
  MenuSection,
  ProgressCircle,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@rbx/foundation-ui';
import { useLocalization } from '@rbx/intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import useCampaignReportingChartsStyles from '@components/reporting/CampaignReportingCharts.styles';
import DateFilteringTimePeriod, {
  DATE_FILTERING_TIME_PERIOD_OPTIONS,
  IsValidDateFilteringTimePeriod,
} from '@constants/dateFilteringTimePeriod';
import { UNAVAILABLE_VALUE_DISPLAY } from '@constants/displayConstants';
import { TranslationNamespace } from '@constants/localization';
import { REPORTING_TIMEZONE_DB_NAME } from '@constants/reportingStatsConstants';
import ReportingViewType, { getAttributionWindow } from '@constants/reportingViewType';
import { MS_PER_DAY } from '@constants/time';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { CampaignTimeSeriesDataPoints } from '@type/timeSeries';
import {
  formatTimestampLabel,
  makePlaysValueFormatter,
  makeRoasValueFormatter,
  MetricValueFormatter,
  sumPlaysFromTimeSeries,
} from '@utils/reportingChartFormatters';

type MetricTab = 'plays' | 'roas';

const CHART_HEIGHT_PX = 240;

interface MetricChartProps {
  attributionWindowDays: number;
  dataPoints: CampaignTimeSeriesDataPoints;
  formatTimestamp: (ts: number | string) => string;
  formatValue: MetricValueFormatter;
  seriesName: string;
  zoneLegendItemFormatter: (type: SeriesDataTypes) => string;
}

const MetricChart = ({
  attributionWindowDays,
  dataPoints,
  formatTimestamp,
  formatValue,
  seriesName,
  zoneLegendItemFormatter,
}: MetricChartProps) => {
  // Dashed "pending attribution" zone anchored to the last data point.
  const lastTs = dataPoints.at(-1)?.[0];
  const zones: LineChartZones =
    lastTs === undefined
      ? []
      : [
          {
            end: null,
            start: lastTs - attributionWindowDays * MS_PER_DAY,
            type: SeriesDataTypes.Projection,
          },
        ];
  return (
    <LineChart
      data={{
        series: [{ dataPoints, name: seriesName, type: SeriesDataTypes.Normal, zones }],
      }}
      height={CHART_HEIGHT_PX}
      tooltipFormatters={{
        formatSeriesKeyForPoint: ({ x }) => formatTimestamp(x),
        formatSeriesValueForPoint: ({ y }) => formatValue(y),
        formatXForPoint: formatTimestamp,
      }}
      xAxisFormatter={({ value }) => formatTimestamp(value)}
      xAxisType={{ granularity: XAxisGranularity.Day, type: 'datetime' }}
      yAxisConfigs={[
        {
          yAxisFormatter: ({ value }) => (typeof value === 'number' ? formatValue(value) : value),
        },
      ]}
      zoneLegendItemFormatter={zoneLegendItemFormatter}
    />
  );
};

const CampaignReportingCharts = () => {
  const { translate: translateForecast } = useNamespacedTranslation(TranslationNamespace.Forecast);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateCreatorDashboardNavigation } = useNamespacedTranslation(
    TranslationNamespace.CreatorDashboardNavigation,
  );
  const { locale } = useLocalization();
  const { classes } = useCampaignReportingChartsStyles();

  const isCampaignRoasEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isCampaignRoasEnabled ?? false,
  );
  // Under the custom-range flag the drawer chart is driven entirely by the
  // page-level date selection (the store already re-fetches it on page-level
  // date changes and on drawer open), so the drawer's own picker is redundant
  // and is hidden to prevent divergence.
  const isCustomDateRangeEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isCustomDateRangeEnabled ?? false,
  );

  const [activeMetricTab, setActiveMetricTab] = useState<MetricTab>('plays');

  const formatTimestamp = useCallback(
    (ts: number | string) => formatTimestampLabel(ts, locale, REPORTING_TIMEZONE_DB_NAME),
    [locale],
  );
  const formatPlaysValue = useMemo(() => makePlaysValueFormatter(locale), [locale]);
  const formatRoasValue = useMemo(() => makeRoasValueFormatter(locale), [locale]);

  const { timeSeriesPeriod, timeSeriesState } = useNewFlowStore(
    (state: NewFlowStoreType) => state.campaignDetailsState,
  );
  const reportingViewType = useNewFlowStore(
    (state: NewFlowStoreType) => state.reportingViewState.currentSelection,
  );
  const fetchCampaignTimeSeries = useNewFlowStore(
    (state: NewFlowStoreType) => state.fetchCampaignTimeSeries,
  );

  const attributionWindowDays = getAttributionWindow(reportingViewType);
  const canShowRoas =
    isCampaignRoasEnabled && reportingViewType === ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT;

  useEffect(() => {
    if (!canShowRoas && activeMetricTab === 'roas') {
      setActiveMetricTab('plays');
    }
  }, [activeMetricTab, canShowRoas]);

  // Trailing-30d zone previously flagged the window as "Unvalidated" (i.e. no
  // data yet). The chart is now blended with ML-produced estimates for that
  // window (see getCampaignTimeSeriesService `mergeRoasPreferValidated`), so
  // relabel to communicate that dashed segment = estimated, solid = final.
  const zoneLegendItemFormatter = (type: SeriesDataTypes) =>
    type === SeriesDataTypes.Projection
      ? translateReport('Label.Estimated')
      : translateReport('Label.Validated');

  const handlePeriodChange = (nextValue: string) => {
    const newPeriod = Number(nextValue);
    if (!IsValidDateFilteringTimePeriod(newPeriod) || newPeriod === timeSeriesPeriod) {
      return;
    }
    fetchCampaignTimeSeries(newPeriod);
  };

  // Custom is not one of the presets, but the page-level picker can leave the drawer
  // on it. It is appended only then, so the trigger has a label to show instead of
  // collapsing to the empty placeholder.
  const periodMenuItems = [
    ...DATE_FILTERING_TIME_PERIOD_OPTIONS.map((option) => (
      <MenuItem
        key={option.value}
        title={translateReport(option.labelKey)}
        value={String(option.value)}
      />
    )),
    ...(timeSeriesPeriod === DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM
      ? [
          <MenuItem
            key={DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM}
            title={translateReport('Label.Custom')}
            value={String(DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM)}
          />,
        ]
      : []),
  ];

  const handleMetricTabChange = (newTab: string) => {
    setActiveMetricTab(newTab as MetricTab);
  };

  const roasDataPoints = timeSeriesState.data?.roas;

  const totalPlays = useMemo(
    () => sumPlaysFromTimeSeries(timeSeriesState.data?.plays),
    [timeSeriesState.data],
  );

  const totalRoas = timeSeriesState.data?.totalRoas;

  const playsScorecardDisplayValue = useMemo(() => {
    if (timeSeriesState.isLoading || timeSeriesState.isError || totalPlays === undefined) {
      return UNAVAILABLE_VALUE_DISPLAY;
    }

    return formatPlaysValue(totalPlays);
  }, [formatPlaysValue, timeSeriesState.isError, timeSeriesState.isLoading, totalPlays]);

  const roasScorecardDisplayValue = useMemo(() => {
    if (timeSeriesState.isLoading || timeSeriesState.isError || totalRoas === undefined) {
      return UNAVAILABLE_VALUE_DISPLAY;
    }

    return formatRoasValue(totalRoas);
  }, [formatRoasValue, timeSeriesState.isError, timeSeriesState.isLoading, totalRoas]);

  const renderMetricTabLabel = (label: string, displayValue: string, testId: string) => (
    <span className={classes.metricDisplay} data-testid={testId}>
      <span className='text-body-medium'>{label}</span>
      {timeSeriesState.isLoading ? (
        <ProgressCircle
          ariaLabel={translateMisc('Label.Loading')}
          className={classes.metricValue}
          size='Small'
          variant='Indeterminate'
        />
      ) : (
        <span className={`text-title-large ${classes.metricValue}`}>{displayValue}</span>
      )}
    </span>
  );

  const playsTabLabel = renderMetricTabLabel(
    translateForecast('Label.TotalPlays'),
    playsScorecardDisplayValue,
    'plays-metric',
  );

  const roasTabLabel = renderMetricTabLabel(
    translateReport('Label.ROAS'),
    roasScorecardDisplayValue,
    'roas-metric',
  );

  const renderChartContent = () => {
    if (timeSeriesState.isLoading) {
      return (
        <ProgressCircle
          ariaLabel={translateMisc('Label.Loading')}
          size='Medium'
          variant='Indeterminate'
        />
      );
    }

    if (timeSeriesState.isError || !timeSeriesState.data) {
      return (
        <span className={`text-body-medium ${classes.errorText}`}>
          {translateReport('Description.GenericFetchError')}
        </span>
      );
    }

    if (activeMetricTab === 'roas' && !roasDataPoints) {
      return (
        <span className={`text-body-medium ${classes.errorText}`}>
          {translateReport('Description.NoRoasData')}
        </span>
      );
    }

    const isRoas = activeMetricTab === 'roas';
    return (
      <MetricChart
        attributionWindowDays={attributionWindowDays}
        dataPoints={isRoas ? roasDataPoints! : timeSeriesState.data.plays}
        formatTimestamp={formatTimestamp}
        formatValue={isRoas ? formatRoasValue : formatPlaysValue}
        seriesName={isRoas ? translateReport('Label.ROAS') : translateCampaign('Label.Plays')}
        zoneLegendItemFormatter={zoneLegendItemFormatter}
      />
    );
  };

  return (
    <div className={classes.container} data-testid='campaign-reporting-charts'>
      <div className={classes.titleRow}>
        <span className='text-title-large'>
          {translateCreatorDashboardNavigation('Heading.Performance')}
        </span>
      </div>
      <div className={classes.controlsRow}>
        <div className={classes.controlsLeft}>
          <Tabs onValueChange={handleMetricTabChange} size='Small' value={activeMetricTab}>
            <TabsList className={classes.metricTabList}>
              <TabsTrigger
                aria-label={translateCampaign('Label.Plays')}
                className={classes.metricTab}
                value='plays'>
                {playsTabLabel}
              </TabsTrigger>
              {canShowRoas && (
                <TabsTrigger
                  aria-label={translateReport('Label.ROAS')}
                  className={classes.metricTab}
                  value='roas'>
                  {roasTabLabel}
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>
        {!isCustomDateRangeEnabled && (
          <Dropdown
            className={classes.periodSelect}
            isDisabled={timeSeriesState.isLoading}
            label={translateReport('Label.DateRange')}
            onValueChange={handlePeriodChange}
            placeholder=''
            size='Small'
            value={String(timeSeriesPeriod)}>
            <Menu>
              <MenuSection>{periodMenuItems}</MenuSection>
            </Menu>
          </Dropdown>
        )}
      </div>
      <div className={classes.chartWrapper}>{renderChartContent()}</div>
    </div>
  );
};

export default CampaignReportingCharts;
