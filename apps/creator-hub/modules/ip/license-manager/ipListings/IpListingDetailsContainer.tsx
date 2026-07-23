import React, { useEffect, useState } from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Grid, Typography, Button, makeStyles, OpenInNewIcon, Alert } from '@rbx/ui';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { AssetThumbnailSize, ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Flex } from '@modules/miscellaneous/common/components';
import { Link, PageLoading } from '@modules/miscellaneous/common';
import { EXPLORE_LISTING_DETAILS } from '@modules/licenses/urls';
import { ListingStatus, ListingVisibility } from '@rbx/clients/contentLicensingApi/v1';

import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import RejectReasonModal from '../../rights/components/common/RejectReasonModal';
import IpListingsBreadcrumbs from './components/IpListingsBreadcrumbs';
import IpListingStatusChip from './components/IpListingStatusChip';
import { IP_LISTING_EDIT_HREF, LICENSE_CREATE_HREF } from '../urls';
import { useIpListingQuery, useLicensesQuery } from './hooks/ipListings';
import { useIpFamilyQuery } from '../../ipFamilies/hooks/ipFamily';
import LicenseTable from './components/LicenseTable';
import IpLoadError from '../../components/error/IpLoadError';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../utils/logger';

// API returns a string, not an enum, so we create the enum here for more robust checking.
enum ListingRejectionReason {
  UnconfirmedOwnership = 'uncofirmed ip ownership', // API returns a typo in the string
  InappropriateContent = 'inappropriate content',
}

const reasonToLabelKey: { [reason in ListingRejectionReason]: string } = {
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
  const { translate } = useTranslation();
  const router = useRouter();
  const { logEvent } = useLicenseManagerLogger();
  const { classes } = useStyles();

  const { id } = router.query;
  const ipListingId = id as string;
  const ipListingReq = useIpListingQuery(ipListingId);
  const licensesReq = useLicensesQuery(ipListingId);
  const ipFamilyReq = useIpFamilyQuery(ipListingReq.data?.ipFamilyId ?? undefined);
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);

  const { setPageTitle } = useIpLayoutContext();
  useEffect(() => {
    if (ipListingReq?.data) {
      setPageTitle(<IpListingsBreadcrumbs pages={[{ title: ipListingReq.data.name || '' }]} />);
    }
  }, [ipListingReq.data, setPageTitle]);

  if (ipListingReq.error || ipFamilyReq.error || licensesReq.error) {
    return <IpLoadError error={ipListingReq.error || ipFamilyReq.error || licensesReq.error} />;
  }

  if (ipListingReq.isPending || ipFamilyReq.isPending || licensesReq.isPending) {
    return <PageLoading />;
  }

  const listing = ipListingReq.data;
  const ipFamily = ipFamilyReq.data;
  const licenses = licensesReq.data;
  const thumbnailAssetIds = listing.thumbnailAssetIds || [];

  const isPublic = listing.visibility === ListingVisibility.Public;
  const showPublicLink = isPublic && listing.status === ListingStatus.Approved;

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
            {listing.status === ListingStatus.Rejected && listing.statusReason && (
              <React.Fragment>
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
                  reason={translate(
                    reasonToLabelKey[listing.statusReason as ListingRejectionReason],
                  )}
                  dialogOpen={reasonDialogOpen}
                  setDialogOpen={setReasonDialogOpen}
                />
              </React.Fragment>
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
                alt={listing.name || ''}
                // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
                size={AssetThumbnailSize._256x144}
                containerClass={classes.thumbnailContainer}
              />
            ))}
          </Flex>
        </Flex>
      </Grid>

      <Grid item container flexDirection='column'>
        <Grid item>
          <Typography variant='h6' gutterBottom>
            {translate('Label.Licenses')}
          </Typography>
        </Grid>
        {licenses && licenses.length > 0 ? (
          <Grid item>
            <LicenseTable licenses={licenses} />
          </Grid>
        ) : (
          <Grid item>
            <Typography>{translate('Description.NoLicenses')}</Typography>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};

export default withTranslation(IpListingDetailsContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
]);
