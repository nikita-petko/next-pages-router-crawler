import React, { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  DauBucket,
  LicenseDurationType,
  LicenseType,
  LicenseVisibility,
  UniverseContentMaturity,
} from '@rbx/client-content-licensing-api/v1';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Grid, Typography, CircularProgress } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import useIpSnackbar from '../../hooks/useIpSnackbar';
import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import useConfirmation from '../agreements/hooks/useConfirmation';
import { IP_LISTING_DETAILS_HREF, LICENSE_CREATE_HREF } from '../urls';
import { convertContentStandardsQuestionAnswerToRequest } from '../utils/guidelinesAndRestrictions';
import { buildLicenseDurationForRequest } from '../utils/timeLimitedLicense';
import IpListingsBreadcrumbs from './components/IpListingsBreadcrumbs';
import type { LicenseFormData } from './components/LicenseForm';
import LicenseForm from './components/LicenseForm';
import { MinimumDAU } from './components/licenseFormTypes';
import { useAddLicenseMutation, useIpListingQuery, useLicenseQuery } from './hooks/ipListings';
import mapLicenseResponseToFormDefaults from './utils/mapLicenseResponseToFormDefaults';
import { resolveEnableMonetization } from './utils/shouldRevShareOnActivation';

const EMPTY_CREATE_DEFAULTS: LicenseFormData = {
  name: '',
  description: '',
  revenueShare: 0,
  maxMaturityRating: UniverseContentMaturity.Restricted,
  minimumDAU: MinimumDAU.NoRequirement,
  contentStandardsFile: undefined,
  monitorType: null,
  contentStandardScope: '',
  contentStandardAnswers: [],
};

/** Page to create a license for an IP listing */
const LicenseCreateContainer = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { id } = router.query;
  const ipListingId = typeof id === 'string' ? id : '';
  const { enqueueErrorSnackbar } = useIpSnackbar();
  const { confirm, confirmationContent } = useConfirmation();
  const { isFetched } = useSettings();
  const { frontendFlags, loadingFrontendFlags } = useToolboxServiceApiProvider();
  const enableCollaborationLicensing =
    frontendFlags[FrontendFlagName.FrontendFlagEnableCreatorCollaborationLicensing] ?? false;
  const enableMarketplaceSalesLicensing =
    frontendFlags[FrontendFlagName.FrontendFlagEnableMarketplaceSalesLicensing] ?? false;

  const rawCopyFrom = router.query.copyFrom;
  const copyFromLicenseId: string | undefined = (() => {
    if (typeof rawCopyFrom === 'string' && rawCopyFrom.trim()) {
      return rawCopyFrom.trim();
    }
    if (Array.isArray(rawCopyFrom) && rawCopyFrom[0]?.trim()) {
      return rawCopyFrom[0].trim();
    }
    return undefined;
  })();

  const licenseQuery = useLicenseQuery(copyFromLicenseId ?? '', {
    enabled: router.isReady && !!copyFromLicenseId,
  });

  const { data: ipListing, isLoading: isIpListingLoading } = useIpListingQuery(ipListingId);

  const isCopySourceInvalid =
    !!copyFromLicenseId &&
    (licenseQuery.isError ||
      (licenseQuery.isSuccess &&
        !!licenseQuery.data &&
        licenseQuery.data.listingId !== ipListingId));

  useEffect(() => {
    if (!router.isReady || !copyFromLicenseId) {
      return;
    }
    if (isCopySourceInvalid) {
      Promise.resolve(router.replace(LICENSE_CREATE_HREF(ipListingId))).catch(() => {});
    }
  }, [router.isReady, copyFromLicenseId, isCopySourceInvalid, ipListingId, router]);

  const copySourceForSubmit = useMemo(() => {
    if (!copyFromLicenseId || !licenseQuery.data) {
      return undefined;
    }
    if (licenseQuery.data.listingId !== ipListingId) {
      return undefined;
    }
    return licenseQuery.data;
  }, [copyFromLicenseId, licenseQuery.data, ipListingId]);

  const defaultValues = useMemo((): LicenseFormData => {
    if (!copyFromLicenseId || !licenseQuery.data || licenseQuery.data.listingId !== ipListingId) {
      return EMPTY_CREATE_DEFAULTS;
    }
    return mapLicenseResponseToFormDefaults(
      licenseQuery.data,
      enableCollaborationLicensing,
      enableMarketplaceSalesLicensing,
    );
  }, [
    copyFromLicenseId,
    licenseQuery.data,
    ipListingId,
    enableCollaborationLicensing,
    enableMarketplaceSalesLicensing,
  ]);

  const licenseFormKey = `${ipListingId}-${copyFromLicenseId ?? 'new'}`;

  const isCopyLoading =
    !!copyFromLicenseId && (!router.isReady || licenseQuery.isPending || licenseQuery.isFetching);

  const { setPageTitle } = useIpLayoutContext();
  useEffect(() => {
    setPageTitle(
      <IpListingsBreadcrumbs
        pages={[
          {
            href: IP_LISTING_DETAILS_HREF(ipListingId),
            title: ipListing?.name ?? '',
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
    let contentStandardsDocumentIdField: { contentStandardsDocumentId: string } | undefined;
    if (!data.contentStandardsFile) {
      if (data.deleteContentStandardsDocument) {
        contentStandardsDocumentIdField = { contentStandardsDocumentId: '' };
      } else {
        const trimmedId = copySourceForSubmit?.contentStandardsDocumentId?.trim();
        if (trimmedId) {
          contentStandardsDocumentIdField = { contentStandardsDocumentId: trimmedId };
        }
      }
    }

    addLicenseMutation.mutate({
      listingId: ipListingId,
      royaltyRate: data.revenueShare,
      maxAgeRating: data.maxMaturityRating,
      dau7DayThreshold: data.minimumDAU,
      name: data.name,
      description: data.description,
      visibility: data.visibility ?? LicenseVisibility.Private,
      enableMonetization: resolveEnableMonetization({
        durationType: data.durationType,
        licenseType:
          enableCollaborationLicensing || enableMarketplaceSalesLicensing
            ? data.licenseType
            : LicenseType.FullExperience,
        monitorType: data.monitorType,
        enableCollaborationLicensing,
        enableMarketplaceSalesLicensing,
      }),
      contentStandardsDocument: data.contentStandardsFile,
      ...contentStandardsDocumentIdField,
      contentStandardScope: data.contentStandardScope,
      contentStandardAnswers: convertContentStandardsQuestionAnswerToRequest(
        data.contentStandardAnswers,
      ),
      creatorDau7DayThreshold: DauBucket.None,
      countries: [],
      licenseDuration: buildLicenseDurationForRequest(
        data.durationType ?? LicenseDurationType.Perpetual,
        {
          minDays: data.minDuration,
          maxDays: data.maxDuration,
        },
      ),
      licenseType: enableCollaborationLicensing ? data.licenseType : LicenseType.FullExperience,
    });
  };

  const handleCancel = () => {
    void router.push(IP_LISTING_DETAILS_HREF(ipListingId));
  };

  if (!isFetched || loadingFrontendFlags || isIpListingLoading || isCopyLoading) {
    return <CircularProgress />;
  }

  return (
    <>
      {confirmationContent}
      <Grid container direction='column' spacing={3} maxWidth={708}>
        <Grid item>
          <Typography variant='h1' component='h1'>
            {translate('Heading.CreateLicense')}
          </Typography>
        </Grid>
        <Grid item>
          <LicenseForm
            key={licenseFormKey}
            onBeforeSubmitModeratedChanges={handleBeforeSubmitModeratedChanges}
            defaultValues={defaultValues}
            onSubmit={handleSave}
            onCancel={handleCancel}
            submitButtonText={translate('Action.Create')}
            isSubmitting={addLicenseMutation.isPending}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default withTranslation(LicenseCreateContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
]);
