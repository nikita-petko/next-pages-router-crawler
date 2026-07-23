import { ReactElement, useEffect, useState } from 'react';
import { ExperimentState, TriggerMode } from '@rbx/clients/priceExperimentationApi/v1';
import { useLocalStorage } from '@rbx/react-utilities';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { lastViewedHoldoutFinishedKey } from '../../constants/experimentConstants';
import { isInitialExperimentComplete, isOngoingExperiment } from '../../helpers/experimentUtils';
import useCurrentOptimizationStyles from './CurrentOptimization.styles';
import InitialDisplay from './InitialDisplay';
import InProgressDisplay from './InProgressDisplay';
import HoldoutRunningDisplay from './HoldoutRunningDisplay';
import ProductTable from '../ProductTable/ProductTable';
import { productIdentifierToKey } from '../../types/product';
import useGetProducts from '../../queries/useGetProducts';
import { usePricingError } from '../../providers/PricingErrorProvider';
import HoldoutResultsDisplay from './HoldoutResultsDisplay';
import CompleteDisplay from './CompleteDisplay';
import useGetLatestExperiment from '../../queries/useGetLatestExperiment';

const CurrentOptimization = () => {
  const { classes } = useCurrentOptimizationStyles();
  const { translate } = useTranslation();

  const {
    universeId,
    latestExperiment: currentExperiment,
    isLoading: isLoadingExperiment,
    isError: isErrorExperiment,
  } = useGetLatestExperiment();

  const [lastViewedHoldoutFinished] = useLocalStorage<null | string>(
    lastViewedHoldoutFinishedKey,
    null,
  );

  // When getting experiment data is implemented, we need to initialize
  // checkedProducts with all products if experiment is in progress
  const [checkedProducts, setCheckedProducts] = useState<Set<string>>(new Set());

  const [hasDeselectModalOpenedBefore, setHasDeselectModalOpenedBefore] = useState(false);
  const [isDeselectModalOpen, setIsDeselectModalOpen] = useState(false);

  // Whether we're displaying the HoldoutRunning or HoldoutComplete display
  // just to show the completion confirmation modal. The background will not be interacted with.
  let isFinishedPollingDisplay = false;
  let display: ReactElement = <InitialDisplay checkedProducts={checkedProducts} />;
  // eslint-disable-next-line default-case -- Default case is not updating display and leaving it as initial state
  switch (currentExperiment?.state) {
    case ExperimentState.Running:
      display = <InProgressDisplay />;
      break;
    case ExperimentState.ResultsReady:
      display = <CompleteDisplay />;
      break;
    // Holdout completing state goes to holdout running while polling, display a polling modal on top
    case ExperimentState.HoldoutCompleting:
    case ExperimentState.HoldoutRunning:
      display = <HoldoutRunningDisplay />;
      break;
    /*
    Prices reverted represents auto revert on bad results
    Holdout completed represents holdout time period finished
    Both of these states use the same screen with slight differences in text and buttons
     */
    case ExperimentState.PriceReverted:
    case ExperimentState.HoldoutCompleted:
      display = <HoldoutResultsDisplay />;
      break;
    case ExperimentState.PriceRevertingWithCompletion: {
      // Polling states
      if (currentExperiment.holdoutMetadata?.holdoutCompletionMode === TriggerMode.Auto) {
        // Holdout completed normally but user decided to revert
        // Show holdout results screen with button actions disabled
        display = <HoldoutResultsDisplay />;
      } else {
        // User stopped the holdout early and decided to revert
        // Show holdout running screen with button actions disabled.
        // If the user stopped the holdout fast enough it didn't manage to go into HoldoutRunning state, it may not have metadata
        // which is why we check this in an else block instead of an else-if
        display = <HoldoutRunningDisplay />;
      }
      break;
    }
    case ExperimentState.Completed:
      // Case where user was polling for holdout completion
      // We need to still show them the same page they were looking at before
      if (lastViewedHoldoutFinished === currentExperiment.id) {
        isFinishedPollingDisplay = true;
        if (currentExperiment.holdoutMetadata?.holdoutCompletionMode === TriggerMode.Auto) {
          // Holdout completed normally but user decided to revert
          display = <HoldoutResultsDisplay />;
        } else {
          // User stopped the holdout early and decided to revert
          // Show holdout running screen with button actions disabled.
          // If the user stopped the holdout fast enough it didn't manage to go into HoldoutRunning state, it may not have metadata
          // which is why we check this in an else block instead of an else-if
          display = <HoldoutRunningDisplay />;
        }
      }
  }

  const { products, isLoading, isError } = useGetProducts(isFinishedPollingDisplay);
  usePricingError(isError);

  const ongoingTestComplete =
    isInitialExperimentComplete(currentExperiment?.state) &&
    // For the cases where we're displaying the finished polling modal, we don't want to show the table as selectable
    // and we want to show the optimized price.
    // This is fine since everything will be reloaded once the user clicks the "Finish" button on the confirmation modal
    // and ongoingTestComplete will then be false.
    (isOngoingExperiment(currentExperiment?.state) || isFinishedPollingDisplay);

  // On first load, check everything by default
  useEffect(() => {
    if (!isLoading) {
      const allProductKeys = products.map((product) => productIdentifierToKey(product));
      setCheckedProducts(new Set(allProductKeys));
    }
  }, [isLoading, products]);

  const onTableChange = (_: unknown, newCheckedProducts: Set<string>) => {
    setCheckedProducts(newCheckedProducts);

    // The first time the user deselects a product, show the deselect modal
    if (
      display.type === InitialDisplay &&
      !hasDeselectModalOpenedBefore &&
      newCheckedProducts.size < products.length
    ) {
      setIsDeselectModalOpen(true);
      setHasDeselectModalOpenedBefore(true);
    }
  };

  if (isLoadingExperiment || isErrorExperiment) {
    return null;
  }

  return (
    <div className={classes.container}>
      {display}
      {!isError && universeId !== undefined && (
        <ProductTable
          universeId={universeId}
          noSelect={ongoingTestComplete}
          showOptimizedPrice={ongoingTestComplete}
          disabled={currentExperiment?.state === ExperimentState.Running}
          loading={isLoading}
          products={products}
          checkedProducts={checkedProducts}
          onChange={onTableChange}
          productIdentifierToKey={productIdentifierToKey}
        />
      )}

      <Dialog open={isDeselectModalOpen} onClose={() => setIsDeselectModalOpen(false)}>
        <DialogTitle>{translate('Heading.DeselectProduct')}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='secondary'>
            {translate('Message.DeselectProduct')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsDeselectModalOpen(false)}
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

export default CurrentOptimization;
