import { useQuery } from '@tanstack/react-query';
import {
  getO18Eligibility,
  O18Eligibility,
  type EligibilityCriteria,
} from '@modules/clients/creatorDevexApi';

export type DevExO18EligibilityResult = {
  isLoading: boolean;
  isError: boolean;
  /** The API's `o18Eligibility` field, defaulting to `None` until loaded. */
  o18Eligibility: O18Eligibility;
  /** The API's `eligibilityCriteria` field. */
  eligibilityCriteria: EligibilityCriteria | null;
};

type UseDevExO18EligibilityStateOptions = {
  enabled?: boolean;
};

const STALE_TIME_MS = 5 * 60 * 1000;

const isValidUniverseId = (universeId: number) => Number.isFinite(universeId) && universeId > 0;

function useDevExO18EligibilityState(
  universeId: number,
  { enabled = true }: UseDevExO18EligibilityStateOptions = {},
): DevExO18EligibilityResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['devExO18Eligibility', universeId],
    queryFn: ({ signal }) => getO18Eligibility(universeId, { signal }),
    staleTime: STALE_TIME_MS,
    enabled: enabled && isValidUniverseId(universeId),
  });

  return {
    isLoading,
    isError,
    o18Eligibility: data?.o18Eligibility ?? O18Eligibility.None,
    eligibilityCriteria: data?.eligibilityCriteria ?? null,
  };
}

export default useDevExO18EligibilityState;
