import React, { useCallback, useEffect } from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Grid, Typography } from '@rbx/ui';
import { useRouter } from 'next/router';
import { PageLoading } from '@modules/miscellaneous/common';
import {
  ContentStandardAnswer,
  DauBucket,
  LicenseDurationType,
  LicenseModerationStatus,
  LicenseVisibility,
  UniverseContentMaturity,
} from '@rbx/clients/contentLicensingApi/v1';
import { useSettings } from '@modules/settings';

import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import { useContentLicensingCustomSettings } from '../../common/implementations/contentLicensingCustomSettings';
import PendingEditsAlert from './components/PendingEditsAlert';
import LicensePendingAlert from './components/LicensePendingAlert';
import IpListingsBreadcrumbs from './components/IpListingsBreadcrumbs';
import {
  useLicenseQuery,
  useIpListingQuery,
  useUpdateLicenseMutation,
  useAgreementsByLicenseQuery,
} from './hooks/ipListings';
import { IP_LISTING_DETAILS_HREF } from '../urls';
import LicenseForm, {
  LicenseFormData,
  LicenseFormSubmitOptions,
  EDIT_MODE,
  EDIT_WITH_AGREEMENTS_MODE,
} from './components/LicenseForm';
import useIpSnackbar from '../../hooks/useIpSnackbar';
import { MinimumDAU, MinimumDAUValue, MonitorType } from './components/licenseFormTypes';
import IpLoadError from '../../components/error/IpLoadError';
import useConfirmation from '../agreements/hooks/useConfirmation';
import {
  buildLicenseDurationForRequest,
  convertNumDaysToDurationBucket,
} from '../utils/timeLimitedLicense';

interface Props {
  licenseId: string;
}

/** Page to edit a license */
const LicenseEditContainer = ({ licenseId }: Props) => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;
  const { enqueueErrorSnackbar, enqueueSuccessSnackbar } = useIpSnackbar();
  const { confirm, confirmationContent } = useConfirmation();

  const licenseReq = useLicenseQuery(licenseId);
  const ipListingReq = useIpListingQuery(licenseReq.data?.listingId ?? undefined);
  const agreementsReq = useAgreementsByLicenseQuery({ licenseId, pageSize: 10 });
  const updateLicenseMutation = useUpdateLicenseMutation();

  const { enableLicenseModeration } = useContentLicensingCustomSettings();
  const showModerationUI = enableLicenseModeration;

  const handleBeforeSubmitModeratedChanges = useCallback(async () => {
    const { confirmed } = await confirm({
      title: translate('Action.SubmitForReview'),
      description: translate('Description.ConfirmModerationChangesEdit'),
      primaryActionLabel: translate('Action.SubmitForReview'),
    });
    return confirmed;
  }, [confirm, translate]);

  const { setPageTitle } = useIpLayoutContext();

  useEffect(() => {
    if (licenseReq.data && ipListingReq.data)
      setPageTitle(
        <IpListingsBreadcrumbs
          pages={[
            {
              href: IP_LISTING_DETAILS_HREF(licenseReq.data.listingId!),
              title: ipListingReq.data.name || '',
            },
            { title: licenseReq.data.name || '' },
            { title: translate('Heading.Edit') },
          ]}
        />,
      );
  }, [ipListingReq.data, licenseReq.data, setPageTitle, translate]);

  if (licenseReq.error || ipListingReq.error || agreementsReq.error) {
    return <IpLoadError error={licenseReq.error || ipListingReq.error || agreementsReq.error} />;
  }

  if (!isFetched || licenseReq.isPending || ipListingReq.isPending || agreementsReq.isPending) {
    return <PageLoading />;
  }

  const license = licenseReq.data;
  const hasAgreements = agreementsReq.data.agreements && agreementsReq.data.agreements.length > 0;

  const hasPendingEdits = showModerationUI && !!license.hasPendingEdits;
  const isLicensePending =
    showModerationUI && license.moderationStatus === LicenseModerationStatus.Pending;
  const areModeratedFieldsLocked = hasPendingEdits || isLicensePending;

  return (
    <React.Fragment>
      {confirmationContent}
      <Grid container direction='column' spacing={3} maxWidth={708}>
        {isLicensePending && !hasPendingEdits && (
          <Grid item XSmall={12}>
            <LicensePendingAlert />
          </Grid>
        )}
        {hasPendingEdits && (
          <Grid item XSmall={12}>
            <PendingEditsAlert
              pendingEdits={license.pendingEdits!}
              currentValues={{
                name: license.name ?? undefined,
                description: license.description ?? undefined,
                contentStandardsDocumentId: license.contentStandardsDocumentId ?? undefined,
                contentStandardScope: license.contentStandardsScope ?? undefined,
              }}
              licenseName={license.name ?? undefined}
            />
          </Grid>
        )}
        <Grid item>
          <Typography variant='h1' component='h1'>
            {translate('Heading.EditLicense')}
          </Typography>
        </Grid>
        <Grid item>
          <LicenseForm
            mode={hasAgreements ? EDIT_WITH_AGREEMENTS_MODE : EDIT_MODE}
            showModerationUI={showModerationUI}
            hasPendingEdits={areModeratedFieldsLocked}
            onBeforeSubmitModeratedChanges={
              showModerationUI ? handleBeforeSubmitModeratedChanges : undefined
            }
            defaultValues={{
              name: license.name || '',
              description: license.description || '',
              revenueShare: license.royaltyRate || 0,
              maxMaturityRating:
                license.maxAgeRating === UniverseContentMaturity.None
                  ? UniverseContentMaturity.Restricted
                  : license.maxAgeRating || UniverseContentMaturity.Restricted,
              minimumDAU: (license.dau7DayThreshold as MinimumDAUValue) || MinimumDAU.NoRequirement,
              contentStandardsFile: undefined, // We rely on contentStandardsDocumentId to prefill the file input
              contentStandardsDocumentId: license.contentStandardsDocumentId ?? undefined,
              visibility: license.visibility,
              monitorType: license.enableMonetization
                ? MonitorType.MonitorAndRevshare
                : MonitorType.MonitorOnly,
              contentStandardScope: license.contentStandardsScope || '',
              contentStandardAnswers: license.contentStandardAnswers || [],
              durationType: enableIpPlatformTimeboundLicenses
                ? license.licenseDuration?.durationType
                : LicenseDurationType.Perpetual,
              minDuration: enableIpPlatformTimeboundLicenses
                ? convertNumDaysToDurationBucket(
                    license.licenseDuration?.timeBounds?.minMax?.minDays,
                  )
                : undefined,
              maxDuration: enableIpPlatformTimeboundLicenses
                ? convertNumDaysToDurationBucket(
                    license.licenseDuration?.timeBounds?.minMax?.maxDays,
                  )
                : undefined,
            }}
            onSubmit={(data: LicenseFormData, options: LicenseFormSubmitOptions) => {
              const getContentStandardsDocumentId = () => {
                if (data.deleteContentStandardsDocument) {
                  return '';
                }
                return license.contentStandardsDocumentId ?? undefined;
              };

              updateLicenseMutation.mutate(
                {
                  licenseId,
                  royaltyRate: license.royaltyRate ?? 0,
                  maxAgeRating: license.maxAgeRating ?? UniverseContentMaturity.None,
                  dau7DayThreshold: license.dau7DayThreshold ?? DauBucket.None,
                  name: data.name,
                  description: data.description,
                  visibility: data.visibility ?? LicenseVisibility.Private,
                  enableMonetization: data.monitorType === MonitorType.MonitorAndRevshare,
                  contentStandardsDocumentId: getContentStandardsDocumentId(),
                  countries: license.countries ?? [],
                  creatorDau7DayThreshold: license.creatorDau7DayThreshold ?? DauBucket.None,
                  ...(!hasAgreements && {
                    royaltyRate: data.revenueShare,
                    maxAgeRating: data.maxMaturityRating,
                    dau7DayThreshold: data.minimumDAU,
                  }),
                  ...(data.contentStandardsFile && {
                    contentStandardsDocument: data.contentStandardsFile,
                  }),
                  contentStandardScope: data.contentStandardScope,
                  contentStandardAnswers: data.contentStandardAnswers.map((a) => ({
                    questionId: a.questionId ?? '',
                    answer:
                      (a.answer as ContentStandardAnswer) ?? ContentStandardAnswer.NotApplicable,
                  })),
                  licenseDuration: enableIpPlatformTimeboundLicenses
                    ? buildLicenseDurationForRequest(
                        data.durationType ??
                          license.licenseDuration?.durationType ??
                          LicenseDurationType.Perpetual,
                        {
                          minDays:
                            data.minDuration ??
                            license.licenseDuration?.timeBounds?.minMax?.minDays,
                          maxDays:
                            data.maxDuration ??
                            license.licenseDuration?.timeBounds?.minMax?.maxDays,
                        },
                      )
                    : null,
                },
                {
                  onSuccess: () => {
                    enqueueSuccessSnackbar(
                      options.hasModeratedChanges
                        ? 'Message.LicenseUpdatedWithPendingChanges'
                        : 'Message.LicenseUpdated',
                    );
                    router.push(IP_LISTING_DETAILS_HREF(license.listingId || ''));
                  },
                  onError: () => {
                    enqueueErrorSnackbar();
                  },
                },
              );
            }}
            onCancel={() => {
              router.push(IP_LISTING_DETAILS_HREF(license.listingId || ''));
            }}
            submitButtonText={translate('Action.Update')}
            isSubmitting={updateLicenseMutation.isPending}
          />
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default withTranslation(LicenseEditContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
]);
