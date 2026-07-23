import { ColumnType, NumberContext, TableSortOrder } from '@modules/charts-generic';
import {
  RAQIV2Metric,
  RAQIV2MetricValueType,
  TRAQIV2UIMetric,
} from '@rbx/creator-hub-analytics-config';
import ColumnConfigWithoutColumnKey from '../types/TableColumnConfigWithoutColumnKey';
import getAnalyticsMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';
import { generateAnalyticsNumberFormattingSpec } from './analyticsNumberFormattingSpec';
import { isComputedMetric, type MetricLike } from '../types/ComputedMetric';
import {
  getIsPositiveGoodFromMetricLike,
  getMetricLabelFromMetricLike,
} from './metricLikeSemantics';

const computeRAQIV2MetricColumnConfigOverride = ({
  metric,
  disableSort,
}: {
  metric: MetricLike<TRAQIV2UIMetric>;
  disableSort?: boolean;
}): ColumnConfigWithoutColumnKey<RAQIV2Metric> => {
  let defaultColumnConfig: ColumnConfigWithoutColumnKey<RAQIV2Metric>;
  const computedMetric = isComputedMetric(metric);
  const metricLabel = getMetricLabelFromMetricLike(metric);
  const { localizedName, isPositiveGood, columnDisplayConfigOverrides, valueType } = computedMetric
    ? {
        localizedName: metricLabel,
        isPositiveGood: getIsPositiveGoodFromMetricLike(metric),
        columnDisplayConfigOverrides: undefined,
        valueType: RAQIV2MetricValueType.Numeric,
      }
    : getAnalyticsMetricDisplayConfig(metric);
  if (valueType === RAQIV2MetricValueType.Numeric) {
    defaultColumnConfig = {
      columnType: ColumnType.Number,
      titleKey: localizedName,
      analyticsNumberFormattingSpec: generateAnalyticsNumberFormattingSpec({
        metric,
        context: NumberContext.TableDataPoint,
      }),
      sort: disableSort
        ? undefined
        : {
            direction: isPositiveGood ? TableSortOrder.desc : TableSortOrder.asc,
          },
    };
  } else {
    defaultColumnConfig = {
      columnType: ColumnType.Text,
      titleKey: localizedName,
    };
  }

  return columnDisplayConfigOverrides
    ? {
        ...defaultColumnConfig,
        ...columnDisplayConfigOverrides,
      }
    : defaultColumnConfig;
};
export default computeRAQIV2MetricColumnConfigOverride;
