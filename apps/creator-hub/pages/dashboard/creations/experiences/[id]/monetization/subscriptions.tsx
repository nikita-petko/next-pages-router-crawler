import { useEffect } from 'react';
import type { NextLayoutPage } from 'next';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import SubscriptionsPageContentContainer from '@modules/experience-monetization/pages/Subscriptions/SubscriptionsPageContentContainer';
import SubscriptionsPageTitle from '@modules/experience-monetization/pages/Subscriptions/SubscriptionsPageTitle';
import { useHasUserSeenSubscriptionsNew } from '@modules/experience-navigation/components/SubscriptionsNewChip';

const SubscriptionsPage: NextLayoutPage = () => {
  const { setHasUserSeen } = useHasUserSeenSubscriptionsNew();
  useEffect(() => {
    setHasUserSeen(true);
  }, [setHasUserSeen]);

  return <SubscriptionsPageContentContainer />;
};

SubscriptionsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    noNavigationItem: true,
    context: { title: <SubscriptionsPageTitle /> },
  });
SubscriptionsPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default SubscriptionsPage;
