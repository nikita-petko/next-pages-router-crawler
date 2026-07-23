import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import {
  legacyHoldoutTestPopulation,
  holdoutTestPopulation,
} from '../../constants/experimentConstants';
import { convertTimeSpanToWeeks } from '../../helpers/experimentUtils';
import { useFormatters } from '../../helpers/useFormatters';
import { useGetLatestExperiment } from '../../queries/useGetLatestExperiment';
import HoldoutScorecard from '../Scorecard/HoldoutScorecard';
import useDetailedResultsStyles from './DetailedResults.styles';

const HoldoutDetailedResults = () => {
  const { translate } = useTranslation();
  const { classes } = useDetailedResultsStyles();

  const { gameDetails } = useCurrentGame();
  const { latestExperiment: currentExperiment } = useGetLatestExperiment();

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
