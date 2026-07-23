import type { FC } from 'react';
import React, { useMemo } from 'react';
import type GenericCsvExporter from '@modules/charts-generic/charts/exporters/GenericCsvExporter';
import type { GenericTableV2RowExpansionConfig } from '@modules/charts-generic/tables/types/GenericTableType';
import { isCustomTableColumnConfig } from '../../../constants/RAQIV2PredefinedTableColumnConfig';
import type { AnalyticsTableConfig } from '../../../constants/RAQIV2PredefinedTableConfig';
import useRAQIV2PredefinedWarnings from '../../../hooks/useRAQIV2PredefinedWarnings';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import type RAQIV2TableContext from '../../../types/RAQIV2TableContext';
import computeRAQIV2SpecOverride from '../../../utils/computeRAQIV2SpecOverride';
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

const AnalyticsConfigTable: FC<RAQIV2PredefinedTableProps> = ({
  config,
  tableContext,
  isInTabSwitchedContext,
  rowRange,
  chartControl,
  onExporterReady,
  rowExpansion,
}) => {
  const { dataColumns, breakdowns, pagination, footerKey, ...otherConfig } = config;
  const { translate } = useRAQIV2TranslationDependencies();
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

  return (
    <AnalyticsDataTable
      {...otherConfig}
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
};

export default AnalyticsConfigTable;
