import React, { FC, useCallback, useMemo } from 'react';
import { Divider, Toggle, Dropdown, Menu, MenuItem, MenuSection, Icon } from '@rbx/foundation-ui';
import { makeStyles } from '@rbx/ui';
import { ChartType } from '@modules/charts-generic';
import {
  translationKey,
  TranslationKey,
  useTranslationWrapper,
  type FormattedText,
} from '@modules/analytics-translations';
import {
  TExploreModeMetrics,
  useRAQIV2TranslationDependencies,
  RAQIV2ChartContext,
  getGranularityOptionsForMetric,
  getSharedGranularityOptionsForMetrics,
  useAnalyticsCurrentDateRangeBundle,
  useAnalyticsCurrentGranularityBundle,
  TUIGranularity,
  UIGranularities,
  isDurationChartMetric,
  type BenchmarkOverlayType,
  type ComputedMetric,
  type TRAQIV2NumericUIMetric,
  type ExploreModeChartType,
  type UIFilters,
  type OverlayAvailability,
  type ChartTypeMetricSupport,
  EXPLORE_MODE_TABLE,
} from '@modules/experience-analytics-shared';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { RAQIV2ChartResource, TRAQIV2BreakdownDimension } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation } from '@rbx/intl';
import ExploreModeSourceSelector from './ExploreModeSourceSelector';
import ExploreModeMetricSelector from './ExploreModeMetricSelector';
import ExploreModeChartTypeSelector from './ExploreModeChartTypeSelector';
import ExploreModeOverlaysControl, { type OverlayOption } from './ExploreModeOverlaysControl';
import ExploreModeSmoothingControl, { type SmoothingOption } from './ExploreModeSmoothingControl';
import ExploreModeEquationBuilder, {
  type SourceFilterDimensionsByMetric,
} from './ExploreModeEquationBuilder';
import type { ExploreModeMetricSourceFilterDrawerConfig } from './ExploreModeMetricSourceCard';
import ExploreModeCustomEventControls from './ExploreModeCustomEventControls';
import { customEventsMetric } from './useExploreModeSourceSelection';
import ExploreModeBreakdownControl from './components/ExploreModeBreakdownControl';

const isChartTypeCumulativeCompatible = (type: ExploreModeChartType) =>
  type === ChartType.Bar ||
  type === ChartType.Pie ||
  type === ChartType.DurationSpline ||
  type === ChartType.DurationArea ||
  type === EXPLORE_MODE_TABLE;

const useStyles = makeStyles()(() => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    flex: '0 1 350px',
    maxWidth: '350px',
    minWidth: '260px',
    padding: '12px 0',
    borderRight: '1px solid var(--stroke-default)',
    overflowY: 'auto',
    height: '100%',
    boxSizing: 'border-box',
  },
  rootSheet: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    paddingBottom: '24px',
  },
  sectionHeading: {
    fontSize: '14px',
    fontWeight: 700,
    lineHeight: '20px',
    margin: 0,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
}));

type SidebarGranularityOption = {
  granularity: TUIGranularity;
  isAllowed: boolean;
  messageKey?: TranslationKey;
};

type ExploreModeSidebarBaseProps = {
  variant?: 'inline' | 'sheet';
  metric: TExploreModeMetrics | null;
  setMetric: (metric: TExploreModeMetrics | null) => void;
  computedMetric: ComputedMetric<TRAQIV2NumericUIMetric> | null;
  setComputedMetric: (cm: ComputedMetric<TRAQIV2NumericUIMetric> | null) => void;
  availableMetrics: TExploreModeMetrics[];
  constraintMetrics: readonly TExploreModeMetrics[];
  sourceFilter: TranslationKey | null;
  filteredMetrics: TExploreModeMetrics[];
  onSourceChange: (source: TranslationKey | null) => void;
  chartType: ExploreModeChartType;
  onChartTypeChange: (chartType: ExploreModeChartType) => void;
  onChartTypeWithGranularityChange: (
    chartType: ExploreModeChartType,
    granularity: TUIGranularity,
  ) => void;
  overlayOption: OverlayOption;
  onOverlayChange: (option: OverlayOption) => void;
  benchmarkType: BenchmarkOverlayType | null;
  onBenchmarkTypeChange: (benchmarkType: BenchmarkOverlayType | null) => void;
  availableBenchmarkTypes?: readonly BenchmarkOverlayType[];
  smoothingOption: SmoothingOption;
  onSmoothingChange: (option: SmoothingOption) => void;
  overlayAvailability: OverlayAvailability;
  chartContext: RAQIV2ChartContext;
  isComputedMetricsFeatureEnabled: boolean;
  operationsEnabled: boolean;
  onOperationsEnabledChange: (enabled: boolean) => void;
  showChartTypeSelector: boolean;
  availableChartTypes: readonly ExploreModeChartType[];
  supportedChartTypes: readonly ExploreModeChartType[];
  chartTypeSupport: Record<ExploreModeChartType, ChartTypeMetricSupport>;
  showSmoothingControl?: boolean;
  sourceFilterResource?: ExploreModeMetricSourceFilterDrawerConfig['resource'];
  sourceFilterDimensionsByMetric?: SourceFilterDimensionsByMetric;
  breakdownDimensions: readonly TRAQIV2BreakdownDimension[];
  breakdown: readonly TRAQIV2BreakdownDimension[];
  onBreakdownChange: (nextBreakdown: TRAQIV2BreakdownDimension[]) => void;
  noBreakdownLabel: FormattedText;
  getBreakdownLabel: (dimension: TRAQIV2BreakdownDimension) => FormattedText;
};

type ExploreModeSidebarProps = ExploreModeSidebarBaseProps &
  (
    | {
        isCustomEventsMode: true;
        customEventResource: RAQIV2ChartResource;
        filters: UIFilters;
        onFiltersChange: (filters: UIFilters) => void;
      }
    | {
        isCustomEventsMode: false;
        customEventResource?: never;
        filters?: never;
        onFiltersChange?: never;
      }
  );

const ExploreModeSidebar: FC<ExploreModeSidebarProps> = ({
  variant = 'inline',
  metric,
  setMetric,
  computedMetric,
  setComputedMetric,
  availableMetrics,
  constraintMetrics,
  sourceFilter,
  isCustomEventsMode,
  filteredMetrics,
  onSourceChange,
  chartType,
  onChartTypeChange,
  onChartTypeWithGranularityChange,
  overlayOption,
  onOverlayChange,
  benchmarkType,
  onBenchmarkTypeChange,
  availableBenchmarkTypes = [],
  smoothingOption,
  onSmoothingChange,
  overlayAvailability,
  chartContext,
  isComputedMetricsFeatureEnabled,
  operationsEnabled,
  onOperationsEnabledChange,
  showChartTypeSelector,
  availableChartTypes,
  supportedChartTypes,
  chartTypeSupport,
  showSmoothingControl = true,
  sourceFilterResource,
  sourceFilterDimensionsByMetric,
  customEventResource,
  filters,
  onFiltersChange,
  breakdownDimensions,
  breakdown,
  onBreakdownChange,
  noBreakdownLabel,
  getBreakdownLabel,
}) => {
  const {
    classes: { root, rootSheet, sectionHeading, section },
  } = useStyles();

  const { translate } = useRAQIV2TranslationDependencies();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const configureChartLabel = tPendingTranslation(
    'Configure chart',
    'Heading for the sidebar section where users configure chart settings.',
    translationKey('Heading.ExploreMode.ConfigureChart', TranslationNamespace.Analytics),
  );
  const useOperationsLabel = tPendingTranslation(
    'Use operations',
    'Toggle label to enable computed metric operations in the chart configuration.',
    translationKey('Label.ExploreMode.UseOperations', TranslationNamespace.Analytics),
  );
  const timeIntervalLabel = tPendingTranslation(
    'Time interval',
    'Label for the time interval dropdown in the chart configuration.',
    translationKey('Label.ExploreMode.TimeInterval', TranslationNamespace.Analytics),
  );
  const selectIntervalLabel = tPendingTranslation(
    'Select interval',
    'Placeholder text in the time interval dropdown before a value is selected.',
    translationKey('Placeholder.ExploreMode.SelectInterval', TranslationNamespace.Analytics),
  );
  const breakdownByLabel = translate(
    translationKey('Label.Control.Breakdown', TranslationNamespace.Analytics),
  );
  const selectBreakdownLabel = translate(
    translationKey('Placeholder.ExploreMode.SelectBreakdown', TranslationNamespace.Analytics),
  );
  const granularityLabels = useMemo(
    () => ({
      [RAQIV2MetricGranularity.OneMonth]: tPendingTranslation(
        'Months',
        'Time granularity option for monthly data aggregation.',
        translationKey('Label.ExploreMode.Granularity.Monthly', TranslationNamespace.Analytics),
      ),
      [RAQIV2MetricGranularity.OneWeek]: tPendingTranslation(
        'Weeks',
        'Time granularity option for weekly data aggregation.',
        translationKey('Label.ExploreMode.Granularity.Weekly', TranslationNamespace.Analytics),
      ),
      [RAQIV2MetricGranularity.OneDay]: tPendingTranslation(
        'Days',
        'Time granularity option for daily data aggregation.',
        translationKey('Label.ExploreMode.Granularity.Days', TranslationNamespace.Analytics),
      ),
      [RAQIV2MetricGranularity.OneHour]: tPendingTranslation(
        'Hours',
        'Time granularity option for hourly data aggregation.',
        translationKey('Label.ExploreMode.Granularity.Hourly', TranslationNamespace.Analytics),
      ),
      [RAQIV2MetricGranularity.HalfHour]: tPendingTranslation(
        '30-minutes',
        'Time granularity option for 30-minute interval data aggregation.',
        translationKey(
          'Label.ExploreMode.Granularity.ThirtyMinutely',
          TranslationNamespace.Analytics,
        ),
      ),
      [RAQIV2MetricGranularity.OneMinute]: tPendingTranslation(
        'Minutes',
        'Time granularity option for per-minute data aggregation.',
        translationKey('Label.ExploreMode.Granularity.Minutely', TranslationNamespace.Analytics),
      ),
      [RAQIV2MetricGranularity.None]: tPendingTranslation(
        'Cumulative',
        'Time granularity option for cumulative (non-time-series) data aggregation.',
        translationKey('Label.ExploreMode.Granularity.Cumulative', TranslationNamespace.Analytics),
      ),
    }),
    [tPendingTranslation],
  );

  const dateTimeBundle = useAnalyticsCurrentDateRangeBundle();
  const { onChangeGranularity } = useAnalyticsCurrentGranularityBundle();
  const metricsForGranularity = useMemo<readonly TExploreModeMetrics[]>(() => {
    if (constraintMetrics.length > 0) {
      return constraintMetrics;
    }
    return metric ? [metric] : [];
  }, [constraintMetrics, metric]);
  const granularityOptions = useMemo<SidebarGranularityOption[]>(() => {
    if (metricsForGranularity.length === 0) {
      return [];
    }
    if (metricsForGranularity.length === 1) {
      return getGranularityOptionsForMetric({
        metric: metricsForGranularity[0],
        startDate: dateTimeBundle.startDate,
        endDate: dateTimeBundle.endDate,
        breakdown: chartContext.breakdown,
      });
    }
    const sharedGranularities = getSharedGranularityOptionsForMetrics({
      metrics: metricsForGranularity,
      startDate: dateTimeBundle.startDate,
      endDate: dateTimeBundle.endDate,
      breakdown: chartContext.breakdown,
    });
    const result: SidebarGranularityOption[] = sharedGranularities.map((granularity) => ({
      granularity,
      isAllowed: true,
    }));
    if (
      isValidArrayEnumValue(UIGranularities, chartContext.granularity) &&
      !sharedGranularities.includes(chartContext.granularity)
    ) {
      result.push({
        granularity: chartContext.granularity,
        isAllowed: false,
        messageKey: translationKey(
          'Description.UnsupportedGranularity',
          TranslationNamespace.Analytics,
        ),
      });
    }
    return result;
  }, [
    chartContext.breakdown,
    chartContext.granularity,
    dateTimeBundle.endDate,
    dateTimeBundle.startDate,
    metricsForGranularity,
  ]);

  const hasEnabledGranularityOptions = granularityOptions.some((option) => option.isAllowed);

  const handleGranularityChange = useCallback(
    (value: string) => {
      if (isValidArrayEnumValue(UIGranularities, value)) {
        if (value === RAQIV2MetricGranularity.None) {
          onChartTypeWithGranularityChange(ChartType.Bar, value);
        } else if (chartContext.granularity === RAQIV2MetricGranularity.None) {
          onChartTypeWithGranularityChange(ChartType.Spline, value);
        } else {
          onChangeGranularity(value);
        }
      }
    },
    [onChangeGranularity, chartContext.granularity, onChartTypeWithGranularityChange],
  );

  const handleChartTypeChange = useCallback(
    (newChartType: ExploreModeChartType) => {
      const isCumulative = chartContext.granularity === RAQIV2MetricGranularity.None;
      const newIsCumulativeCompatible = isChartTypeCumulativeCompatible(newChartType);

      if (isCumulative && !newIsCumulativeCompatible) {
        const firstAllowed = granularityOptions.find(
          (opt) => opt.isAllowed && opt.granularity !== RAQIV2MetricGranularity.None,
        );
        if (firstAllowed) {
          onChartTypeWithGranularityChange(newChartType, firstAllowed.granularity);
        } else {
          // do nothing
        }
      } else if (
        !isCumulative &&
        newIsCumulativeCompatible &&
        newChartType !== EXPLORE_MODE_TABLE
      ) {
        onChartTypeWithGranularityChange(newChartType, RAQIV2MetricGranularity.None);
      } else {
        onChartTypeChange(newChartType);
      }
    },
    [
      onChartTypeChange,
      onChartTypeWithGranularityChange,
      chartContext.granularity,
      granularityOptions,
    ],
  );

  const handleToggleOperations = useCallback(
    (checked: boolean) => {
      onOperationsEnabledChange(checked);
      if (!checked) {
        setComputedMetric(null);
      }
    },
    [onOperationsEnabledChange, setComputedMetric],
  );

  const equationBuilderMetrics = useMemo(
    () => availableMetrics.filter((m) => !isDurationChartMetric(m)),
    [availableMetrics],
  );
  const equationBuilderDefaultMetric = metric && !isDurationChartMetric(metric) ? metric : null;

  return (
    <div className={variant === 'sheet' ? rootSheet : root}>
      {variant === 'inline' && <h2 className={sectionHeading}>{configureChartLabel}</h2>}

      <div className={section}>
        {isComputedMetricsFeatureEnabled && (
          <Toggle
            label={useOperationsLabel}
            size='Medium'
            isChecked={operationsEnabled}
            onCheckedChange={handleToggleOperations}
            placement='Start'
          />
        )}

        {!operationsEnabled && (
          <React.Fragment>
            <ExploreModeSourceSelector
              value={sourceFilter}
              onChange={onSourceChange}
              availableMetrics={availableMetrics}
            />

            {isCustomEventsMode ? (
              <ExploreModeCustomEventControls
                resource={customEventResource}
                metric={customEventsMetric}
                filters={filters}
                onFiltersChange={onFiltersChange}
              />
            ) : (
              <ExploreModeMetricSelector
                options={filteredMetrics}
                value={metric}
                onChange={setMetric}
                showCategoryLabels={!sourceFilter}
              />
            )}
          </React.Fragment>
        )}

        {operationsEnabled && isComputedMetricsFeatureEnabled && (
          <ExploreModeEquationBuilder
            availableMetrics={equationBuilderMetrics}
            defaultMetric={equationBuilderDefaultMetric}
            sourceFilterResource={sourceFilterResource}
            sourceFilterDimensionsByMetric={sourceFilterDimensionsByMetric}
            onComputedMetricChange={setComputedMetric}
            initialComputedMetric={computedMetric}
          />
        )}
      </div>

      <Divider variant='Standard' />

      <div className={section}>
        {hasEnabledGranularityOptions && (
          <Dropdown
            label={timeIntervalLabel}
            size='Medium'
            placeholder={selectIntervalLabel}
            value={chartContext.granularity}
            onValueChange={handleGranularityChange}>
            <Menu>
              <MenuSection>
                {granularityOptions.map(({ granularity, ...option }) => (
                  <MenuItem
                    key={granularity}
                    value={granularity}
                    title={granularityLabels[granularity] ?? granularity}
                    disabled={!option.isAllowed}
                    description={
                      !option.isAllowed && option.messageKey
                        ? translate(option.messageKey)
                        : undefined
                    }
                    trailing={
                      chartContext.granularity === granularity ? (
                        <Icon name='icon-filled-check' size='Medium' />
                      ) : undefined
                    }
                  />
                ))}
              </MenuSection>
            </Menu>
          </Dropdown>
        )}

        <ExploreModeBreakdownControl
          label={breakdownByLabel}
          placeholder={selectBreakdownLabel}
          breakdown={breakdown}
          breakdownDimensions={breakdownDimensions}
          noBreakdownLabel={noBreakdownLabel}
          onBreakdownChange={onBreakdownChange}
          getBreakdownLabel={getBreakdownLabel}
        />

        {showChartTypeSelector && (
          <ExploreModeChartTypeSelector
            value={chartType}
            onChange={handleChartTypeChange}
            availableTypes={availableChartTypes}
            supportedTypes={supportedChartTypes}
            chartTypeSupport={chartTypeSupport}
          />
        )}

        <ExploreModeOverlaysControl
          value={overlayOption}
          onChange={onOverlayChange}
          benchmarkType={benchmarkType}
          onBenchmarkTypeChange={onBenchmarkTypeChange}
          availableBenchmarkTypes={availableBenchmarkTypes}
          availability={overlayAvailability}
        />

        {showSmoothingControl && (
          <ExploreModeSmoothingControl value={smoothingOption} onChange={onSmoothingChange} />
        )}
      </div>
    </div>
  );
};

export default ExploreModeSidebar;
