import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { captureException } from '@sentry/nextjs';
import { contentLicensingClient } from '@modules/clients';
import { listAll } from '@modules/clients/utils';
import { CancellationReason, ListingStatus } from '@rbx/clients/contentLicensingApi/v1';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import {
  MATCHES_QUERY_KEY,
  AGREEMENTS_QUERY_KEY,
  GET_LICENSE_BY_IP_FAMILY_ID_QUERY_KEY,
} from '../../queryKeys';

const DEFAULT_PAGE_SIZE = 100;

export const useLicenseByIpFamilyIdQuery = (ipFamilyId: string) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  if (!accountId) {
    throw new Error('Missing account ID');
  }

  return useQuery({
    queryKey: GET_LICENSE_BY_IP_FAMILY_ID_QUERY_KEY(ipFamilyId),
    queryFn: async () => {
      /*
        Since we don't have an direct API for this, we'll need to fetch all ip listings,
        filter them by ip family id, and then fetch all licenses for each ip listing.

        Maybe in the future we can get `getLicenseByIpFamilyId` API.
      */

      const ipListings = await listAll({
        api: (pageToken) =>
          contentLicensingClient.listIpListingsByAccount(
            accountId,
            DEFAULT_PAGE_SIZE, // pageSize
            pageToken,
          ),
        getItems: (response) => response.listings || [],
        getPageToken: (response) => response.nextPageToken ?? undefined,
      });

      const matchingAndApprovedIpListings = ipListings.filter(
        (ipListing) =>
          ipListing.ipFamilyId === ipFamilyId && ipListing.status === ListingStatus.Approved,
      );

      if (!matchingAndApprovedIpListings || matchingAndApprovedIpListings.length === 0) {
        return [];
      }

      const licenseResults = await Promise.all(
        matchingAndApprovedIpListings.map((ipListing) => {
          return listAll({
            api: (cursor) =>
              contentLicensingClient.listLicensesByIpListing(
                accountId,
                ipListing.id!,
                DEFAULT_PAGE_SIZE, // pageSize
                cursor, // pageToken
              ),
            getItems: (response) => response.licenses || [],
            getPageToken: (response) => response.nextPageToken ?? undefined,
          });
        }),
      );

      return licenseResults.flatMap((result) => result || []);
    },
    enabled: !!accountId,
  });
};

export interface PromoteAgreementCandidateParams {
  candidateId: string;
  licenseId: string;
  enableMonetization: boolean;
}

export const usePromoteAgreementCandidateMutation = () => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();

  return useMutation({
    mutationFn: async ({
      candidateId,
      licenseId,
      enableMonetization,
    }: PromoteAgreementCandidateParams) => {
      const accountId = account?.id;
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      return contentLicensingClient.promoteAgreementCandidate(
        accountId,
        candidateId,
        licenseId,
        enableMonetization,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATCHES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY });
    },
    onError: (error) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'promoteAgreementCandidate' },
        extra: { candidateId: account?.id },
      });
    },
  });
};

export interface RejectLicenseApplicationParams {
  agreementId: string;
  feedback?: string;
}

export const useRejectLicenseApplicationMutation = () => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async ({ agreementId, feedback }: RejectLicenseApplicationParams) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      return contentLicensingClient.rejectLicenseApplication(accountId, agreementId, feedback);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY });
    },
    onError: (error, agreementId) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'rejectLicenseApplication' },
        extra: { agreementId, accountId },
      });
    },
  });
};

export const useApproveLicenseApplicationMutation = () => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async (agreementId: string) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      return contentLicensingClient.approveLicenseApplication(accountId, agreementId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY });
    },
    onError: (error, agreementId) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'approveLicenseApplication' },
        extra: { agreementId, accountId },
      });
    },
  });
};

export const useAcceptAgreementDisputeMutation = () => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async (agreementId: string) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      return contentLicensingClient.acceptAgreementDispute(accountId, agreementId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY });
    },
    onError: (error, agreementId) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'acceptAgreementDispute' },
        extra: { agreementId, accountId },
      });
    },
  });
};

export const useRejectAgreementDisputeMutation = () => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async (agreementId: string) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      return contentLicensingClient.rejectAgreementDispute(accountId, agreementId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY });
    },
    onError: (error, agreementId) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'rejectAgreementDispute' },
        extra: { agreementId, accountId },
      });
    },
  });
};

export const useArchiveUnsuccessfulOfferMutation = () => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async (agreementId: string) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      return contentLicensingClient.archiveUnsuccessfulOffer(accountId, agreementId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY });
    },
    onError: (error, agreementId) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'archiveUnsuccessfulOffer' },
        extra: { agreementId, accountId },
      });
    },
  });
};

export const useEnableAgreementMonetizationMutation = () => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async (agreementId: string) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      return contentLicensingClient.enableMonetization(accountId, agreementId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY });
    },
    onError: (error, agreementId) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'enableAgreementMonetization' },
        extra: { agreementId, accountId },
      });
    },
  });
};

export interface RequestLicenseUsageChangesParams {
  agreementId: string;
  feedback: string;
}

export const useRequestLicenseUsageChangesMutation = () => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async ({ agreementId, feedback }: RequestLicenseUsageChangesParams) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      return contentLicensingClient.initiateChangeRequest(accountId, agreementId, feedback);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY });
    },
    onError: (error, agreementId, feedback) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'approveLicenseApplication' },
        extra: { agreementId, accountId, feedback },
      });
    },
  });
};

export interface CancelAcceptedAgreementMutationParams {
  agreementId: string;
  reason: CancellationReason;
}

/**
 * Allows a Creator to terminate an agreement with an Inquired or Accepted status.
 */
export const useCreatorCancelAgreementMutation = () => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async ({ agreementId, reason }: CancelAcceptedAgreementMutationParams) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      return contentLicensingClient.cancelAgreement(accountId, agreementId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY });
    },
    onError: (error, agreementId) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'creatorCancelAcceptedAgreement' },
        extra: { agreementId, accountId },
      });
    },
  });
};
