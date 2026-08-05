import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useRobloxAuthentication } from '@rbx/auth';
import { HubMeta, SiteName, buildTitle } from '@rbx/creator-hub-history';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useFlag } from '@rbx/flags';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import { isShowcaseExperiencesEnabled as isShowcaseExperiencesEnabledFlag } from '@generated/flags/contentLicensing';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { SCROLL_CONTAINER_ID } from '@modules/creator-hub-layout/CreatorHubLayoutInner';
import ShowcaseContentTile from '@modules/ip/license-manager/components/ShowcaseContentTile';
import { EXTERNAL_EXPERIENCE_HREF } from '@modules/ip/license-manager/urls';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
  useLicenseManagerLoggerLogOnce,
} from '@modules/ip/license-manager/utils/logger';
import { PageLoading } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { JsonLd } from '../components/JsonLd';
import LicensesList from '../components/LicensesList';
import ShowcaseContentCarousel from '../components/ShowcaseContentCarousel';
import ThumbnailCarousel from '../components/ThumbnailCarousel';
import useGetIPListing from '../hooks/useGetIPListing';
import useGetPublicListingShowcaseContent from '../hooks/useGetPublicListingShowcaseContent';
import useGetShowcaseExperienceDetails from '../hooks/useGetShowcaseExperienceDetails';
import { getListingThumbnailAssetIds } from '../utils/listingThumbnails';

interface ListingDetailsContainerProps {
  listingId: string;
}

const BASE_URL = getProductionCreatorHubUrl(process.env.buildTarget);

const EMPTY_THUMBNAIL_ASSET_IDS: number[] = [];

/** A component that displays a full screen page of details of an IP listing. */
const ListingDetailsContainer: FunctionComponent<ListingDetailsContainerProps> = ({
  listingId,
}) => {
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const { status } = useRobloxAuthentication();
  const { ready: isShowcaseExperiencesFlagReady, value: isShowcaseExperiencesEnabled } = useFlag(
    isShowcaseExperiencesEnabledFlag,
  );
  const showcasedExperiencesLabel = tPendingTranslation(
    'Showcased experiences',
    'Section heading for experiences showcased on an IP listing details page',
    translationKey('Label.ShowcasedExperiences', TranslationNamespace.AgreementsManager),
  );
  const previousShowcasedContentAriaLabel = tPendingTranslation(
    'Previous showcased content',
    'Accessible label for the previous button in the showcased content carousel',
    translationKey('Action.PreviousShowcasedContent', TranslationNamespace.Licenses),
  );
  const nextShowcasedContentAriaLabel = tPendingTranslation(
    'Next showcased content',
    'Accessible label for the next button in the showcased content carousel',
    translationKey('Action.NextShowcasedContent', TranslationNamespace.Licenses),
  );

  const { logEvent } = useLicenseManagerLogger();
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
  const showcaseContentEnabled = isShowcaseExperiencesFlagReady && isShowcaseExperiencesEnabled;
  const showcaseContentRequest = useGetPublicListingShowcaseContent({
    listingId,
    enabled: showcaseContentEnabled,
  });
  const showcasedUniverseIds = useMemo(() => {
    return (
      showcaseContentRequest.data.content?.flatMap((contentReference) => {
        const universeId = Number(contentReference.contentId);
        return contentReference.contentType === 'Universe' &&
          Number.isSafeInteger(universeId) &&
          universeId > 0
          ? [universeId]
          : [];
      }) ?? []
    );
  }, [showcaseContentRequest.data.content]);
  const uniqueShowcasedUniverseIds = useMemo(
    () => [...new Set(showcasedUniverseIds)],
    [showcasedUniverseIds],
  );
  const showcaseExperienceDetailsRequest = useGetShowcaseExperienceDetails({
    universeIds: uniqueShowcasedUniverseIds,
    enabled:
      showcaseContentEnabled &&
      !showcaseContentRequest.isPending &&
      !showcaseContentRequest.isError,
  });
  const handleShowcaseContentClick = useCallback(
    (universeId: number, contentPosition: number) => {
      logEvent(LicenseManagerClickEvent.PublicListingDetailsPageShowcaseContentClickEvent, {
        listingId,
        contentType: 'Universe',
        contentId: universeId,
        contentPosition,
      });
    },
    [listingId, logEvent],
  );
  const showcasedCarouselItems = useMemo(() => {
    const detailsByUniverseId = new Map(
      (showcaseExperienceDetailsRequest.data?.data ?? []).flatMap((details) =>
        details.id == null ? [] : [[details.id, details] as const],
      ),
    );
    return showcasedUniverseIds.flatMap((universeId, index) => {
      const details = detailsByUniverseId.get(universeId);
      if (details == null) {
        return [];
      }
      return [
        {
          id: `Universe:${universeId}:${index}`,
          content: (
            <ShowcaseContentTile
              universeId={universeId}
              name={details.name ?? ''}
              link={
                details.rootPlaceId != null
                  ? EXTERNAL_EXPERIENCE_HREF(details.rootPlaceId)
                  : undefined
              }
              onClick={() => handleShowcaseContentClick(universeId, index + 1)}
            />
          ),
        },
      ];
    });
  }, [
    handleShowcaseContentClick,
    showcaseExperienceDetailsRequest.data?.data,
    showcasedUniverseIds,
  ]);
  const handleShowcaseCarouselNavigationClick = useCallback(
    (direction: 'previous' | 'next') => {
      logEvent(
        LicenseManagerClickEvent.PublicListingDetailsPageShowcaseCarouselNavigationClickEvent,
        {
          listingId,
          direction,
          contentCount: showcasedCarouselItems.length,
        },
      );
    },
    [listingId, logEvent, showcasedCarouselItems.length],
  );
  const handlePreviousShowcaseContentClick = useCallback(() => {
    handleShowcaseCarouselNavigationClick('previous');
  }, [handleShowcaseCarouselNavigationClick]);
  const handleNextShowcaseContentClick = useCallback(() => {
    handleShowcaseCarouselNavigationClick('next');
  }, [handleShowcaseCarouselNavigationClick]);
  const hasShowcasedExperiences =
    !showcaseContentRequest.isPending &&
    !showcaseContentRequest.isError &&
    !showcaseExperienceDetailsRequest.isPending &&
    !showcaseExperienceDetailsRequest.isError &&
    showcasedCarouselItems.length > 0;

  const thumbnailAssetIds = useMemo(() => {
    if (!listing) {
      return EMPTY_THUMBNAIL_ASSET_IDS;
    }
    return getListingThumbnailAssetIds(listing.thumbnailAssetIds);
  }, [listing]);

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
    <>
      <HubMeta
        title={listing.name ?? ''}
        seoTitle={buildTitle(SiteName.CreatorHub, translate('Label.Licenses'), listing.name)}
        description={listingDescription}
        canonical={canonicalUrl}
        ogUrl={canonicalUrl}
        ogType='website'
        type='licensing'
        entityName={listing.name ?? ''}
        entityId={listingId}>
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
      <Grid item overflow='hidden'>
        <ThumbnailCarousel assetIds={thumbnailAssetIds} name={listing.name ?? ''} />
      </Grid>
      <Grid
        item
        container
        flexDirection='column'
        marginTop='-100px'
        padding={3}
        spacing={1.5}
        minWidth={0}
        width='100%'
        maxWidth='100%'
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
        {isShowcaseExperiencesFlagReady &&
          isShowcaseExperiencesEnabled &&
          hasShowcasedExperiences && (
            <Grid
              item
              container
              flexDirection='column'
              spacing={1.5}
              padding={1.5}
              minWidth={0}
              width='100%'
              maxWidth='100%'>
              <Grid item>
                <Typography variant='h5'>{showcasedExperiencesLabel}</Typography>
              </Grid>
              <Grid item minWidth={0} width='100%' maxWidth='100%'>
                <ShowcaseContentCarousel
                  items={showcasedCarouselItems}
                  previousAriaLabel={previousShowcasedContentAriaLabel}
                  nextAriaLabel={nextShowcasedContentAriaLabel}
                  onPreviousClick={handlePreviousShowcaseContentClick}
                  onNextClick={handleNextShowcaseContentClick}
                />
              </Grid>
            </Grid>
          )}
        <Grid item padding={0.5}>
          <Typography variant='h5' data-testid='explore-listing-details-licenses-heading'>
            {translate('Heading.Licenses')}
          </Typography>
        </Grid>
        <Grid item>
          <LicensesList listingId={listingId} />
        </Grid>
      </Grid>
    </>
  );
};

export default withTranslation(ListingDetailsContainer, [
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.Error,
  TranslationNamespace.Licenses,
  TranslationNamespace.Controls,
]);
