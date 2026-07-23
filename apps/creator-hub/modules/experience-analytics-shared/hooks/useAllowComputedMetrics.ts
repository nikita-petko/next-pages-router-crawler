import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';

const useAllowComputedMetrics = (): boolean => {
  const { isExploreModeComputedMetricsEnabled, isExploreModeL7SmoothingEnabled, isFetched } =
    useFeatureFlagsForNamespace(
      ['isExploreModeComputedMetricsEnabled', 'isExploreModeL7SmoothingEnabled'],
      FeatureFlagNamespace.Analytics,
    );

  return isFetched && (isExploreModeComputedMetricsEnabled || isExploreModeL7SmoothingEnabled);
};

export default useAllowComputedMetrics;
