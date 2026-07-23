import { useEffect, useState } from 'react';
import { ExperimentState } from '@rbx/client-price-experimentation-api/v1';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@rbx/ui';
import { lastViewedHoldoutFinishedKey } from '../../constants/experimentConstants';
import { isExperimentPolling } from '../../helpers/experimentUtils';
import { useCompleteExperiment } from '../../queries/useCompleteExperiment';
import { useGetLatestExperiment } from '../../queries/useGetLatestExperiment';
import HoldoutResults from '../PriceOptimizationResults/HoldoutResults';
import useCurrentOptimizationStyles from './CurrentOptimization.styles';

const HoldoutRunningDisplay = () => {
  const { translate } = useTranslation();
  const { classes } = useCurrentOptimizationStyles();

  const { universeId, latestExperiment: currentExperiment } = useGetLatestExperiment();
  const { refetchData } = useCompleteExperiment();

  const [isPollingModalOpen, setIsPollingModalOpen] = useState(false);
  const [isHoldoutCompletedModalOpen, setIsHoldoutCompletedModalOpen] = useState(false);
  const setLastViewedHoldoutFinished = useLocalStorage<null | string>(
    lastViewedHoldoutFinishedKey,
    null,
  )[1];

  // Only trigger on state change, not whole experiment change on purpose.
  // This is to prevent popping up polling modals when nothing has changed and user has already closed them.
  useEffect(() => {
    if (isExperimentPolling(currentExperiment?.state)) {
      setIsPollingModalOpen(true);
      setIsHoldoutCompletedModalOpen(false);
    }
    if (currentExperiment?.state === ExperimentState.HoldoutCompleted) {
      // Manual finish and apply prices. There is no confirmation modal for this.
      setIsPollingModalOpen(false);
    }
    if (currentExperiment?.state === ExperimentState.Completed) {
      // Manual finish and revert. There is a confirmation modal for this.
      setIsPollingModalOpen(false);
      setIsHoldoutCompletedModalOpen(true);
    }
  }, [currentExperiment?.state]);

  const closeFinishPriceOptimization = () => {
    setIsHoldoutCompletedModalOpen(false);
    // oxlint-disable-next-line typescript/no-non-null-assertion
    refetchData(universeId!);
    setLastViewedHoldoutFinished(null);
  };

  return (
    <div className={classes.container}>
      <HoldoutResults />
      <div>
        <Typography variant='h3' component='h3' className={classes.headingGapSmall}>
          {translate('Heading.ProductList')}
        </Typography>
        <Typography variant='body1' component='p' className={classes.textBox}>
          {translate('Description.ProductListTable')}
        </Typography>
      </div>
      {/* Modal for notifying user that we are updating their prices. */}
      <Dialog
        open={isPollingModalOpen}
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
      <Dialog
        open={isHoldoutCompletedModalOpen}
        onClose={closeFinishPriceOptimization}
        maxWidth='Medium'>
        <DialogTitle>{translate('Heading.PricesRestored')}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='secondary'>
            {translate('Message.PricesRestored')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={closeFinishPriceOptimization}
            variant='contained'
            size='large'
            color='primary'>
            {translate('Action.GotIt')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default HoldoutRunningDisplay;
