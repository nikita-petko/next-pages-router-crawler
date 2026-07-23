import { useCallback } from 'react';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { getResponseFromError } from '@modules/clients/utils';
import type {
  TGetAffiliateLinksProps,
  TCreateAffiliateLinkProps,
  TGetGroupAffiliateLinksProps,
  TEditAffiliateLinkProps,
} from './affiliateLinksRequests';
import {
  getAffiliateLinks,
  createAffiliateLink,
  getGroupAffiliateLinks,
  createGroupAffiliateLink,
  editAffiliateLink,
  editGroupAffiliateLink,
  getUniverseEligibility,
} from './affiliateLinksRequests';

export function useGetAffiliateLinks(
  requestProps: TGetAffiliateLinksProps | TGetGroupAffiliateLinksProps,
) {
  const queryFn = useCallback(() => {
    if ('groupId' in requestProps && requestProps.groupId) {
      return getGroupAffiliateLinks(requestProps);
    }
    return getAffiliateLinks(requestProps);
  }, [requestProps]);

  return useQuery({
    queryKey: ['affiliateLinks', requestProps],
    placeholderData: keepPreviousData,
    queryFn,
  });
}

export function useCreateAffiliateLink(groupId?: number) {
  return useMutation({
    mutationFn: async (requestProps: TCreateAffiliateLinkProps) => {
      try {
        if (groupId) {
          return await createGroupAffiliateLink({ groupId, ...requestProps });
        }
        return await createAffiliateLink(requestProps);
      } catch (e) {
        const response = getResponseFromError(e);
        throw await response?.json();
      }
    },
  });
}

export function useEditAffiliateLink(groupId?: number) {
  return useMutation({
    mutationFn: async (requestProps: TEditAffiliateLinkProps) => {
      try {
        if (groupId) {
          return await editGroupAffiliateLink({ groupId, ...requestProps });
        }
        return await editAffiliateLink(requestProps);
      } catch (e) {
        const response = getResponseFromError(e);
        throw await response?.json();
      }
    },
  });
}

// Cache for universe eligibility to avoid repeated API calls
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
type CacheEntry = { ts: number; isEligible: Promise<boolean | undefined> };
const eligibilityCache = new Map<number, CacheEntry>();

// Cached function to get universe eligibility with TTL
export const getCachedUniverseEligibility = async (
  universeId: number,
): Promise<boolean | undefined> => {
  const now = Date.now();
  const cached = eligibilityCache.get(universeId);

  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return cached.isEligible;
  }

  const isEligible = getUniverseEligibility(universeId)
    .then((response) => response.isEligible)
    .catch(() => undefined); // Default to undefined if API fails

  eligibilityCache.set(universeId, { ts: now, isEligible });
  return isEligible;
};
