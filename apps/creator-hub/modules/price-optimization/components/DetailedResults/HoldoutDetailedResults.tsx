import { useTranslation } from '@rbx/intl';
import { CircularProgress, Typography } from '@rbx/ui';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import HoldoutScorecard from '../Scorecard/HoldoutScorecard';
import {
  legacyHoldoutTestPopulation,
  holdoutTestPopulation,
} from '../../constants/experimentConstants';
import useFormatters from '../../helpers/useFormatters';
import useDetailedResultsStyles from './DetailedResults.styles';
import useGetLatestExperiment from '../../queries/useGetLatestExperiment';
import { convertTimeSpanToWeeks } from '../../helpers/experimentUtils';

const HoldoutDetailedResults = () => {
  const { translate } = useTranslation();
  const { classes } = useDetailedResultsStyles();

  const { gameDetails, isLoadingGame } = useCurrentGame();
  const {
    latestExperiment: currentExperiment,
    isLoading: isLoadingExperiment,
    isError: isErrorExperiment,
  } = useGetLatestExperiment();

  const holdoutDurationWeeks = convertTimeSpanToWeeks(
    currentExperiment?.displayHoldoutExperimentDuration ?? null,
    true,
  );

  const displayHoldoutTestPopulation = !currentExperiment?.displayHoldoutExperimentDuration
    ? legacyHoldoutTestPopulation
    : holdoutTestPopulation;

  const { percentageFormatter, dateFormatter } = useFormatters();

  const durationString = translate('Description.DateRange', {
    startDate: dateFormatter.format(currentExperiment?.holdoutMetadata?.startTime ?? new Date()),
    endDate: dateFormatter.format(currentExperiment?.holdoutMetadata?.endTime ?? new Date()),
  });
  const holdoutScorecardSummary = translate('Description.HoldoutScorecardSummaryV2', {
    testPopulationPercent: percentageFormatter.format(displayHoldoutTestPopulation),
    numWeeks: holdoutDurationWeeks,
  });
  const experienceLabel = translate('Label.Experience', {
    experienceName: gameDetails?.name ?? '',
  });

  if (isErrorExperiment) {
    return null;
  }

  if (isLoadingGame || isLoadingExperiment) {
    return <CircularProgress />;
  }

  return (
    <div className={classes.detailsContainer}>
      <Typography variant='body1'>{experienceLabel}</Typography>
      <div className={classes.holdoutScorecardContainer}>
        <Typography variant='body2' className={classes.dateRange}>
          {durationString}
        </Typography>
        <Typography variant='body2'>{holdoutScorecardSummary}</Typography>
        <HoldoutScorecard />
      </div>
    </div>
  );
};

export default HoldoutDetailedResults;
