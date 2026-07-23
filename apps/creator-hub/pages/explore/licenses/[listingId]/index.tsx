import React, { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import AppNavigationLayout from '@modules/navigation/layout/components/AppLayout';
import ListingDetailsContainer from '@modules/licenses/containers/ListingDetailsContainer';
import IPContainer from '@modules/licenses/containers/IPContainer';
import { PageLoading } from '@modules/miscellaneous/common';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { StringLocaleMap } from '@modules/creator-settings/container/preferences/LocaleConstants';

const getLicenseDetailsPageLayout = (page: ReactNode) => (
  <AppNavigationLayout disableLeftNavigation>{page}</AppNavigationLayout>
);

const ListingDetails: NextLayoutPage = () => {
  const { translate } = useTranslation();
  const router = useRouter();

  if (!router.isReady) {
    return <PageLoading />;
  }

  if (router.query.listingId === undefined || typeof router.query.listingId !== 'string') {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
      />
    );
  }

  // If the listingId is a locale code, redirect to the explore licenses page
  // TODO - MUS-2133 - aquach - remove this once we have diagnosed and removed
  // where the locale code is being appended
  const potentialLocale = router.query.listingId.toLowerCase();
  if (StringLocaleMap.has(potentialLocale)) {
    router.push('/explore/licenses');
    return <PageLoading />;
  }

  return (
    <IPContainer>
      <ListingDetailsContainer listingId={router.query.listingId} />
    </IPContainer>
  );
};

ListingDetails.getPageLayout = getLicenseDetailsPageLayout;

export default ListingDetails;
