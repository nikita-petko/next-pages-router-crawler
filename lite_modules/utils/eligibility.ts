import { EligibilityStatus, GetEligibilityResponse } from '@type/eligibility';
import { EmptyRequestStateType } from '@utils/zustandUtils';

export interface EligibilityContext {
  response: EmptyRequestStateType<GetEligibilityResponse>;
  universeId: number;
}

// Returns the objective eligibility map for `universeId` only when we have a settled,
// matching response (no in-flight refetch, no error). Returns `undefined` otherwise so
// callers can distinguish "we know nothing yet" from "we know this universe is eligible
// for X". Single source of truth used by both the objective renderer and the goal-
// defaulting effect.
export const SelectObjectiveEligibilityForUniverse = (
  eligibilityContext: EligibilityContext | undefined,
  universeId: number | undefined,
): Record<number, EligibilityStatus> | undefined => {
  if (!universeId || eligibilityContext?.universeId !== universeId) {
    return undefined;
  }
  const request = eligibilityContext.response;
  if (!request || request.isLoading || request.isError) {
    return undefined;
  }
  return request.data?.campaignEligibility.objectiveEligibility;
};

// True only when we have a settled, matching response that reports the given universe
// as ineligible. Loading, error, and stale (different-universe) responses all return
// false so we never block on unknown state.
export const SelectIsUniverseIneligible = (
  eligibilityContext: EligibilityContext | undefined,
  universeId: number | undefined,
): boolean => {
  if (!universeId || universeId <= 0 || eligibilityContext?.universeId !== universeId) {
    return false;
  }
  const request = eligibilityContext.response;
  if (!request || request.isLoading || request.isError) {
    return false;
  }
  return request.data?.universeEligibility?.eligible === false;
};
