import type { ScopeInfo } from '@modules/clients/cloudAuthentication';
import { WildcardTargetPart } from '../constants/openCloudConstants';

const UniverseTargetPart = 'universe';
const CreatorTargetPart = 'creator';

/**
 * Utility function to determine if wildcard warning should be displayed
 *
 * @param validScopeInfos - Current scope infos from the form
 * @param getScopeTypeProductName - Function to get product name from scope type
 * @param getNthSharedTargetPart - Function to get target part name by index
 * @returns true if wildcard warning should be displayed
 */
export default function shouldShowWildcardWarning(
  validScopeInfos: ScopeInfo[],
  getScopeTypeProductName: (scopeType: string) => string,
  getNthSharedTargetPart: (productName: string, index: number) => string,
): boolean {
  // Always show warning if there are any universe wildcard scopes
  return validScopeInfos.some((validScope) => {
    const scopeTypeName = validScope.scopeType;
    if (!scopeTypeName) {
      return false;
    }

    const productName = getScopeTypeProductName(scopeTypeName);
    const firstTargetPartName = getNthSharedTargetPart(productName, 0);

    const hasUniverseOrCreatorTargetPart =
      firstTargetPartName === UniverseTargetPart || firstTargetPartName === CreatorTargetPart;
    const hasWildcardInTargetParts = validScope.targetParts?.includes(WildcardTargetPart) || false;

    return hasUniverseOrCreatorTargetPart && hasWildcardInTargetParts;
  });
}
