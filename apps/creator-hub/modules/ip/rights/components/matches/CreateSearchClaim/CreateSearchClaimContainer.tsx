import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { RobloxGamesApiModelsResponsePlaceDetails } from '@rbx/client-games/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, Stepper, Step, StepLabel, makeStyles } from '@rbx/ui';
import { UnifiedLogger } from '@rbx/unified-logger';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { eventStreamBaseUrl } from '@modules/eventStream/tracker';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentAccountContext } from '../../../../components/AccountProvider';
import useScrollRef from '../../../helpers/useScrollRef';
import useCreateClaimHandler from '../../../hooks/useCreateClaimHandler';
import type { ClaimRequest } from '../../../types/types';
import ReviewCreations from '../../createClaims/ReviewCreations';
import ConflictClaimSubmittedDialog from '../../createRemovalRequest/ConflictClaimSubmittedDialog';
import LegalAgreementsContainer from '../../createRemovalRequest/LegalAgreementsContainer';
import createClaimHandlerErrorDialog from '../../error/CreateClaimHandlerErrorDialog';
import type useCart from '../useCart';
import AddSearchCreationsForm from './AddSearchCreationsForm';

const LAST_STEP = 2;

const useStyles = makeStyles()(() => ({
  hiddenContainer: {
    display: 'none',
  },
  fullWidth: {
    width: '100%',
  },
}));

export interface CreateSearchClaimContainerProps {
  onBack: () => void;
  onSuccess: () => void;
  cart: ReturnType<typeof useCart>;
  originalContent: RobloxGamesApiModelsResponsePlaceDetails | null;
  isExperienceSearch: boolean;
}

/**
 *  CreateSearchClaimContainer displays a Create Claim form seeded by search contents instead of bulk links.
 */
const CreateSearchClaimContainer = ({
  onBack,
  onSuccess,
  cart,
  originalContent,
  isExperienceSearch,
}: CreateSearchClaimContainerProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [claimDescription, setClaimDescription] = useState('');
  const { ready, translate } = useTranslation();
  const { account, user } = useCurrentAccountContext();
  const {
    classes: { hiddenContainer, fullWidth },
  } = useStyles();
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([]);
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
    <>
      <Grid container direction='column' spacing={1}>
        <Grid item container direction='column' spacing={2} paddingBottom='32px'>
          <Grid item>
            <Typography variant='h1'>{translate('Label.NewClaim')}</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body1' color='secondary'>
              {translate('Description.NewClaim')}
            </Typography>
          </Grid>
        </Grid>
        <Grid item className={fullWidth} paddingBottom='48px'>
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
          <AddSearchCreationsForm
            onNext={onClickNext}
            onBack={onBack}
            cart={cart}
            setClaimRequests={setClaimRequests}
            originalContent={originalContent}
            isExperienceSearch={isExperienceSearch}
            account={account}
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
    </>
  );
};

export default withTranslation(CreateSearchClaimContainer, [TranslationNamespace.RightsPortal]);
