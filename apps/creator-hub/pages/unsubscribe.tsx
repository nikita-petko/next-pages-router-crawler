import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useSearchParams } from 'next/navigation';
import MarketingEmailsUnsubscribeContainer from '@modules/creator-settings/container/unsubscribe/MarketingEmailsUnsubscribeContainer';
import UnsubscribeContainer from '@modules/creator-settings/container/unsubscribe/UnsubscribeContainer';
import CreatorSettingsLeftNavigation from '@modules/creator-settings/leftNavigation/CreatorSettingsLeftNavigation';
import UnsubscribePageLayout from '@modules/navigation/layout/components/UnsubscribePageLayout';

const getUnsubscribePageLayout = (page: ReactNode) => (
  <UnsubscribePageLayout leftNavigationContents={<CreatorSettingsLeftNavigation />} page={page} />
);

const UnsubscribePage: NextLayoutPage = () => {
  const searchParams = useSearchParams();
  const notificationType = searchParams.get('notificationType');
  const isUnsubscribeMarketing = notificationType === 'MarketingEmails';
  const container = isUnsubscribeMarketing ? (
    <MarketingEmailsUnsubscribeContainer />
  ) : (
    <UnsubscribeContainer />
  );

  return <>{container}</>;
};

UnsubscribePage.getPageLayout = getUnsubscribePageLayout;
UnsubscribePage.loggerConfig = { rosId: RosTeams.CreatorHubPlatform };

export default UnsubscribePage;
