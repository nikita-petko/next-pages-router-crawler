import React, { type FC, useMemo } from 'react';
import { SingleChartCardContainer } from '@rbx/analytics-ui';
import type GenericCsvExporter from '@modules/charts-generic/charts/exporters/GenericCsvExporter';
import type { GenericTableV2RowExpansionConfig } from '@modules/charts-generic/tables/types/GenericTableType';
import { isCustomTableColumnConfig } from '../../../constants/RAQIV2PredefinedTableColumnConfig';
import type { AnalyticsTableConfig } from '../../../constants/RAQIV2PredefinedTableConfig';
import useRAQIV2PredefinedWarnings from '../../../hooks/useRAQIV2PredefinedWarnings';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import type RAQIV2TableContext from '../../../types/RAQIV2TableContext';
import computeRAQIV2SpecOverride from '../../../utils/computeRAQIV2SpecOverride';
import getUniqueKeyForAnalyticsComponent from '../../../utils/getUniqueKeyForAnalyticsComponent';
import { useChartActionsPolicy } from '../ChartActionsContext';
import { useAnalyticsChartContainerDragDropContext } from '../layout/AnalyticsChartContainerDragDropContext';
import SortableAnalyticsChartContainer from '../layout/SortableAnalyticsChartContainer';
import AnalyticsDataTable from './AnalyticsDataTable';
import type { MetricTableColumnSpec } from './types';

export type RAQIV2PredefinedTableProps = {
  config: AnalyticsTableConfig;
  tableContext: RAQIV2TableContext;
  isInTabSwitchedContext?: boolean;
  rowRange?: {
    start: number;
    end: number;
  };
  chartControl?: React.JSX.Element | null;
  /**
   * Forwarded to the underlying {@link AnalyticsDataTable}. Exposing this as a
   * dedicated prop (rather than expecting it on the serializable
   * {@link AnalyticsTableConfig}) keeps the config strictly serializable for
   * custom dashboards while still allowing call sites to wire a CSV exporter.
   *
   * Receives a getter (rather than a pre-built exporter) so the underlying
   * `GenericTableExporter` is only allocated when the parent actually invokes
   * it (e.g. on a user-triggered download).
   */
  onExporterReady?: (getExporter: (() => GenericCsvExporter) | null) => void;
  /**
   * Optional expandable rows (stack traces, nested detail, etc.). Kept on this
   * component rather than `AnalyticsTableConfig` so configs stay serializable.
   */
  rowExpansion?: GenericTableV2RowExpansionConfig<string>;
};

const EMPTY_CHART_SUMMARY_SPECS: React.ComponentProps<
  typeof SingleChartCardContainer
>['chartSummarySpecs'] = [];

const AnalyticsConfigTable: FC<RAQIV2PredefinedTableProps> = ({
  config,
  tableContext,
  isInTabSwitchedContext,
  rowRange,
  chartControl,
  onExporterReady,
  rowExpansion,
}) => {
  const {
    dataColumns,
    breakdowns,
    pagination,
    footerKey,
    titleKey,
    titleLabel,
    definitionTooltipKey,
    ...otherConfig
  } = config;
  const { translate, ready } = useRAQIV2TranslationDependencies();
  const { fullDataColumnSpecs, metricDataColumnSpecs } = useMemo(() => {
    const metricSpecs: MetricTableColumnSpec<string>[] = [];
    const fullSpecs = dataColumns.map((column) => {
      if (isCustomTableColumnConfig(column)) {
        return { ...column, columnKey: column.key, resource: tableContext.resource };
      }
      const { key, metric, overrides, ...rest } = column;
      const metricSpec = {
        columnKey: key,
        ...rest,
        ...computeRAQIV2SpecOverride({ ...tableContext, metric }, overrides ?? {}),
      };
      metricSpecs.push(metricSpec);
      return metricSpec;
    });
    return {
      fullDataColumnSpecs: fullSpecs,
      metricDataColumnSpecs: metricSpecs,
    };
  }, [tableContext, dataColumns]);

  const dynamicWarnings = useRAQIV2PredefinedWarnings(metricDataColumnSpecs);

  // Append the config's static footnote (if any) after the dynamic data
  // warnings so both render in the table footer.
  const chartWarnings = useMemo(
    () => (footerKey ? [...dynamicWarnings, translate(footerKey)] : dynamicWarnings),
    [dynamicWarnings, footerKey, translate],
  );
  const dragDropContext = useAnalyticsChartContainerDragDropContext();
  const actionsPolicy = useChartActionsPolicy();
  const chartContainerId = useMemo(() => getUniqueKeyForAnalyticsComponent(config), [config]);
  const headerActionItems = useMemo(() => {
    if (actionsPolicy && typeof actionsPolicy === 'object' && 'actions' in actionsPolicy) {
      return actionsPolicy.actions;
    }
    return [];
  }, [actionsPolicy]);
  const resolvedTitleLabel = titleLabel?.trim()
    ? titleLabel.trim()
    : titleKey && ready
      ? String(translate(titleKey))
      : '';
  const shouldRenderCardChrome = !!dragDropContext?.isEnabled || headerActionItems.length > 0;
  const hideTableHeaderTitle = shouldRenderCardChrome;
  const table = (
    <AnalyticsDataTable
      {...otherConfig}
      titleKey={hideTableHeaderTitle ? undefined : titleKey}
      titleLabel={hideTableHeaderTitle ? undefined : titleLabel}
      definitionTooltipKey={definitionTooltipKey}
      dataColumnSpecs={fullDataColumnSpecs}
      breakdowns={breakdowns}
      isInTabSwitchedContext={isInTabSwitchedContext}
      chartWarnings={chartWarnings}
      rowRange={rowRange}
      pagination={pagination}
      chartControl={chartControl}
      onExporterReady={onExporterReady}
      rowExpansion={rowExpansion}
    />
  );

  if (!shouldRenderCardChrome) {
    return table;
  }

  const chartCard = (
    <SingleChartCardContainer
      titleLabel={resolvedTitleLabel}
      chartSummarySpecs={EMPTY_CHART_SUMMARY_SPECS}
      headerActionItems={headerActionItems}>
      {table}
    </SingleChartCardContainer>
  );

  if (!dragDropContext?.isEnabled) {
    return chartCard;
  }

  return (
    <SortableAnalyticsChartContainer
      itemId={chartContainerId}
      dropIndicator={dragDropContext.getDropIndicator(chartContainerId)}
      resizeOptions={dragDropContext.getResizeOptions?.(chartContainerId)}>
      {chartCard}
    </SortableAnalyticsChartContainer>
  );
};

export default AnalyticsConfigTable;
