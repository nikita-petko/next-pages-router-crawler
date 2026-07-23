import React, { FunctionComponent, useState, useCallback, useMemo } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PageLoading } from '@modules/miscellaneous/common';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { useRouter } from 'next/router';
import {
  useLicenseManagerLogger,
  LicenseManagerClickEvent,
} from '@modules/ip/license-manager/utils/logger';
import { useSettings } from '@modules/settings';

import SelectedExperienceContext from '../context/SelectedExperienceContext';
import SelectExperienceStep from '../components/SelectExperienceStep';
import SelectCreationReadinessStep from '../components/SelectCreationReadinessStep';
import ReviewTermsStep, { ReviewTermsState } from '../components/ReviewTermsStep';
import SubmitApplicationStep from '../components/SubmitApplicationStep';
import useGetPublicLicenseById from '../hooks/useGetPublicLicenseById';
import { EXPLORE_LISTING_DETAILS } from '../urls';

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

export enum Steps {
  SelectExperience = 0,
  SelectCreationReadiness = 1,
  ReviewTerms = 2,
  SubmitApplication = 3,
}

const CancelConfirmationModal: React.FC<CancelConfirmationModalProps> = ({
  isOpen,
  onClickCancel,
  onClickConfirm,
}) => {
  const { translate } = useTranslation();

  return (
    <Dialog fullWidth maxWidth='Medium' open={isOpen}>
      <DialogTitle>{translate('Heading.ConfirmCancellation')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{translate('Message.ConfirmCancellation')}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClickCancel} variant='contained' color='secondary'>
          {translate('Action.No')}
        </Button>
        <Button onClick={onClickConfirm} variant='contained' color='primaryBrand'>
          {translate('Action.Yes')}
        </Button>
      </DialogActions>
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
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;

  const [activeStep, setActiveStep] = useState(Steps.SelectExperience);
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
  const providerValue = useMemo(
    () => ({ selectedExperienceId, setSelectedExperienceId }),
    [selectedExperienceId, setSelectedExperienceId],
  );

  const logClickEvent = useCallback(
    async (eventName: LicenseManagerClickEvent) => {
      logEvent(eventName, {
        licenseId: licenseId!,
        experienceId: selectedExperienceId ?? '',
      });
    },
    [licenseId, selectedExperienceId, logEvent],
  );

  const onNext = useCallback(() => {
    setActiveStep(activeStep + 1);
  }, [activeStep, setActiveStep]);

  const onPrev = useCallback(() => {
    setActiveStep(activeStep - 1);
  }, [activeStep, setActiveStep]);

  const onClickCancel = useCallback(() => {
    if (selectedExperienceId != null) {
      setIsCancelConfirmationModalOpen(true);
      return;
    }
    logClickEvent(LicenseManagerClickEvent.CancelLicenseRequestNoExperienceSelectedClickEvent);
    router.push(EXPLORE_LISTING_DETAILS(listingId));
  }, [selectedExperienceId, router, listingId, logClickEvent]);

  // Are you sure you want to cancel? > Select YES to confirm cancel
  const onClickConfirmCancellation = () => {
    logEvent(LicenseManagerClickEvent.CancelLicenseRequestYesClickEvent, {
      licenseId: licenseId!,
      experienceId: selectedExperienceId ?? '',
      activeStep: Steps[activeStep],
    });
    setIsCancelConfirmationModalOpen(false);
    router.push(EXPLORE_LISTING_DETAILS(listingId));
  };

  // Are you sure you want to cancel? > Select NO to cancel cancel
  const onClickCancelCancellation = () => {
    logEvent(LicenseManagerClickEvent.CancelLicenseRequestNoClickEvent, {
      licenseId: licenseId!,
      experienceId: selectedExperienceId ?? '',
      activeStep: Steps[activeStep],
    });
    setIsCancelConfirmationModalOpen(false);
  };

  const { isPending, isError, data: license } = useGetPublicLicenseById({ licenseId });

  if (!isFetched || isPending) {
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
      <Grid item marginBottom={6}>
        <Typography variant='h2' data-testid='apply-to-license-heading'>
          {translate('Heading.RequestLicense')}
        </Typography>
      </Grid>
      <Grid item marginBottom={4}>
        <Stepper activeStep={activeStep}>
          <Step>
            <StepLabel>{translate('Label.SelectExperience')}</StepLabel>
          </Step>
          <Step>
            <StepLabel>
              {enableIpPlatformTimeboundLicenses
                ? translate('Label.DescribeYourVision')
                : translate('Label.TellUsMore')}
            </StepLabel>
          </Step>
          <Step>
            <StepLabel>{translate('Label.AcknowledgeTerms')}</StepLabel>
          </Step>
          <Step>
            <StepLabel>{translate('Label.SubmitApplication')}</StepLabel>
          </Step>
        </Stepper>
      </Grid>
      <Grid item container>
        {activeStep === Steps.SelectExperience && (
          <SelectExperienceStep onNext={onNext} onCancel={onClickCancel} license={license} />
        )}
        {activeStep === Steps.SelectCreationReadiness && (
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
            dateRange={dateRange}
            setDateRange={setDateRange}
            onNext={onNext}
            onPrev={onPrev}
            onCancel={onClickCancel}
          />
        )}
        {activeStep === Steps.ReviewTerms && (
          <ReviewTermsStep
            license={license}
            reviewTermsState={reviewTermsState}
            setReviewTermsState={setReviewTermsState}
            onNext={onNext}
            onPrev={onPrev}
            onCancel={onClickCancel}
          />
        )}
        {activeStep === Steps.SubmitApplication && (
          <SubmitApplicationStep
            onPrev={onPrev}
            license={license}
            listingId={listingId}
            creatorPitch={creatorPitch}
            dateRange={dateRange}
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
