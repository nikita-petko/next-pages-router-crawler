import type { FunctionComponent } from 'react';
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Translate, withTranslation } from '@rbx/intl';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import BasicLayout from './BasicLayout';

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
    <CreatorHubLayout
      title={
        <Translate translationKey='Title.Unsubscribe' namespace={TranslationNamespace.Settings} />
      }
      noBreadCrumbs
      leftNavigationContents={leftNavigationContents}>
      {page}
    </CreatorHubLayout>
  );
};

export default withTranslation(UnsubscribePageLayout, [TranslationNamespace.UnifiedNavigation]);
