// oxlint-disable typescript/no-non-null-assertion react/react-compiler
import { useEffect, useState } from 'react';
import { ExperimentState } from '@rbx/client-price-experimentation-api/v1';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@rbx/ui';
import { lastViewedHoldoutFinishedKey } from '../../constants/experimentConstants';
import { usePricingErrorContext } from '../../providers/PricingErrorProvider';
import { useCompleteExperiment } from '../../queries/useCompleteExperiment';
import { useGetLatestExperiment } from '../../queries/useGetLatestExperiment';
import HoldoutResults from '../PriceOptimizationResults/HoldoutResults';
import useCurrentOptimizationStyles from './CurrentOptimization.styles';

enum PageState {
  START = 0,
  RESTORE_PRICES = 1,
  FINISH_HOLDOUT_SUCCEEDED = 2,
  FINISH_HOLDOUT_FAILED = 3,
  RESTORE_PRICES_POLLING = 4,
  FINISHED_POLLING = 5,
}

const HoldoutResultsDisplay = () => {
  const { translate } = useTranslation();
  const { classes } = useCurrentOptimizationStyles();

  const { setHasError } = usePricingErrorContext();

  const { universeId, latestExperiment: currentExperiment } = useGetLatestExperiment();

  const { markExperimentComplete, restorePricesAndComplete, refetchData } = useCompleteExperiment();

  const [pageState, setPageState] = useState<PageState>(PageState.START);
  const [isPollingModalOpen, setIsPollingModalOpen] = useState(false);

  const setLastViewedHoldoutFinished = useLocalStorage<null | string>(
    lastViewedHoldoutFinishedKey,
    null,
  )[1];

  const isRestorePricesButtonDisabled = pageState !== PageState.START;
  const isFinishPriceOptimizationButtonDisabled = pageState !== PageState.START;

  // Only trigger on state change, not whole experiment change on purpose.
  // This is to prevent popping up polling modals when nothing has changed and user has already closed them.
  useEffect(() => {
    const newState = currentExperiment?.state;
    if (newState === ExperimentState.PriceRevertingWithCompletion) {
      setPageState(PageState.RESTORE_PRICES_POLLING);
      setIsPollingModalOpen(true);
    } else if (newState === ExperimentState.Completed) {
      setPageState(PageState.FINISHED_POLLING);
      setIsPollingModalOpen(false);
    }
  }, [currentExperiment?.state]);

  const openConfirmRestorePrices = () => {
    setPageState(PageState.RESTORE_PRICES);
  };

  const closeConfirmRestorePrices = () => {
    setPageState(PageState.START);
  };

  // Triggered after clicking restore original prices, then confirming that you are restoring on the modal
  const restorePrices = async () => {
    try {
      await restorePricesAndComplete(universeId!, currentExperiment!.id);
      setLastViewedHoldoutFinished(currentExperiment!.id);
      // The polling also triggers a useEffect which will update the state, but keeping the logic here to be explicit
      setPageState(PageState.RESTORE_PRICES_POLLING);
      setIsPollingModalOpen(true);
    } catch {
      setHasError(true);
      setPageState(PageState.START);
    }
  };

  const confirmExperimentFinished = async (experimentSucceeded: boolean) => {
    try {
      await markExperimentComplete(universeId!, currentExperiment!.id);
      setPageState(
        experimentSucceeded ? PageState.FINISH_HOLDOUT_SUCCEEDED : PageState.FINISH_HOLDOUT_FAILED,
      );
    } catch {
      setHasError(true);
      setPageState(PageState.START);
    }
  };

  // Triggered after taking an action, then clicking finish on the confirmation modal
  const closeFinishPriceOptimization = () => {
    // Don't need to reset back to PageState.START since we're changing the page after refetching the data
    refetchData(universeId!);
    // Clear out local storage to mark user as having seen the finish confirmation modal
    // in case the modal was shown after polling
    setLastViewedHoldoutFinished(null);
  };

  // The buttons are different for auto reverted holdout which did badly and other stopped holdouts
  // For auto revert case, there is only one button which opens a slightly different confirmation modal
  const buttons =
    currentExperiment && currentExperiment.state === ExperimentState.PriceReverted ? (
      <Button
        variant='contained'
        disabled={isFinishPriceOptimizationButtonDisabled}
        onClick={() => confirmExperimentFinished(false)}>
        {translate('Action.FinishTest')}
      </Button>
    ) : (
      <>
        <Button
          variant='outlined'
          color='primary'
          disabled={isRestorePricesButtonDisabled}
          onClick={openConfirmRestorePrices}>
          {translate('Action.RestorePrices')}
        </Button>
        <Button
          variant='contained'
          disabled={isFinishPriceOptimizationButtonDisabled}
          onClick={() => confirmExperimentFinished(true)}>
          {translate('Action.FinishTest')}
        </Button>
      </>
    );

  return (
    <div className={classes.container}>
      <HoldoutResults />
      <div className={classes.actionButtonsContainer}>{buttons}</div>
      {/* Modal for confirming whether user really wants to restore the prices */}
      <Dialog
        open={pageState === PageState.RESTORE_PRICES}
        onClose={closeConfirmRestorePrices}
        maxWidth='Medium'>
        <DialogTitle>{translate('Heading.ConfirmRestorePrices')}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='secondary'>
            {translate('Message.ConfirmRestorePrices')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={closeConfirmRestorePrices}
            variant='outlined'
            className={classes.actionButtonsContainer}
            size='large'
            color='primary'>
            {translate('Action.Cancel')}
          </Button>
          <Button onClick={restorePrices} variant='contained' size='large' color='primary'>
            {translate('Action.ConfirmRestorePrices')}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Modal for notifying user that price optimization flow is completed */}
      <Dialog
        open={
          pageState === PageState.FINISH_HOLDOUT_SUCCEEDED ||
          pageState === PageState.FINISH_HOLDOUT_FAILED ||
          pageState === PageState.FINISHED_POLLING
        }
        onClose={closeFinishPriceOptimization}
        maxWidth='Medium'>
        <DialogTitle>{translate('Heading.PriceOptimizationComplete')}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='secondary'>
            {currentExperiment?.state === ExperimentState.PriceReverted
              ? translate('Message.PriceOptimizationRestoreComplete')
              : translate('Message.PriceOptimizationComplete')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={closeFinishPriceOptimization}
            variant='contained'
            size='large'
            color='primary'>
            {translate('Action.Close')}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Modal for notifying user that we are updating their prices. */}
      <Dialog
        open={isPollingModalOpen && pageState === PageState.RESTORE_PRICES_POLLING}
        onClose={() => setIsPollingModalOpen(false)}
        maxWidth='Medium'>
        <DialogTitle>{translate('Heading.UpdatingThePricesAfterRestore')}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='secondary'>
            {translate('Message.UpdatingThePricesAfterRestore')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsPollingModalOpen(false)}
            variant='outlined'
            size='large'
            color='primary'>
            {translate('Action.Close')}
          </Button>
        </DialogActions>
      </Dialog>
      <div>
        <Typography variant='h3' component='h3' className={classes.headingGapSmall}>
          {translate('Heading.ProductList')}
        </Typography>
        <Typography variant='body1' component='p' className={classes.textBox}>
          {translate('Description.ProductListTable')}
        </Typography>
      </div>
    </div>
  );
};

export default HoldoutResultsDisplay;
