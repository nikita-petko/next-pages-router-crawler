import { LineChart, SeriesDataTypes, XAxisGranularity } from '@rbx/analytics-ui';
import type { LineChartZones } from '@rbx/analytics-ui';
import { ProgressCircle, Tabs, TabsList, TabsTrigger } from '@rbx/foundation-ui';
import { useLocalization } from '@rbx/intl';
import { FormControl, MenuItem, Select, Typography } from '@rbx/ui';
import { ChangeEvent, useCallback, useMemo, useState } from 'react';

import useCampaignReportingChartsStyles from '@components/reporting/CampaignReportingCharts.styles';
import {
  DATE_FILTERING_TIME_PERIOD_OPTIONS,
  IsValidDateFilteringTimePeriod,
} from '@constants/dateFilteringTimePeriod';
import { UNAVAILABLE_VALUE_DISPLAY } from '@constants/displayConstants';
import { TranslationNamespace } from '@constants/localization';
import { getAttributionWindow } from '@constants/reportingViewType';
import { MS_PER_DAY } from '@constants/time';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { CampaignTimeSeriesDataPoints } from '@type/timeSeries';
import {
  formatTimestampLabel,
  getRoasMetric,
  makePercentValueFormatter,
  makePlaysValueFormatter,
  MetricValueFormatter,
  sumPlaysFromTimeSeries,
} from '@utils/reportingChartFormatters';
import { getAdvertiserTimezoneDbName } from '@utils/timezone';

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

  const timezoneDbName = useAppStore((state: AppStoreType) =>
    getAdvertiserTimezoneDbName(state.advertiserState?.data?.organization?.time_zone),
  );

  const [activeMetricTab, setActiveMetricTab] = useState<MetricTab>('plays');

  const formatTimestamp = useCallback(
    (ts: number | string) => formatTimestampLabel(ts, locale, timezoneDbName),
    [locale, timezoneDbName],
  );
  const formatPlaysValue = useMemo(() => makePlaysValueFormatter(locale), [locale]);
  const formatPercentValue = useMemo(() => makePercentValueFormatter(locale), [locale]);

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

  const zoneLegendItemFormatter = (type: SeriesDataTypes) =>
    type === SeriesDataTypes.Projection
      ? translateReport('Label.Unvalidated')
      : translateReport('Label.Validated');

  const handlePeriodChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newPeriod = Number(event.target.value);
    if (!IsValidDateFilteringTimePeriod(newPeriod) || newPeriod === timeSeriesPeriod) {
      return;
    }
    fetchCampaignTimeSeries(newPeriod);
  };

  const handleMetricTabChange = (newTab: string) => {
    setActiveMetricTab(newTab as MetricTab);
  };

  // Only recomputes when the underlying time-series data reference changes.
  // spend/revenue are only present when the ROAS feature is enabled.
  const roasDataPoints = useMemo(
    () =>
      timeSeriesState.data?.spend && timeSeriesState.data?.revenue
        ? getRoasMetric(timeSeriesState.data.spend, timeSeriesState.data.revenue)
        : undefined,
    [timeSeriesState.data],
  );

  const totalPlays = useMemo(
    () => sumPlaysFromTimeSeries(timeSeriesState.data?.plays),
    [timeSeriesState.data],
  );

  const playsScorecardDisplayValue = useMemo(() => {
    if (timeSeriesState.isLoading || timeSeriesState.isError || totalPlays === undefined) {
      return UNAVAILABLE_VALUE_DISPLAY;
    }

    return formatPlaysValue(totalPlays);
  }, [formatPlaysValue, timeSeriesState.isError, timeSeriesState.isLoading, totalPlays]);

  const playsTabLabel = (
    <span className={classes.metricDisplay} data-testid='plays-metric'>
      <Typography component='span' variant='body2'>
        {translateForecast('Label.TotalPlays')}
      </Typography>
      {timeSeriesState.isLoading ? (
        <ProgressCircle
          ariaLabel={translateMisc('Label.Loading')}
          className={classes.metricValue}
          size='Small'
          variant='Indeterminate'
        />
      ) : (
        <Typography className={classes.metricValue} component='span' variant='h6'>
          {playsScorecardDisplayValue}
        </Typography>
      )}
    </span>
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
        <Typography className={classes.errorText} variant='body2'>
          {translateReport('Description.GenericFetchError')}
        </Typography>
      );
    }

    if (activeMetricTab === 'roas' && !roasDataPoints) {
      return (
        <Typography className={classes.errorText} variant='body2'>
          {translateReport('Description.NoRoasData')}
        </Typography>
      );
    }

    const isRoas = activeMetricTab === 'roas';
    return (
      <MetricChart
        attributionWindowDays={attributionWindowDays}
        dataPoints={isRoas ? roasDataPoints! : timeSeriesState.data.plays}
        formatTimestamp={formatTimestamp}
        formatValue={isRoas ? formatPercentValue : formatPlaysValue}
        seriesName={isRoas ? translateReport('Label.ROAS') : translateCampaign('Label.Plays')}
        zoneLegendItemFormatter={zoneLegendItemFormatter}
      />
    );
  };

  return (
    <div className={classes.container} data-testid='campaign-reporting-charts'>
      <div className={classes.titleRow}>
        <Typography variant='h6'>
          {translateCreatorDashboardNavigation('Heading.Performance')}
        </Typography>
      </div>
      <div className={classes.controlsRow}>
        <div className={classes.controlsLeft}>
          <Tabs onValueChange={handleMetricTabChange} size='Small' value={activeMetricTab}>
            <TabsList>
              <TabsTrigger
                aria-label={translateCampaign('Label.Plays')}
                className={classes.metricTab}
                value='plays'>
                {playsTabLabel}
              </TabsTrigger>
              {isCampaignRoasEnabled && (
                <TabsTrigger className={classes.metricTab} value='roas'>
                  {translateReport('Label.ROAS')}
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>
        <FormControl className={classes.periodSelect} variant='outlined'>
          <Select
            disabled={timeSeriesState.isLoading}
            inputProps={{ name: 'campaignPerformancePeriod' }}
            label={translateReport('Label.DateRange')}
            onChange={handlePeriodChange}
            // Render the dropdown inside the Sheet (Radix Dialog) rather than
            // portaling to <body>, which is inert while the Sheet is open and
            // would treat a dropdown click as an outside dismiss.
            SelectProps={{ MenuProps: { disablePortal: true } }}
            size='small'
            value={timeSeriesPeriod}
            variant='outlined'>
            {DATE_FILTERING_TIME_PERIOD_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {translateReport(option.labelKey)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      <div className={classes.chartWrapper}>{renderChartContent()}</div>
    </div>
  );
};

export default CampaignReportingCharts;
