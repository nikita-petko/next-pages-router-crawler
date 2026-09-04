import type { FunctionComponent } from 'react';
import React, { useCallback, useContext } from 'react';
import type { LicenseResponse } from '@rbx/client-content-licensing-api/v1';
import { LicenseDurationType, LicenseType } from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
import { useTranslation, useLocalization, Locale } from '@rbx/intl';
import { Button, Grid, Typography } from '@rbx/ui';
import { isImageAttachmentEnabledInLicenseApplication } from '@generated/flags/contentLicensing';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import {
  KeyValuePair,
  KeyValuePairContainer,
} from '@modules/ip/license-manager/components/KeyValuePair';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLoggerLogOnce,
} from '@modules/ip/license-manager/utils/logger';
import { getDateRangeLabel } from '@modules/ip/license-manager/utils/timeLimitedLicense';
import CreatorThumbnailContainer from '@modules/miscellaneous/common/containers/CreatorThumbnailContainer';
import { PageLoading } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import Flex from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import SelectedCreatorContext from '../context/SelectedCreatorContext';
import SelectedExperienceContext from '../context/SelectedExperienceContext';
import useApplyToPublicLicenseMutation from '../hooks/useApplyToLicenseMutation';
import {
  type CreatorPitchAttachment,
  hasBlockingCreatorPitchAttachments,
  getSubmittableCreatorPitchAttachmentAssetIds,
  hasUsableCreatorPitchAttachments,
  isCreatorPitchAttachmentsRequired,
} from '../utils/creatorPitchAttachmentTypes';
import { getApplyFlowRevShareOnActivation } from '../utils/getApplyFlowRevShareOnActivation';
import { isAvatarLicenseApplyFlow } from '../utils/isAvatarLicenseApplyFlow';
import { getEffectiveLicenseTypeForDisplay } from '../utils/licenseTypeTranslationKeys';
import type { CollaborationSalesAvenues } from '../utils/salesAvenue';
import ApplicationSubmissionModal from './ApplicationSubmissionModal';
import ExperienceSummaryCardContainer from './ExperienceSummaryCardContainer';
import LicenseSummaryCardContainer from './LicenseSummaryCardContainer';
import SalesAvenueResolvedGrid from './SalesAvenueResolvedGrid';
import ViewPitchAttachments from './ViewPitchAttachments';

const EMPTY_CREATOR_PITCH_ATTACHMENTS: CreatorPitchAttachment[] = [];

interface SubmitApplicationStepProps {
  onPrev: () => void;
  onCancel: () => void;
  license: LicenseResponse;
  listingId: string;
  creatorPitch: string;
  creatorPitchAttachments?: CreatorPitchAttachment[];
  dateRange?: { startDate: Date | null; endDate: Date | null } | undefined;
  enableMonetization?: boolean;
  enableCollaborationLicensing?: boolean;
  enableMarketplaceSalesLicensing?: boolean;
  collaborationSalesAvenues?: CollaborationSalesAvenues;
  logClickEvent?: (eventName: LicenseManagerClickEvent) => void;
}

/** A component that displays a step in the request license flow where the user submits their application for the license. */
const SubmitApplicationStep: FunctionComponent<SubmitApplicationStepProps> = ({
  onPrev,
  onCancel,
  license,
  listingId,
  creatorPitch,
  creatorPitchAttachments = EMPTY_CREATOR_PITCH_ATTACHMENTS,
  dateRange,
  enableMonetization,
  enableCollaborationLicensing = false,
  enableMarketplaceSalesLicensing = false,
  collaborationSalesAvenues,
  logClickEvent,
}) => {
  const { translate } = useTranslation();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { locale } = useLocalization();
  const { isFetched } = useSettings();
  const { ready: isImageAttachmentFlagReady, value: isImageAttachmentEnabled } = useFlag(
    isImageAttachmentEnabledInLicenseApplication,
  );
  const isSubmitBlockedByAttachments =
    isImageAttachmentFlagReady &&
    isImageAttachmentEnabled &&
    (hasBlockingCreatorPitchAttachments(creatorPitchAttachments) ||
      (isCreatorPitchAttachmentsRequired(license.licenseType) &&
        !hasUsableCreatorPitchAttachments(creatorPitchAttachments)));

  const selectedLicenseOwnerLabel = tPendingTranslation(
    'Selected license owner',
    'Heading on the review-and-submit step showing who was chosen as the license owner (apply-as target). Distinct from the earlier picker step labeled Select license owner.',
    translationKey('Label.SelectedLicenseOwner', TranslationNamespace.Licenses),
  );
  const requestLabel = tPendingTranslation(
    'Apply',
    'Apply for a license',
    translationKey('Action.Apply', TranslationNamespace.Licenses),
  );
  const context = useContext(SelectedExperienceContext);
  const { selectedExperienceId } = context;
  const { selectedCreator } = useContext(SelectedCreatorContext);
  const licenseId = license.id;

  const revShareOnActivation = getApplyFlowRevShareOnActivation({
    durationType: license.licenseDuration?.durationType,
    licenseType: license.licenseType,
    enableCollaborationLicensing,
    enableMarketplaceSalesLicensing,
  });

  const effectiveLicenseType = getEffectiveLicenseTypeForDisplay(
    license.licenseType,
    enableCollaborationLicensing,
    enableMarketplaceSalesLicensing,
  );
  const isAvatarLicense = isAvatarLicenseApplyFlow(effectiveLicenseType);
  const requiresExperienceSelection = !isAvatarLicense;
  const applyCreatorId = selectedCreator?.creatorId;
  const applyCreatorType = selectedCreator?.creatorType;

  const showCollaborationSalesAvenueFields =
    enableCollaborationLicensing &&
    license.licenseType === LicenseType.CollaborationInExperienceSale;

  const applyToLicenseMutation = useApplyToPublicLicenseMutation(
    licenseId ?? '',
    revShareOnActivation ? true : (enableMonetization ?? false),
    enableCollaborationLicensing,
    license.licenseType,
  );

  const { logOnce } = useLicenseManagerLoggerLogOnce();
  if (licenseId && (selectedExperienceId || isAvatarLicense)) {
    logOnce(LicenseManagerImpressionEvent.ReviewAndSubmitLicenseRequestStepImpressionEvent, {
      licenseId,
      experienceId: selectedExperienceId ?? '',
    });
  }

  const onClickSubmit = useCallback(async () => {
    if (isSubmitBlockedByAttachments) {
      return;
    }
    if (logClickEvent) {
      logClickEvent(LicenseManagerClickEvent.SubmitLicenseRequestClickEvent);
    }
    if (
      selectedExperienceId ||
      (isAvatarLicense && applyCreatorId != null && applyCreatorType != null)
    ) {
      const pitch = creatorPitch.trim();
      const pitchImageAssetIds =
        getSubmittableCreatorPitchAttachmentAssetIds(creatorPitchAttachments);
      await applyToLicenseMutation
        .mutateAsync({
          universeId: selectedExperienceId ?? undefined,
          applyCreator:
            isAvatarLicense && applyCreatorId != null && applyCreatorType != null
              ? { creatorId: applyCreatorId, creatorType: applyCreatorType }
              : undefined,
          pitch,
          dateRange:
            license.licenseDuration?.durationType === LicenseDurationType.TimeLimited
              ? dateRange
              : undefined,
          collaborationSalesAvenues: showCollaborationSalesAvenueFields
            ? collaborationSalesAvenues
            : undefined,
          pitchImageAssetIds: pitchImageAssetIds.length > 0 ? pitchImageAssetIds : undefined,
        })
        .catch(() => undefined);
    }
  }, [
    isSubmitBlockedByAttachments,
    logClickEvent,
    selectedExperienceId,
    isAvatarLicense,
    applyCreatorId,
    applyCreatorType,
    creatorPitch,
    creatorPitchAttachments,
    applyToLicenseMutation,
    license.licenseDuration,
    dateRange,
    showCollaborationSalesAvenueFields,
    collaborationSalesAvenues,
  ]);

  if (
    !licenseId ||
    (requiresExperienceSelection && !selectedExperienceId) ||
    (isAvatarLicense && (applyCreatorId == null || applyCreatorType == null))
  ) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
      />
    );
  }

  if (!isFetched) {
    return <PageLoading />;
  }

  return (
    <>
      <Grid container flexDirection='column' padding={1.5} spacing={2}>
        <Grid item container flexDirection='column'>
          <Grid item>
            <Typography variant='h6'>{translate('Description.ReviewApplication')}</Typography>
          </Grid>
          <Grid item flexDirection='column' marginTop={2}>
            <Typography variant='h6' color='primary'>
              {translate('Label.SelectedLicense')}
            </Typography>
            <LicenseSummaryCardContainer
              license={license}
              listingId={listingId}
              effectiveLicenseType={effectiveLicenseType}
            />
          </Grid>
          {isAvatarLicense && selectedCreator != null && (
            <Grid item flexDirection='column' marginTop={2}>
              <Typography variant='h6' color='primary'>
                {selectedLicenseOwnerLabel}
              </Typography>
              <div className='flex items-center gap-xsmall'>
                <CreatorThumbnailContainer className='size-400' creator={selectedCreator} />
                <Typography variant='body1'>{selectedCreator.creatorName}</Typography>
              </div>
            </Grid>
          )}
          {requiresExperienceSelection && selectedExperienceId != null && (
            <Grid item flexDirection='column' marginTop={2}>
              <Typography variant='h6' color='primary'>
                {translate('Label.SelectedCreation')}
              </Typography>
              <ExperienceSummaryCardContainer
                experienceId={selectedExperienceId}
                creationDetailsContent={
                  showCollaborationSalesAvenueFields && collaborationSalesAvenues ? (
                    <KeyValuePairContainer>
                      {collaborationSalesAvenues.developerProducts.length > 0 && (
                        <KeyValuePair
                          label={translate('Label.DeveloperProducts')}
                          value={
                            <SalesAvenueResolvedGrid
                              entries={collaborationSalesAvenues.developerProducts}
                            />
                          }
                        />
                      )}
                      {collaborationSalesAvenues.gamePasses.length > 0 && (
                        <KeyValuePair
                          label={translate('Label.GamePasses')}
                          value={
                            <SalesAvenueResolvedGrid
                              entries={collaborationSalesAvenues.gamePasses}
                            />
                          }
                        />
                      )}
                    </KeyValuePairContainer>
                  ) : undefined
                }
              />
            </Grid>
          )}
          <Grid
            item
            flexDirection='column'
            marginTop={2}
            width='50%'
            data-testid='creator-pitch-summary'>
            <KeyValuePairContainer>
              <KeyValuePair
                label={translate('Label.CreatorIntentOfUse')}
                value={
                  <Flex flexDirection='column' gap={12}>
                    <Typography whiteSpace='pre-wrap'>{creatorPitch}</Typography>
                    <ViewPitchAttachments attachments={creatorPitchAttachments} />
                  </Flex>
                }
              />
              {license.licenseDuration?.durationType === LicenseDurationType.TimeLimited &&
                dateRange && (
                  <KeyValuePair
                    label={translate('Header.DateRangeRequest')}
                    value={getDateRangeLabel(
                      dateRange.startDate,
                      dateRange.endDate,
                      locale ?? Locale.English,
                    )}
                  />
                )}
            </KeyValuePairContainer>
          </Grid>
        </Grid>
        {/* TODO - aquach - remove marginTop once StickyFooter is implemented */}
        <Grid item marginTop={6}>
          <Flex flexDirection='row' gap={10}>
            <Button
              variant='text'
              color='secondary'
              onClick={onCancel}
              loading={applyToLicenseMutation.isPending}
              disabled={applyToLicenseMutation.isPending}>
              {translate('Action.Cancel')}
            </Button>
            <Button
              variant='outlined'
              color='secondary'
              onClick={onPrev}
              loading={applyToLicenseMutation.isPending}
              disabled={applyToLicenseMutation.isPending}>
              {translate('Action.Back')}
            </Button>
            <Button
              variant='contained'
              onClick={onClickSubmit}
              loading={applyToLicenseMutation.isPending}
              disabled={applyToLicenseMutation.isPending || isSubmitBlockedByAttachments}
              data-testid='apply-to-license-submit'>
              {requestLabel}
            </Button>
          </Flex>
        </Grid>
      </Grid>
      {/* TODO - Show a specific error if the agreement is already active */}
      {applyToLicenseMutation.isError && (
        <Grid item>
          <Typography variant='body2' color='error'>
            {translate('Label.FailedToSubmitApplication')}
          </Typography>
        </Grid>
      )}
      <ApplicationSubmissionModal
        isOpen={applyToLicenseMutation.isSuccess}
        logClickEvent={logClickEvent}
      />
    </>
  );
};

export default SubmitApplicationStep;
