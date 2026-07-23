import { Fragment, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@rbx/ui';
import { ExperimentState, TriggerMode } from '@rbx/clients/priceExperimentationApi/v1';
import DetailedResults from '../DetailedResults/DetailedResults';
import useGetLatestExperiment from '../../queries/useGetLatestExperiment';
import useGetHoldoutMetrics from '../../queries/useGetHoldoutMetrics';
import useFormatters from '../../helpers/useFormatters';
import useScorecardButtonsStyles from './ScorecardButtons.styles';
import {
  extractHoldoutResults,
  isInHoldoutResultsState,
  isInHoldoutState,
} from '../../helpers/experimentUtils';
import HoldoutDetailedResults from '../DetailedResults/HoldoutDetailedResults';

const ScorecardButtons = () => {
  const { translate } = useTranslation();
  const { dateFormatter } = useFormatters();

  const { classes } = useScorecardButtonsStyles();

  const [showScorecard, setShowScorecard] = useState(false);
  const [showHoldoutScorecard, setShowHoldoutScorecard] = useState(false);

  const { latestExperiment: currentExperiment } = useGetLatestExperiment();
  const { metrics } = useGetHoldoutMetrics();

  const { isStatisticallySignificant: isHoldoutRevenueStatSig } = extractHoldoutResults(metrics);

  const holdoutScorecardDisabled =
    !isInHoldoutResultsState(currentExperiment?.state) ||
    (currentExperiment?.holdoutMetadata?.holdoutCompletionMode === TriggerMode.Manual &&
      !isHoldoutRevenueStatSig);

  const startDateString = dateFormatter.format(currentExperiment!.startTime as Date);
  const endDateString = dateFormatter.format(currentExperiment!.endTime as Date);

  const showHoldoutResultButton =
    isInHoldoutState(currentExperiment?.state) ||
    currentExperiment?.state === ExperimentState.Completed;

  return (
    <Fragment>
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
      <Dialog open={showScorecard} onClose={() => setShowScorecard(false)} maxWidth='XLarge'>
        <DialogTitle className={classes.dialogTitle}>
          {translate('Heading.TestDetailedResults', {
            startDate: startDateString,
            endDate: endDateString,
          })}
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <DetailedResults />
        </DialogContent>
        <DialogActions className={classes.dialogActions}>
          <Button
            onClick={() => setShowScorecard(false)}
            color='primary'
            size='large'
            variant='outlined'>
            {translate('Action.CloseExperimentDetails')}
          </Button>
        </DialogActions>
      </Dialog>

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
    </Fragment>
  );
};

export default ScorecardButtons;
