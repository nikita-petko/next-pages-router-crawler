import React, { FunctionComponent, useEffect } from 'react';
import { Grid, Typography, Breadcrumbs } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Link, PageLoading } from '@modules/miscellaneous/common';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { SCROLL_CONTAINER_ID } from '@modules/navigation/layout/components/AppLayout';
import {
  LicenseManagerImpressionEvent,
  useLicenseManagerLoggerLogOnce,
} from '@modules/ip/license-manager/utils/logger';
import { useRobloxAuthentication } from '@rbx/auth';
import { HubMeta, SiteName, buildTitle } from '@rbx/creator-hub-history';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';

import { JsonLd } from '../components/JsonLd';

import useGetIPListing from '../hooks/useGetIPListing';
import { EXPLORE_LICENSES_HREF } from '../urls';
import LicensesList from '../components/LicensesList';
import ThumbnailCarousel from '../components/ThumbnailCarousel';

interface ListingDetailsContainerProps {
  listingId: string;
}

const BASE_URL = getProductionCreatorHubUrl(process.env.buildTarget);

/** A component that displays a full screen page of details of an IP listing. */
const ListingDetailsContainer: FunctionComponent<ListingDetailsContainerProps> = ({
  listingId,
}) => {
  const { translate } = useTranslation();
  const { status } = useRobloxAuthentication();

  const { logOnce } = useLicenseManagerLoggerLogOnce();

  // Wait for auth to settle before logging so isAuthenticated is accurate
  const isAuthResolved = status !== 'loading';
  useEffect(() => {
    if (isAuthResolved) {
      logOnce(LicenseManagerImpressionEvent.ViewListingDetailsImpressionEvent, {
        listingId,
        isAuthenticated: status === 'success',
      });
    }
  }, [isAuthResolved, listingId, logOnce, status]);

  // Resets user scroll position to the top of the page on navigation to this page
  useEffect(() => {
    document.getElementById(SCROLL_CONTAINER_ID)?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [listingId]);

  const { isPending, isError, data: listing } = useGetIPListing({ listingId });

  if (isPending) {
    return <PageLoading />;
  }

  if (isError || !listing) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
      />
    );
  }

  const canonicalUrl = `${BASE_URL}/explore/licenses/${listingId}`;
  const listingDescription = listing.description ?? '';

  return (
    <React.Fragment>
      <HubMeta
        title={listing.name ?? ''}
        seoTitle={buildTitle(SiteName.CreatorHub, translate('Label.Licenses'), listing.name)}
        description={listingDescription}
        canonical={canonicalUrl}
        ogUrl={canonicalUrl}
        ogType='website'
        type='licensing'
        entityName={listing.name ?? ''}
        entityId={listingId}
        breadcrumbItems={[
          { name: translate('Label.Licenses'), url: `${BASE_URL}/explore/licenses` },
          { name: listing.name ?? '', url: canonicalUrl },
        ]}>
        {/* CreativeWork JSON-LD - tells search engines this page represents a creative work (IP listing).
            Helps Google understand the content type for richer indexing and potential rich snippets. */}
        <JsonLd
          id='creativework-jsonld'
          data={{
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: listing.name,
            description: listingDescription,
            url: canonicalUrl,
            provider: { '@type': 'Organization', name: 'Roblox', url: 'https://www.roblox.com' },
          }}
        />
      </HubMeta>
      <Grid item paddingBottom={3} paddingLeft={4}>
        <Breadcrumbs aria-label='license-details-breadcrumb'>
          <Link href={EXPLORE_LICENSES_HREF} color='inherit'>
            <Typography variant='body1'>{translate('Label.Licenses')}</Typography>
          </Link>
          <Typography variant='body1' color='primary'>
            {listing.name}
          </Typography>
        </Breadcrumbs>
      </Grid>
      <Grid item overflow='hidden'>
        <ThumbnailCarousel assetIds={listing.thumbnailAssetIds ?? []} name={listing.name ?? ''} />
      </Grid>
      <Grid
        item
        container
        flexDirection='column'
        marginTop='-100px'
        padding={3}
        spacing={1.5}
        zIndex={2}>
        <Grid item container flexDirection='row'>
          <Grid
            item
            container
            XSmall={8}
            justifyContent='flex-start'
            alignItems='center'
            spacing={1.5}
            wrap='nowrap'>
            <Grid item container flexDirection='column' overflow='hidden'>
              <Grid item XSmall>
                <Typography
                  variant='h3'
                  display='block'
                  noWrap
                  data-testid='explore-listing-details-name'>
                  {listing.name}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Grid item container flexDirection='column' spacing={1.5} padding={1.5}>
          <Grid item>
            <Typography variant='h5'>{translate('Heading.About')}</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2' color='secondary' whiteSpace='pre-wrap'>
              {listing.description}
            </Typography>
          </Grid>
        </Grid>
        <Grid item padding={0.5}>
          <Typography variant='h5' data-testid='explore-listing-details-licenses-heading'>
            {translate('Heading.Licenses')}
          </Typography>
        </Grid>
        <Grid item>
          <LicensesList listingId={listingId} />
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default withTranslation(ListingDetailsContainer, [
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.Error,
  TranslationNamespace.Licenses,
  TranslationNamespace.Controls,
]);
