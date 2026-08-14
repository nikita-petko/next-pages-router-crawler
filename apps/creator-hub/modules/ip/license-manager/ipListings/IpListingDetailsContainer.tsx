import React, { useCallback, useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { ListingStatus, ListingVisibility } from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
import {
  Alert as FoundationAlert,
  Button as FoundationButton,
  ProgressCircle,
} from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { AssetThumbnailSize, ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Alert, Button, Grid, makeStyles, OpenInNewIcon, Typography } from '@rbx/ui';
import { isShowcaseExperiencesEnabled as isShowcaseExperiencesEnabledFlag } from '@generated/flags/contentLicensing';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ShowcaseContentCarousel from '@modules/licenses/components/ShowcaseContentCarousel';
import { EXPLORE_LISTING_DETAILS } from '@modules/licenses/urls';
import { Link, PageLoading } from '@modules/miscellaneous/components';
import Flex from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import IpLoadError from '../../components/error/IpLoadError';
import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import { useIpFamilyQuery } from '../../ipFamilies/hooks/ipFamily';
import RejectReasonModal from '../../rights/components/common/RejectReasonModal';
import ShowcaseContentTile from '../components/ShowcaseContentTile';
import { EXTERNAL_EXPERIENCE_HREF, IP_LISTING_EDIT_HREF, LICENSE_CREATE_HREF } from '../urls';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
} from '../utils/logger';
import IpListingsBreadcrumbs from './components/IpListingsBreadcrumbs';
import IpListingStatusChip from './components/IpListingStatusChip';
import LicenseTable from './components/LicenseTable';
import ShowcasedExperiencesDialog from './components/ShowcasedExperiencesDialog';
import { useIpListingQuery, useLicensesQuery } from './hooks/ipListings';
import useGetListingShowcaseContent from './hooks/useGetListingShowcaseContent';
import useGetShowcaseUniverseDetails from './hooks/useGetShowcaseUniverseDetails';

// API returns a string, not an enum, so we create the enum here for more robust checking.
enum ListingRejectionReason {
  UnconfirmedOwnership = 'uncofirmed ip ownership', // API returns a typo in the string
  InappropriateContent = 'inappropriate content',
}

const reasonToLabelKey: Partial<Record<string, string>> = {
  [ListingRejectionReason.UnconfirmedOwnership]: 'Label.RejectReasonIpOwnership',
  [ListingRejectionReason.InappropriateContent]: 'Label.RejectReasonInappropriateContent',
};

const SPOTLIGHTED_CREATIONS_HEADING_ID = 'iph-spotlighted-creations-heading';

const useStyles = makeStyles()(() => ({
  thumbnailContainer: {
    width: 160,
    height: 90,
    display: 'inline-block',
    paddingTop: 0,
  },

  flexGrow: {
    flexGrow: 1,
  },
}));

const IpListingDetailsContainer = () => {
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const router = useRouter();
  const { logEvent } = useLicenseManagerLogger();
  const { classes } = useStyles();

  const { id } = router.query;
  const ipListingId = typeof id === 'string' ? id : '';
  const ipListingReq = useIpListingQuery(ipListingId);
  const licensesReq = useLicensesQuery(ipListingId);
  const ipFamilyReq = useIpFamilyQuery(ipListingReq.data?.ipFamilyId ?? undefined);
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [showcasedExperiencesDialogOpen, setShowcasedExperiencesDialogOpen] = useState(false);
  const handleCloseShowcasedExperiences = useCallback(() => {
    setShowcasedExperiencesDialogOpen(false);
  }, []);
  const { ready: isShowcaseExperiencesFlagReady, value: isShowcaseExperiencesEnabled } = useFlag(
    isShowcaseExperiencesEnabledFlag,
  );
  const showcaseContentReq = useGetListingShowcaseContent({
    listingId: ipListingId,
    enabled: isShowcaseExperiencesFlagReady && isShowcaseExperiencesEnabled,
  });
  const showcasedContent = showcaseContentReq.data?.content;
  const showcasedUniverseIds = useMemo(
    () =>
      (showcasedContent ?? []).flatMap((reference) => {
        const universeId = Number(reference.contentId);
        return reference.contentType === 'Universe' &&
          Number.isSafeInteger(universeId) &&
          universeId > 0
          ? [universeId]
          : [];
      }),
    [showcasedContent],
  );
  const showcaseUniverseDetailsReq = useGetShowcaseUniverseDetails({
    universeIds: showcasedUniverseIds,
    enabled: isShowcaseExperiencesFlagReady && isShowcaseExperiencesEnabled,
  });
  const showcaseDetailsByUniverseId = useMemo(
    () =>
      new Map(
        (showcaseUniverseDetailsReq.data?.data ?? []).flatMap((details) =>
          details.id == null ? [] : [[details.id, details] as const],
        ),
      ),
    [showcaseUniverseDetailsReq.data?.data],
  );
  const isShowcaseContentError =
    showcaseContentReq.isError ||
    (showcasedUniverseIds.length > 0 && showcaseUniverseDetailsReq.isError);
  const failedShowcaseRequest =
    showcaseContentReq.isError && showcaseUniverseDetailsReq.isError
      ? 'featured_creations_and_universe_details'
      : showcaseContentReq.isError
        ? 'featured_creations'
        : 'universe_details';
  const isShowcaseContentRetrying =
    isShowcaseContentError &&
    (showcaseContentReq.isFetching || showcaseUniverseDetailsReq.isFetching);
  const isShowcaseContentLoading =
    showcaseContentReq.isPending ||
    (showcasedUniverseIds.length > 0 && showcaseUniverseDetailsReq.isPending) ||
    isShowcaseContentRetrying;
  const spotlightedCreationsLabel = tPendingTranslation(
    'Featured creations',
    'Section heading for creations spotlighted on an IP listing details page',
    translationKey('Label.SpotlightedCreations', TranslationNamespace.AgreementsManager),
  );
  const spotlightedCreationsDescription = tPendingTranslation(
    'Add creations to feature for Creators browsing your license listing.',
    'Description of the spotlighted / featured creations section on an IP listing details page',
    translationKey('Description.SpotlightedCreations', TranslationNamespace.AgreementsManager),
  );
  const editCreationsLabel = tPendingTranslation(
    'Edit',
    'Button to edit the associated item',
    translationKey('Action.Edit', TranslationNamespace.Creations),
  );
  const retryShowcasedExperiencesLabel = tPendingTranslation(
    'Retry',
    'Action to retry a failed request',
    translationKey('Action.Retry', TranslationNamespace.AgreementsManager),
  );
  const previousShowcasedContentAriaLabel = tPendingTranslation(
    'Previous featured creation',
    'Accessible label for the previous button in the showcased content carousel',
    translationKey('Action.PreviousShowcasedContent', TranslationNamespace.Licenses),
  );
  const nextShowcasedContentAriaLabel = tPendingTranslation(
    'Next featured creation',
    'Accessible label for the next button in the showcased content carousel',
    translationKey('Action.NextShowcasedContent', TranslationNamespace.Licenses),
  );
  const showcasedCarouselItems = useMemo(
    () =>
      showcasedUniverseIds.map((universeId, index) => {
        const details = showcaseDetailsByUniverseId.get(universeId);
        const name =
          details?.name ??
          tPendingTranslation(
            'Universe {universeId}',
            'Fallback name for a showcased experience when its name cannot be loaded',
            translationKey(
              'Label.ShowcasedExperienceUniverseWithId',
              TranslationNamespace.AgreementsManager,
            ),
            { universeId: universeId.toString() },
          );
        return {
          id: `Universe:${universeId}:${index}`,
          content: (
            <ShowcaseContentTile
              universeId={universeId}
              name={name}
              showExternalIcon={false}
              link={
                details?.rootPlaceId != null
                  ? EXTERNAL_EXPERIENCE_HREF(details.rootPlaceId)
                  : undefined
              }
              onClick={() =>
                logEvent(LicenseManagerClickEvent.IphListingsDetailsPageShowcaseContentClickEvent, {
                  listingId: ipListingId,
                  contentType: 'Universe',
                  contentId: universeId,
                  contentPosition: index + 1,
                })
              }
            />
          ),
        };
      }),
    [ipListingId, logEvent, showcaseDetailsByUniverseId, showcasedUniverseIds, tPendingTranslation],
  );
  const { setPageTitle } = useIpLayoutContext();
  useEffect(() => {
    if (ipListingReq?.data) {
      setPageTitle(<IpListingsBreadcrumbs pages={[{ title: ipListingReq.data.name ?? '' }]} />);
    }
  }, [ipListingReq.data, setPageTitle]);
  useEffect(() => {
    if (isShowcaseContentError) {
      logEvent(
        LicenseManagerImpressionEvent.IphListingsDetailsPageShowcasedExperiencesLoadFailureImpressionEvent,
        {
          listingId: ipListingId,
          surface: 'details',
          failedRequest: failedShowcaseRequest,
        },
      );
    }
  }, [failedShowcaseRequest, ipListingId, isShowcaseContentError, logEvent]);

  if (ipListingReq.isError || ipFamilyReq.isError || licensesReq.isError) {
    return <IpLoadError error={ipListingReq.error ?? ipFamilyReq.error ?? licensesReq.error} />;
  }

  if (ipListingReq.isPending || ipFamilyReq.isPending || licensesReq.isPending) {
    return <PageLoading />;
  }

  const listing = ipListingReq.data;
  const ipFamily = ipFamilyReq.data;
  const licenses = licensesReq.data;
  const thumbnailAssetIds = listing.thumbnailAssetIds ?? [];
  const rejectionReasonLabelKey = listing.statusReason
    ? reasonToLabelKey[listing.statusReason]
    : undefined;

  const isPublic = listing.visibility === ListingVisibility.Public;
  const showPublicLink = isPublic && listing.status === ListingStatus.Approved;

  const handleAddCreations = () => {
    logEvent(LicenseManagerClickEvent.IphListingsDetailsPageManageShowcasedExperiencesClickEvent, {
      listingId: ipListingId,
    });
    setShowcasedExperiencesDialogOpen(true);
  };
  const handleRetryShowcasedExperiences = () => {
    logEvent(LicenseManagerClickEvent.IphListingsDetailsPageRetryShowcasedExperiencesClickEvent, {
      listingId: ipListingId,
      surface: 'details',
      failedRequest: failedShowcaseRequest,
    });
    if (showcaseContentReq.isError) {
      void showcaseContentReq.refetch();
    }
    if (showcaseUniverseDetailsReq.isError) {
      void showcaseUniverseDetailsReq.refetch();
    }
  };
  let alertMessage;
  if (listing.status === ListingStatus.Pending) {
    alertMessage = 'Description.ListingPrivateWhileUnderReview';
  } else if (!isPublic && listing.status === ListingStatus.Approved) {
    alertMessage = 'Message.ListingNotPublic';
  }

  return (
    <Grid container direction='column' spacing={3} maxWidth={1200}>
      <Grid item>
        <Flex gap={8}>
          <Flex gap={8} alignItems='center' classes={{ root: classes.flexGrow }}>
            <Typography variant='h1' component='h1'>
              {listing.name}
            </Typography>
          </Flex>
          <Button
            variant='contained'
            color='secondary'
            disabled={
              listing.status !== ListingStatus.Approved && listing.status !== ListingStatus.Rejected
            }
            component={NextLink}
            href={IP_LISTING_EDIT_HREF(ipListingId)}
            onClick={() =>
              logEvent(LicenseManagerClickEvent.IphListingsDetailsPageEditListingClickEvent, {
                listingId: ipListingId,
              })
            }>
            {translate('Action.EditListing')}
          </Button>
          <Button
            variant='contained'
            color='secondary'
            href={LICENSE_CREATE_HREF(ipListingId)}
            disabled={listing.status === ListingStatus.Rejected}
            component={NextLink}
            onClick={() =>
              logEvent(LicenseManagerClickEvent.IphListingsDetailsPageAddLicenseClickEvent, {
                listingId: ipListingId,
              })
            }>
            {translate('Action.AddLicense')}
          </Button>
        </Flex>
        <Grid item>
          <Flex gap={8} alignItems='center'>
            <IpListingStatusChip status={listing.status} isPublic={isPublic} />
            {listing.status === ListingStatus.Rejected && rejectionReasonLabelKey && (
              <>
                <Button
                  sx={{ textTransform: 'none' }}
                  size='small'
                  onClick={(event) => {
                    setReasonDialogOpen(true);
                    event.stopPropagation();
                  }}>
                  {translate('Label.ViewRejectReason')}
                </Button>
                <RejectReasonModal
                  reason={translate(rejectionReasonLabelKey)}
                  dialogOpen={reasonDialogOpen}
                  setDialogOpen={setReasonDialogOpen}
                />
              </>
            )}
            {showPublicLink && (
              <Link
                href={EXPLORE_LISTING_DETAILS(ipListingId)}
                target='_blank'
                onClick={() =>
                  logEvent(
                    LicenseManagerClickEvent.IphListingsDetailsPageViewPublicListingClickEvent,
                    { listingId: ipListingId },
                  )
                }>
                <Flex gap={4} alignItems='center'>
                  <span>{translate('Action.ViewListing')}</span>
                  <OpenInNewIcon />
                </Flex>
              </Link>
            )}
          </Flex>
        </Grid>
      </Grid>

      {alertMessage && (
        <Grid item>
          <Alert severity='info'>{translate(alertMessage)}</Alert>
        </Grid>
      )}

      <Grid item>
        <Flex gap={8} flexDirection='column'>
          <Typography variant='h6'>{translate('Label.IpFamily')}</Typography>
          <Typography variant='body1'>{ipFamily.name}</Typography>
        </Flex>
      </Grid>

      <Grid item>
        <Flex gap={8} flexDirection='column'>
          <Typography variant='h6'>{translate('Label.Description')}</Typography>
          <Typography variant='body1' whiteSpace='pre-wrap'>
            {listing.description}
          </Typography>
        </Flex>
      </Grid>

      <Grid item>
        <Flex gap={8} flexDirection='column'>
          <Typography variant='h6'>{translate('Label.Images')}</Typography>
          <Flex gap={12}>
            {thumbnailAssetIds.map((assetId) => (
              <Thumbnail2d
                key={assetId}
                targetId={assetId}
                type={ThumbnailTypes.assetThumbnail}
                returnPolicy={ReturnPolicy.PlaceHolder}
                includeBackground={false}
                alt={listing.name ?? ''}
                // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
                size={AssetThumbnailSize._256x144}
                containerClass={classes.thumbnailContainer}
              />
            ))}
          </Flex>
        </Flex>
      </Grid>

      {isShowcaseExperiencesFlagReady && isShowcaseExperiencesEnabled && (
        <Grid item>
          <Flex gap={8} flexDirection='column'>
            <Typography id={SPOTLIGHTED_CREATIONS_HEADING_ID} variant='h6'>
              {spotlightedCreationsLabel}
            </Typography>
            <Typography>{spotlightedCreationsDescription}</Typography>
            {isShowcaseContentLoading ? (
              <div className='flex justify-center padding-large'>
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
              <>
                <FoundationButton
                  variant='Standard'
                  size='Medium'
                  className='width-fit'
                  onClick={handleAddCreations}>
                  {editCreationsLabel}
                </FoundationButton>
                {showcasedUniverseIds.length > 0 && (
                  <ShowcaseContentCarousel
                    ariaLabelledBy={SPOTLIGHTED_CREATIONS_HEADING_ID}
                    previousAriaLabel={previousShowcasedContentAriaLabel}
                    nextAriaLabel={nextShowcasedContentAriaLabel}
                    items={showcasedCarouselItems}
                  />
                )}
              </>
            )}
          </Flex>
        </Grid>
      )}

      <Grid item container flexDirection='column'>
        <Grid item>
          <Typography variant='h6' gutterBottom>
            {translate('Label.Licenses')}
          </Typography>
        </Grid>
        {licenses && licenses.length > 0 ? (
          <Grid item>
            <LicenseTable licenses={licenses} ipListingId={ipListingId} />
          </Grid>
        ) : (
          <Grid item>
            <Typography>{translate('Description.NoLicenses')}</Typography>
          </Grid>
        )}
      </Grid>

      {isShowcaseExperiencesFlagReady &&
        isShowcaseExperiencesEnabled &&
        showcasedExperiencesDialogOpen && (
          <ShowcasedExperiencesDialog
            open={showcasedExperiencesDialogOpen}
            listingId={ipListingId}
            selectedContent={showcasedContent ?? undefined}
            ifMatch={showcaseContentReq.data?.eTag}
            onClose={handleCloseShowcasedExperiences}
          />
        )}
    </Grid>
  );
};

export default withTranslation(IpListingDetailsContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.Creations,
  TranslationNamespace.Licenses,
]);
