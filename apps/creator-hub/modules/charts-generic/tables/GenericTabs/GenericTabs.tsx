import type { ReactNode } from 'react';
import React, { useCallback, useMemo } from 'react';
import type { TTabsProps } from '@rbx/ui';
import { Tabs, Tab } from '@rbx/ui';
import useGenericTabsStyles from './GenericTabs.styles';

type TabSpec<TTabKey> = {
  key: TTabKey;
  label: ReactNode;
};

type TGenericTabsProps<TTabKey> = {
  mobileLabel: ReactNode;
  tabs: TabSpec<TTabKey>[];
  activeTab: TTabKey;
  onTabSelected: (tabKey: TTabKey) => void;
};
const GenericTabs = <TTabKey extends string | number>({
  tabs,
  activeTab,
  onTabSelected,
}: TGenericTabsProps<TTabKey>) => {
  const {
    classes: { tabRoot, tabsRoot },
  } = useGenericTabsStyles();

  const renderChildren = useMemo(
    () =>
      tabs.map((tab) => {
        return <Tab key={tab.key} value={tab.key} label={tab.label} classes={{ root: tabRoot }} />;
      }),
    [tabs, tabRoot],
  );

  const handleOnTabSelected: TTabsProps['onChange'] = useCallback(
    (event: React.ChangeEvent<{}>, value: TTabKey) => {
      onTabSelected(value);
    },
    [onTabSelected],
  );

  return (
    <Tabs
      data-testid='generic-tabs'
      value={activeTab}
      onChange={handleOnTabSelected}
      orientation='horizontal'
      variant='scrollable'
      scrollButtons={false}
      classes={{ root: tabsRoot }}>
      {renderChildren}
    </Tabs>
  );
};

export default GenericTabs;
