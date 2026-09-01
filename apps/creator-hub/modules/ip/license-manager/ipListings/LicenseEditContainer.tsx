import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  DauBucket,
  LicenseDurationType,
  LicenseModerationStatus,
  LicenseType,
  LicenseVisibility,
  UniverseContentMaturity,
} from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import { isIphInGameSalesAvatarMarketplaceSalesLicenseCreationEnabled } from '@generated/flags/contentLicensing';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import IpLoadError from '../../components/error/IpLoadError';
import useIpSnackbar from '../../hooks/useIpSnackbar';
import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import useConfirmation from '../agreements/hooks/useConfirmation';
import { IP_LISTING_DETAILS_HREF } from '../urls';
import { convertContentStandardsQuestionAnswerToRequest } from '../utils/guidelinesAndRestrictions';
import { LicenseManagerImpressionEvent, useLicenseManagerLogger } from '../utils/logger';
import { buildLicenseDurationForRequest } from '../utils/timeLimitedLicense';
import IpListingsBreadcrumbs from './components/IpListingsBreadcrumbs';
import type {
  LicenseFormAnalyticsContext,
  LicenseFormData,
  LicenseFormSubmitOptions,
} from './components/LicenseForm';
import LicenseForm, {
  buildLicenseFormAnalyticsParameters,
  EDIT_MODE,
  EDIT_WITH_AGREEMENTS_MODE,
} from './components/LicenseForm';
import LicensePendingAlert from './components/LicensePendingAlert';
import PendingEditsAlert from './components/PendingEditsAlert';
import {
  useLicenseQuery,
  useIpListingQuery,
  useUpdateLicenseMutation,
  useAgreementsByLicenseQuery,
} from './hooks/ipListings';
import mapLicenseResponseToFormDefaults from './utils/mapLicenseResponseToFormDefaults';
import { resolveEnableMonetization } from './utils/shouldRevShareOnActivation';

interface Props {
  licenseId: string;
}

/** Page to edit a license */
const LicenseEditContainer = ({ licenseId }: Props) => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { enqueueErrorSnackbar, enqueueSuccessSnackbar } = useIpSnackbar();
  const { logEvent } = useLicenseManagerLogger();
  const { confirm, confirmationContent } = useConfirmation();
  const { isFetched } = useSettings();
  const { ready: isLicenseCreationFlagReady, value: licenseCreationFlagValue } = useFlag(
    isIphInGameSalesAvatarMarketplaceSalesLicenseCreationEnabled,
  );
  const isLicenseCreationEnabled = licenseCreationFlagValue ?? false;

  const licenseReq = useLicenseQuery(licenseId);
  const ipListingReq = useIpListingQuery(licenseReq.data?.listingId ?? undefined);
  const agreementsReq = useAgreementsByLicenseQuery({ licenseId, pageSize: 10 });
  const updateLicenseMutation = useUpdateLicenseMutation();

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
    if (licenseReq.data && ipListingReq.data) {
      setPageTitle(
        <IpListingsBreadcrumbs
          pages={[
            {
              href: IP_LISTING_DETAILS_HREF(licenseReq.data.listingId ?? ''),
              title: ipListingReq.data.name ?? '',
            },
            { title: licenseReq.data.name ?? '' },
            { title: translate('Heading.Edit') },
          ]}
        />,
      );
    }
  }, [ipListingReq.data, licenseReq.data, setPageTitle, translate]);

  const hasAgreements = Boolean(agreementsReq.data?.agreements?.length);
  const hasPendingEdits = !!licenseReq.data?.hasPendingEdits;
  const isLicensePending = licenseReq.data?.moderationStatus === LicenseModerationStatus.Pending;
  const areModeratedFieldsLocked = hasPendingEdits || isLicensePending;
  const licenseFormAnalyticsContext = useMemo<LicenseFormAnalyticsContext>(
    () => ({
      formAction: 'update',
      entrySource: 'listingDetails',
      listingId: licenseReq.data?.listingId ?? '',
      licenseId,
      hasAgreements,
      hasPendingEdits: areModeratedFieldsLocked,
    }),
    [areModeratedFieldsLocked, hasAgreements, licenseId, licenseReq.data?.listingId],
  );

  if (licenseReq.error || ipListingReq.error || agreementsReq.error) {
    return <IpLoadError error={licenseReq.error ?? ipListingReq.error ?? agreementsReq.error} />;
  }

  if (
    !isFetched ||
    !isLicenseCreationFlagReady ||
    licenseReq.isPending ||
    ipListingReq.isPending ||
    agreementsReq.isPending
  ) {
    return <PageLoading />;
  }

  const license = licenseReq.data;
  const isMarketplaceSaleLicense = license.licenseType === LicenseType.MarketplaceSale;

  return (
    <>
      {confirmationContent}
      <Grid container direction='column' spacing={3} maxWidth={708}>
        {isLicensePending && !hasPendingEdits && (
          <Grid item XSmall={12}>
            <LicensePendingAlert />
          </Grid>
        )}
        {hasPendingEdits && license.pendingEdits && (
          <Grid item XSmall={12}>
            <PendingEditsAlert
              pendingEdits={license.pendingEdits}
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
            hasPendingEdits={areModeratedFieldsLocked}
            onBeforeSubmitModeratedChanges={handleBeforeSubmitModeratedChanges}
            defaultValues={{
              ...mapLicenseResponseToFormDefaults(
                license,
                isLicenseCreationEnabled,
                isLicenseCreationEnabled,
              ),
              contentStandardsFile: undefined, // Rely on contentStandardsDocumentId for existing PDF UI
            }}
            onSubmit={(data: LicenseFormData, options: LicenseFormSubmitOptions) => {
              const analyticsParameters = {
                ...buildLicenseFormAnalyticsParameters(licenseFormAnalyticsContext, {
                  ...data,
                  licenseType: data.licenseType ?? license.licenseType,
                  durationType:
                    data.durationType ??
                    license.licenseDuration?.durationType ??
                    LicenseDurationType.Perpetual,
                  visibility: data.visibility ?? LicenseVisibility.Private,
                }),
                hasModeratedChanges: options.hasModeratedChanges,
              };
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
                  maxAgeRating: isMarketplaceSaleLicense
                    ? UniverseContentMaturity.None
                    : (license.maxAgeRating ?? UniverseContentMaturity.None),
                  dau7DayThreshold: isMarketplaceSaleLicense
                    ? DauBucket.None
                    : (license.dau7DayThreshold ?? DauBucket.None),
                  name: data.name,
                  description: data.description,
                  visibility: data.visibility ?? LicenseVisibility.Private,
                  enableMonetization: resolveEnableMonetization({
                    durationType:
                      data.durationType ??
                      license.licenseDuration?.durationType ??
                      LicenseDurationType.Perpetual,
                    licenseType: isLicenseCreationEnabled
                      ? (data.licenseType ?? license.licenseType)
                      : license.licenseType,
                    monitorType: data.monitorType,
                    enableCollaborationLicensing: isLicenseCreationEnabled,
                    enableMarketplaceSalesLicensing: isLicenseCreationEnabled,
                  }),
                  contentStandardsDocumentId: getContentStandardsDocumentId(),
                  countries: license.countries ?? [],
                  creatorDau7DayThreshold: license.creatorDau7DayThreshold ?? DauBucket.None,
                  ...(!hasAgreements && {
                    royaltyRate: data.revenueShare,
                    ...(!isMarketplaceSaleLicense && {
                      maxAgeRating: data.maxMaturityRating,
                      dau7DayThreshold: data.minimumDAU,
                    }),
                  }),
                  ...(data.contentStandardsFile && {
                    contentStandardsDocument: data.contentStandardsFile,
                  }),
                  contentStandardScope: data.contentStandardScope,
                  contentStandardAnswers: convertContentStandardsQuestionAnswerToRequest(
                    data.contentStandardAnswers,
                  ),
                  licenseDuration: buildLicenseDurationForRequest(
                    data.durationType ??
                      license.licenseDuration?.durationType ??
                      LicenseDurationType.Perpetual,
                    {
                      minDays:
                        data.minDuration ?? license.licenseDuration?.timeBounds?.minMax?.minDays,
                      maxDays:
                        data.maxDuration ?? license.licenseDuration?.timeBounds?.minMax?.maxDays,
                    },
                  ),
                  // TODO - MUS-2702 - aquach - Send minimumCreatorEarningsBucket in licenseTerms once the update API supports it.
                },
                {
                  onSuccess: () => {
                    logEvent(
                      LicenseManagerImpressionEvent.IphLicenseFormSubmissionSuccessImpressionEvent,
                      analyticsParameters,
                    );
                    enqueueSuccessSnackbar(
                      options.hasModeratedChanges
                        ? 'Message.LicenseUpdatedWithPendingChanges'
                        : 'Message.LicenseUpdated',
                    );
                    void router.push(IP_LISTING_DETAILS_HREF(license.listingId ?? ''));
                  },
                  onError: () => {
                    logEvent(
                      LicenseManagerImpressionEvent.IphLicenseFormSubmissionFailureImpressionEvent,
                      analyticsParameters,
                    );
                    enqueueErrorSnackbar();
                  },
                },
              );
            }}
            onCancel={() => {
              void router.push(IP_LISTING_DETAILS_HREF(license.listingId ?? ''));
            }}
            submitButtonText={translate('Action.Update')}
            isSubmitting={updateLicenseMutation.isPending}
            analyticsContext={licenseFormAnalyticsContext}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default withTranslation(LicenseEditContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.Controls,
]);
