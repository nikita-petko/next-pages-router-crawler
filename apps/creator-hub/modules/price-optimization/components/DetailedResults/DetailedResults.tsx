import { ReactNode } from 'react';
import { Alert, ArrowDownwardIcon, ArrowUpwardIcon, CircularProgress, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import Scorecard from '../Scorecard/Scorecard';
import useGetExperimentResults from '../../queries/useGetExperimentResults';
import useGetExperimentationMetadata from '../../queries/useGetExperimentationMetadata';
import useDetailedResultsStyles from './DetailedResults.styles';
import useFormatters from '../../helpers/useFormatters';
import { usePricingError } from '../../providers/PricingErrorProvider';
import { convertTimeSpanToWeeks } from '../../helpers/experimentUtils';

const DetailedResults = () => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = useDetailedResultsStyles();

  const { gameDetails, isLoadingGame } = useCurrentGame();
  const {
    experimentResults,
    isLoading: isLoadingResults,
    isError: isErrorResults,
  } = useGetExperimentResults();
  const { percentageFormatter } = useFormatters();

  const { holdoutDuration } = useGetExperimentationMetadata();

  const holdoutDurationWeeks = convertTimeSpanToWeeks(holdoutDuration, true);

  usePricingError(isErrorResults);
  if (isErrorResults) {
    return null;
  }

  if (isLoadingGame || isLoadingResults) {
    return <CircularProgress />;
  }

  // We know experiment results and metrics are defined here, since we checked for errors/loading above

  let recommendedPriceChangeString: ReactNode = translate('Description.KeyFindings.NoChange');
  if (experimentResults?.shouldChangePrices) {
    const recommendedPriceChange = percentageFormatter.format(
      experimentResults.recommendedPriceChange!,
    );
    const revenueIncrease = percentageFormatter.format(experimentResults.projectedRevenueLift!);
    const boldChunks = [
      {
        opening: 'changeStrongStart',
        closing: 'changeStrongEnd',
        content: (chunks: ReactNode) => <strong>{chunks}</strong>,
      },
      {
        opening: 'priceStart',
        closing: 'priceEnd',
        content: () => <strong>{recommendedPriceChange}</strong>,
      },
      {
        opening: 'revenueStart',
        closing: 'revenueEnd',
        content: () => <strong>{revenueIncrease}</strong>,
      },
      {
        opening: 'playtimeStrongStart',
        closing: 'playtimeStrongEnd',
        content: (chunks: ReactNode) => <strong>{chunks}</strong>,
      },
      {
        opening: 'dauStrongStart',
        closing: 'dauStrongEnd',
        content: (chunks: ReactNode) => <strong>{chunks}</strong>,
      },
    ];
    if (experimentResults.recommendedPriceChange! > 0) {
      recommendedPriceChangeString = translateHTML(
        'Description.KeyFindings.RaisePricesV2',
        boldChunks,
        { numWeeks: holdoutDurationWeeks },
      );
    } else {
      recommendedPriceChangeString = translateHTML(
        'Description.KeyFindings.LowerPricesV2',
        boldChunks,
        { numWeeks: holdoutDurationWeeks },
      );
    }
  }

  return (
    <div className={classes.detailsContainer}>
      <Typography variant='h5'>
        {translate('Label.Experience', { experienceName: gameDetails?.name ?? '' })}
      </Typography>

      <div className={classes.infoBlock}>
        <Typography variant='h5'>{translate('Heading.KeyFindings')}</Typography>
        <Alert
          severity='info'
          variant='outlined'
          icon={false}
          className={classes.recommendationAlert}>
          {recommendedPriceChangeString}
        </Alert>
      </div>

      <div className={classes.infoBlock}>
        <Typography variant='h5'>{translate('Heading.TestMethods')}</Typography>
        <span>
          {translateHTML('Description.TestMethods', null, {
            greenUpArrow: <ArrowUpwardIcon color='success' className={classes.centeredIcon} />,
            redDownArrow: <ArrowDownwardIcon color='error' className={classes.centeredIcon} />,
          })}
        </span>
        <Scorecard />
      </div>
    </div>
  );
};

export default DetailedResults;
