import React, { useCallback, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { ListingStatus, ListingVisibility } from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
import { Button as FoundationButton } from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { AssetThumbnailSize, ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Alert, Button, Grid, makeStyles, OpenInNewIcon, Typography } from '@rbx/ui';
import { isShowcaseExperiencesEnabled as isShowcaseExperiencesEnabledFlag } from '@generated/flags/contentLicensing';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { EXPLORE_LISTING_DETAILS } from '@modules/licenses/urls';
import { Link, PageLoading } from '@modules/miscellaneous/components';
import Flex from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import IpLoadError from '../../components/error/IpLoadError';
import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import { useIpFamilyQuery } from '../../ipFamilies/hooks/ipFamily';
import RejectReasonModal from '../../rights/components/common/RejectReasonModal';
import { IP_LISTING_EDIT_HREF, LICENSE_CREATE_HREF } from '../urls';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../utils/logger';
import IpListingsBreadcrumbs from './components/IpListingsBreadcrumbs';
import IpListingStatusChip from './components/IpListingStatusChip';
import LicenseTable from './components/LicenseTable';
import ShowcasedExperiencesDialog from './components/ShowcasedExperiencesDialog';
import { useIpListingQuery, useLicensesQuery } from './hooks/ipListings';

// API returns a string, not an enum, so we create the enum here for more robust checking.
enum ListingRejectionReason {
  UnconfirmedOwnership = 'uncofirmed ip ownership', // API returns a typo in the string
  InappropriateContent = 'inappropriate content',
}

const reasonToLabelKey: Partial<Record<string, string>> = {
  [ListingRejectionReason.UnconfirmedOwnership]: 'Label.RejectReasonIpOwnership',
  [ListingRejectionReason.InappropriateContent]: 'Label.RejectReasonInappropriateContent',
};

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
  const showcasedExperiencesLabel = tPendingTranslation(
    'Showcased experiences',
    'Section heading for experiences showcased on an IP listing details page',
    translationKey('Label.ShowcasedExperiences', TranslationNamespace.AgreementsManager),
  );
  const showcasedExperiencesSelectedCount = tPendingTranslation(
    '{selectedCount}/10 selected.',
    'Count of experiences selected for an IP listing showcase',
    translationKey(
      'Label.ShowcasedExperiencesSelectedCount',
      TranslationNamespace.AgreementsManager,
    ),
    { selectedCount: '0' },
  );
  const noShowcasedExperiencesDescription = tPendingTranslation(
    'No showcased experiences',
    'Empty state shown when an IP listing has no showcased experiences',
    translationKey('Description.NoShowcasedExperiences', TranslationNamespace.AgreementsManager),
  );
  const manageShowcasedExperiencesLabel = tPendingTranslation(
    'Manage',
    'Action to manage content, such as the experiences showcased on an IP listing',
    translationKey('Action.Manage', TranslationNamespace.AgreementsManager),
  );
  const { setPageTitle } = useIpLayoutContext();
  useEffect(() => {
    if (ipListingReq?.data) {
      setPageTitle(<IpListingsBreadcrumbs pages={[{ title: ipListingReq.data.name ?? '' }]} />);
    }
  }, [ipListingReq.data, setPageTitle]);

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

  const handleManageShowcasedExperiences = () => {
    logEvent(LicenseManagerClickEvent.IphListingsDetailsPageManageShowcasedExperiencesClickEvent, {
      listingId: ipListingId,
    });
    setShowcasedExperiencesDialogOpen(true);
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
            <Typography variant='h6'>{showcasedExperiencesLabel}</Typography>
            <Flex gap={8} alignItems='center'>
              <Typography>{showcasedExperiencesSelectedCount}</Typography>
              <FoundationButton
                variant='Link'
                size='Medium'
                onClick={handleManageShowcasedExperiences}>
                {manageShowcasedExperiencesLabel}
              </FoundationButton>
            </Flex>
            <Typography>{noShowcasedExperiencesDescription}</Typography>
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

      {isShowcaseExperiencesFlagReady && isShowcaseExperiencesEnabled && (
        <ShowcasedExperiencesDialog
          open={showcasedExperiencesDialogOpen}
          listingId={ipListingId}
          onClose={handleCloseShowcasedExperiences}
        />
      )}
    </Grid>
  );
};

export default withTranslation(IpListingDetailsContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
]);
