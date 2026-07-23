import React, { FunctionComponent, createContext, useContext, useMemo } from 'react';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { AnalyticsQueryParams } from '@modules/charts-generic';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import emptyFunction from '../emptyFunction';
import { logTabChange } from '../logging/experienceAnalyticsUnifiedLogger';

type AnalyticsTabBundleRaw = {
  tabKeyRaw: string | null;
  onKnownTabChange: (tab: string, knownTabs: Readonly<Array<string>>) => void;
};

export const DefaultAnalyticsTabLayoutBundleContext: AnalyticsTabBundleRaw = {
  tabKeyRaw: null,
  onKnownTabChange: emptyFunction,
};

export const AnalyticsTabLayoutBundleContext = createContext<AnalyticsTabBundleRaw>(
  DefaultAnalyticsTabLayoutBundleContext,
);
AnalyticsTabLayoutBundleContext.displayName = 'AnalyticsTabLayoutBundle';

export const useAnalyticsTabLayoutBundle = (tabKeys: Readonly<Array<string>>) => {
  const { tabKeyRaw, onKnownTabChange } = useContext(AnalyticsTabLayoutBundleContext);
  return useMemo(() => {
    const tabKey = tabKeyRaw && tabKeys.includes(tabKeyRaw) ? tabKeyRaw : null;
    const onTabChange = (tab: string) => onKnownTabChange(tab, tabKeys);
    return {
      tabKey: tabKey ?? tabKeys[0],
      onTabChange,
    };
  }, [tabKeyRaw, tabKeys, onKnownTabChange]);
};

export function useAnalyticsEnumTabLayoutBundle<TTab extends string>(
  tabKeys: Readonly<Array<TTab>>,
): {
  tabKey: TTab;
  onTabChange: (tab: TTab) => void;
} {
  const { tabKeyRaw, onKnownTabChange } = useContext(AnalyticsTabLayoutBundleContext);
  return useMemo(() => {
    const tabKeyTyped: TTab | null = tabKeyRaw as TTab | null;
    const tabKey = tabKeyTyped && tabKeys.includes(tabKeyTyped) ? tabKeyTyped : null;
    const onTabChange = (tab: TTab) => onKnownTabChange(tab, tabKeys);
    return {
      tabKey: tabKey ?? tabKeys[0],
      onTabChange,
    };
  }, [tabKeyRaw, tabKeys, onKnownTabChange]);
}

const AnalyticsTabLayoutBundleProvider: FunctionComponent<React.PropsWithChildren> = ({
  children,
}) => {
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const [tabQueryParams, setTabQueryParams] = useQueryParams([AnalyticsQueryParams.Tab]);
  const currentTab = useMemo(() => {
    const tabFromParams = Array.isArray(tabQueryParams.tab)
      ? tabQueryParams.tab[0]
      : tabQueryParams.tab;
    return tabFromParams ?? null;
  }, [tabQueryParams.tab]);

  const bundle: AnalyticsTabBundleRaw = useMemo(() => {
    const onKnownTabChange = (tab: string, knownTabs: Readonly<Array<string>>) => {
      if (!knownTabs.includes(tab)) {
        return;
      }
      logTabChange(unifiedLogger, { newTab: tab, tabs: knownTabs });
      setTabQueryParams({
        [AnalyticsQueryParams.Tab]: tab,
      });
    };
    return {
      tabKeyRaw: currentTab,
      onKnownTabChange,
    };
  }, [currentTab, setTabQueryParams, unifiedLogger]);

  return (
    <AnalyticsTabLayoutBundleContext.Provider value={bundle}>
      {children}
    </AnalyticsTabLayoutBundleContext.Provider>
  );
};
export default AnalyticsTabLayoutBundleProvider;
