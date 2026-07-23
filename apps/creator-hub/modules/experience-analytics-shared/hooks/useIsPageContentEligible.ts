import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import RAQIV2EligibilityChecker from '../types/RAQIV2EligibilityChecker';
import { RAQIV2PageEligibilityConfig } from '../types/RAQIV2PageConfig';

const useIsPageContentEligible = (eligibility?: RAQIV2PageEligibilityConfig): boolean => {
  const { experienceHasPerformanceMonitoringAccess } = useFeatureFlagsForNamespace(
    'experienceHasPerformanceMonitoringAccess',
    FeatureFlagNamespace.Analytics,
  );
  if (!eligibility) {
    return true;
  }
  const { checkerType } = eligibility;
  switch (checkerType) {
    case RAQIV2EligibilityChecker.PerformanceMonitoring:
      return experienceHasPerformanceMonitoringAccess;
    default: {
      const exhaustiveCheck: never = checkerType;
      throw new Error(`Unhandled checker type: ${exhaustiveCheck}`);
    }
  }
};
export default useIsPageContentEligible;
