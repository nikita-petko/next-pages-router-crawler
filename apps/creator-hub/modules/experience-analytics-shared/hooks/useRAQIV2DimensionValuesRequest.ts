import { RAQIV2ChartResource, RAQIV2BreakdownValue } from '@modules/clients/analytics';
import {
  RAQIV2Dimension,
  TRAQIV2Dimension,
  TRAQIV2APIMetric,
  RAQIV2DimensionDisplayConfig,
  RAQIV2DimensionValueType,
} from '@rbx/creator-hub-analytics-config';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { useCallback, useMemo } from 'react';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic';
import useApiRequest, { TUseApiRequestResponse } from './useApiRequest';
import { useCachedAnalyticsQueryGateway } from '../context/AnalyticsQueryGatewayProvider';
import { isLoadingRAQIV2Prerequisites } from '../utils/RAQIV2InternalException';
import calculateTimeRangeFromSpec from '../utils/calculateTimeRangeFromSpec';
import TTimeRangeSpec from '../types/TimeRangeSpec';

export type RAQIV2CombinedDimensionValuesResult = null | {
  values: Array<RAQIV2BreakdownValue>;
};

const useRAQIV2DimensionValuesRequest = (
  resource: RAQIV2ChartResource,
  dimension: TRAQIV2Dimension,
  contextMetrics: Array<TRAQIV2APIMetric>,
  timeRangeSpec?: TTimeRangeSpec,
): TUseApiRequestResponse<RAQIV2CombinedDimensionValuesResult> => {
  const {
    client: { getDimensionValues: platformGetDimension },
  } = useCachedAnalyticsQueryGateway();

  const { valueType: dimensionValueType } = RAQIV2DimensionDisplayConfig[dimension];

  const { startDate: bundleStartTime, endDate: bundleEndTime } =
    useAnalyticsCurrentDateRangeBundle();

  const { startTime, endTime } = useMemo(() => {
    if (timeRangeSpec) {
      return calculateTimeRangeFromSpec(timeRangeSpec);
    }
    return { startTime: bundleStartTime, endTime: bundleEndTime };
  }, [timeRangeSpec, bundleStartTime, bundleEndTime]);
  const makeRequest = useCallback(async (): Promise<RAQIV2CombinedDimensionValuesResult> => {
    switch (dimensionValueType) {
      case RAQIV2DimensionValueType.Dynamic:
      case RAQIV2DimensionValueType.DynamicWithPreset:
        break;
      case RAQIV2DimensionValueType.Enum:
        return null;
      default: {
        const exhaustiveCheck: never = dimensionValueType;
        throw new Error(
          `Unknown dimension value type ${exhaustiveCheck} for dimension ${dimension}`,
        );
      }
    }
    if (isLoadingRAQIV2Prerequisites(resource) || !isValidEnumValue(RAQIV2Dimension, dimension)) {
      return null;
    }
    const { values: responseValues } = await platformGetDimension({
      resource,
      metrics: contextMetrics,
      dimension,
      startTime,
      endTime,
    });
    if (!responseValues) return null;
    const requestDimensionResult = responseValues.find(
      ({ dimension: dim }) => dim?.name === dimension,
    );
    if (!requestDimensionResult?.values) return null;
    return { values: requestDimensionResult.values };
  }, [
    resource,
    platformGetDimension,
    contextMetrics,
    dimension,
    startTime,
    endTime,
    dimensionValueType,
  ]);

  return useApiRequest(makeRequest);
};

export default useRAQIV2DimensionValuesRequest;
