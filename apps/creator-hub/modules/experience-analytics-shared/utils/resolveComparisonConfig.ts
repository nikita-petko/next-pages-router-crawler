import { DEFAULT_COMPARISON_CONFIG, type ComparisonConfig } from '../types/ComparisonConfig';

const resolveComparisonConfig = (
  base?: ComparisonConfig,
  override?: ComparisonConfig,
): Required<ComparisonConfig> => ({
  chip: override?.chip ?? base?.chip ?? DEFAULT_COMPARISON_CONFIG.chip,
  rangePolicy: override?.rangePolicy ?? base?.rangePolicy ?? DEFAULT_COMPARISON_CONFIG.rangePolicy,
});

export default resolveComparisonConfig;
