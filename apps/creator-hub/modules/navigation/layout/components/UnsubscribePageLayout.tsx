import React, { FunctionComponent } from 'react';
import { useSearchParams } from 'next/navigation';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import BasicLayout from './BasicLayout';
import AppLayout from './AppLayout';

interface UnsubscribePageLayoutProps {
  leftNavigationContents: React.ReactNode;
  page: React.ReactNode;
}

const UnsubscribePageLayout: FunctionComponent<
  React.PropsWithChildren<UnsubscribePageLayoutProps>
> = ({ leftNavigationContents, page }) => {
  const searchParams = useSearchParams();
  const notificationType = searchParams.get('notificationType');
  const isUnsubscribeMarketing = notificationType === 'MarketingEmails';

  return isUnsubscribeMarketing ? (
    <BasicLayout showHeader={!isUnsubscribeMarketing}>{page}</BasicLayout>
  ) : (
    <AppLayout leftNavigationContents={leftNavigationContents}>{page}</AppLayout>
  );
};

export default withTranslation(UnsubscribePageLayout, [TranslationNamespace.UnifiedNavigation]);
