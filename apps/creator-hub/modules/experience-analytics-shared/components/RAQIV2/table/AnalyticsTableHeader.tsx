import React, { memo, useMemo, useEffect } from 'react';
import { FormattedText, TranslationKey } from '@modules/analytics-translations';
import {
  CellDataType,
  ChartHeader,
  resolveTableColumnTitle,
  TableColumnConfig,
  TableExportButton,
  TGenericChartExportConfig,
} from '@modules/charts-generic';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import { useExperienceAnalyticsGameDetails } from '../../../context/ExperienceAnalyticsGameDetailsProvider';
import {
  TTableExportButtonProps,
  useTabbedTableExportButtonProps,
} from './RAQIV2PredefinedTabbedExportButtonPropsProvider';

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

  if (!titleKey || !translationReady) {
    return undefined;
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
