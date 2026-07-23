import React, { FunctionComponent, useState, useCallback, useRef, useEffect } from 'react';
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
import RemovalRequestForm from './RemovalRequestForm';
import LegalAgreementsContainer from './LegalAgreementsContainer';
import ConflictClaimSubmittedDialog from './ConflictClaimSubmittedDialog';
import createClaimHandlerErrorDialog from '../error/CreateClaimHandlerErrorDialog';
import { useCurrentAccountContext } from '../../../components/AccountProvider';

export const CreateRemovalRequestURL = `/dashboard/rights-manager/removal-requests/create`;
export const AccountsURL = `/dashboard/rights-manager/accounts`;

const LAST_STEP = 2;

export type ContentInfo = {
  contentId: number;
  contentType: ClaimContentContentTypeEnum;
  originalLink: string;
};

export type TakedownRequest = {
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
 * CreateRemovalRequestContainer displays a form for creating removal requests
 */
const CreateRemovalRequestContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [claimDescription, setClaimDescription] = useState('');
  const router = useRouter();
  const { ready, translate } = useTranslation();
  const { account, user } = useCurrentAccountContext();
  const {
    classes: { hiddenContainer, fullWidth },
  } = useStyles();

  const [takedownRequests, setTakedownRequests] = useState<TakedownRequest[]>([]);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
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
    handlerReset();
    router.push(AccountsURL);
  }, [handlerReset, router]);

  useEffect(() => {
    if (handlerIsSuccess && !shouldToastConflict) {
      reset();
    }
  }, [handlerIsSuccess, shouldToastConflict, reset]);

  if (account && account.status && account.status !== AccountStatusEnum.Verified) {
    router.push(AccountsURL);
    return null;
  }

  if (handlerIsSuccess) {
    return shouldToastConflict ? (
      <ConflictClaimSubmittedDialog reset={reset} onClose={reset} />
    ) : null;
  }

  if (!account || !user || !ready) {
    return <PageLoading />;
  }

  const submissionData = {
    accountId: account?.id ?? '',
    userId: user?.id ?? '',
    description: claimDescription,
    takedownRequests,
  };

  const HandlerErrorDialog = createClaimHandlerErrorDialog({
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
        <Grid item container direction='column' spacing={2} paddingBottom='32px' ref={headerRef}>
          <Grid item>
            <Typography variant='body1' color='secondary'>
              {translate('Description.NewRemovalRequest')}
            </Typography>
          </Grid>
        </Grid>
        <Grid item className={fullWidth} paddingBottom='48px'>
          <Stepper activeStep={activeStep} orientation='horizontal'>
            <Step>
              <StepLabel>
                <Typography>{translate('Label.SelectCreationsForRemoval')}</Typography>
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
        <Grid item className={activeStep === 2 ? hiddenContainer : ''}>
          <RemovalRequestForm
            takedownRequests={takedownRequests}
            setTakedownRequests={setTakedownRequests}
            onClickNext={onClickNext}
            onClickBack={() => {
              router.push(AccountsURL);
            }}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            setBacktrackToSearch={() => {}}
          />
        </Grid>
        <Grid item className={activeStep !== 2 ? hiddenContainer : ''}>
          <LegalAgreementsContainer
            requestName={claimDescription}
            setRequestName={setClaimDescription}
            onClickBack={() => {
              handlerReset();
              onClickBack();
            }}
            onClickNext={() => handler(submissionData)}
            isLoading={handlerIsPending && !isErrorDialogOpen}
            isClaimsEnabled={false}
          />
        </Grid>
      </Grid>
      {HandlerErrorDialog}
    </React.Fragment>
  );
};

export default withTranslation(CreateRemovalRequestContainer, [TranslationNamespace.RightsPortal]);
