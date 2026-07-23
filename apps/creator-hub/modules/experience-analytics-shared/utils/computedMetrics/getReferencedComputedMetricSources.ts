import type { ComputedMetric, ComputedMetricSource } from '../../types/ComputedMetric';
import { parseComputedMetricFormula } from './parseComputedMetricFormula';

const getReferencedComputedMetricSources = (
  computedMetric: ComputedMetric,
): readonly ComputedMetricSource[] => {
  const parseResult = parseComputedMetricFormula(
    computedMetric.formula,
    computedMetric.sources.map((source) => source.key),
  );

  if (!parseResult.ok) {
    return computedMetric.sources;
  }

  const referencedSourceKeys = new Set(parseResult.identifiers);
  return computedMetric.sources.filter((source) => referencedSourceKeys.has(source.key));
};

export default getReferencedComputedMetricSources;
