import { Divider, Tab, Tabs } from '@rbx/ui';
import React, { FC, Fragment } from 'react';
import { FormattedText } from '@modules/analytics-translations';
import { useAnalyticsTabLayoutBundle } from '../context/AnalyticsTabLayoutBundleProvider';
import { type OnboardingTipsConfigs } from '../constants/onboardingTipsConfigs';
import OnboardingTipsCarousel from './OnboardingTips/OnboardingTipsCarousel';

type TabConfig = {
  label: FormattedText;
  key: string;
  onboardingTipsConfig?: OnboardingTipsConfigs;
};

type AnalyticsTabsProps = {
  tabs: Array<TabConfig>;
};

const AnalyticsTabs: FC<AnalyticsTabsProps> = ({ tabs }) => {
  const { tabKey, onTabChange } = useAnalyticsTabLayoutBundle(tabs.map((tab) => tab.key));
  return (
    <Fragment>
      <Tabs
        value={tabKey}
        onChange={(_, value) => onTabChange(value)}
        orientation='horizontal'
        variant='scrollable'
        data-testid='analytics-tabs'>
        {tabs.map((tab) => (
          <Tab
            label={
              <span>
                {tab.label}
                {tab.onboardingTipsConfig && (
                  <OnboardingTipsCarousel
                    featureKey={tab.onboardingTipsConfig.featureKey}
                    stepKey={tab.onboardingTipsConfig.stepKey}
                    isClosed={tabKey !== tab.key}
                  />
                )}
              </span>
            }
            value={tab.key}
            key={tab.key}
          />
        ))}
      </Tabs>
      <Divider />
    </Fragment>
  );
};

export default AnalyticsTabs;
