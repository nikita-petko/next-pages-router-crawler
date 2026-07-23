import { Dimension as AnalyticsQueryGatewayAPIDimension } from '@rbx/client-analytics-query-gateway/v1';
import {
  RAQIV2Namespace,
  TRAQIV2APIMetric,
  DimensionToMetricToNamespaceMap,
  RAQIV2Dimension,
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
