import React, { memo, useMemo, useEffect } from 'react';
import type { FormattedText, TranslationKey } from '@modules/analytics-translations/types';
import ChartHeader from '@modules/charts-generic/charts/ChartHeader';
import type GenericCsvExporter from '@modules/charts-generic/charts/exporters/GenericCsvExporter';
import GenericTableExporter from '@modules/charts-generic/charts/exporters/GenericTableExporter';
import type { TGenericChartExportConfig } from '@modules/charts-generic/charts/GenericChartExportButton';
import TableExportButton from '@modules/charts-generic/charts/TableExportButton';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import { resolveTableColumnTitle } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import { useExperienceAnalyticsGameDetails } from '../../../context/ExperienceAnalyticsGameDetailsProvider';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import type { TTableExportButtonProps } from './RAQIV2PredefinedTabbedExportButtonPropsProvider';
import { useTabbedTableExportButtonProps } from './RAQIV2PredefinedTabbedExportButtonPropsProvider';

type DataTableHeaderProps = {
  columnConfigs: TableColumnConfig<string>[];
  data: Map<string, CellDataType>[];
  titleKey?: TranslationKey;
  definitionTooltipKey?: TranslationKey;
  isDataLoading?: boolean;
  isInTabSwitchedContext?: boolean;
  fallbackFileName?: string;
  metricLabelsForExportLog?: FormattedText[];
  exportButtonConfig?: TGenericChartExportConfig;
  /**
   * When set, called whenever the table data updates with a getter for the
   * CSV exporter the parent can wire into a custom download-CSV control.
   *
   * The getter form lets the parent defer the (non-trivial)
   * GenericTableExporter allocation until the user actually triggers a
   * download — every render of this header otherwise produced an exporter
   * instance the parent never read. Passing `null` indicates the table is
   * loading or has no data to export.
   */
  onExporterReady?: (getExporter: (() => GenericCsvExporter) | null) => void;
  chartControl?: React.ReactNode;
};

const AnalyticsTableHeader = ({
  data,
  columnConfigs,
  titleKey,
  definitionTooltipKey,
  isDataLoading,
  isInTabSwitchedContext,
  fallbackFileName,
  metricLabelsForExportLog,
  exportButtonConfig,
  onExporterReady,
  chartControl,
}: DataTableHeaderProps) => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate, ready: translationReady } = translationDependencies;
  const tableExportButtonContext = useTabbedTableExportButtonProps();

  const gameDetails = useExperienceAnalyticsGameDetails();
  const exportButtonProps: TTableExportButtonProps = useMemo(() => {
    if (data.length === 0 || !translationReady || isDataLoading || gameDetails.isLoadingGame) {
      return null;
    }
    // Fall back to provided file name when titleKey is absent
    const fileName = titleKey ? translate(titleKey) : fallbackFileName || '';

    const columnNames = new Map<string, FormattedText>();
    columnConfigs.forEach((config) => {
      columnNames.set(
        config.columnKey,
        resolveTableColumnTitle(translate, config.titleKey, config.titleOverride),
      );
    });

    const columns = columnConfigs.map((config) => config.columnKey);

    return {
      telemetryContext: {
        kpiType: metricLabelsForExportLog?.join(',') || '',
      },
      columns,
      columnNames,
      rowData: data,
      columnConfigs,
      fileName,
    };
  }, [
    data,
    translationReady,
    isDataLoading,
    gameDetails,
    titleKey,
    translate,
    fallbackFileName,
    columnConfigs,
    metricLabelsForExportLog,
  ]);

  const exportButton = useMemo(() => {
    if (!exportButtonProps) {
      return null;
    }
    return <TableExportButton {...exportButtonProps} exportButtonConfig={exportButtonConfig} />;
  }, [exportButtonProps, exportButtonConfig]);

  useEffect(() => {
    if (isInTabSwitchedContext && exportButtonProps) {
      const { updateTableExportButtonProps } = tableExportButtonContext;
      updateTableExportButtonProps(exportButtonProps);
    }
  }, [exportButtonProps, isInTabSwitchedContext, tableExportButtonContext]);

  useEffect(() => {
    if (!onExporterReady) {
      return;
    }
    // `rowData.length === 0` is the equivalent of `GenericTableExporter`'s
    // `hasEmptyData` check, but we can evaluate it without instantiating the
    // exporter — keeping the "no data" signal cheap.
    if (!exportButtonProps || exportButtonProps.rowData.length === 0) {
      onExporterReady(null);
      return;
    }
    // Memoize via closure: repeated getter invocations within the lifetime of
    // this effect (i.e. for the same `exportButtonProps` snapshot) reuse one
    // exporter instance rather than reallocating per call.
    let cachedExporter: GenericCsvExporter | null = null;
    const getExporter = (): GenericCsvExporter => {
      if (cachedExporter) {
        return cachedExporter;
      }
      cachedExporter = new GenericTableExporter(
        exportButtonProps.columns,
        exportButtonProps.columnConfigs,
        exportButtonProps.columnNames,
        exportButtonProps.rowData,
        exportButtonProps.fileName,
      );
      return cachedExporter;
    };
    onExporterReady(getExporter);
  }, [exportButtonProps, onExporterReady]);

  if (!titleKey || !translationReady) {
    return;
  }

  return (
    <ChartHeader
      title={translate(titleKey)}
      definitionTooltip={definitionTooltipKey ? translate(definitionTooltipKey) : undefined}
      chartControl={chartControl}
      exportButton={exportButton}
    />
  );
};

export default memo(AnalyticsTableHeader);
