import type { FC } from 'react';
import React, { memo, useMemo } from 'react';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import {
  Divider,
  Toggle,
  Dropdown,
  Menu,
  MenuItem,
  MenuSection,
  Icon,
  IconButton,
  TextInput,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { makeStyles } from '@rbx/ui';
import type { TranslationKey, FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { BenchmarkOverlayType } from '../../hooks/useAnalyticsBenchmarks';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartContext from '../../types/RAQIV2ChartContext';
import ChartConfiguratorChartTypeSelector from './ChartConfiguratorChartTypeSelector';
import ChartConfiguratorCustomEventControls from './ChartConfiguratorCustomEventControls';
import ChartConfiguratorEquationBuilder from './ChartConfiguratorEquationBuilder';
import ChartConfiguratorMetricSelector from './ChartConfiguratorMetricSelector';
import ChartConfiguratorOverlaysControl from './ChartConfiguratorOverlaysControl';
import type {
  ChartConfiguratorBreakdownControlsProps,
  ChartConfiguratorMetricControlsProps,
  ChartConfiguratorOverlayControlsProps,
  ChartConfiguratorSidebarProps,
  ChartConfiguratorSmoothingControlsProps,
  ChartConfiguratorTableControlsProps,
  ChartConfiguratorTitleControlsProps,
  ChartConfiguratorChartControlsProps,
} from './ChartConfiguratorSidebarModelTypes';
import ChartConfiguratorSmoothingControl from './ChartConfiguratorSmoothingControl';
import ChartConfiguratorSourceSelector from './ChartConfiguratorSourceSelector';
import type { ExploreModeTableMetricColumn } from './chartConfiguratorTableColumns';
import ChartConfiguratorAdditionalMetricColumns from './components/ChartConfiguratorAdditionalMetricColumns';
import ChartConfiguratorBreakdownControl from './components/ChartConfiguratorBreakdownControl';
import useChartConfiguratorSidebarModel from './useChartConfiguratorSidebarModel';
import useTracedChartConfiguratorSidebarDispatch from './useTracedChartConfiguratorSidebarDispatch';

export type {
  ChartConfiguratorSidebarAction,
  ChartConfiguratorSidebarDispatch,
  ChartConfiguratorSidebarProps,
} from './ChartConfiguratorSidebarModelTypes';

const COLLAPSE_TOOLTIP_DELAY_MS = 200;
const EMPTY_BENCHMARK_TYPES: readonly BenchmarkOverlayType[] = [];
const EMPTY_TABLE_ADDITIONAL_COLUMNS: ExploreModeTableMetricColumn[] = [];

const useStyles = makeStyles()(() => ({
  // Spacing for these blocks (gap, padding, margin) is applied via Foundation
  // Tailwind utilities at the JSX call site; only properties without a clean
  // Tailwind equivalent live in `makeStyles` so the legacy block can shrink
  // toward eventual removal.
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '0 1 350px',
    maxWidth: '350px',
    minWidth: '260px',
    borderRight: '1px solid var(--stroke-default)',
    overflowY: 'auto',
    height: '100%',
    boxSizing: 'border-box',
  },
  // Room for Foundation `outline-focus` (outline width + offset) inside this
  // overflow-y scrollport without shifting content: padding holds the ring;
  // negative margin cancels the layout offset.
  inlineFocusRingInset: {
    paddingLeft: 'calc(2 * var(--stroke-thicker))',
    marginLeft: 'calc(-2 * var(--stroke-thicker))',
  },
  rootSheet: {
    display: 'flex',
    flexDirection: 'column',
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
  },
  // Scroll headroom below the last control. The Foundation Tailwind preset
  // doesn't honor arbitrary values (`pb-[10rem]`) and its largest spacing
  // token (`xxlarge` ≈ 1.5rem) is far short of what's needed here, so this
  // stays in CSS rather than a Tailwind utility.
  lastSection: {
    paddingBottom: '10rem',
  },
}));

const DISABLED_OVERLAY_CONTROLS: ChartConfiguratorOverlayControlsProps = { isEnabled: false };
const DEFAULT_TABLE_CONTROLS: ChartConfiguratorTableControlsProps = { mode: 'chart' };

type SidebarModel = ReturnType<typeof useChartConfiguratorSidebarModel>;
type GranularityLabels = Record<RAQIV2MetricGranularity, string>;

type MetricSectionProps = {
  readonly className: string;
  readonly dispatch: ChartConfiguratorSidebarProps['dispatch'];
  readonly useOperationsLabel: string;
  readonly metricControls: ChartConfiguratorMetricControlsProps;
  readonly equationBuilderChartContext: SidebarModel['equationBuilderChartContext'];
  readonly equationBuilderDefaultMetric: SidebarModel['equationBuilderDefaultMetric'];
  readonly equationBuilderMetrics: SidebarModel['equationBuilderMetrics'];
  readonly handleToggleOperations: SidebarModel['handleToggleOperations'];
};

const MetricSection = memo<MetricSectionProps>(
  ({
    className,
    dispatch,
    useOperationsLabel,
    metricControls,
    equationBuilderChartContext,
    equationBuilderDefaultMetric,
    equationBuilderMetrics,
    handleToggleOperations,
  }) => {
    const {
      metric,
      computedMetric,
      availableMetrics,
      sourceFilterResource,
      sourceFilterDimensionsByMetric,
    } = metricControls;
    const isOperationsMode = metricControls.mode === 'operations';

    return (
      <div className={`${className} gap-xxlarge`}>
        <Toggle
          label={useOperationsLabel}
          size='Medium'
          isChecked={isOperationsMode}
          onCheckedChange={handleToggleOperations}
          placement='Start'
        />

        {metricControls.mode !== 'operations' && (
          <>
            <ChartConfiguratorSourceSelector
              value={metricControls.sourceFilter}
              onChange={(sourceFilter) => dispatch({ type: 'set-source-filter', sourceFilter })}
              availableMetrics={availableMetrics}
              isRequired
            />

            {metricControls.mode === 'custom-events' ? (
              <ChartConfiguratorCustomEventControls
                resource={metricControls.customEventResource}
                filters={metricControls.filters}
                onFiltersChange={(filters) =>
                  dispatch({ type: 'set-custom-event-filters', filters })
                }
                autoFocusEventName={metricControls.autoFocusEventName}
              />
            ) : (
              <ChartConfiguratorMetricSelector
                options={metricControls.filteredMetrics}
                value={metric}
                onChange={(nextMetric) => dispatch({ type: 'select-metric', metric: nextMetric })}
                showCategoryLabels={!metricControls.sourceFilter}
                isRequired
              />
            )}
          </>
        )}

        {isOperationsMode && (
          <ChartConfiguratorEquationBuilder
            availableMetrics={equationBuilderMetrics}
            defaultMetric={equationBuilderDefaultMetric}
            sourceFilterResource={sourceFilterResource}
            sourceFilterDimensionsByMetric={sourceFilterDimensionsByMetric}
            onComputedMetricChange={(nextComputedMetric) =>
              dispatch({ type: 'set-computed-metric', computedMetric: nextComputedMetric })
            }
            initialComputedMetric={computedMetric}
            chartContext={equationBuilderChartContext}
          />
        )}
      </div>
    );
  },
);
MetricSection.displayName = 'MetricSection';

type GranularitySectionProps = {
  readonly chartContext: RAQIV2ChartContext;
  readonly granularityLabels: GranularityLabels;
  readonly granularityOptions: SidebarModel['granularityOptions'];
  readonly hasEnabledGranularityOptions: SidebarModel['hasEnabledGranularityOptions'];
  readonly handleGranularityChange: SidebarModel['handleGranularityChange'];
  readonly selectIntervalLabel: string;
  readonly shouldShowUnsupportedGranularityWarning: SidebarModel['shouldShowUnsupportedGranularityWarning'];
  readonly timeIntervalLabel: string;
  readonly translate: (key: TranslationKey) => FormattedText;
  readonly unsupportedGranularityLabel: string;
};

const GranularitySection = memo<GranularitySectionProps>(
  ({
    chartContext,
    granularityLabels,
    granularityOptions,
    hasEnabledGranularityOptions,
    handleGranularityChange,
    selectIntervalLabel,
    shouldShowUnsupportedGranularityWarning,
    timeIntervalLabel,
    translate,
    unsupportedGranularityLabel,
  }) => {
    if (!hasEnabledGranularityOptions) {
      return null;
    }
    return (
      <div className='flex flex-col gap-xsmall'>
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
        {shouldShowUnsupportedGranularityWarning && (
          <div className='flex items-center gap-xsmall content-system-warning'>
            <Icon name='icon-filled-triangle-exclamation' size='Small' />
            <span className='text-caption-medium'>{unsupportedGranularityLabel}</span>
          </div>
        )}
      </div>
    );
  },
);
GranularitySection.displayName = 'GranularitySection';

type BreakdownSectionProps = {
  readonly breakdownControls: ChartConfiguratorBreakdownControlsProps;
  readonly breakdownByLabel: FormattedText;
  readonly dispatch: ChartConfiguratorSidebarProps['dispatch'];
  readonly handleToggleTimestamp: SidebarModel['handleToggleTimestamp'];
  readonly isTableMode: boolean;
  readonly isTimestampSelected: SidebarModel['isTimestampSelected'];
  readonly isTimestampToggleDisabled: SidebarModel['isTimestampToggleDisabled'];
  readonly selectBreakdownLabel: FormattedText;
  readonly timestampLabel: FormattedText;
};

const BreakdownSection = memo<BreakdownSectionProps>(
  ({
    breakdownControls,
    breakdownByLabel,
    dispatch,
    handleToggleTimestamp,
    isTableMode,
    isTimestampSelected,
    isTimestampToggleDisabled,
    selectBreakdownLabel,
    timestampLabel,
  }) => (
    <ChartConfiguratorBreakdownControl
      label={breakdownByLabel}
      placeholder={selectBreakdownLabel}
      breakdown={breakdownControls.breakdown}
      breakdownDimensions={breakdownControls.breakdownDimensions}
      onBreakdownChange={(breakdown) => dispatch({ type: 'set-breakdown', breakdown })}
      getBreakdownLabel={breakdownControls.getBreakdownLabel}
      showTimestampOption={isTableMode}
      isTimestampSelected={isTimestampSelected}
      timestampLabel={timestampLabel}
      onToggleTimestamp={handleToggleTimestamp}
      isTimestampToggleDisabled={isTimestampToggleDisabled}
    />
  ),
);
BreakdownSection.displayName = 'BreakdownSection';

type ChartTypeSectionProps = {
  readonly chartControls: ChartConfiguratorChartControlsProps;
  readonly handleChartTypeChange: SidebarModel['handleChartTypeChange'];
};

const ChartTypeSection = memo<ChartTypeSectionProps>(({ chartControls, handleChartTypeChange }) => (
  <ChartConfiguratorChartTypeSelector
    value={chartControls.chartType}
    onChange={handleChartTypeChange}
    availableTypes={chartControls.availableChartTypes}
    supportedTypes={chartControls.supportedChartTypes}
    chartTypeSupport={chartControls.chartTypeSupport}
  />
));
ChartTypeSection.displayName = 'ChartTypeSection';

type TableAdditionalColumnsSectionProps = {
  readonly dispatch: ChartConfiguratorSidebarProps['dispatch'];
  readonly metricControls: ChartConfiguratorMetricControlsProps;
  readonly tableControls: Extract<ChartConfiguratorTableControlsProps, { mode: 'table' }>;
};

const TableAdditionalColumnsSection = memo<TableAdditionalColumnsSectionProps>(
  ({ dispatch, metricControls, tableControls }) => (
    <ChartConfiguratorAdditionalMetricColumns
      columns={tableControls.tableAdditionalColumns ?? EMPTY_TABLE_ADDITIONAL_COLUMNS}
      onColumnsChange={(tableAdditionalColumns) =>
        dispatch({ type: 'set-table-additional-columns', tableAdditionalColumns })
      }
      availableMetrics={metricControls.availableMetrics}
      sourceFilterResource={metricControls.sourceFilterResource}
      sourceFilterDimensionsByMetric={metricControls.sourceFilterDimensionsByMetric}
      primaryColumnCount={tableControls.tablePrimaryColumnCount ?? 1}
    />
  ),
);
TableAdditionalColumnsSection.displayName = 'TableAdditionalColumnsSection';

type OverlaySectionProps = {
  readonly availableBenchmarkTypes: readonly BenchmarkOverlayType[];
  readonly dispatch: ChartConfiguratorSidebarProps['dispatch'];
  readonly overlayControls: Extract<ChartConfiguratorOverlayControlsProps, { isEnabled: true }>;
};

const OverlaySection = memo<OverlaySectionProps>(
  ({ availableBenchmarkTypes, dispatch, overlayControls }) => (
    <ChartConfiguratorOverlaysControl
      value={overlayControls.overlayOption}
      onChange={(overlayOption) => dispatch({ type: 'set-overlay-option', overlayOption })}
      benchmarkType={overlayControls.benchmarkType}
      onBenchmarkTypeChange={(benchmarkType) =>
        dispatch({ type: 'set-benchmark-type', benchmarkType })
      }
      availableBenchmarkTypes={availableBenchmarkTypes}
      comparisonOffset={overlayControls.comparisonOffset}
      onComparisonOffsetChange={(comparisonOffset) =>
        dispatch({ type: 'set-comparison-offset', comparisonOffset })
      }
      comparisonCustomStartDate={overlayControls.comparisonCustomStartDate}
      onComparisonCustomStartDateChange={(comparisonCustomStartDate) =>
        dispatch({ type: 'set-comparison-custom-start-date', comparisonCustomStartDate })
      }
      availability={overlayControls.overlayAvailability}
    />
  ),
);
OverlaySection.displayName = 'OverlaySection';

type LowerChartControlsSectionProps = {
  readonly availableBenchmarkTypes: readonly BenchmarkOverlayType[];
  readonly dispatch: ChartConfiguratorSidebarProps['dispatch'];
  readonly metricControls: ChartConfiguratorMetricControlsProps;
  readonly overlayControls: ChartConfiguratorOverlayControlsProps;
  readonly tableControls: ChartConfiguratorTableControlsProps;
};

// Table charts use this lower-control slot for additional metric columns.
// Non-table charts use the same slot for overlays, when the caller enables them.
const LowerChartControlsSection = memo<LowerChartControlsSectionProps>(
  ({ availableBenchmarkTypes, dispatch, metricControls, overlayControls, tableControls }) => {
    if (tableControls.mode === 'table') {
      return (
        <TableAdditionalColumnsSection
          dispatch={dispatch}
          metricControls={metricControls}
          tableControls={tableControls}
        />
      );
    }
    if (!overlayControls.isEnabled) {
      return null;
    }
    return (
      <OverlaySection
        availableBenchmarkTypes={availableBenchmarkTypes}
        dispatch={dispatch}
        overlayControls={overlayControls}
      />
    );
  },
);
LowerChartControlsSection.displayName = 'LowerChartControlsSection';

const SmoothingSection = memo<
  ChartConfiguratorSmoothingControlsProps & {
    readonly dispatch: ChartConfiguratorSidebarProps['dispatch'];
  }
>(
  ({
    dispatch,
    smoothingOption,
    isL7SmoothingDisabled = false,
    l7SmoothingDisabledReason = null,
  }) => (
    <ChartConfiguratorSmoothingControl
      value={smoothingOption}
      onChange={(nextSmoothingOption) =>
        dispatch({ type: 'set-smoothing-option', smoothingOption: nextSmoothingOption })
      }
      isL7Disabled={isL7SmoothingDisabled}
      l7SmoothingDisabledReason={l7SmoothingDisabledReason}
    />
  ),
);
SmoothingSection.displayName = 'SmoothingSection';

const TitleSection: FC<{
  readonly className: string;
  readonly titleControls: ChartConfiguratorTitleControlsProps;
}> = ({ className, titleControls }) => (
  <div className={className}>
    <TextInput
      size='Medium'
      label={titleControls.label}
      placeholder={titleControls.placeholder}
      value={titleControls.value}
      onChange={(event) => titleControls.onChange(event.target.value)}
      error={titleControls.error ?? undefined}
      maxLength={titleControls.maxLength}
    />
  </div>
);

const ChartConfiguratorSidebar: FC<ChartConfiguratorSidebarProps> = ({
  variant = 'inline',
  onCollapse,
  dispatch,
  titleControls,
  metricControls,
  chartControls,
  granularityControls,
  breakdownControls,
  smoothingControls,
  overlayControls = DISABLED_OVERLAY_CONTROLS,
  tableControls,
}) => {
  const { chartContext } = granularityControls;
  const resolvedTableControls = tableControls ?? DEFAULT_TABLE_CONTROLS;
  const isTableMode = resolvedTableControls.mode === 'table';
  const sidebarDispatchSnapshot = useMemo(
    () => ({
      metricControls,
      granularityControls,
      tableControls: resolvedTableControls,
    }),
    [granularityControls, metricControls, resolvedTableControls],
  );
  const tracedDispatch = useTracedChartConfiguratorSidebarDispatch(
    dispatch,
    sidebarDispatchSnapshot,
  );
  const availableBenchmarkTypes =
    overlayControls.isEnabled && overlayControls.availableBenchmarkTypes
      ? overlayControls.availableBenchmarkTypes
      : EMPTY_BENCHMARK_TYPES;
  const {
    classes: { root, rootSheet, inlineFocusRingInset, sectionHeading, section, lastSection },
  } = useStyles();

  const { translate } = useRAQIV2TranslationDependencies();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const collapseSidebarLabel = tPendingTranslation(
    'Collapse sidebar',
    'Tooltip for the button that collapses the chart configuration sidebar.',
    translationKey('Action.ExploreMode.CollapseSidebar', TranslationNamespace.Analytics),
  );
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
  const unsupportedGranularityLabel = tPendingTranslation(
    "These metrics don't share the selected interval, so the closest supported one is shown.",
    'Inline notice shown next to the time interval dropdown when a computed chart\u2019s source metrics cannot all use the requested interval, so the chart falls back to the closest supported interval.',
    translationKey(
      'Notice.ChartConfigurator.CoercedSharedGranularity',
      TranslationNamespace.Analytics,
    ),
  );
  const unsupportedGranularityMessageKey = translationKey(
    'Description.UnsupportedGranularity',
    TranslationNamespace.Analytics,
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
  const timestampLabel = tPendingTranslation(
    'Timestamp',
    'Label for the implicit timestamp column added to the explore mode table when the time interval is non-cumulative; appears as a toggleable item inside the breakdown dropdown.',
    translationKey('Label.ExploreMode.Timestamp', TranslationNamespace.Analytics),
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

  const {
    equationBuilderChartContext,
    equationBuilderDefaultMetric,
    equationBuilderMetrics,
    granularityOptions,
    handleChartTypeChange,
    handleGranularityChange,
    handleToggleOperations,
    handleToggleTimestamp,
    hasEnabledGranularityOptions,
    isTimestampSelected,
    isTimestampToggleDisabled,
    shouldShowUnsupportedGranularityWarning,
  } = useChartConfiguratorSidebarModel({
    dispatch: tracedDispatch,
    metricControls,
    chartControls,
    granularityControls,
    unsupportedGranularityMessageKey,
  });

  return (
    <div
      className={
        variant === 'sheet'
          ? `${rootSheet} gap-xxlarge padding-bottom-xxlarge`
          : `${root} ${inlineFocusRingInset} gap-xxlarge padding-y-medium padding-right-large`
      }>
      {variant === 'inline' && (
        <div className='flex flex-row items-center justify-between'>
          <h2 className={sectionHeading}>{configureChartLabel}</h2>
          {onCollapse && (
            <Tooltip
              title={collapseSidebarLabel}
              position='top-center'
              delayDurationMs={COLLAPSE_TOOLTIP_DELAY_MS}>
              <TooltipTrigger asChild>
                <IconButton
                  icon='icon-regular-chevron-small-left'
                  variant='Utility'
                  size='Small'
                  ariaLabel={collapseSidebarLabel}
                  onClick={onCollapse}
                />
              </TooltipTrigger>
            </Tooltip>
          )}
        </div>
      )}

      {titleControls && <TitleSection className={section} titleControls={titleControls} />}

      <MetricSection
        className={section}
        dispatch={tracedDispatch}
        useOperationsLabel={useOperationsLabel}
        metricControls={metricControls}
        equationBuilderChartContext={equationBuilderChartContext}
        equationBuilderDefaultMetric={equationBuilderDefaultMetric}
        equationBuilderMetrics={equationBuilderMetrics}
        handleToggleOperations={handleToggleOperations}
      />

      <Divider variant='Standard' />

      <div className={`${section} ${lastSection} gap-xxlarge`}>
        <GranularitySection
          chartContext={chartContext}
          granularityLabels={granularityLabels}
          granularityOptions={granularityOptions}
          hasEnabledGranularityOptions={hasEnabledGranularityOptions}
          handleGranularityChange={handleGranularityChange}
          selectIntervalLabel={selectIntervalLabel}
          shouldShowUnsupportedGranularityWarning={shouldShowUnsupportedGranularityWarning}
          timeIntervalLabel={timeIntervalLabel}
          translate={translate}
          unsupportedGranularityLabel={unsupportedGranularityLabel}
        />

        <BreakdownSection
          breakdownControls={breakdownControls}
          breakdownByLabel={breakdownByLabel}
          dispatch={tracedDispatch}
          handleToggleTimestamp={handleToggleTimestamp}
          isTableMode={isTableMode}
          isTimestampSelected={isTimestampSelected}
          isTimestampToggleDisabled={isTimestampToggleDisabled}
          selectBreakdownLabel={selectBreakdownLabel}
          timestampLabel={timestampLabel}
        />

        <ChartTypeSection
          chartControls={chartControls}
          handleChartTypeChange={handleChartTypeChange}
        />

        <LowerChartControlsSection
          availableBenchmarkTypes={availableBenchmarkTypes}
          dispatch={tracedDispatch}
          metricControls={metricControls}
          overlayControls={overlayControls}
          tableControls={resolvedTableControls}
        />

        <SmoothingSection {...smoothingControls} dispatch={tracedDispatch} />
      </div>
    </div>
  );
};

export default ChartConfiguratorSidebar;
