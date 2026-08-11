import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useRobloxAuthentication } from '@rbx/auth';
import { HubMeta, SiteName, buildTitle } from '@rbx/creator-hub-history';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useFlag } from '@rbx/flags';
import {
  Alert as FoundationAlert,
  Button as FoundationButton,
  ProgressCircle,
} from '@rbx/foundation-ui';
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
const MAX_SHOWCASED_EXPERIENCES = 10;
const CANONICAL_POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const SPOTLIGHTED_CREATIONS_HEADING_ID = 'spotlighted-creations-heading';

const getValidShowcasedUniverseIds = (
  content: Array<{ contentType?: string; contentId?: string | null }> | null | undefined,
) => {
  const universeIds: number[] = [];
  const seenUniverseIds = new Set<number>();

  for (const contentReference of content ?? []) {
    if (
      contentReference.contentType !== 'Universe' ||
      contentReference.contentId == null ||
      !CANONICAL_POSITIVE_INTEGER_PATTERN.test(contentReference.contentId)
    ) {
      continue;
    }
    const universeId = Number(contentReference.contentId);
    if (!Number.isSafeInteger(universeId) || seenUniverseIds.has(universeId)) {
      continue;
    }
    universeIds.push(universeId);
    seenUniverseIds.add(universeId);
    if (universeIds.length === MAX_SHOWCASED_EXPERIENCES) {
      break;
    }
  }

  return universeIds;
};

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
  const spotlightedCreationsLabel = tPendingTranslation(
    'Spotlighted creations',
    'Section heading for creations spotlighted on an IP listing details page',
    translationKey('Label.SpotlightedCreations', TranslationNamespace.AgreementsManager),
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
  const retryShowcasedExperiencesLabel = tPendingTranslation(
    'Retry',
    'Action to retry a failed request',
    translationKey('Action.Retry', TranslationNamespace.AgreementsManager),
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
  const showcasedUniverseIds = useMemo(
    () => getValidShowcasedUniverseIds(showcaseContentRequest.data?.content),
    [showcaseContentRequest.data?.content],
  );
  const showcaseExperienceDetailsRequest = useGetShowcaseExperienceDetails({
    universeIds: showcasedUniverseIds,
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
      const name = details?.name?.trim();
      const rootPlaceId = details?.rootPlaceId;
      if (
        !name ||
        typeof rootPlaceId !== 'number' ||
        !Number.isSafeInteger(rootPlaceId) ||
        rootPlaceId <= 0
      ) {
        return [];
      }
      return [
        {
          id: `Universe:${universeId}:${index}`,
          content: (
            <ShowcaseContentTile
              universeId={universeId}
              name={name}
              link={EXTERNAL_EXPERIENCE_HREF(rootPlaceId)}
              showExternalIcon={false}
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
  const isShowcaseContentError =
    showcaseContentRequest.isError ||
    (showcasedUniverseIds.length > 0 && showcaseExperienceDetailsRequest.isError);
  const failedShowcaseRequest =
    showcaseContentRequest.isError && showcaseExperienceDetailsRequest.isError
      ? 'showcase_content_and_universe_details'
      : showcaseContentRequest.isError
        ? 'showcase_content'
        : 'universe_details';
  const isShowcaseContentRetrying =
    isShowcaseContentError &&
    (showcaseContentRequest.isFetching || showcaseExperienceDetailsRequest.isFetching);
  const isShowcaseContentLoading =
    showcaseContentRequest.isPending ||
    (showcasedUniverseIds.length > 0 && showcaseExperienceDetailsRequest.isPending) ||
    isShowcaseContentRetrying;
  const hasShowcasedExperiences =
    !isShowcaseContentLoading && !isShowcaseContentError && showcasedCarouselItems.length > 0;
  const hasEmptyShowcasedExperiences =
    showcaseContentEnabled &&
    !isShowcaseContentLoading &&
    !isShowcaseContentError &&
    showcasedCarouselItems.length === 0;
  const handleRetryShowcasedExperiences = useCallback(() => {
    logEvent(LicenseManagerClickEvent.PublicListingDetailsPageRetryShowcasedExperiencesClickEvent, {
      listingId,
      failedRequest: failedShowcaseRequest,
    });
    if (showcaseContentRequest.isError) {
      void showcaseContentRequest.refetch();
    }
    if (showcaseExperienceDetailsRequest.isError) {
      void showcaseExperienceDetailsRequest.refetch();
    }
  }, [
    failedShowcaseRequest,
    listingId,
    logEvent,
    showcaseContentRequest,
    showcaseExperienceDetailsRequest,
  ]);
  useEffect(() => {
    if (isShowcaseContentError) {
      logEvent(
        LicenseManagerImpressionEvent.PublicListingDetailsPageShowcasedExperiencesLoadFailureImpressionEvent,
        {
          listingId,
          failedRequest: failedShowcaseRequest,
        },
      );
    }
  }, [failedShowcaseRequest, isShowcaseContentError, listingId, logEvent]);
  useEffect(() => {
    if (hasShowcasedExperiences) {
      logOnce(
        LicenseManagerImpressionEvent.PublicListingDetailsPageShowcasedExperiencesImpressionEvent,
        {
          listingId,
          contentCount: showcasedCarouselItems.length,
        },
      );
    }
  }, [hasShowcasedExperiences, listingId, logOnce, showcasedCarouselItems.length]);
  useEffect(() => {
    if (hasEmptyShowcasedExperiences) {
      logOnce(
        LicenseManagerImpressionEvent.PublicListingDetailsPageEmptyShowcasedExperiencesImpressionEvent,
        { listingId },
      );
    }
  }, [hasEmptyShowcasedExperiences, listingId, logOnce]);

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
          (isShowcaseContentLoading || isShowcaseContentError || hasShowcasedExperiences) && (
            <Grid
              component='section'
              item
              container
              flexDirection='column'
              spacing={1.5}
              padding={1.5}
              minWidth={0}
              width='100%'
              maxWidth='100%'>
              <Grid item padding={0.5}>
                <Typography id={SPOTLIGHTED_CREATIONS_HEADING_ID} variant='h5'>
                  {spotlightedCreationsLabel}
                </Typography>
              </Grid>
              <Grid item minWidth={0} width='100%' maxWidth='100%'>
                {isShowcaseContentLoading ? (
                  <div
                    aria-busy='true'
                    className='flex justify-center items-center min-height-[174px]'>
                    <ProgressCircle
                      variant='Indeterminate'
                      ariaLabel={translate('Label.Loading')}
                      size='Medium'
                    />
                  </div>
                ) : isShowcaseContentError ? (
                  <FoundationAlert
                    variant='Feedback'
                    severity='Error'
                    hasCloseAffordance={false}
                    className='!width-fit !stroke-default [&>div[aria-hidden=true]]:!bg-shift-100'>
                    <span className='inline-flex items-center gap-small'>
                      <span>{translate('Error.LoadingData')}</span>
                      <FoundationButton
                        variant='Link'
                        size='Small'
                        className='![height:auto] !padding-none !text-label-medium [&>div]:!bg-none [&>div]:!transition-none [&>span>span]:!padding-none'
                        onClick={handleRetryShowcasedExperiences}>
                        {retryShowcasedExperiencesLabel}
                      </FoundationButton>
                    </span>
                  </FoundationAlert>
                ) : (
                  <ShowcaseContentCarousel
                    items={showcasedCarouselItems}
                    previousAriaLabel={previousShowcasedContentAriaLabel}
                    nextAriaLabel={nextShowcasedContentAriaLabel}
                    ariaLabelledBy={SPOTLIGHTED_CREATIONS_HEADING_ID}
                    onPreviousClick={handlePreviousShowcaseContentClick}
                    onNextClick={handleNextShowcaseContentClick}
                  />
                )}
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
