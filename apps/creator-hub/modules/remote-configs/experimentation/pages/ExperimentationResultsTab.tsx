import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { startOfToday, subDays } from '@rbx/core';
import { RAQIV2Dimension, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
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
import { ExperimentMetric, ExperimentState } from '../../api/universeExperimentationClientEnums';
import {
  hasExperimentStarted,
  isExperimentRunningAndDurationMet,
  isExperimentStoppable,
} from '../../utils/experimentProperties';
import getExperimentTimeSpec from '../../utils/experimentTimeSpec';
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

type ExperimentationResultsTabProps = {
  experimentId: string;
};

const ExperimentationResultsTab: FC<ExperimentationResultsTabProps> = ({ experimentId }) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { client: raqiClient } = useRAQIV2Client(false);
  const resource = useUniverseResource();
  const { experiment } = useExperiment({
    experimentId,
  });
  const { experimentVariantsResults, isLoading: isLoadingExperimentVariantsResults } =
    useExperimentVariantsResults(experimentId);

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
      isD1RetentionLikelyToBeBlank,
      isD7RetentionLikelyToBeBlank,
      raqiClient,
      resource,
      timeSpec,
    ],
  );

  const { data: responsesByGoalMetric, ...goalMetricState } = useMappedApiRequest(
    orederedGoalMetrics,
    makeRequestsForMetrics,
  );

  const { data: responsesByLearningMetric, ...learningMetricState } = useMappedApiRequest(
    orederedLearningMetrics,
    makeRequestsForMetrics,
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

    if (experiment) {
      return (
        <ExperimentSignificanceNotificationArea
          experiment={experiment}
          action={actionInNotificationArea}
          experimentVariantsResults={experimentVariantsResults}
        />
      );
    }

    return null;
  }, [actionInNotificationArea, experiment, experimentVariantsResults, isSRMDetected]);

  if (isLoadingExperimentVariantsResults || isSRMLoading) {
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
      />
      {isNonEmptyArray(availableMetricOptions) && (
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
