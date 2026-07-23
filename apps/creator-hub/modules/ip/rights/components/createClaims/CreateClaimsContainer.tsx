import React, { useState, useCallback, useEffect } from 'react';
import { Grid, Typography, Stepper, Step, StepLabel, makeStyles } from '@rbx/ui';
import { useRouter } from 'next/router';
import { PageLoading } from '@modules/miscellaneous/common';
import { Doc } from '@modules/miscellaneous/common/components/uploaders';
import {
  AccountStatusEnum,
  ClaimContentContentTypeEnum,
  ClaimItemDiscoveredFromEnum,
  ClaimItemSourceEnum,
} from '@rbx/clients/rightsV1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useCreateClaimHandler from '../../hooks/useCreateClaimHandler';
import LegalAgreementsContainer from '../createRemovalRequest/LegalAgreementsContainer';
import { ClaimsURL } from '../claims/ClaimsContainer';
import { accountURL } from '../account/AccountContainer';
import ReviewCreations from './ReviewCreations';
import AddCreationsForm from './AddCreationsForm/AddCreationsForm';
import ConflictClaimSubmittedDialog from '../createRemovalRequest/ConflictClaimSubmittedDialog';
import createClaimHandlerErrorDialog from '../error/CreateClaimHandlerErrorDialog';
import { useCurrentAccountContext } from '../../../components/AccountProvider';

export const CreateClaimsURL = `/dashboard/rights-manager/claims/create`;

const LAST_STEP = 2;

export type ContentInfo = {
  contentId: number;
  contentType: ClaimContentContentTypeEnum;
  originalLink: string;
};

export type ClaimRequest = {
  creationSource: ClaimItemSourceEnum;
  infringingContent: ContentInfo;
  myContent?: ContentInfo;
  description: string;
  supportingFiles: Doc[];
  key: string;
  discoveredFrom: ClaimItemDiscoveredFromEnum;
};

const useStyles = makeStyles()({
  hiddenContainer: {
    display: 'none',
  },
  fullWidth: {
    width: '100%',
  },
});

/**
 * CreateClaimsContainer displays a multi step form for creating claims
 */
const CreateClaimsContainer = () => {
  const { ready, translate } = useTranslation();

  const [activeStep, setActiveStep] = useState(0);
  const [claimDescription, setClaimDescription] = useState('');
  const router = useRouter();
  const { account, user, features } = useCurrentAccountContext();
  const {
    classes: { hiddenContainer, fullWidth },
  } = useStyles();
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([]);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const {
    handler,
    handlerReset,
    handlerIsSuccess,
    handlerIsPending,
    handlerIsError,
    shouldToastConflict,
    shouldEditConflictClaim,
    shouldEditBadRequestClaim,
    shouldRetryCreateClaim,
    shouldToastRateLimit,
  } = useCreateClaimHandler();

  const onClickNext = useCallback(() => {
    if (activeStep < LAST_STEP) {
      window.scrollTo(0, 0);
      setActiveStep(activeStep + 1);
    }
  }, [activeStep, setActiveStep]);

  const onClickBack = useCallback(() => {
    if (activeStep > 0) {
      window.scrollTo(0, 0);
      setActiveStep(activeStep - 1);
    }
  }, [activeStep, setActiveStep]);

  useEffect(() => {
    if (handlerIsError && !isErrorDialogOpen) {
      setIsErrorDialogOpen(true);
    }
  }, [handlerIsError, isErrorDialogOpen]);

  const reset = useCallback(() => {
    router.push(ClaimsURL);
    handlerReset();
  }, [handlerReset, router]);

  useEffect(() => {
    if (handlerIsSuccess && !shouldToastConflict) {
      reset();
    }
  }, [handlerIsSuccess, shouldToastConflict, reset]);

  if (!account || !user || !ready) {
    return <PageLoading />;
  }

  if (!ready || !features?.enableClaimsAndDisputes) {
    return null;
  }

  if (account && account.status && account.status !== AccountStatusEnum.Verified) {
    router.push(accountURL);
    return null;
  }

  if (handlerIsSuccess) {
    return shouldToastConflict ? (
      <ConflictClaimSubmittedDialog reset={reset} onClose={reset} />
    ) : null;
  }

  const submissionData = {
    accountId: account?.id ?? '',
    userId: user?.id ?? '',
    description: claimDescription,
    takedownRequests: claimRequests,
  };

  const handlerErrorDialog = createClaimHandlerErrorDialog({
    open: isErrorDialogOpen,
    reset: handlerReset,
    onClose: () => {
      setIsErrorDialogOpen(false);
      handlerReset();
    },
    isLoading: handlerIsPending,
    onSubmit: () => handler(submissionData),
    shouldEditConflictClaim,
    shouldRetryCreateClaim,
    shouldEditBadRequestClaim,
    shouldToastRateLimit,
  });

  return (
    <React.Fragment>
      <Grid container direction='column' spacing={1}>
        <Grid item container direction='column' spacing={2} paddingBottom='32px'>
          <Grid item>
            <Typography variant='body1' color='secondary'>
              {translate('Description.NewClaim')}
            </Typography>
          </Grid>
        </Grid>
        <Grid item className={fullWidth} paddingBottom='24px'>
          <Stepper activeStep={activeStep} orientation='horizontal'>
            <Step>
              <StepLabel>
                <Typography>{translate('Label.SelectCreationsToClaim')}</Typography>
              </StepLabel>
            </Step>
            <Step>
              <StepLabel>
                <Typography>{translate('Label.ReviewCreations')}</Typography>
              </StepLabel>
            </Step>
            <Step>
              <StepLabel>
                <Typography>{translate('Label.AddDetails')}</Typography>
              </StepLabel>
            </Step>
          </Stepper>
        </Grid>
        <Grid item className={activeStep === 0 ? '' : hiddenContainer}>
          <AddCreationsForm
            onNext={onClickNext}
            onBack={() => router.push(ClaimsURL)}
            claimRequests={claimRequests}
            setClaimRequests={setClaimRequests}
          />
        </Grid>
        <Grid item className={activeStep === 1 ? '' : hiddenContainer}>
          <ReviewCreations
            claimRequests={claimRequests}
            setClaimRequests={setClaimRequests}
            onClickNext={onClickNext}
            onClickBack={onClickBack}
            setActiveStep={setActiveStep}
          />
        </Grid>
        <Grid item className={activeStep === 2 ? '' : hiddenContainer}>
          <LegalAgreementsContainer
            requestName={claimDescription}
            setRequestName={setClaimDescription}
            onClickBack={() => {
              handlerReset();
              onClickBack();
            }}
            onClickNext={() => handler(submissionData)}
            isLoading={handlerIsPending && !isErrorDialogOpen}
            isClaimsEnabled
          />
        </Grid>
      </Grid>
      {handlerErrorDialog}
    </React.Fragment>
  );
};

export default withTranslation(CreateClaimsContainer, [TranslationNamespace.RightsPortal]);
