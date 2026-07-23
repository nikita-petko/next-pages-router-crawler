import React, { useCallback, useEffect } from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Grid, Typography, CircularProgress } from '@rbx/ui';
import { useRouter } from 'next/router';
import {
  DauBucket,
  LicenseDurationType,
  LicenseVisibility,
  UniverseContentMaturity,
} from '@rbx/clients/contentLicensingApi/v1';
import { useSettings } from '@modules/settings';

import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import { useContentLicensingCustomSettings } from '../../common/implementations/contentLicensingCustomSettings';
import IpListingsBreadcrumbs from './components/IpListingsBreadcrumbs';
import { IP_LISTING_DETAILS_HREF } from '../urls';
import { useAddLicenseMutation, useIpListingQuery } from './hooks/ipListings';
import LicenseForm, { LicenseFormData } from './components/LicenseForm';
import { MonitorType, MinimumDAU } from './components/licenseFormTypes';
import useIpSnackbar from '../../hooks/useIpSnackbar';
import useConfirmation from '../agreements/hooks/useConfirmation';
import { convertContentStandardsQuestionAnswerToRequest } from '../utils/guidelinesAndRestrictions';
import { buildLicenseDurationForRequest } from '../utils/timeLimitedLicense';

/** Page to create a license for an IP listing */
const LicenseCreateContainer = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { id } = router.query;
  const ipListingId = id as string;
  const { enqueueErrorSnackbar } = useIpSnackbar();
  const { confirm, confirmationContent } = useConfirmation();
  const { enableLicenseModeration } = useContentLicensingCustomSettings();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;

  const { data: ipListing, isLoading: isIpListingLoading } = useIpListingQuery(ipListingId);
  const showModerationUI = enableLicenseModeration;

  const { setPageTitle } = useIpLayoutContext();
  useEffect(() => {
    setPageTitle(
      <IpListingsBreadcrumbs
        pages={[
          {
            href: IP_LISTING_DETAILS_HREF(ipListingId),
            title: ipListing?.name || '',
          },
          { title: translate('Heading.CreateLicense') },
        ]}
      />,
    );
  }, [ipListing?.name, ipListingId, setPageTitle, translate]);

  const addLicenseMutation = useAddLicenseMutation({
    onSuccess: () => router.push(IP_LISTING_DETAILS_HREF(ipListingId)),
    onError: () => {
      enqueueErrorSnackbar();
    },
  });

  const handleBeforeSubmitModeratedChanges = useCallback(async () => {
    const { confirmed } = await confirm({
      title: translate('Action.SubmitForReview'),
      description: translate('Description.ConfirmModerationChangesCreate'),
      primaryActionLabel: translate('Action.SubmitForReview'),
    });
    return confirmed;
  }, [confirm, translate]);

  const handleSave = (data: LicenseFormData) => {
    addLicenseMutation.mutate({
      listingId: ipListingId,
      royaltyRate: data.revenueShare,
      maxAgeRating: data.maxMaturityRating,
      dau7DayThreshold: data.minimumDAU,
      name: data.name,
      description: data.description,
      visibility: data.visibility ?? LicenseVisibility.Private,
      enableMonetization:
        enableIpPlatformTimeboundLicenses && data.durationType === LicenseDurationType.TimeLimited
          ? true // Enforce monetization on activation for Timelimited licenses
          : data.monitorType === MonitorType.MonitorAndRevshare,
      contentStandardsDocument: data.contentStandardsFile,
      contentStandardScope: data.contentStandardScope,
      contentStandardAnswers: convertContentStandardsQuestionAnswerToRequest(
        data.contentStandardAnswers,
      ),
      creatorDau7DayThreshold: DauBucket.None,
      countries: [],
      licenseDuration: enableIpPlatformTimeboundLicenses
        ? buildLicenseDurationForRequest(data.durationType ?? LicenseDurationType.Perpetual, {
            minDays: data.minDuration,
            maxDays: data.maxDuration,
          })
        : null,
    });
  };

  const handleCancel = () => {
    router.push(IP_LISTING_DETAILS_HREF(ipListingId));
  };

  if (!isFetched || isIpListingLoading) {
    return <CircularProgress />;
  }

  return (
    <React.Fragment>
      {confirmationContent}
      <Grid container direction='column' spacing={3} maxWidth={708}>
        <Grid item>
          <Typography variant='h1' component='h1'>
            {translate('Heading.CreateLicense')}
          </Typography>
        </Grid>
        <Grid item>
          <LicenseForm
            showModerationUI={showModerationUI}
            onBeforeSubmitModeratedChanges={
              showModerationUI ? handleBeforeSubmitModeratedChanges : undefined
            }
            defaultValues={{
              name: '',
              description: '',
              revenueShare: 0,
              maxMaturityRating: UniverseContentMaturity.Restricted,
              minimumDAU: MinimumDAU.NoRequirement,
              contentStandardsFile: undefined,
              monitorType: null,
              contentStandardScope: '',
              contentStandardAnswers: [],
            }}
            onSubmit={handleSave}
            onCancel={handleCancel}
            submitButtonText={translate('Action.Create')}
            isSubmitting={addLicenseMutation.isPending}
          />
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default withTranslation(LicenseCreateContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
]);
