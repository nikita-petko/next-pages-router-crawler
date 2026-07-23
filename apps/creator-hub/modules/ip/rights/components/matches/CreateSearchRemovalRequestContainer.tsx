import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Grid, Typography, Stepper, Step, StepLabel, makeStyles } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/common';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { UnifiedLogger } from '@rbx/unified-logger';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { eventStreamBaseUrl } from '@modules/eventStream/tracker';
import { RobloxGamesApiModelsResponsePlaceDetails } from '@rbx/clients/games';
import useCreateClaimHandler from '../../hooks/useCreateClaimHandler';
import useScrollRef from '../../helpers/useScrollRef';
import LegalAgreementsContainer from '../createRemovalRequest/LegalAgreementsContainer';
import { TakedownRequest } from '../createRemovalRequest/CreateRemovalRequestContainer';
import SearchRemovalForm from './SearchRemovalForm';
import RemovalRequestForm from '../createRemovalRequest/RemovalRequestForm';
import useCart from './useCart';
import ConflictClaimSubmittedDialog from '../createRemovalRequest/ConflictClaimSubmittedDialog';
import createClaimHandlerErrorDialog from '../error/CreateClaimHandlerErrorDialog';
import { useCurrentAccountContext } from '../../../components/AccountProvider';

export const AccountsURL = `/dashboard/rights-manager/accounts`;
const LAST_STEP = 2;

const useStyles = makeStyles()(() => ({
  hiddenContainer: {
    display: 'none',
  },
  fullWidth: {
    width: '100%',
  },
}));

export interface CreateSearchRemovalRequestContainerProps {
  onBack: () => void;
  onSuccess: () => void;
  cart: ReturnType<typeof useCart>;
  originalContent: RobloxGamesApiModelsResponsePlaceDetails | null;
  isExperienceSearch: boolean;
}

/**
 * Similar to CreateRemovalRequestContainer, but imports SearchContents & has different options for editing.
 */
const CreateSearchRemovalRequestContainer = ({
  onBack,
  onSuccess,
  cart,
  originalContent,
  isExperienceSearch,
}: CreateSearchRemovalRequestContainerProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [claimDescription, setClaimDescription] = useState('');
  const { ready, translate } = useTranslation();
  const { account, user } = useCurrentAccountContext();
  const {
    classes: { hiddenContainer, fullWidth },
  } = useStyles();
  const [takedownRequests, setTakedownRequests] = useState<TakedownRequest[]>([]);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const {
    handler,
    handlerResult,
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
  const [backtrackToSearch, setBacktrackToSearch] = useState(true);
  const { scrollRef } = useScrollRef();
  const onClickNext = useCallback(() => {
    if (activeStep < LAST_STEP) {
      scrollRef?.scrollTo(0, 0);
      setActiveStep(activeStep + 1);
    }
  }, [scrollRef, activeStep, setActiveStep]);
  const onClickBack = useCallback(() => {
    if (activeStep > 0) {
      handlerReset();
      scrollRef?.scrollTo(0, 0);
      setActiveStep(activeStep - 1);
    }
  }, [scrollRef, activeStep, setActiveStep, handlerReset]);

  const unifiedLogger = useMemo(
    () =>
      new UnifiedLogger({
        product: 'CreatorDashboard',
        eventBaseUrl: eventStreamBaseUrl,
      }),
    [],
  );

  useEffect(() => {
    if (handlerIsError && !isErrorDialogOpen) {
      setIsErrorDialogOpen(true);
    }
  }, [handlerIsError, isErrorDialogOpen]);

  const reset = useCallback(() => {
    onSuccess();
    handlerReset();
  }, [handlerReset, onSuccess]);

  useEffect(() => {
    if (handlerIsSuccess) {
      cart.items.forEach((item) => {
        unifiedLogger.logImpressionEvent({
          eventName: CreatorDashboardEventType.RightsManagerSearchResultSubmitted,
          parameters: {
            claimId: handlerResult.createClaim?.id ?? '',
            contentId: item.searchContent.contentId ?? '',
            contentType: item.searchContent.contentType ?? '',
          },
        });
      });

      if (!shouldToastConflict) {
        reset();
      }
    }
  }, [
    handlerIsSuccess,
    shouldToastConflict,
    cart.items,
    handlerResult.createClaim,
    unifiedLogger,
    reset,
  ]);

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

  // if user deletes entire table in step 2, then backtrack to step 1 and request user to enter links
  const searchFormActive = backtrackToSearch && activeStep === 0;
  const linkFormActive = (!backtrackToSearch && activeStep === 0) || activeStep === 1;

  return (
    <React.Fragment>
      <Grid container direction='column' spacing={1}>
        <Grid item container direction='column' spacing={2} paddingBottom='32px'>
          <Grid item>
            <Typography variant='h1'>{translate('Heading.NewRemovalRequest')}</Typography>
          </Grid>
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
                <Typography>{translate('Label.FillCreationsForRemoval')}</Typography>
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
        <Grid item className={searchFormActive ? '' : hiddenContainer}>
          <SearchRemovalForm
            onClickNext={(reqs) => {
              if (reqs.length > 0) {
                setTakedownRequests(reqs);
                onClickNext();
              }
            }}
            onClickBack={onBack}
            cart={cart}
            originalContent={originalContent}
            isExperienceSearch={isExperienceSearch}
          />
        </Grid>
        <Grid item className={linkFormActive ? '' : hiddenContainer}>
          <RemovalRequestForm
            takedownRequests={takedownRequests}
            setTakedownRequests={setTakedownRequests}
            onClickNext={onClickNext}
            onClickBack={() => {
              setBacktrackToSearch(true);
              setActiveStep(0);
              onBack();
            }}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            setBacktrackToSearch={setBacktrackToSearch}
            shouldHideCreation
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
            isClaimsEnabled={false}
          />
        </Grid>
      </Grid>
      {handlerErrorDialog}
    </React.Fragment>
  );
};

export default withTranslation(CreateSearchRemovalRequestContainer, [
  TranslationNamespace.RightsPortal,
]);
