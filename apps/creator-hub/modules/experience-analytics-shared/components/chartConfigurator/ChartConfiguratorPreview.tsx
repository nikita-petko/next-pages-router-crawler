import { type FC, useMemo } from 'react';
import { ChartStyleMode } from '@rbx/analytics-ui';
import type { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import { Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { ChartLocation } from '@modules/charts-generic/context/ChartLocation';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import buildChartConfiguratorTableConfig, {
  type ExploreModeTableMetricColumnInput,
} from '../../chartConfigurator/buildChartConfiguratorTableConfig';
import {
  isChartConfiguratorSupportedChartType,
  type ChartConfiguratorChartType,
} from '../../chartConfigurator/ChartConfiguratorChartTypes';
import type { TChartConfiguratorMetrics } from '../../chartConfigurator/chartConfiguratorMetricsConfig';
import type { ControlledChartConfiguratorGranularitySelection } from '../../chartConfigurator/controlledChartConfiguratorState';
import { getBaseMetricFromL7 } from '../../chartConfigurator/l7MetricMapping';
import type {
  ComparisonCustomStartDateValue,
  ComparisonOffsetValue,
} from '../../chartConfigurator/overlayUrlParams';
import getAnalyticsMetricDisplayConfig from '../../constants/AnalyticsMetricDisplayConfig';
import type { BenchmarkOverlayType } from '../../hooks/useAnalyticsBenchmarks';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import { isComputedMetric } from '../../types/ComputedMetric';
import { ChartOverlay, type ChartOverlays } from '../../types/RAQIV2ChartSpec';
import type RAQIV2ChartSpec from '../../types/RAQIV2ChartSpec';
import { RAQIV2SpecialLayoutType } from '../../types/RAQIV2SpecialLayoutConfig';
import type RAQIV2TableContext from '../../types/RAQIV2TableContext';
import { ChartActionsProvider, type ChartActionsPolicy } from '../RAQIV2/ChartActionsContext';
import GenericAnalyticsLayoutItem from '../RAQIV2/layout/GenericAnalyticsLayoutItem';
import RAQIV2GenericChart from '../RAQIV2/RAQIV2GenericChart';
import AnalyticsConfigTable from '../RAQIV2/table/AnalyticsConfigTable';
import ChartConfiguratorEmptyChartState from './ChartConfiguratorEmptyChartState';
import type { OverlayOption } from './ChartConfiguratorOverlaysControl';
import { resolveChartConfiguratorPreviewTitleLabel } from './chartConfiguratorPreviewTitle';
import type { ExploreModeTableMetricColumn } from './chartConfiguratorTableColumns';
import ChartConfiguratorDateRangeControl from './components/ChartConfiguratorDateRangeControl';
import styles from './ChartConfiguratorPreview.module.css';

const EMPTY_TABLE_ADDITIONAL_COLUMNS: readonly ExploreModeTableMetricColumn[] = [];

/**
 * Why the preview renders its empty/placeholder state instead of a chart.
 * Absence of a reason (`undefined`) means "not empty" — there is no separate
 * `null` state, so callers leave the prop unset when the preview can render.
 */
export type ChartConfiguratorEmptyStateReason = 'missing-metric' | 'missing-custom-event';

/**
 * Render-only model for the chart configurator preview pane.
 *
 * The parent hook owns draft state and spec construction; this component only
 * renders the date-range control, the bare chart preview, and empty states for
 * incomplete or unsupported preview configurations.
 */
export type ChartConfiguratorPreviewProps = {
  readonly chartSpec: RAQIV2ChartSpec | null;
  readonly displayMetric: TChartConfiguratorMetrics | null;
  readonly selectedChartType: ChartConfiguratorChartType;
  readonly computedMetricChartTitleLabel: string | undefined;
  readonly overlayOption?: OverlayOption;
  readonly benchmarkType?: BenchmarkOverlayType | null;
  readonly comparisonOffset?: ComparisonOffsetValue;
  readonly comparisonCustomStartDate?: ComparisonCustomStartDateValue;
  readonly tableAdditionalColumns?: readonly ExploreModeTableMetricColumn[];
  readonly emptyStateReason?: ChartConfiguratorEmptyStateReason;
  readonly fallbackChartTitleLabel?: string;
  /**
   * Authored chart title (e.g. custom-dashboard chart editor). When non-empty
   * it takes precedence over the metric's localized name and any computed
   * metric name in the preview header.
   */
  readonly chartTitleLabel?: string;
  readonly granularitySelection?: ControlledChartConfiguratorGranularitySelection;
  readonly dateRangeOptions: readonly RAQIV2DateRangeType[];
  /**
   * Product surface used by chart telemetry/actions. Defaults to Explore for
   * compatibility with the original preview usage.
   */
  readonly chartLocation?: ChartLocation;
  /**
   * Surface-owned chart sizing override. When omitted, RAQIV2GenericChart uses
   * its chartStyleMode-dependent default height.
   */
  readonly chartHeight?: number;
  /**
   * Header-action policy for the preview chart card. Defaults to
   * no actions for the in-editor preview. Hosts that render the preview as an
   * interactive tile (e.g. the custom dashboard editor) pass their own policy
   * to surface tile-level controls.
   */
  readonly actionsPolicy?: ChartActionsPolicy;
};

/**
 * Live preview shell for controlled chart configurator flows.
 *
 * Incomplete selections render the shared empty chart visual; unsupported
 * configurations render through an abnormal chart card so preview height remains
 * stable.
 */
const ChartConfiguratorPreview: FC<ChartConfiguratorPreviewProps> = ({
  chartSpec,
  displayMetric,
  selectedChartType,
  computedMetricChartTitleLabel,
  overlayOption = 'none',
  benchmarkType = null,
  comparisonOffset,
  comparisonCustomStartDate,
  tableAdditionalColumns = EMPTY_TABLE_ADDITIONAL_COLUMNS,
  emptyStateReason,
  fallbackChartTitleLabel,
  chartTitleLabel: authoredChartTitleLabel,
  granularitySelection,
  dateRangeOptions,
  chartLocation = 'explore-mode',
  chartHeight,
  actionsPolicy = false,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const untitledFormulaLabel = tPendingTranslation(
    '(Untitled formula)',
    'Default name shown for a formula that has not been named yet.',
    translationKey('Label.ExploreMode.UntitledFormula', TranslationNamespace.Analytics),
  );
  const selectMetricPreviewLabel = translate(
    translationKey('Placeholder.ExploreMode.SelectMetric', TranslationNamespace.Analytics),
  );
  const selectMetricPreviewSubtitleLabel = tPendingTranslation(
    'Select a metric to preview this chart.',
    'Subtitle shown in the chart configurator preview card before the user has chosen a metric.',
    translationKey(
      'Description.ChartConfigurator.Preview.SelectMetric',
      TranslationNamespace.Analytics,
    ),
  );
  const previewUnavailableLabel = translate(
    translationKey('Description.ChartType.GenericNotSupported', TranslationNamespace.Analytics),
  );
  const previewUnavailableSubtitleLabel = tPendingTranslation(
    'Try a different metric or chart type.',
    'Subtitle shown when the chart configurator preview cannot render the selected chart configuration.',
    translationKey('Description.ChartConfigurator.Unsupported', TranslationNamespace.Analytics),
  );
  const unsupportedGranularityWarningLabel = translate(
    translationKey(
      'Error.ChartConfigurator.UnsupportedSelectedGranularity',
      TranslationNamespace.Analytics,
    ),
  );
  const shouldShowUnsupportedGranularityWarning = Boolean(
    granularitySelection && !granularitySelection.isRequestedGranularitySupported,
  );
  const overlays = useMemo<ChartOverlays>(() => {
    switch (overlayOption) {
      case 'benchmarks':
        return [ChartOverlay.benchmark(benchmarkType ?? undefined)];
      case 'period-over-period':
        return [
          ChartOverlay.comparison({
            relativeOffset: comparisonOffset,
            customStartDate: comparisonCustomStartDate,
          }),
        ];
      case 'none':
      case 'quota':
        return [];
      default:
        return overlayOption satisfies never;
    }
  }, [benchmarkType, comparisonCustomStartDate, comparisonOffset, overlayOption]);
  const table = useMemo(() => {
    if (selectedChartType !== ChartType.Table || !chartSpec || !displayMetric) {
      return null;
    }
    const primaryMetric: ExploreModeTableMetricColumnInput = {
      key: isComputedMetric(chartSpec.metric) ? 'primary_computed' : `primary_${displayMetric}`,
      metric: chartSpec.metric,
    };
    const additionalMetricColumns = tableAdditionalColumns.flatMap(
      (column): ExploreModeTableMetricColumnInput[] => {
        if (column.metric === null) {
          return [];
        }
        return [
          {
            key: column.key,
            metric: column.metric,
            filter: column.filters,
          },
        ];
      },
    );
    const tableConfig = buildChartConfiguratorTableConfig({
      breakdown: chartSpec.breakdown ?? [],
      primaryMetric,
      additionalMetricColumns,
      pageLevelFilter: chartSpec.filter,
      granularity: chartSpec.granularity,
    });
    if (!tableConfig) {
      return null;
    }
    const tableContext: RAQIV2TableContext = {
      resource: chartSpec.resource,
      timeSpec: chartSpec.timeSpec,
      breakdown: chartSpec.breakdown ?? [],
      granularity: chartSpec.granularity,
      filter: chartSpec.filter ?? [],
    };
    // Mount bare like Explore Mode — an orphan `GenericAnalyticsLayoutItem`
    // plus chart-card `height: 100%` rules collapses the table to an empty frame.
    return (
      <div className={styles.previewTableFrame} data-testid='chart-configurator-preview-table'>
        <AnalyticsConfigTable config={tableConfig} tableContext={tableContext} />
      </div>
    );
  }, [chartSpec, displayMetric, selectedChartType, tableAdditionalColumns]);

  const chart = useMemo(() => {
    if (selectedChartType === ChartType.Table) {
      return null;
    }
    if (!chartSpec || !displayMetric || !isChartConfiguratorSupportedChartType(selectedChartType)) {
      return null;
    }

    const { localizedName, localizedDescription } = getAnalyticsMetricDisplayConfig(displayMetric);
    const computedMetricChart = isComputedMetric(chartSpec.metric) ? chartSpec.metric : null;
    const defaultMetricTitleLabel = translate(localizedName);
    const isPrecomputedL7MetricChart =
      !computedMetricChart &&
      typeof chartSpec.metric === 'string' &&
      getBaseMetricFromL7(chartSpec.metric) !== null;
    const chartTitleLabel = resolveChartConfiguratorPreviewTitleLabel({
      authoredChartTitleLabel,
      computedMetricChart,
      computedMetricChartTitleLabel,
      defaultMetricTitleLabel,
      fallbackChartTitleLabel,
      formatSmoothingTitleLabel: (metricName) =>
        String(
          tPendingTranslation(
            '{metricName} (7 day moving average)',
            'Chart title when L7 smoothing is enabled. {metricName} is replaced with the metric display name.',
            translationKey(
              'Label.ExploreMode.Smoothing.ChartTitleFormat',
              TranslationNamespace.Analytics,
            ),
            { metricName },
          ),
        ),
      isPrecomputedL7MetricChart,
      untitledFormulaLabel: String(untitledFormulaLabel),
    });

    return (
      // The preview chart's header chrome is host-driven: the in-editor preview
      // defaults to no actions, while a dashboard tile host supplies edit/delete
      // via `actionsPolicy`.
      <ChartActionsProvider value={actionsPolicy}>
        <GenericAnalyticsLayoutItem layout={RAQIV2SpecialLayoutType.FullWidthLayout}>
          <RAQIV2GenericChart
            titleLabel={chartTitleLabel}
            titleKey={chartTitleLabel ? undefined : localizedName}
            definitionTooltipKey={computedMetricChart ? undefined : localizedDescription}
            chartKeyOrConfig={null}
            spec={chartSpec}
            chartType={selectedChartType}
            chartStyleMode={ChartStyleMode.Normal}
            chartHeight={chartHeight}
            overlays={overlays}
            onSelectChartRegion={null}
            chartLocation={chartLocation}
          />
        </GenericAnalyticsLayoutItem>
      </ChartActionsProvider>
    );
  }, [
    authoredChartTitleLabel,
    actionsPolicy,
    chartHeight,
    chartLocation,
    chartSpec,
    computedMetricChartTitleLabel,
    displayMetric,
    fallbackChartTitleLabel,
    overlays,
    selectedChartType,
    tPendingTranslation,
    translate,
    untitledFormulaLabel,
  ]);

  const resolvedEmptyStateReason =
    emptyStateReason ?? (!displayMetric ? 'missing-metric' : undefined);
  const emptyStateLabels = useMemo(() => {
    if (resolvedEmptyStateReason === 'missing-custom-event') {
      return {
        titleLabel: selectMetricPreviewLabel,
        subtitleLabel: selectMetricPreviewSubtitleLabel,
      };
    }
    if (resolvedEmptyStateReason === 'missing-metric') {
      return {
        titleLabel: selectMetricPreviewLabel,
        subtitleLabel: selectMetricPreviewSubtitleLabel,
      };
    }
    return null;
  }, [resolvedEmptyStateReason, selectMetricPreviewLabel, selectMetricPreviewSubtitleLabel]);

  return (
    <div className='flex flex-col [flex:1_1_0%] width-full min-width-0 gap-medium'>
      <div className='width-full flex flex-row items-end [flex-wrap:wrap] gap-medium padding-bottom-medium [border-bottom:var(--stroke-standard)_solid_var(--color-stroke-default)]'>
        <ChartConfiguratorDateRangeControl dateRangeOptions={dateRangeOptions} />
      </div>
      {shouldShowUnsupportedGranularityWarning && (
        <div className='flex items-center gap-xsmall content-system-warning'>
          <Icon name='icon-filled-triangle-exclamation' size='Small' />
          <span className='text-caption-medium'>{unsupportedGranularityWarningLabel}</span>
        </div>
      )}
      <div className={styles.previewChartFrame}>
        {table ??
          chart ??
          (emptyStateLabels ? (
            <ChartConfiguratorEmptyChartState
              titleLabel={emptyStateLabels.titleLabel}
              subtitleLabel={emptyStateLabels.subtitleLabel}
              chartHeight={chartHeight}
            />
          ) : (
            <ChartConfiguratorEmptyChartState
              titleLabel={previewUnavailableLabel}
              subtitleLabel={previewUnavailableSubtitleLabel}
              chartHeight={chartHeight}
              isError
              errorDescription={previewUnavailableSubtitleLabel}
            />
          ))}
      </div>
    </div>
  );
};

export default ChartConfiguratorPreview;
