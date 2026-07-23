import type { FunctionComponent } from 'react';
import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import type { Theme } from '@mui/material/styles';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Grid, Step, StepLabel, Stepper } from '@rbx/ui';
import {
  useLicenseManagerLogger,
  LicenseManagerClickEvent,
} from '@modules/ip/license-manager/utils/logger';
import { PageLoading } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import type { ReviewTermsState } from '../components/ReviewTermsStep';
import ReviewTermsStep from '../components/ReviewTermsStep';
import SelectCreationReadinessStep from '../components/SelectCreationReadinessStep';
import SelectExperienceStep from '../components/SelectExperienceStep';
import SetLicenseRequirementsStep from '../components/SetLicenseRequirementsStep';
import SubmitApplicationStep from '../components/SubmitApplicationStep';
import SelectedExperienceContext from '../context/SelectedExperienceContext';
import useGetPublicLicenseById from '../hooks/useGetPublicLicenseById';
import {
  EXPLORE_LICENSES_HREF,
  EXPLORE_LISTING_DETAILS,
  LICENSE_REQUEST_RETURN_TO_QUERY,
  LicenseRequestCancelReturnTo,
} from '../urls';
import type { CollaborationSalesAvenues } from '../utils/salesAvenue';
import { EMPTY_COLLABORATION_SALES_AVENUES } from '../utils/salesAvenue';

interface ApplyToLicenseContainerProps {
  listingId: string;
  licenseId: string;
  experienceId?: number;
}

interface CancelConfirmationModalProps {
  isOpen: boolean;
  onClickCancel: () => void;
  onClickConfirm: () => void;
}

type ApplyToLicenseStepKey =
  | 'SelectExperience'
  | 'SelectCreationReadiness'
  | 'SetLicenseRequirements'
  | 'ReviewTerms'
  | 'SubmitApplication';

/** Tailwind arbitrary max-width for cancel confirmation dialog content (literal required for JIT). */
const CANCEL_DIALOG_CONTENT_CLASSNAME = 'max-w-[320px] width-full';

/**
 * Active step label styles. Tailwind on the Stepper root usually loses to MUI StepLabel’s Emotion
 * `body2` / active `fontWeight` rules; hoisted `sx` keeps a stable callback ref and matches theme bold.
 */
const applyLicenseStepperSx = (theme: Theme) => ({
  '& .MuiStepLabel-label.Mui-active': {
    fontWeight: theme.typography.fontWeightBold,
  },
  '& .MuiStepLabel-label.Mui-active .MuiTypography-root': {
    fontWeight: theme.typography.fontWeightBold,
  },
});

function getApplyToLicenseStepKeys(
  showSetLicenseRequirementsStep: boolean,
): ApplyToLicenseStepKey[] {
  const keys: ApplyToLicenseStepKey[] = ['SelectExperience', 'SelectCreationReadiness'];
  if (showSetLicenseRequirementsStep) {
    keys.push('SetLicenseRequirements');
  }
  keys.push('ReviewTerms', 'SubmitApplication');
  return keys;
}

const CancelConfirmationModal: React.FC<CancelConfirmationModalProps> = ({
  isOpen,
  onClickCancel,
  onClickConfirm,
}) => {
  const { translate } = useTranslation();

  return (
    <Dialog open={isOpen} size='Small' isModal hasCloseAffordance={false}>
      <DialogContent className={CANCEL_DIALOG_CONTENT_CLASSNAME}>
        <DialogBody className='flex flex-col gap-y-xsmall'>
          <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
            {translate('Heading.ConfirmCancellation')}
          </DialogTitle>
          <span className='text-body-medium content-default margin-none'>
            {translate('Message.ConfirmCancellation')}
          </span>
        </DialogBody>
        <DialogFooter className='flex flex-col gap-small small:flex-row small:justify-end'>
          <Button onClick={onClickCancel} variant='contained' color='secondary'>
            {translate('Action.No')}
          </Button>
          <Button onClick={onClickConfirm} variant='contained' color='primaryBrand'>
            {translate('Action.Yes')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/** Contains the steps needed to apply for a license and maintains the state between those steps */
const ApplyToLicenseContainer: FunctionComponent<ApplyToLicenseContainerProps> = ({
  listingId,
  licenseId,
  experienceId,
}) => {
  const router = useRouter();
  const cancelReturnHref = useMemo(() => {
    const raw = router.query?.[LICENSE_REQUEST_RETURN_TO_QUERY];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value === LicenseRequestCancelReturnTo.LicensesCatalog) {
      return EXPLORE_LICENSES_HREF;
    }
    return EXPLORE_LISTING_DETAILS(listingId);
  }, [listingId, router.query]);
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const { isFetched } = useSettings();
  const { frontendFlags, loadingFrontendFlags } = useToolboxServiceApiProvider();
  const enableCollaborationLicensing =
    frontendFlags[FrontendFlagName.FrontendFlagEnableCreatorCollaborationLicensing] ?? false;
  const enableMarketplaceSalesLicensing =
    frontendFlags[FrontendFlagName.FrontendFlagEnableMarketplaceSalesLicensing] ?? false;

  const [activeStep, setActiveStep] = useState(0);
  const [selectedExperienceId, setSelectedExperienceId] = useState<number | null>(
    experienceId ?? null,
  );
  const [isCancelConfirmationModalOpen, setIsCancelConfirmationModalOpen] =
    useState<boolean>(false);
  const [isRevShareNowTimingPreferred, setRevShareNowTimingPreference] = useState<
    boolean | undefined
  >(undefined);
  const [creatorPitch, setCreatorPitch] = useState<string>('');
  const [dateRange, setDateRange] = useState<
    | {
        startDate: Date | null;
        endDate: Date | null;
      }
    | undefined
  >(undefined);
  const [reviewTermsState, setReviewTermsState] = useState<ReviewTermsState>({
    isConsentChecked: false,
    isGuidelinesAndRestrictionsChecked: false,
    isGuidelinesAndRestrictionsReviewed: false,
  });
  const [collaborationSalesAvenues, setCollaborationSalesAvenues] =
    useState<CollaborationSalesAvenues>(EMPTY_COLLABORATION_SALES_AVENUES);
  const providerValue = useMemo(
    () => ({ selectedExperienceId, setSelectedExperienceId }),
    [selectedExperienceId, setSelectedExperienceId],
  );

  const { isPending, isError, data: license } = useGetPublicLicenseById({ licenseId });

  const showSetLicenseRequirementsStep = enableCollaborationLicensing;

  const stepKeys = useMemo(
    () => getApplyToLicenseStepKeys(showSetLicenseRequirementsStep),
    [showSetLicenseRequirementsStep],
  );

  const stepLabels = useMemo(
    () =>
      stepKeys.map((stepKey) => {
        switch (stepKey) {
          case 'SelectExperience':
            return translate('Label.SelectExperience');
          case 'SelectCreationReadiness':
            return showSetLicenseRequirementsStep
              ? translate('Label.TellUsMore')
              : translate('Label.DescribeYourVision');
          case 'SetLicenseRequirements':
            return translate('Heading.SetYourRequirements');
          case 'ReviewTerms':
            return translate('Label.AcknowledgeTerms');
          case 'SubmitApplication':
            return translate('Label.SubmitApplication');
          default: {
            const exhaustiveStepKey: never = stepKey;
            return exhaustiveStepKey;
          }
        }
      }),
    [showSetLicenseRequirementsStep, stepKeys, translate],
  );

  const activeStepKey = stepKeys[activeStep];

  const logClickEvent = useCallback(
    async (eventName: LicenseManagerClickEvent) => {
      logEvent(eventName, {
        licenseId,
        experienceId: selectedExperienceId ?? '',
      });
    },
    [licenseId, selectedExperienceId, logEvent],
  );

  const onNext = useCallback(() => {
    setActiveStep((currentStep) => currentStep + 1);
  }, []);

  const onPrev = useCallback(() => {
    setActiveStep((currentStep) => currentStep - 1);
  }, []);

  const onClickCancel = useCallback(() => {
    if (selectedExperienceId != null) {
      setIsCancelConfirmationModalOpen(true);
      return;
    }
    void logClickEvent(LicenseManagerClickEvent.CancelLicenseRequestNoExperienceSelectedClickEvent);
    void router.push(cancelReturnHref);
  }, [selectedExperienceId, router, cancelReturnHref, logClickEvent]);

  // Are you sure you want to cancel? > Select YES to confirm cancel
  const onClickConfirmCancellation = useCallback(() => {
    logEvent(LicenseManagerClickEvent.CancelLicenseRequestYesClickEvent, {
      licenseId,
      experienceId: selectedExperienceId ?? '',
      activeStep: activeStepKey ?? String(activeStep),
    });
    setIsCancelConfirmationModalOpen(false);
    void router.push(cancelReturnHref);
  }, [
    activeStep,
    activeStepKey,
    cancelReturnHref,
    licenseId,
    logEvent,
    router,
    selectedExperienceId,
  ]);

  // Are you sure you want to cancel? > Select NO to cancel cancel
  const onClickCancelCancellation = useCallback(() => {
    logEvent(LicenseManagerClickEvent.CancelLicenseRequestNoClickEvent, {
      licenseId,
      experienceId: selectedExperienceId ?? '',
      activeStep: activeStepKey ?? String(activeStep),
    });
    setIsCancelConfirmationModalOpen(false);
  }, [activeStep, activeStepKey, licenseId, logEvent, selectedExperienceId]);

  if (!isFetched || loadingFrontendFlags || isPending) {
    return <PageLoading />;
  }

  if (isError || !license) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
      />
    );
  }

  return (
    <SelectedExperienceContext.Provider value={providerValue}>
      <Grid item marginBottom={4}>
        <Stepper activeStep={activeStep} sx={applyLicenseStepperSx}>
          {stepKeys.map((stepKey, index) => (
            <Step key={stepKey}>
              <StepLabel>{stepLabels[index]}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Grid>
      <Grid item container>
        {activeStepKey === 'SelectExperience' && (
          <SelectExperienceStep onNext={onNext} onCancel={onClickCancel} license={license} />
        )}
        {activeStepKey === 'SelectCreationReadiness' && (
          <SelectCreationReadinessStep
            revShareValue={license.royaltyRate ?? 0}
            isRevShareNowTimingPreferred={
              isRevShareNowTimingPreferred ?? license.enableMonetization
            }
            licenseRevShareTiming={license.enableMonetization}
            setRevShareNowTimingPreference={setRevShareNowTimingPreference}
            creatorPitch={creatorPitch}
            setCreatorPitch={setCreatorPitch}
            licenseDuration={license.licenseDuration ?? undefined}
            licenseType={license.licenseType}
            enableCollaborationLicensing={enableCollaborationLicensing}
            enableMarketplaceSalesLicensing={enableMarketplaceSalesLicensing}
            collaborationSalesAvenues={collaborationSalesAvenues}
            setCollaborationSalesAvenues={setCollaborationSalesAvenues}
            dateRange={dateRange}
            setDateRange={setDateRange}
            contentMode={showSetLicenseRequirementsStep ? 'pitchOnly' : 'full'}
            onNext={onNext}
            onPrev={onPrev}
            onCancel={onClickCancel}
          />
        )}
        {activeStepKey === 'SetLicenseRequirements' && (
          <SetLicenseRequirementsStep
            revShareValue={license.royaltyRate ?? 0}
            isRevShareNowTimingPreferred={
              isRevShareNowTimingPreferred ?? license.enableMonetization
            }
            licenseRevShareTiming={license.enableMonetization}
            setRevShareNowTimingPreference={setRevShareNowTimingPreference}
            licenseDuration={license.licenseDuration ?? undefined}
            licenseType={license.licenseType}
            enableCollaborationLicensing={enableCollaborationLicensing}
            enableMarketplaceSalesLicensing={enableMarketplaceSalesLicensing}
            dateRange={dateRange}
            setDateRange={setDateRange}
            collaborationSalesAvenues={collaborationSalesAvenues}
            setCollaborationSalesAvenues={setCollaborationSalesAvenues}
            onNext={onNext}
            onPrev={onPrev}
            onCancel={onClickCancel}
          />
        )}
        {activeStepKey === 'ReviewTerms' && (
          <ReviewTermsStep
            license={license}
            reviewTermsState={reviewTermsState}
            setReviewTermsState={setReviewTermsState}
            onNext={onNext}
            onPrev={onPrev}
            onCancel={onClickCancel}
          />
        )}
        {activeStepKey === 'SubmitApplication' && (
          <SubmitApplicationStep
            onPrev={onPrev}
            license={license}
            listingId={listingId}
            creatorPitch={creatorPitch}
            dateRange={dateRange}
            enableCollaborationLicensing={enableCollaborationLicensing}
            enableMarketplaceSalesLicensing={enableMarketplaceSalesLicensing}
            collaborationSalesAvenues={collaborationSalesAvenues}
            enableMonetization={isRevShareNowTimingPreferred}
            onCancel={onClickCancel}
            logClickEvent={logClickEvent}
          />
        )}
      </Grid>
      <CancelConfirmationModal
        isOpen={isCancelConfirmationModalOpen}
        onClickCancel={onClickCancelCancellation}
        onClickConfirm={onClickConfirmCancellation}
      />
    </SelectedExperienceContext.Provider>
  );
};

export default withTranslation(ApplyToLicenseContainer, [
  TranslationNamespace.Controls,
  TranslationNamespace.Creations,
  TranslationNamespace.Error,
  TranslationNamespace.Licenses,
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
]);
