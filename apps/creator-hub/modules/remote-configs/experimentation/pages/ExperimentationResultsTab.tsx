import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { startOfToday, subDays } from '@rbx/core';
import { RAQIV2Dimension, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import { isEhdResultsEnabled as isEhdResultsEnabledFlag } from '@generated/flags/creatorAnalytics';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { isNonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import { useRAQIV2Client } from '@modules/experience-analytics-shared/context/RAQIV2ClientProvider';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useMappedApiRequest from '@modules/experience-analytics-shared/hooks/useMappedApiRequest';
import makeRAQIV2Request from '@modules/experience-analytics-shared/utils/makeRAQIV2Request';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ExperimentMetricToRAQIV2Metric } from '../../api/makeValidatedExperimentationAPI';
import {
  ExperimentMetric,
  ExperimentState,
  ExperimentResultsSource,
} from '../../api/universeExperimentationClientEnums';
import type {
  ValidExperimentVariantBase,
  ValidExperimentVariantsResults,
} from '../../api/validExperimentationTypes';
import {
  hasExperimentStarted,
  isExperimentHarmDetected,
  isExperimentRunningAndDurationMet,
  isExperimentStoppable,
} from '../../utils/experimentProperties';
import getExperimentTimeSpec from '../../utils/experimentTimeSpec';
import EarlyHarmBanner from '../components/EarlyHarmBanner';
import EmptyExperimentResultsCard from '../components/EmptyExperimentResultsCard';
import ExperimentMetricsResultChart from '../components/ExperimentMetricsResultChart';
import ExperimentMetricsResultTable from '../components/ExperimentMetricsResultTable';
import ExperimentSignificanceNotificationArea from '../components/ExperimentSignificanceNotificationArea';
import SRMBanner from '../components/SRMBanner';
import StopExperimentButton from '../components/StopExperimentButton';
import useExperiment from '../hooks/useExperiment';
import useExperimentSRMDetected from '../hooks/useExperimentSRMDetected';
import useExperimentVariantsResults from '../hooks/useExperimentVariantsResults';

const emptyArray: never[] = [];

// Build a RAQI response from experimentVariantsResults to bypass RAQI
const buildResultsBasedResponseForMetric = (
  metric: ExperimentMetric,
  experimentVariantsResults: ValidExperimentVariantsResults | undefined,
  orderedVariants: ReadonlyArray<ValidExperimentVariantBase>,
) => {
  const variantResults = experimentVariantsResults?.variantResults;
  if (!variantResults) {
    return { response: null };
  }

  let controlMean: number | undefined;
  variantResults.forEach((metricResults) => {
    const forMetric = metricResults.get(metric);
    if (forMetric && controlMean === undefined) {
      controlMean = forMetric.controlMean;
    }
  });

  if (controlMean === undefined) {
    return { response: null };
  }

  const baselineControlMean = controlMean;
  const values = orderedVariants.map((variant) => {
    const lift = variantResults.get(variant.variantId)?.get(metric)?.lift;
    const value =
      variant.isBaseline || lift === undefined
        ? baselineControlMean
        : baselineControlMean * (1 + lift);
    return {
      breakdownValue: [{ dimension: RAQIV2Dimension.ExperimentVariant, value: variant.label }],
      dataPoints: [{ value }],
    };
  });

  return { response: { values } };
};

type ExperimentationResultsTabProps = {
  experimentId: string;
};

const ExperimentationResultsTab: FC<ExperimentationResultsTabProps> = ({ experimentId }) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { client: raqiClient } = useRAQIV2Client(false);
  const resource = useUniverseResource();
  const { ready: isEhdResultsFlagReady, value: isEhdResultsFlagValue } =
    useFlag(isEhdResultsEnabledFlag);
  const isEhdResultsEnabled = isEhdResultsFlagReady && (isEhdResultsFlagValue ?? false);
  const { experiment, isDataLoading: isExperimentLoading } = useExperiment({
    experimentId,
  });
  const isEarlyHarmAnalysisPeriod = isEhdResultsEnabled && !!experiment?.isEarlyHarmAnalysisPeriod;

  // Disable metric requests if EHD period and flag is not ready
  const areMetricRequestsEnabled = !experiment?.isEarlyHarmAnalysisPeriod || isEhdResultsFlagReady;
  const { experimentVariantsResults, isLoading: isLoadingExperimentVariantsResults } =
    useExperimentVariantsResults({
      experimentId,
      resultsSource: isEarlyHarmAnalysisPeriod
        ? ExperimentResultsSource.Ehd
        : ExperimentResultsSource.Batch,
      fallbackResultsSource: isEhdResultsEnabled ? ExperimentResultsSource.Ehd : undefined,
      disabled: isExperimentLoading || experiment == null || !areMetricRequestsEnabled,
    });

  const isHarmDetected = useMemo(
    () => isExperimentHarmDetected(experimentVariantsResults),
    [experimentVariantsResults],
  );

  const { orderedVariants, orederedGoalMetrics, orederedLearningMetrics, timeSpec } =
    useMemo(() => {
      const variants = experiment?.variants ?? emptyArray;
      const goalMetrics = experiment?.goalMetrics ?? emptyArray;
      const learningMetrics = experiment?.learningMetrics ?? emptyArray;

      return {
        orderedVariants: variants.slice().sort((a) => (a.isBaseline ? -1 : 0)),
        orederedGoalMetrics: goalMetrics,
        orederedLearningMetrics: learningMetrics.sort((a, b) => a.localeCompare(b)),
        timeSpec: getExperimentTimeSpec(experiment),
      };
    }, [experiment]);

  const isD7RetentionLikelyToBeBlank = useMemo(() => {
    const sevenDaysAgo = subDays(startOfToday(), 8);
    return experiment?.state === ExperimentState.Running && experiment.startedTime >= sevenDaysAgo;
  }, [experiment]);

  const isD1RetentionLikelyToBeBlank = useMemo(() => {
    const oneDayAgo = subDays(startOfToday(), 2);
    return experiment?.state === ExperimentState.Running && experiment.startedTime >= oneDayAgo;
  }, [experiment]);

  const makeRequestsForMetrics = useCallback(
    async (metrics: ExperimentMetric[]) => {
      const responses = await Promise.all(
        metrics.map(async (metric) => {
          if (isEarlyHarmAnalysisPeriod) {
            return {
              key: metric,
              response: buildResultsBasedResponseForMetric(
                metric,
                experimentVariantsResults,
                orderedVariants,
              ),
            };
          }

          const response = await makeRAQIV2Request(
            {
              resource,
              metric: ExperimentMetricToRAQIV2Metric[metric],
              granularity: RAQIV2MetricGranularity.None,
              breakdown: [RAQIV2Dimension.ExperimentVariant],
              filter: [{ dimension: RAQIV2Dimension.Experiment, values: [experimentId] }],
              timeSpec,
            },
            raqiClient,
          );

          // For D1/D7 retention, display N/A instead of 0% if the experiment started within the last 1/7 days.
          // The IXP response may return 0 in this scenario, so we check for that here.
          // If all returned data points are 0, treat the result as null to represent N/A.
          if (
            metric === ExperimentMetric.Day7Retention ||
            metric === ExperimentMetric.Day1Retention
          ) {
            const areDataPointsZero = response.response?.values?.every(
              (v) => v.dataPoints?.length === 1 && v.dataPoints[0].value === 0,
            );

            if (areDataPointsZero) {
              if (metric === ExperimentMetric.Day7Retention && isD7RetentionLikelyToBeBlank) {
                return {
                  key: metric,
                  response: {
                    response: null,
                  },
                };
              }

              if (metric === ExperimentMetric.Day1Retention && isD1RetentionLikelyToBeBlank) {
                return {
                  key: metric,
                  response: {
                    response: null,
                  },
                };
              }
            }
          }

          return {
            key: metric,
            response,
          };
        }),
      );
      return new Map(responses.map(({ key, response }) => [key, response]));
    },
    [
      experimentId,
      experimentVariantsResults,
      isD1RetentionLikelyToBeBlank,
      isD7RetentionLikelyToBeBlank,
      isEarlyHarmAnalysisPeriod,
      orderedVariants,
      raqiClient,
      resource,
      timeSpec,
    ],
  );

  const { data: responsesByGoalMetric, ...goalMetricState } = useMappedApiRequest(
    orederedGoalMetrics,
    makeRequestsForMetrics,
    areMetricRequestsEnabled,
  );

  const { data: responsesByLearningMetric, ...learningMetricState } = useMappedApiRequest(
    orederedLearningMetrics,
    makeRequestsForMetrics,
    areMetricRequestsEnabled,
  );

  const availableMetricOptions: ExperimentMetric[] = useMemo(() => {
    return Array.from(new Set([...orederedGoalMetrics, ...orederedLearningMetrics]));
  }, [orederedGoalMetrics, orederedLearningMetrics]);

  const actionInNotificationArea = useMemo(() => {
    if (
      !experiment ||
      !isExperimentStoppable(experiment.state) ||
      !isExperimentRunningAndDurationMet(experiment)
    ) {
      return undefined;
    }

    return (
      <StopExperimentButton
        buttonLabel={translate(
          translationKey(
            'Label.StopExperimentButton.MakeDecision',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
        buttonColor='primaryBrand'
        buttonVariant='contained'
        experimentId={experimentId}
      />
    );
  }, [experiment, experimentId, translate]);

  const { isSRMDetected, isLoading: isSRMLoading } = useExperimentSRMDetected(experimentId);

  const banner = useMemo(() => {
    if (isSRMDetected) {
      return <SRMBanner />;
    }

    if (!experiment) {
      return null;
    }

    return (
      <>
        {isEarlyHarmAnalysisPeriod ? (
          <EarlyHarmBanner
            experiment={experiment}
            experimentVariantsResults={experimentVariantsResults}
            isHarmDetected={isHarmDetected}
          />
        ) : (
          <ExperimentSignificanceNotificationArea
            experiment={experiment}
            action={actionInNotificationArea}
            experimentVariantsResults={experimentVariantsResults}
          />
        )}
      </>
    );
  }, [
    actionInNotificationArea,
    experiment,
    experimentVariantsResults,
    isSRMDetected,
    isEarlyHarmAnalysisPeriod,
    isHarmDetected,
  ]);

  if (isExperimentLoading || isLoadingExperimentVariantsResults || isSRMLoading) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  if (experiment && !hasExperimentStarted(experiment.state)) {
    return (
      <Grid container item display='flex' flexDirection='column'>
        <EmptyExperimentResultsCard experiment={experiment} />
      </Grid>
    );
  }

  return (
    <Grid container item XSmall={12} gap='40px'>
      {banner}
      <ExperimentMetricsResultTable
        orderedExperimentVariants={orderedVariants}
        state={goalMetricState}
        titleKey={translationKey(
          'Title.GoalMetrics',
          TranslationNamespace.UniverseConfigAndExperimentation,
        )}
        tooltipKey={translationKey(
          'Description.ExperimentResultTable.Metrics',
          TranslationNamespace.UniverseConfigAndExperimentation,
        )}
        raqiResponseByMetric={responsesByGoalMetric}
        experimentVariantsResults={experimentVariantsResults}
        showResultsUpdatedAt={!isSRMDetected}
        isSRMDetected={isSRMDetected}
        isEarlyHarmAnalysisPeriod={isEarlyHarmAnalysisPeriod}
      />
      <ExperimentMetricsResultTable
        orderedExperimentVariants={orderedVariants}
        state={learningMetricState}
        titleKey={translationKey(
          'Title.LearningMetrics',
          TranslationNamespace.UniverseConfigAndExperimentation,
        )}
        tooltipKey={translationKey(
          'Description.ExperimentResultTable.Metrics',
          TranslationNamespace.UniverseConfigAndExperimentation,
        )}
        raqiResponseByMetric={responsesByLearningMetric}
        experimentVariantsResults={experimentVariantsResults}
        isSRMDetected={isSRMDetected}
        isEarlyHarmAnalysisPeriod={isEarlyHarmAnalysisPeriod}
      />
      {/* TODO (ELO-202): Show chart for EHD when enrolled in CAS */}
      {!isEarlyHarmAnalysisPeriod && isNonEmptyArray(availableMetricOptions) && (
        <ExperimentMetricsResultChart
          experimentId={experimentId}
          metrics={availableMetricOptions}
          timeSpec={timeSpec}
          isSRMDetected={isSRMDetected}
        />
      )}
    </Grid>
  );
};

export default ExperimentationResultsTab;
