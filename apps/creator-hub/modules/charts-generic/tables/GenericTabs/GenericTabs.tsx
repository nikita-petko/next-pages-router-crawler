import React, { ReactNode, useCallback, useMemo } from 'react';
import { useMediaQuery, Tabs, Tab, MenuItem, Select, TTabsProps, TSelectProps } from '@rbx/ui';
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
  mobileLabel,
  tabs,
  activeTab,
  onTabSelected,
}: TGenericTabsProps<TTabKey>) => {
  const {
    classes: { tabsIndicator, tabRoot, tabsRoot, selectedFirstTab, selectedLastTab },
    cx,
  } = useGenericTabsStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const renderChildren = useMemo(
    () =>
      tabs.map((tab) => {
        if (!isCompactView) {
          return (
            <Tab key={tab.key} value={tab.key} label={tab.label} classes={{ root: tabRoot }} />
          );
        }
        return (
          <MenuItem key={tab.key} value={tab.key}>
            {tab.label}
          </MenuItem>
        );
      }),
    [tabs, isCompactView, tabRoot],
  );

  const handleOnTabSelected: TTabsProps['onChange'] = useCallback(
    (event: React.ChangeEvent<{}>, value: TTabKey) => {
      onTabSelected(value);
    },
    [onTabSelected],
  );

  const handleOnMenuSelected: TSelectProps['onChange'] = useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      onTabSelected(event.target.value as TTabKey);
    },
    [onTabSelected],
  );

  if (!isCompactView) {
    return (
      <Tabs
        data-testid='generic-tabs'
        value={activeTab}
        onChange={handleOnTabSelected}
        orientation='horizontal'
        variant='fullWidth'
        classes={{
          indicator: tabsIndicator,
          root: cx(tabsRoot, {
            [selectedFirstTab]: activeTab === tabs[0].key,
            [selectedLastTab]: activeTab === tabs[tabs.length - 1].key,
          }),
        }}>
        {renderChildren}
      </Tabs>
    );
  }
  return (
    <Select
      data-testid='mobile-tabs'
      value={activeTab}
      onChange={handleOnMenuSelected}
      label={mobileLabel}
      classes={{ root: tabsRoot }}
      fullWidth
      size='small'>
      {renderChildren}
    </Select>
  );
};

export default GenericTabs;
