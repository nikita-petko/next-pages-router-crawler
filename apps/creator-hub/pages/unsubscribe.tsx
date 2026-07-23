import React, { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import CreatorSettingsLeftNavigation from '@modules/creator-settings/leftNavigation/CreatorSettingsLeftNavigation';
import UnsubscribeContainer from '@modules/creator-settings/container/unsubscribe/UnsubscribeContainer';
import MarketingEmailsUnsubscribeContainer from '@modules/creator-settings/container/unsubscribe/MarketingEmailsUnsubscribeContainer';
import UnsubscribePageLayout from '@modules/navigation/layout/components/UnsubscribePageLayout';
import { useSearchParams } from 'next/navigation';

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

  return <React.Fragment>{container}</React.Fragment>;
};

UnsubscribePage.getPageLayout = getUnsubscribePageLayout;

export default UnsubscribePage;
