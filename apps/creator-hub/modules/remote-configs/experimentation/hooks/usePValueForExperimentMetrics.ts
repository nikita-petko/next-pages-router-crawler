import {
  RAQIV2UIQueryRequest,
  useRAQIV2Request,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import { useMemo } from 'react';
import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import { GenericChartState } from '@modules/charts-generic';
import { getExperimentTimeSpec } from '../../utils/experimentProperties';
import { ExperimentMetric } from '../../api/universeExperimentationClientEnums';
import useExperiment from './useExperiment';

export type PValueByExperimentMetricAndVariant = Map<ExperimentMetric, Record<string, number>>;
const emptyPValueByExperimentMetricAndVariant: PValueByExperimentMetricAndVariant = new Map();

export const STATSIG_P_VALUE_THRESHOLD = 0.05;
export const isPValueStatsig = (pValue: number) => {
  return Math.abs(pValue) < STATSIG_P_VALUE_THRESHOLD;
};

const usePValueForExperimentMetrics = (
  experimentId: string,
): {
  pValueByExperimentMetricAndVariant: PValueByExperimentMetricAndVariant;
} & GenericChartState => {
  const resource = useUniverseResource();
  const { experiment } = useExperiment({
    experimentId,
  });

  const queryRequest: RAQIV2UIQueryRequest = useMemo(() => {
    return {
      resource,
      metric: RAQIV2Metric.ExperimentMetricVariantControlRelativePValue,
      granularity: RAQIV2MetricGranularity.None,
      filter: [
        {
          dimension: RAQIV2Dimension.Experiment,
          values: [experimentId],
        },
      ],
      breakdown: [RAQIV2Dimension.ExperimentVariant, RAQIV2Dimension.ExperimentMetric],
      timeSpec: getExperimentTimeSpec(experiment),
    };
  }, [experiment, experimentId, resource]);

  const { data, ...rest } = useRAQIV2Request(queryRequest);

  return useMemo(() => {
    const pValueByExperimentMetricAndVariant = data?.response?.values?.reduce(
      (acc, { breakdownValue, dataPoints }) => {
        let variantId: string | undefined;
        let variantMetric: ExperimentMetric | undefined;

        breakdownValue?.forEach(({ dimension, value }) => {
          if (dimension === RAQIV2Dimension.ExperimentVariant) {
            variantId = experiment?.variants.find((variant) => variant.label === value)?.variantId;
          } else if (
            dimension === RAQIV2Dimension.ExperimentMetric &&
            value &&
            isValidEnumValue(ExperimentMetric, value)
          ) {
            variantMetric = value;
          }
        });

        const pValue = dataPoints?.[0]?.value ?? STATSIG_P_VALUE_THRESHOLD;
        if (variantId && variantMetric) {
          acc.set(variantMetric, {
            ...acc.get(variantMetric),
            [variantId]: pValue,
          });
        }

        return acc;
      },
      new Map<ExperimentMetric, Record<string, number>>(),
    );

    return {
      pValueByExperimentMetricAndVariant:
        pValueByExperimentMetricAndVariant ?? emptyPValueByExperimentMetricAndVariant,
      ...rest,
    };
  }, [data?.response?.values, experiment?.variants, rest]);
};

export default usePValueForExperimentMetrics;
