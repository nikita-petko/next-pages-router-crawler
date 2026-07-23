import { Fragment, memo, useEffect, useMemo } from 'react';
import { Divider } from '@rbx/foundation-ui';
import { Tabs, Tab } from '@rbx/ui';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
// eslint-disable-next-line no-restricted-imports -- allow this for now and minimize import size
import { logPageTabView } from '@modules/experience-analytics-shared/logging/experienceAnalyticsUnifiedLogger';
import { useTabs } from './useTabs';

export type TabConfig<T extends string> = {
  key: T;
  label: string;
  content: React.ReactNode;
};

export type TabbedLayoutProps<T extends string> = {
  tabs: TabConfig<T>[];
  defaultTab?: T;
};

const getTabId = (key: string) => `tab-${key}`;
const getTabPanelId = (key: string) => `tabpanel-${key}`;

/**
 * URL-driven tabbed layout.
 *
 * Renders a `@rbx/ui` tab bar, a divider, and all tab panels concurrently
 * (visibility toggled via `hidden`). Tab state is managed internally via
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
 * <TabbedLayout tabs={tabs} defaultTab='overview' />
 * ```
 */
function GenericTabbedPageLayout<T extends string>({ tabs, defaultTab }: TabbedLayoutProps<T>) {
  const tabKeys = useMemo(() => tabs.map((t) => t.key), [tabs]);
  const { activeTab, setActiveTab } = useTabs(tabKeys, defaultTab);

  const { unifiedLogger } = useUnifiedLoggerProvider();

  useEffect(() => {
    if (activeTab) {
      logPageTabView(unifiedLogger, { tab: activeTab });
    }
  }, [activeTab, unifiedLogger]);

  return (
    <Fragment>
      <div>
        <Tabs
          value={activeTab}
          onChange={(_, value: T) => setActiveTab(value)}
          capitalize={false}
          scrollButtons={false}
          variant='scrollable'>
          {tabs.map(({ key, label }) => (
            <Tab
              key={key}
              id={getTabId(key)}
              aria-controls={getTabPanelId(key)}
              label={label}
              value={key}
            />
          ))}
        </Tabs>
        <Divider />
      </div>

      {tabs.map(({ key, content }) => (
        <div
          key={key}
          id={getTabPanelId(key)}
          aria-labelledby={getTabId(key)}
          role='tabpanel'
          hidden={activeTab !== key}>
          {content}
        </div>
      ))}
    </Fragment>
  );
}

export default memo(GenericTabbedPageLayout);
