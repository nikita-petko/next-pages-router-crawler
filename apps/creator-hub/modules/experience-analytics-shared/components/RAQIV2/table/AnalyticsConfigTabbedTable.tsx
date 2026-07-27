import type { FC } from 'react';
import React, { useCallback, useState, useMemo } from 'react';
import { Grid } from '@rbx/ui';
import ChartFooter from '@modules/charts-generic/charts/ChartFooter';
import ChartHeader from '@modules/charts-generic/charts/ChartHeader';
import TableExportButton from '@modules/charts-generic/charts/TableExportButton';
import GenericTabs from '@modules/charts-generic/tables/GenericTabs/GenericTabs';
import { isAnalyticsTableWithControlConfig } from '../../../constants/RAQIV2PredefinedTabbedTableConfigs';
import type { AnalyticsTabbedTableConfig } from '../../../constants/RAQIV2PredefinedTabbedTableConfigs';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import AnalyticsConfigTabbedTableDropdownControl from './AnalyticsConfigTabbedTableDropdownControl';
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
  const [selectedOptionKeyByControlKey, setSelectedOptionKeyByControlKey] = useState<
    Record<string, string>
  >({});
  const { tableExportButtonProps } = useTabbedTableExportButtonProps();

  const handleTabSelect = useCallback(
    (tab: TPredefinedSubTableKey) => {
      const tabExists = tabbedTableConfig.tabs.some((config) => config.key === tab);
      if (tabExists) {
        setActiveTableKey(tab);
      }
    },
    [tabbedTableConfig],
  );

  const handleControlOptionSelected = useCallback((controlKey: string, optionKey: string) => {
    setSelectedOptionKeyByControlKey((prev) => ({ ...prev, [controlKey]: optionKey }));
  }, []);

  const activeTab = useMemo(
    () => tabbedTableConfig.tabs.find((config) => config.key === activeTableKey),
    [tabbedTableConfig, activeTableKey],
  );

  const activeTableWithControl = useMemo(() => {
    const config = activeTab?.config;
    return config && isAnalyticsTableWithControlConfig(config) ? config : undefined;
  }, [activeTab]);

  const selectedOptionKey = useMemo(() => {
    if (!activeTableWithControl) {
      return undefined;
    }
    const persistedOptionKey = selectedOptionKeyByControlKey[activeTableWithControl.key];
    const isPersistedOptionValid = activeTableWithControl.options.some(
      (option) => option.key === persistedOptionKey,
    );
    if (isPersistedOptionValid) {
      return persistedOptionKey;
    }
    return activeTableWithControl.defaultOptionKey ?? activeTableWithControl.options[0].key;
  }, [activeTableWithControl, selectedOptionKeyByControlKey]);

  const handleActiveTableControlOptionSelected = useCallback(
    (optionKey: string) => {
      if (activeTableWithControl) {
        handleControlOptionSelected(activeTableWithControl.key, optionKey);
      }
    },
    [activeTableWithControl, handleControlOptionSelected],
  );

  const activeTableConfig = useMemo(() => {
    if (activeTableWithControl && selectedOptionKey) {
      const selectedOption = activeTableWithControl.options.find(
        (option) => option.key === selectedOptionKey,
      );
      if (selectedOption) {
        return selectedOption.config;
      }
    }
    return activeTab && !isAnalyticsTableWithControlConfig(activeTab.config)
      ? activeTab.config
      : undefined;
  }, [activeTab, activeTableWithControl, selectedOptionKey]);

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
    return activeTab?.footerKey ? (
      <ChartFooter warnings={[translate(activeTab.footerKey)]} />
    ) : null;
  }, [activeTab, translate]);

  return (
    <Grid container item XSmall={12} direction='row'>
      <Grid item XSmall={12}>
        {tableHeader}
      </Grid>
      <div className='flex flex-row items-center justify-between wrap gap-small width-full'>
        <GenericTabs
          mobileLabel={translate(tabbedTableConfig.tabMobileLabelKey)}
          tabs={tabs}
          activeTab={activeTableKey}
          onTabSelected={handleTabSelect}
        />
        {activeTableWithControl && selectedOptionKey && (
          <AnalyticsConfigTabbedTableDropdownControl
            tableWithControl={activeTableWithControl}
            selectedOptionKey={selectedOptionKey}
            onOptionSelected={handleActiveTableControlOptionSelected}
          />
        )}
      </div>
      {activeTableConfig && (
        <AnalyticsConfigTable
          key={`${activeTableKey}:${selectedOptionKey ?? ''}`}
          config={activeTableConfig}
          tableContext={chartContext}
          isInTabSwitchedContext
        />
      )}
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
