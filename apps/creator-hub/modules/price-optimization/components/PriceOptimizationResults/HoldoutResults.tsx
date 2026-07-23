import { useTranslation } from '@rbx/intl';
import { CircularProgress, Typography } from '@rbx/ui';
import { addDays } from '@rbx/core';
import { ExperimentState, TriggerMode } from '@rbx/clients/priceExperimentationApi/v1';
import useGetLatestExperiment from '../../queries/useGetLatestExperiment';
import useFormatters from '../../helpers/useFormatters';
import { usePricingError } from '../../providers/PricingErrorProvider';
import ExperimentResultCard, {
  ExperimentResultTextColor,
} from '../ExperimentResultCard/ExperimentResultCard';
import useGetExperimentResults from '../../queries/useGetExperimentResults';
import useGetProducts from '../../queries/useGetProducts';
import usePriceOptimizationResultsStyles from './PriceOptimizationResults.styles';
import ScorecardButtons from '../ScorecardButtons/ScorecardButtons';
import {
  holdoutTestPopulation,
  legacyHoldoutTestPopulation,
} from '../../constants/experimentConstants';
import useGetExperimentationMetadata from '../../queries/useGetExperimentationMetadata';
import useGetHoldoutMetrics from '../../queries/useGetHoldoutMetrics';
import {
  extractHoldoutResults,
  isInHoldoutResultsState,
  convertTimeSpanToWeeks,
  convertTimeSpanToDays,
} from '../../helpers/experimentUtils';

const HoldoutResults = () => {
  const { translate } = useTranslation();
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

  const {
    metrics: holdoutMetrics,
    isLoading: isLoadingMetrics,
    isError: isErrorMetrics,
  } = useGetHoldoutMetrics();

  const { products, isLoading: isLoadingProducts, isError: isErrorProducts } = useGetProducts();

  const { holdoutDuration: defaultHoldoutDuration } = useGetExperimentationMetadata();

  const recentlyStartedHoldout =
    currentExperiment?.state === ExperimentState.HoldoutRunning &&
    currentExperiment?.holdoutMetadata === null &&
    currentExperiment?.displayHoldoutExperimentDuration === null;

  // If start time and holdout duration is null, means holdout just started and is transitioning from HoldoutStarting -> HoldoutRunning
  // This means we should use the default experiment duration
  // Otherwise the holdout already has a holdout duration set which we should use
  const holdoutDuration = recentlyStartedHoldout
    ? defaultHoldoutDuration
    : (currentExperiment?.displayHoldoutExperimentDuration ?? null);

  const holdoutDurationWeeks = convertTimeSpanToWeeks(holdoutDuration, true);
  const holdoutDays = convertTimeSpanToDays(holdoutDuration, true);

  const displayHoldoutTestPopulation = !currentExperiment?.displayHoldoutExperimentDuration
    ? legacyHoldoutTestPopulation
    : holdoutTestPopulation;

  const isError = isErrorCurrentExperiment || isErrorResults || isErrorProducts || isErrorMetrics;
  const isLoading =
    isLoadingCurrentExperiment ||
    isLoadingResults ||
    isLoadingProducts ||
    // Holdout metrics will not load if the experiment is not in a state which has metrics yet
    (isLoadingMetrics && isInHoldoutResultsState(currentExperiment?.state));

  const { changeFormatter, percentageFormatter, dateFormatter } = useFormatters();

  usePricingError(isError);

  if (isError) {
    return null;
  }

  // experiment results will always be defined if !isLoading && !isError
  // including the check here to make type checking easier
  if (isLoading || !experimentResults) {
    return <CircularProgress />;
  }

  const {
    testedProductsRevenue,
    overallRevenue,
    isStatisticallySignificant: isRevenueStatSig,
  } = extractHoldoutResults(holdoutMetrics);

  const testedProductsRevenuePercentageString = testedProductsRevenue
    ? translate('Label.RevenueLift', {
        revenueLiftPercent: changeFormatter.format(testedProductsRevenue),
      })
    : '';
  const overallRevenueValuePercentageString = overallRevenue
    ? translate('Label.RevenueLift', { revenueLiftPercent: changeFormatter.format(overallRevenue) })
    : '';

  // Determine summary text, state text, and string for tested products/overall revenue lift
  // Various considerations are current state, holdout completion mode, price revert mode, and whether results are statsig
  let summaryString = '';
  let statusString = '';
  let testedProductsRevenueString = '';
  let overallRevenueString = '';
  let showingRevenueMetric = false;
  if (
    currentExperiment?.state === ExperimentState.HoldoutRunning ||
    currentExperiment?.state === ExperimentState.HoldoutCompleting
  ) {
    // Holdout is currently running, or user decided to stop holdout early.
    // Either way don't show results, treat as active holdout.
    summaryString = translate('Description.PriceReviewSummary.ActiveV2', {
      numWeeks: holdoutDurationWeeks,
    });
    statusString = translate('PriceReview.Status.Active');
    testedProductsRevenueString = translate('Description.Results.Pending');
    overallRevenueString = translate('Description.Results.Pending');
  } else if (
    currentExperiment?.state === ExperimentState.HoldoutCompleted ||
    currentExperiment?.state === ExperimentState.PriceRevertingWithCompletion ||
    currentExperiment?.state === ExperimentState.Completed
  ) {
    // We treat the polling states and finished polling states same as holdout completed state which triggered the polling.
    if (currentExperiment?.holdoutMetadata?.holdoutCompletionMode === TriggerMode.Auto) {
      // For auto completed holdouts, we show results
      summaryString = translate('Description.PriceReviewSummary.CompletedV2', {
        numWeeks: holdoutDurationWeeks,
      });
      statusString = translate('PriceReview.Status.Completed');
      testedProductsRevenueString = testedProductsRevenuePercentageString;
      overallRevenueString = overallRevenueValuePercentageString;
      showingRevenueMetric = true;
    } else {
      // For manually early stopped holdouts, we show results if they are statsig
      statusString = translate('PriceReview.Status.Stopped');
      if (isRevenueStatSig) {
        if (testedProductsRevenue && testedProductsRevenue < 0) {
          summaryString = translate('Description.PriceReviewSummary.StoppedNegativeResults');
        } else {
          summaryString = translate('Description.PriceReviewSummary.StoppedPositiveResults');
        }
        testedProductsRevenueString = testedProductsRevenuePercentageString;
        overallRevenueString = overallRevenueValuePercentageString;
        showingRevenueMetric = true;
      } else {
        summaryString = translate('Description.PriceReviewSummary.StoppedNoData');
        testedProductsRevenueString = translate('Description.Results.NotAvailable');
        overallRevenueString = translate('Description.Results.NotAvailable');
      }
    }
  } else if (currentExperiment?.state === ExperimentState.PriceReverted) {
    // For autoreverted holdouts, we show results
    summaryString = translate('Description.PriceReviewSummary.AutoStopped');
    statusString = translate('PriceReview.Status.Stopped');
    testedProductsRevenueString = testedProductsRevenuePercentageString;
    overallRevenueString = overallRevenueValuePercentageString;
    showingRevenueMetric = true;
  }

  let testedProductsRevenueColor = ExperimentResultTextColor.NEUTRAL;
  if (testedProductsRevenue && showingRevenueMetric) {
    if (testedProductsRevenue > 0) {
      testedProductsRevenueColor = ExperimentResultTextColor.POSITIVE;
    } else if (testedProductsRevenue < 0) {
      testedProductsRevenueColor = ExperimentResultTextColor.NEGATIVE;
    }
  }

  let overallRevenueColor = ExperimentResultTextColor.NEUTRAL;
  if (overallRevenue && showingRevenueMetric) {
    if (overallRevenue > 0) {
      overallRevenueColor = ExperimentResultTextColor.POSITIVE;
    } else if (overallRevenue < 0) {
      overallRevenueColor = ExperimentResultTextColor.NEGATIVE;
    }
  }

  const approximateHoldoutEndTime = addDays(
    currentExperiment?.holdoutMetadata?.startTime ?? new Date(),
    holdoutDays,
  );
  const holdoutEndTime = currentExperiment?.holdoutMetadata?.endTime ?? approximateHoldoutEndTime;
  const holdoutEndTimeString = dateFormatter.format(holdoutEndTime);

  const revenueImpact = experimentResults.projectedRevenueLift!;
  const revenueImpactPercent = changeFormatter.format(revenueImpact);
  const revenueImpactString = translate('Label.RevenueLift', {
    revenueLiftPercent: revenueImpactPercent,
  });

  const priceReviewProductsTestedString = translate('Label.NumProducts', {
    numProducts: products.length.toString(),
  });

  const testPopulationString = translate('Label.TestPopulationPercent', {
    testPopulationPercent: percentageFormatter.format(displayHoldoutTestPopulation),
  });

  return (
    <div className={classes.container}>
      <div>
        <Typography variant='h3' component='h3'>
          {translate('Heading.PriceReviewPeriod')}
        </Typography>
        <Typography variant='body2' component='p' className={classes.subtitleText}>
          {summaryString}
        </Typography>
      </div>
      <div className={classes.cardGrid}>
        <ExperimentResultCard
          title={translate('Label.PriceReviewTestedProductsRevenueLift')}
          text={testedProductsRevenueString}
          textColor={testedProductsRevenueColor}
          primary
        />
        <ExperimentResultCard
          title={translate('Label.PriceReviewOverallProductsRevenueLift')}
          text={overallRevenueString}
          textColor={overallRevenueColor}
          primary
        />
        <ExperimentResultCard
          title={translate('Label.RevenueImpact')}
          text={revenueImpactString}
          textColor={ExperimentResultTextColor.POSITIVE}
          className={classes.mediumCard}
          primary
        />
        <ExperimentResultCard
          title={translate('Label.PriceReviewEnds')}
          text={holdoutEndTimeString}
        />

        <ExperimentResultCard title={translate('Label.TestStatus')} text={statusString} />

        <ExperimentResultCard
          title={translate('Label.ProductsTested')}
          text={priceReviewProductsTestedString}
        />

        <ExperimentResultCard
          title={translate('Label.PriceReviewPopulation')}
          text={testPopulationString}
        />
      </div>

      <ScorecardButtons />
    </div>
  );
};

export default HoldoutResults;
