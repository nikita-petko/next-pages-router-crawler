import { useState } from 'react';
import { ExperimentState, TriggerMode } from '@rbx/client-price-experimentation-api/v1';
import { useTranslation } from '@rbx/intl';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@rbx/ui';
import {
  extractHoldoutResults,
  isInHoldoutResultsState,
  isInHoldoutState,
} from '../../helpers/experimentUtils';
import { useGetHoldoutMetrics } from '../../queries/useGetHoldoutMetrics';
import { useGetLatestExperiment } from '../../queries/useGetLatestExperiment';
import HoldoutDetailedResults from '../DetailedResults/HoldoutDetailedResults';
import useScorecardButtonsStyles from './ScorecardButtons.styles';

const ScorecardButtons = () => {
  const { translate } = useTranslation();

  const { classes } = useScorecardButtonsStyles();

  const [showHoldoutScorecard, setShowHoldoutScorecard] = useState(false);

  const { latestExperiment: currentExperiment } = useGetLatestExperiment();
  const { metrics } = useGetHoldoutMetrics();

  const { isStatisticallySignificant: isHoldoutRevenueStatSig } = extractHoldoutResults(metrics);

  const holdoutScorecardDisabled =
    !isInHoldoutResultsState(currentExperiment?.state) ||
    (currentExperiment?.holdoutMetadata?.holdoutCompletionMode === TriggerMode.Manual &&
      !isHoldoutRevenueStatSig);

  const showHoldoutResultButton =
    isInHoldoutState(currentExperiment?.state) ||
    currentExperiment?.state === ExperimentState.Completed;

  return (
    <>
      <span className={classes.scorecardButtonsContainer}>
        {showHoldoutResultButton && (
          <Button
            size='small'
            color='primary'
            variant='contained'
            disabled={holdoutScorecardDisabled}
            onClick={() => setShowHoldoutScorecard(true)}>
            {translate('Action.HoldoutDetails')}
          </Button>
        )}
      </span>
      <Dialog open={showHoldoutScorecard} onClose={() => setShowHoldoutScorecard(false)}>
        <DialogTitle className={classes.dialogTitle}>
          {translate('Heading.HoldoutScorecard')}
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <HoldoutDetailedResults />
        </DialogContent>
        <DialogActions className={classes.dialogActions}>
          <Button
            onClick={() => setShowHoldoutScorecard(false)}
            color='primary'
            size='large'
            variant='outlined'>
            {translate('Action.CloseExperimentDetails')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ScorecardButtons;
