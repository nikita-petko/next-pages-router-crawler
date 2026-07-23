import { useEffect } from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsSubscriptionsNavigationItem } from '@modules/charts-generic';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import SubscriptionsPageContentContainer from '@modules/experience-monetization/pages/Subscriptions/SubscriptionsPageContentContainer';
import { useHasUserSeenSubscriptionsNew } from '@modules/experience-navigation/components/SubscriptionsNewChip';

const SubscriptionsPage: NextLayoutPage = () => {
  const { setHasUserSeen } = useHasUserSeenSubscriptionsNew();
  useEffect(() => {
    setHasUserSeen(true);
  }, [setHasUserSeen]);

  return <SubscriptionsPageContentContainer />;
};

SubscriptionsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsSubscriptionsNavigationItem });

export default SubscriptionsPage;
