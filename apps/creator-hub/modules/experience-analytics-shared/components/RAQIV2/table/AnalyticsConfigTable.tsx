import React, { FC, useMemo } from 'react';
import useRAQIV2PredefinedWarnings from '../../../hooks/useRAQIV2PredefinedWarnings';
import RAQIV2TableContext from '../../../types/RAQIV2TableContext';
import computeRAQIV2SpecOverride from '../../../utils/computeRAQIV2SpecOverride';
import { AnalyticsTableConfig } from '../../../constants/RAQIV2PredefinedTableConfig';
import AnalyticsDataTable from './AnalyticsDataTable';
import { isCustomTableColumnConfig } from '../../../constants/RAQIV2PredefinedTableColumnConfig';
import { MetricTableColumnSpec } from './types';

export type RAQIV2PredefinedTableProps = {
  config: AnalyticsTableConfig;
  tableContext: RAQIV2TableContext;
  isInTabSwitchedContext?: boolean;
  rowRange?: {
    start: number;
    end: number;
  };
  chartControl?: React.JSX.Element | null;
};

const AnalyticsConfigTable: FC<RAQIV2PredefinedTableProps> = ({
  config,
  tableContext,
  isInTabSwitchedContext,
  rowRange,
  chartControl,
}) => {
  const { dataColumns, breakdowns, pagination, ...otherConfig } = config;
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

  const chartWarnings = useRAQIV2PredefinedWarnings(metricDataColumnSpecs);

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
    />
  );
};

export default AnalyticsConfigTable;
