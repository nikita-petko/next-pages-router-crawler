import { RAQIV2MetricValueType } from '@rbx/creator-hub-analytics-config';
import type { RAQIV2Metric, TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import { NumberContext } from '@modules/charts-generic/charts/numberFormatters';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import { TableSortOrder } from '@modules/charts-generic/tables/types/TableSort';
import getAnalyticsMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';
import {
  getUIMetricFromAtomicMetricLike,
  isComputedMetric,
  type MetricLike,
} from '../types/ComputedMetric';
import type ColumnConfigWithoutColumnKey from '../types/TableColumnConfigWithoutColumnKey';
import { generateAnalyticsNumberFormattingSpec } from './analyticsNumberFormattingSpec';
import {
  getIsPositiveGoodFromMetricLike,
  getMetricTitleKeyFromMetricLike,
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
  // Use the table-column-specific helper so unnamed computed metrics show
  // "(Untitled formula)" in the header rather than the raw formula text
  // (e.g. "A / B"). For atomic metrics and named computed metrics this
  // matches the chart/title behavior the user already sees elsewhere.
  const metricTitleKey = getMetricTitleKeyFromMetricLike(metric);
  const { localizedName, isPositiveGood, columnDisplayConfigOverrides, valueType } = computedMetric
    ? {
        localizedName: metricTitleKey,
        isPositiveGood: getIsPositiveGoodFromMetricLike(metric),
        columnDisplayConfigOverrides: undefined,
        valueType: RAQIV2MetricValueType.Numeric,
      }
    : getAnalyticsMetricDisplayConfig(getUIMetricFromAtomicMetricLike(metric));
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
