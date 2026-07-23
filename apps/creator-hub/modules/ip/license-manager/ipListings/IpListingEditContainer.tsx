import { useEffect } from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRouter } from 'next/router';
import { CircularProgress, Grid, Typography } from '@rbx/ui';
import { ListingStatus } from '@rbx/clients/contentLicensingApi/v1';

import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import { IP_LISTING_DETAILS_HREF } from '../urls';
import { useIpListingQuery, useUpdateIpListingMutation } from './hooks/ipListings';
import IpListingForm, { EDIT_MODE, FormStore } from './components/IpListingForm';
import IpListingsBreadcrumbs from './components/IpListingsBreadcrumbs';
import IpLoadError from '../../components/error/IpLoadError';
import useIpSnackbar from '../../hooks/useIpSnackbar';

/**
 * Edit a IP Listing / License Listing
 */
const IpListingEditContainer = () => {
  const router = useRouter();
  const { id } = router.query;
  const ipListingId = id as string;
  const ipListingReq = useIpListingQuery(ipListingId);
  const { translate } = useTranslation();
  const { enqueueErrorSnackbar } = useIpSnackbar();

  const updateIpListingMutation = useUpdateIpListingMutation({
    onSuccess: () => {
      router.push(IP_LISTING_DETAILS_HREF(ipListingId));
    },
    onError: () => {
      enqueueErrorSnackbar();
    },
  });

  const handleSave = (data: FormStore) => {
    updateIpListingMutation.mutate({
      ipListingId,
      name: data.name,
      description: data.description,
      thumbnails: data.thumbnails,
    });
  };

  const handleCancel = () => {
    router.push(IP_LISTING_DETAILS_HREF(ipListingId));
  };

  const pageTitle = translate('Heading.EditLicenseListing');
  const { setPageTitle } = useIpLayoutContext();
  useEffect(() => {
    setPageTitle(<IpListingsBreadcrumbs pages={[{ title: pageTitle }]} />);
  }, [pageTitle, setPageTitle]);

  if (ipListingReq.isPending) {
    return <CircularProgress />;
  }

  if (
    ipListingReq.error ||
    (ipListingReq.data.status !== ListingStatus.Approved &&
      ipListingReq.data.status !== ListingStatus.Rejected)
  ) {
    return <IpLoadError error={ipListingReq.error} />;
  }

  return (
    <Grid container direction='column' spacing={4}>
      <Grid item>
        <Typography variant='h1' component='h1'>
          {pageTitle}
        </Typography>
      </Grid>
      <Grid item>
        <IpListingForm
          defaultValues={{
            ipFamilyId: ipListingReq.data.ipFamilyId!,
            name: ipListingReq.data.name || '',
            description: ipListingReq.data.description || '',
            thumbnails: ipListingReq.data.thumbnailAssetIds
              ? ipListingReq.data.thumbnailAssetIds.map((assetId) => ({
                  type: 'existing',
                  assetId,
                }))
              : [],
          }}
          onSubmit={handleSave}
          onCancel={handleCancel}
          submitButtonText={translate('Action.SubmitForReview')}
          isSubmitting={updateIpListingMutation.isPending}
          mode={EDIT_MODE}
        />
      </Grid>
    </Grid>
  );
};

export default withTranslation(IpListingEditContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
]);
