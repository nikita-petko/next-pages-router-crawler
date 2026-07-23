import { useUniverseResource } from '@modules/experience-analytics-shared';
import { useCreatorExperimentationClient } from '@modules/remote-configs/CreatorExperimentationClientProvider';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useDebounce } from '@rbx/react-utilities';
import { ExperimentMetric } from '../../api/universeExperimentationClientEnums';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const interval = 2000; // 2 seconds
const maxAttempts = 20;
const DEBOUNCE_DELAY = 300; // 300ms debounce delay

const useExperimentMDECalculation = ({
  exposurePercent,
  goalMetric,
  durationDays,
  baselineProportion,
  variantProportions,
}: {
  exposurePercent: number;
  goalMetric: ExperimentMetric | null;
  durationDays: number;
  baselineProportion: number;
  variantProportions: number[];
}) => {
  const { id: universeId } = useUniverseResource();
  const client = useCreatorExperimentationClient();

  // Debounce the parameters to prevent frequent API calls while user is typing
  const debouncedExposurePercent = useDebounce(exposurePercent, DEBOUNCE_DELAY);
  const debouncedDurationDays = useDebounce(durationDays, DEBOUNCE_DELAY);
  const debouncedBaselineProportion = useDebounce(baselineProportion, DEBOUNCE_DELAY);
  const debouncedVariantProportions = useDebounce(variantProportions, DEBOUNCE_DELAY);

  const fetchMDE = useCallback(() => {
    if (!goalMetric) {
      return Promise.resolve({
        done: false,
      } as const);
    }

    return client.v1UniversesUniverseIdExperimentMdePost({
      universeId,
      calculateExperimentMdeData: {
        exposurePercent: debouncedExposurePercent,
        universeGoalMetric: goalMetric,
        durationDays: debouncedDurationDays,
        baselineProportion: debouncedBaselineProportion,
        variantProportions: debouncedVariantProportions,
      },
    });
  }, [
    debouncedBaselineProportion,
    client,
    debouncedDurationDays,
    debouncedExposurePercent,
    goalMetric,
    universeId,
    debouncedVariantProportions,
  ]);

  const pollMDE = useCallback(async () => {
    let response = await fetchMDE();

    let attempts = 1;
    while (!response.done) {
      if (attempts > maxAttempts) {
        throw new Error('Error: reached out max number of attempts');
      }

      await sleep(interval); // eslint-disable-line no-await-in-loop -- sleep in between requests to provide time for the op to resolve
      response = await fetchMDE(); // eslint-disable-line no-await-in-loop -- make requests serially until one succeeds

      attempts += 1;
    }

    if (response.isError) {
      throw new Error(response.error.message, { cause: response.error.code });
    }

    return response.mde;
  }, [fetchMDE]);

  const select = useCallback(
    ({
      totalSampleSize,
      mdeRelativePercentages,
      minimumSampleSizeThreshold,
    }: {
      totalSampleSize: number;
      mdeRelativePercentages: number[];
      minimumSampleSizeThreshold: number;
    }) => {
      // 1. get max relative percentage
      const maxMdeRelativePercentage = Math.max(...mdeRelativePercentages);
      const indexOfMaxMdeRelativePercentage =
        mdeRelativePercentages.indexOf(maxMdeRelativePercentage);

      // 2. get variant proportion of max relative percentage
      const variantProportionOfMaxMdeRelativePercentage =
        variantProportions[indexOfMaxMdeRelativePercentage] / 100;

      // 3. get sample size for that variant
      const sampleSize = totalSampleSize * variantProportionOfMaxMdeRelativePercentage;

      return {
        totalSampleSize,
        mdeRelativePercentage: maxMdeRelativePercentage,
        meetThreshold: sampleSize >= minimumSampleSizeThreshold,
      };
    },
    [variantProportions],
  );
  const { data, isFetching, error } = useQuery({
    queryKey: [
      'experiment-mde',
      universeId,
      goalMetric,
      debouncedDurationDays,
      debouncedExposurePercent,
      debouncedBaselineProportion,
      ...debouncedVariantProportions,
    ],
    queryFn: pollMDE,
    enabled: !!universeId && !!goalMetric && !!debouncedDurationDays && !!debouncedExposurePercent,
    select,
  });

  return useMemo(
    () => ({
      mde: data,
      isFetching,
      error,
    }),
    [data, isFetching, error],
  );
};

export default useExperimentMDECalculation;
