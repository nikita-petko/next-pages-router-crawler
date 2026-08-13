import type { ReactElement } from 'react';
import { ExperimentState, TriggerMode } from '@rbx/client-price-experimentation-api/v1';
import { useLocalStorage } from '@rbx/react-utilities';
import { lastViewedHoldoutFinishedKey } from '../../constants/experimentConstants';
import { useGetLatestExperiment } from '../../queries/useGetLatestExperiment';
import CompleteDisplay from './CompleteDisplay';
import useCurrentOptimizationStyles from './CurrentOptimization.styles';
import HoldoutResultsDisplay from './HoldoutResultsDisplay';
import HoldoutRunningDisplay from './HoldoutRunningDisplay';
import InitialDisplay from './InitialDisplay';
import InProgressDisplay from './InProgressDisplay';

const CurrentOptimization = () => {
  const { classes } = useCurrentOptimizationStyles();

  const {
    latestExperiment: currentExperiment,
    isLoading: isLoadingExperiment,
    isError: isErrorExperiment,
  } = useGetLatestExperiment();

  const [lastViewedHoldoutFinished] = useLocalStorage<null | string>(
    lastViewedHoldoutFinishedKey,
    null,
  );

  let display: ReactElement = <InitialDisplay />;

  // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- DO NOT REMOVE THIS, WILL BREAK. Default case fallthrough is intended
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

  if (isLoadingExperiment || isErrorExperiment) {
    return null;
  }

  return <div className={classes.container}>{display}</div>;
};

export default CurrentOptimization;
