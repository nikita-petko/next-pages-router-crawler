import type { FC } from 'react';
import React, { Fragment } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Divider, Tab, Tabs } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type DataSharingTabKey from '../enums/DataSharingTabKey';

export type TabConfig = {
  label: string;
  key: DataSharingTabKey;
};

type DataSharingTabsProps = {
  tabs: Array<TabConfig>;
  currentTabKey: DataSharingTabKey;
  onTabChange: (key: DataSharingTabKey) => void;
};

const DataSharingTabs: FC<DataSharingTabsProps> = ({ tabs, currentTabKey, onTabChange }) => {
  const { translate } = useTranslation();
  return (
    <>
      <Tabs
        value={currentTabKey}
        onChange={(_, value) => onTabChange(value)}
        orientation='horizontal'
        scrollButtons='auto'
        variant='standard'
        data-testid='tabs-container'>
        {tabs.map((tab) => (
          <Tab
            label={translate(tab.label)}
            value={tab.key}
            key={tab.key}
            data-testid={`tab-${tab.key}`}
          />
        ))}
      </Tabs>
      <Divider />
    </>
  );
};

export default withTranslation(DataSharingTabs, [TranslationNamespace.DataSharingSettingsV2]);
