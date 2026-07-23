import type { Dimension as AnalyticsQueryGatewayAPIDimension } from '@rbx/client-analytics-query-gateway/v1';
import { DimensionToMetricToNamespaceMap } from '@rbx/creator-hub-analytics-config';
import type {
  RAQIV2Dimension,
  RAQIV2Namespace,
  TRAQIV2APIMetric,
} from '@rbx/creator-hub-analytics-config';
const getNamespacedDimensionsForMetrics = (
  dimension: RAQIV2Dimension,
  metrics: TRAQIV2APIMetric[],
): AnalyticsQueryGatewayAPIDimension[] => {
  const { defaultNamespace, overrides } = DimensionToMetricToNamespaceMap[dimension];
  const namespaces = new Set<RAQIV2Namespace>();
  metrics.forEach((metric) => {
    const metricNamespace = overrides?.[metric] ?? defaultNamespace;
    namespaces.add(metricNamespace);
  });
  return Array.from(namespaces).map((namespace) => ({ namespace, name: dimension }));
};
export default getNamespacedDimensionsForMetrics;
