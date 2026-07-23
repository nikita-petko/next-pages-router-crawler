import { useMemo, memo } from 'react';
import { CircularProgress, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import usePriceOptimizationResultsStyles from './PriceOptimizationResults.styles';
import ExperimentResultCard, {
  ExperimentResultTextColor,
} from '../ExperimentResultCard/ExperimentResultCard';
import useGetExperimentResults from '../../queries/useGetExperimentResults';
import useGetLatestExperiment from '../../queries/useGetLatestExperiment';
import useGetProducts from '../../queries/useGetProducts';
import useGetExperimentationMetadata from '../../queries/useGetExperimentationMetadata';
import useFormatters from '../../helpers/useFormatters';
import { usePricingError } from '../../providers/PricingErrorProvider';
import ScorecardButtons from '../ScorecardButtons/ScorecardButtons';
import { convertTimeSpanToWeeks } from '../../helpers/experimentUtils';
import calculatePriceChangeCounts from '../../helpers/priceChangeUtils';

const ItemLevelExperimentResults = () => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = usePriceOptimizationResultsStyles();

  const {
    latestExperiment: currentExperiment,
    isLoading: isLoadingCurrentExperiment,
    isError: isErrorCurrentExperiment,
  } = useGetLatestExperiment();
  const {
    experimentResults,
    isLoading: isLoadingResults,
    isError: isErrorResults,
  } = useGetExperimentResults();
  const { products, isLoading: isLoadingProducts, isError: isErrorProducts } = useGetProducts();

  const { changeFormatter, percentageFormatter, dateFormatter } = useFormatters();

  const isLoading = isLoadingCurrentExperiment || isLoadingResults || isLoadingProducts;
  const isError = isErrorCurrentExperiment || isErrorResults || isErrorProducts;

  const { holdoutDuration } = useGetExperimentationMetadata();

  const holdoutDurationWeeks = convertTimeSpanToWeeks(holdoutDuration, true);

  usePricingError(isError);

  // Calculate item-level price change counts using helper function
  const { priceIncreaseCount, priceDecreaseCount, noChangeCount } = useMemo(() => {
    return calculatePriceChangeCounts(products);
  }, [products]);

  if (isError) {
    return null;
  }

  // experiment results will always be defined if !isLoading && !isError
  // including the check here to make type checking easier
  if (isLoading || !experimentResults) {
    return <CircularProgress />;
  }

  return (
    <div className={classes.container}>
      <div>
        <Typography variant='h3' component='h3'>
          {translate('Heading.PriceRecommendations')}
        </Typography>
        <Typography variant='body2' component='p' className={classes.subtitleText}>
          {priceIncreaseCount > 0 || priceDecreaseCount > 0
            ? translateHTML(
                'Description.RecommendPriceItemLevel',
                [
                  {
                    opening: 'revenueStart',
                    closing: 'revenueEnd',
                    content: () => (
                      <strong>
                        {changeFormatter.format(experimentResults.projectedRevenueLift!)}
                      </strong>
                    ),
                  },
                ],
                { numWeeks: holdoutDurationWeeks },
              )
            : translate('Description.RecommendNoChange')}
        </Typography>
      </div>
      <div className={classes.cardGrid}>
        <ExperimentResultCard
          title={translate('Label.RecommendPriceIncrease')}
          text={`${priceIncreaseCount} ${translate(priceIncreaseCount === 1 ? 'Label.Product' : 'Label.Products')}`}
          tooltip={translate('Description.Recommendation.Tooltip')}
          textColor={ExperimentResultTextColor.POSITIVE}
          primary
        />
        <ExperimentResultCard
          title={translate('Label.RecommendPriceDecrease')}
          text={`${priceDecreaseCount} ${translate(priceDecreaseCount === 1 ? 'Label.Product' : 'Label.Products')}`}
          tooltip={translate('Description.Recommendation.Tooltip')}
          textColor={ExperimentResultTextColor.NEGATIVE}
          primary
        />
        <ExperimentResultCard
          title={translate('Label.RecommendNoChange')}
          text={`${noChangeCount} ${translate(noChangeCount === 1 ? 'Label.Product' : 'Label.Products')}`}
          tooltip={translate('Description.Recommendation.Tooltip')}
          textColor={ExperimentResultTextColor.NEUTRAL}
          primary
        />
        <ExperimentResultCard
          title={translate('Label.RevenueImpact')}
          text={translate('Label.RevenueLift', {
            revenueLiftPercent: changeFormatter.format(experimentResults.projectedRevenueLift!),
          })}
          tooltip={translate('Description.LongTermImpact.TooltipV2', {
            numWeeks: holdoutDurationWeeks,
          })}
          textColor={ExperimentResultTextColor.POSITIVE}
          primary
        />
        <ExperimentResultCard
          title={translate('Label.TestDuration')}
          text={`${dateFormatter.format(currentExperiment!.startTime as Date)}—${dateFormatter.format(currentExperiment!.endTime as Date)}`}
        />
        <ExperimentResultCard
          title={translate('Label.TestStatus')}
          text={translate('Label.TestStatus.Completed')}
        />
        <ExperimentResultCard
          title={translate('Label.ProductsTested')}
          text={translate('Label.NumProducts', {
            numProducts: products.length.toString(),
          })}
        />
        <ExperimentResultCard
          title={translate('Label.TestPopulation')}
          text={translate('Label.TestPopulationPercent', {
            testPopulationPercent: percentageFormatter.format(experimentResults.testPopulation),
          })}
        />
      </div>
      <ScorecardButtons />
    </div>
  );
};

export default memo(ItemLevelExperimentResults);
