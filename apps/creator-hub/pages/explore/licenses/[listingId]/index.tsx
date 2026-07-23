import type { ReactNode, FunctionComponent } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import { Breadcrumbs, Typography } from '@rbx/ui';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import { StringLocaleMap } from '@modules/creator-settings/container/preferences/LocaleConstants';
import IPContainer from '@modules/licenses/containers/IPContainer';
import ListingDetailsContainer from '@modules/licenses/containers/ListingDetailsContainer';
import { useGetIPListing } from '@modules/licenses/hooks/useGetIPListing';
import { EXPLORE_LICENSES_HREF } from '@modules/licenses/urls';
import { Link, PageLoading } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';

const ListingDetailsBreadcrumbs: FunctionComponent<{ listingId: string }> = ({ listingId }) => {
  const { translate } = useTranslation();
  const { data: listing } = useGetIPListing({ listingId });
  return (
    <Breadcrumbs aria-label='license-details-breadcrumb'>
      <Link href={EXPLORE_LICENSES_HREF} color='inherit'>
        <Typography variant='body1'>{translate('Label.Licenses')}</Typography>
      </Link>
      <Typography variant='body1' color='primary'>
        {listing?.name}
      </Typography>
    </Breadcrumbs>
  );
};

const getLicenseDetailsPageLayout = (
  page: ReactNode,
  { query }: { query: { listingId?: string | string[] } },
) => {
  const listingId = typeof query.listingId === 'string' ? query.listingId : undefined;
  return (
    <CreatorHubLayout
      disableLeftNavigation
      noBreadCrumbs
      title={
        listingId !== undefined ? <ListingDetailsBreadcrumbs listingId={listingId} /> : undefined
      }>
      {page}
    </CreatorHubLayout>
  );
};

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
    void router.push('/explore/licenses');
    return <PageLoading />;
  }

  return (
    <IPContainer>
      <ListingDetailsContainer listingId={router.query.listingId} />
    </IPContainer>
  );
};

ListingDetails.getPageLayout = getLicenseDetailsPageLayout;
ListingDetails.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default ListingDetails;
