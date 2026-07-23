import RAQIV2EligibilityChecker from '../types/RAQIV2EligibilityChecker';
import type { RAQIV2PageEligibilityConfig } from '../types/RAQIV2PageConfig';
import { useAnalyticsExperiencePermissions } from './useAnalyticsPermissions';
import { useUniverseResource } from './useChartResourceProvider';

const useIsPageContentEligible = (eligibility?: RAQIV2PageEligibilityConfig): boolean => {
  const { id: universeId } = useUniverseResource();
  const {
    experienceHasPerformanceMonitoringAccess,
    userCanManageAnalyticsAlertForUniverse,
    userCanViewAnalyticsForUniverse,
  } = useAnalyticsExperiencePermissions(universeId);
  if (!eligibility) {
    return true;
  }
  const { checkerType } = eligibility;
  switch (checkerType) {
    case RAQIV2EligibilityChecker.PerformanceMonitoring:
      return experienceHasPerformanceMonitoringAccess;
    case RAQIV2EligibilityChecker.ManageAlerts:
      return userCanManageAnalyticsAlertForUniverse;
    case RAQIV2EligibilityChecker.ViewAnalytics:
      return userCanViewAnalyticsForUniverse;
    default: {
      const exhaustiveCheck: never = checkerType;
      throw new Error(`Unhandled checker type: ${String(exhaustiveCheck)}`);
    }
  }
};
export default useIsPageContentEligible;
