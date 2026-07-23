import type { FC } from 'react';
import React, { useCallback, useState, useMemo } from 'react';
import { Grid } from '@rbx/ui';
import ChartFooter from '@modules/charts-generic/charts/ChartFooter';
import ChartHeader from '@modules/charts-generic/charts/ChartHeader';
import TableExportButton from '@modules/charts-generic/charts/TableExportButton';
import GenericTabs from '@modules/charts-generic/tables/GenericTabs/GenericTabs';
import type { AnalyticsTabbedTableConfig } from '../../../constants/RAQIV2PredefinedTabbedTableConfigs';
import type { AnalyticsTableConfig } from '../../../constants/RAQIV2PredefinedTableConfig';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import AnalyticsConfigTable from './AnalyticsConfigTable';
import RAQIV2PredefinedTabbedExportButtonPropsProvider, {
  useTabbedTableExportButtonProps,
} from './RAQIV2PredefinedTabbedExportButtonPropsProvider';

type RAQIV2PredefinedTabbedTableProps = {
  config: AnalyticsTabbedTableConfig;
  chartContext: RAQIV2ChartContext;
  chartControl?: React.JSX.Element | null;
};

const RAQIV2PredefinedTabbedTableWithinProvider: FC<RAQIV2PredefinedTabbedTableProps> = ({
  config: tabbedTableConfig,
  chartContext,
  chartControl,
}) => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate } = translationDependencies;
  const predefinedSubTableKeys = tabbedTableConfig.tabs.map((config) => config.key);
  type TPredefinedSubTableKey = (typeof predefinedSubTableKeys)[number];
  const [activeTableKey, setActiveTableKey] = useState<TPredefinedSubTableKey>(
    predefinedSubTableKeys[0],
  );
  const [activeTableConfig, setActiveTableConfig] = useState<AnalyticsTableConfig>(
    tabbedTableConfig.tabs[0].config,
  );
  const { tableExportButtonProps } = useTabbedTableExportButtonProps();

  const handleTabSelect = useCallback(
    (tab: TPredefinedSubTableKey) => {
      const nextActiveTableConfig = tabbedTableConfig.tabs.find(
        (config) => config.key === tab,
      )?.config;
      if (nextActiveTableConfig) {
        setActiveTableKey(tab);
        setActiveTableConfig(nextActiveTableConfig);
      }
    },
    [tabbedTableConfig],
  );

  const tabs = useMemo(() => {
    return tabbedTableConfig.tabs.map((subTableConfig) => {
      return {
        key: subTableConfig.key,
        label: translate(subTableConfig.labelKey),
      };
    });
  }, [tabbedTableConfig, translate]);

  const exportButton = useMemo(() => {
    return tableExportButtonProps ? <TableExportButton {...tableExportButtonProps} /> : null;
  }, [tableExportButtonProps]);

  const tableHeader = useMemo(() => {
    const { titleKey, tooltipKey } = tabbedTableConfig;
    return (
      <ChartHeader
        title={translate(titleKey)}
        definitionTooltip={tooltipKey ? translate(tooltipKey) : undefined}
        chartControl={chartControl}
        exportButton={exportButton}
      />
    );
  }, [tabbedTableConfig, translate, chartControl, exportButton]);

  const tableFooter = useMemo(() => {
    const tableConfig = tabbedTableConfig.tabs.find((config) => config.key === activeTableKey);
    return tableConfig?.footerKey ? (
      <ChartFooter warnings={[translate(tableConfig.footerKey)]} />
    ) : null;
  }, [tabbedTableConfig, activeTableKey, translate]);

  return (
    <Grid container item XSmall={12} direction='row'>
      <Grid item XSmall={12}>
        {tableHeader}
      </Grid>
      <GenericTabs
        mobileLabel={translate(tabbedTableConfig.tabMobileLabelKey)}
        tabs={tabs}
        activeTab={activeTableKey}
        onTabSelected={handleTabSelect}
      />
      <AnalyticsConfigTable
        key={activeTableKey}
        config={activeTableConfig}
        tableContext={chartContext}
        isInTabSwitchedContext
      />
      {tableFooter}
    </Grid>
  );
};

const AnalyticsConfigTabbedTable: FC<RAQIV2PredefinedTabbedTableProps> = ({
  chartControl,
  ...props
}) => {
  return (
    <RAQIV2PredefinedTabbedExportButtonPropsProvider>
      <RAQIV2PredefinedTabbedTableWithinProvider chartControl={chartControl} {...props} />
    </RAQIV2PredefinedTabbedExportButtonPropsProvider>
  );
};

export default React.memo(AnalyticsConfigTabbedTable);
