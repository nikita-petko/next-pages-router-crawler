import { useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTemplate,
  DialogTitle,
  Typography,
} from '@rbx/ui';
import { noop } from '@modules/monetization-shared/noop';
import { convertTimeSpanToWeeks } from '../../helpers/experimentUtils';
import { usePricingError } from '../../providers/PricingErrorProvider';
import { useGetExperimentationMetadata } from '../../queries/useGetExperimentationMetadata';
import { useGetExperimentResults } from '../../queries/useGetExperimentResults';
import { useGetProducts } from '../../queries/useGetProducts';
import ItemLevelExperimentResults from '../PriceOptimizationResults/ItemLevelExperimentResults';
import useCurrentOptimizationStyles from './CurrentOptimization.styles';

enum UserAction {
  NONE = 0,
  REJECT = 1,
  ACCEPT_IMMEDIATE = 2,
  FINISH_NO_CHANGE = 3,
  ACCEPT_HOLDOUT = 4,
}

const CompleteDisplay = () => {
  const { translate } = useTranslation();
  const { classes } = useCurrentOptimizationStyles();
  const { isLoading: isLoadingProducts, isError: isErrorProducts } = useGetProducts();
  const {
    experimentResults,
    isLoading: isLoadingResults,
    isError: isErrorResults,
  } = useGetExperimentResults();

  const [isRejectConfirmationOpen, setIsRejectConfirmationOpen] = useState<boolean>(false);
  const [isHoldoutConfirmationOpen, setIsHoldoutConfirmationOpen] = useState<boolean>(false);
  const [userAction, setUserAction] = useState<UserAction>(UserAction.NONE);

  const [isCompletingExperiment, setIsCompletingExperiment] = useState<boolean>(false);

  const { holdoutDuration } = useGetExperimentationMetadata();

  const holdoutDurationWeeks = convertTimeSpanToWeeks(holdoutDuration, true);

  /*
  Three possible states: Reject results, Accept results, and Finish with no recommendations

  Click reject results -> pop up confirmation modal (do you really want to reject?) -> pop up another modal confirming reject happened
  Click accept results -> pop up for starting holdout -> either start holdout or accept prices
  Click finish results -> modal confirming finish happened
  */

  const openConfirmReject = () => {
    setIsCompletingExperiment(true);
    setIsRejectConfirmationOpen(true);
  };

  const closeConfirmReject = () => {
    setIsCompletingExperiment(false);
    setIsRejectConfirmationOpen(false);
  };

  const openConfirmHoldout = () => {
    setIsCompletingExperiment(true);
    setIsHoldoutConfirmationOpen(true);
  };

  const closeConfirmHoldout = () => {
    setIsCompletingExperiment(false);
    setIsHoldoutConfirmationOpen(false);
  };

  // Triggered after clicking reject, then confirming that you are rejecting on the modal
  const rejectRecommendations = () => {
    setIsCompletingExperiment(true); // This should already be set
    setIsRejectConfirmationOpen(false);
    noop();
    setUserAction(UserAction.REJECT);
  };

  // Triggered after applying
  const applyRecommendations = () => {
    setIsCompletingExperiment(true); // This should already be set
    setIsHoldoutConfirmationOpen(false);
    noop();
    setUserAction(UserAction.ACCEPT_IMMEDIATE);
  };

  const startHoldout = () => {
    setIsCompletingExperiment(true); // This should already be set
    setIsHoldoutConfirmationOpen(false);
    noop();
    setUserAction(UserAction.ACCEPT_HOLDOUT);
  };

  // Triggered after no recommendation finish
  const finishNoRecommendations = () => {
    setIsCompletingExperiment(true);
    noop();
    setUserAction(UserAction.FINISH_NO_CHANGE);
  };

  // Triggered after taking an action, then clicking finish on the confirmation modal
  const confirmFinish = () => {
    setUserAction(UserAction.NONE);
    noop();
  };

  const isLoading = isLoadingProducts || isLoadingResults || isCompletingExperiment;

  // Display error if fail to load data;
  const isError = isErrorProducts || isErrorResults;
  usePricingError(isError);

  let confirmModalTitle = '';
  let confirmModalText = '';
  // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- DO NOT REMOVE THIS, WILL BREAK. Default case fallthrough is intended
  switch (userAction) {
    case UserAction.REJECT:
      confirmModalTitle = translate('Heading.TestComplete');
      confirmModalText = translate('Message.RejectedPrices');
      break;
    case UserAction.ACCEPT_IMMEDIATE:
      confirmModalTitle = translate('Heading.UpdatedPrices');
      confirmModalText = translate('Message.AppliedPrices');
      break;
    case UserAction.FINISH_NO_CHANGE:
      confirmModalTitle = translate('Heading.TestComplete');
      confirmModalText = translate('Message.NoChangePrices');
      break;
    case UserAction.ACCEPT_HOLDOUT:
      confirmModalTitle = translate('Heading.UpdatedPrices');
      confirmModalText = translate('Message.AppliedPricesHoldout');
      break;
  }

  // Conditionally render the buttons
  // Accept/reject buttons only show if there are recommendations, otherwise just show a finish button
  let completeExperimentButtons: React.ReactNode = null;
  if (experimentResults) {
    if (experimentResults.shouldChangePrices) {
      completeExperimentButtons = (
        <div className={classes.actionButtonsContainer}>
          <Button
            variant='outlined'
            color='primary'
            className={classes.actionButton}
            onClick={openConfirmReject}
            disabled={isLoading}>
            {translate('Action.DeclinePrices')}
          </Button>
          <Button
            variant='contained'
            className={classes.actionButton}
            onClick={openConfirmHoldout}
            disabled={isLoading}>
            {translate('Action.ApplyPrices')}
          </Button>
        </div>
      );
    } else {
      completeExperimentButtons = (
        <Button
          variant='contained'
          className={classes.actionButton}
          onClick={finishNoRecommendations}
          disabled={isLoading}>
          {translate('Action.FinishNoChangePrices')}
        </Button>
      );
    }
  }

  return (
    <div className={classes.container}>
      <ItemLevelExperimentResults />
      {completeExperimentButtons}
      <div>
        <Typography variant='h3' component='h3' className={classes.headingGapSmall}>
          {translate('Heading.ProductList')}
        </Typography>
        <Typography variant='body1' component='p' className={classes.textBox}>
          {translate('Description.ReviewPriceRecommendations')}
        </Typography>
      </div>
      {/* Modal for confirming whether user really wants to reject price recommendations */}
      <Dialog open={isRejectConfirmationOpen} onClose={closeConfirmReject} maxWidth='Medium'>
        <DialogTemplate
          onCancel={closeConfirmReject}
          onConfirm={rejectRecommendations}
          color='destructive'
          title={translate('Heading.ConfirmDecline')}
          content={
            <Typography
              variant='body2'
              color='secondary'
              className={classes.modalContentParagraphs}>
              {translate('Message.ConfirmDecline')}
            </Typography>
          }
          cancelText={translate('Action.Cancel')}
          confirmText={translate('Action.RejectResults')}
        />
      </Dialog>
      {/* Modal for asking user whether to apply immediately or start a holdout */}
      <Dialog open={isHoldoutConfirmationOpen} onClose={closeConfirmHoldout} maxWidth='Medium'>
        <DialogTitle>{translate('Heading.ActivatePriceReview')}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='secondary' className={classes.modalContentParagraphs}>
            {translate('Message.ActivatePriceReviewV2', { numWeeks: holdoutDurationWeeks })}
          </Typography>
        </DialogContent>
        <DialogActions className={classes.holdoutModalActions}>
          <Button onClick={closeConfirmHoldout} variant='text' color='primary' size='large'>
            {translate('Action.Cancel')}
          </Button>
          <span className={classes.holdoutApplyButtons}>
            <Button onClick={applyRecommendations} variant='outlined' color='primary' size='large'>
              {translate('Action.NoThanks')}
            </Button>
            <Button onClick={startHoldout} variant='contained' color='primary' size='large'>
              {translate('Action.ConfirmActivatePriceReview')}
            </Button>
          </span>
        </DialogActions>
      </Dialog>
      {/* Modal for notifying user their action has completed */}
      <Dialog open={userAction !== UserAction.NONE} onClose={confirmFinish} maxWidth='Medium'>
        <DialogTitle>{confirmModalTitle}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='secondary'>
            {confirmModalText}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={confirmFinish} variant='contained' color='primary' size='large'>
            {translate('Action.Close')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CompleteDisplay;
