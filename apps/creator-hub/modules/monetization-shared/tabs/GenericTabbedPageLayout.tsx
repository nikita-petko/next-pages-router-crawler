import { memo, useCallback, useEffect, useMemo, type SyntheticEvent } from 'react';
import { buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { Divider } from '@rbx/foundation-ui';
import { Tabs, Tab } from '@rbx/ui';
import type { AnalyticsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { logPageTabView } from '@modules/experience-analytics-shared/logging/experienceAnalyticsUnifiedLogger';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useTabs } from './useTabs';

/** The active tab body; every `Tab`’s `aria-controls` point here (single visible tabpanel). */
export const GENERIC_TABBED_PAGE_LAYOUT_PANEL_ID = 'generic-tabbed-page-layout-panel';

export type TabConfig<T extends string> = {
  key: T;
  label: string;
  content: React.ReactNode;
};

export type TabbedLayoutProps<T extends string> = {
  tabs: TabConfig<T>[];
  defaultTab?: T;
  /** Matches the legacy analytics layout: when provided, HubMeta uses the active tab label. */
  navigationItem?: AnalyticsNavigationItem;
};

const getTabId = (key: string) => `tab-${key}`;

/**
 * URL-driven tabbed layout.
 *
 * Renders a `@rbx/ui` tab bar, a divider, and all tab panels concurrently
 * (visibility toggled via mount). Tab state is managed internally via
 * the `useTabs` hook (reads/writes `?tab=` in the URL).
 *
 * Requires at least one tab to be provided.
 *
 * @example
 * ```tsx
 * const tabs = [
 *   { key: 'overview', label: translate('Heading.Overview'), content: <Overview /> },
 *   { key: 'activity', label: translate('Heading.Activity'), content: <Activity /> },
 * ];
 *
 * <GenericTabbedPageLayout tabs={tabs} defaultTab='overview' />
 * ```
 */
function GenericTabbedPageLayout<T extends string>({
  tabs,
  defaultTab,
  navigationItem,
}: TabbedLayoutProps<T>) {
  const tabKeys = useMemo(() => tabs.map((t) => t.key), [tabs]);
  const { activeTab, setActiveTab } = useTabs(tabKeys, defaultTab);

  const tabContentByKey = useMemo(
    () => new Map(tabs.map((tab) => [tab.key, tab.content] as const)),
    [tabs],
  );
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const handleTabChange = useCallback(
    (_: SyntheticEvent, value: T) => {
      setActiveTab(value);
    },
    [setActiveTab],
  );

  useEffect(() => {
    if (activeTab) {
      logPageTabView(unifiedLogger, { tab: activeTab });
    }
  }, [activeTab, unifiedLogger]);

  const activeContent = tabContentByKey.get(activeTab);

  const activeTabLabel = useMemo(
    () => tabs.find((tab) => tab.key === activeTab)?.label,
    [tabs, activeTab],
  );
  const hubMetaTitle = useMemo(
    () => (navigationItem ? buildTitle(activeTabLabel) : undefined),
    [navigationItem, activeTabLabel],
  );

  return (
    <>
      {hubMetaTitle && <HubMeta hubOnly title={hubMetaTitle} />}
      <div>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          capitalize={false}
          scrollButtons={false}
          variant='scrollable'>
          {tabs.map(({ key, label }) => (
            <Tab
              key={key}
              id={getTabId(key)}
              aria-controls={GENERIC_TABBED_PAGE_LAYOUT_PANEL_ID}
              label={label}
              value={key}
            />
          ))}
        </Tabs>
        <Divider />
      </div>

      <div
        key={activeTab}
        id={GENERIC_TABBED_PAGE_LAYOUT_PANEL_ID}
        aria-labelledby={getTabId(activeTab)}
        role='tabpanel'
        className='min-height-[320px]'>
        {activeContent ?? null}
      </div>
    </>
  );
}

export default memo(GenericTabbedPageLayout);
