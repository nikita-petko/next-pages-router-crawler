import type { FC } from 'react';
import { Divider, Tab, Tabs } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import type { OnboardingTipsConfigs } from '../constants/onboardingTipsConfigs';
import { useAnalyticsTabLayoutBundle } from '../context/AnalyticsTabLayoutBundleProvider';
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
    <>
      <Tabs
        value={tabKey}
        onChange={(_, value: unknown) => {
          if (typeof value === 'string') {
            onTabChange(value);
          }
        }}
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
                    isClosed={tab.onboardingTipsConfig.isClosed ?? tabKey !== tab.key}
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
    </>
  );
};

export default AnalyticsTabs;
