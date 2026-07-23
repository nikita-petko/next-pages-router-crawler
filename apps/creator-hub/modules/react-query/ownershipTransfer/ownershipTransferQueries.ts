import { useQuery, useMutation, useQueryClient, skipToken } from '@tanstack/react-query';
import type { TransferCreator, TransferResource } from '@modules/clients/ownershipTransferApi';
import ownershipTransferClient, {
  TransferResourceType,
} from '@modules/clients/ownershipTransferApi';

type TQueryOptions = {
  refetchOnWindowFocus: boolean;
};

const getOwnershipTransferQueryKey = (
  method: string,
  resourceType: TransferResourceType,
  resourceId: number,
): unknown[] => {
  return ['ownershipTransfer', method, resourceType, resourceId];
};

const GET_LATEST_TRANSFER_KEY = 'getLatestTransfer';
const useGetLatestTransfer = (
  resourceType: TransferResourceType,
  resourceId: number | undefined,
) => {
  return useQuery({
    queryKey: getOwnershipTransferQueryKey(GET_LATEST_TRANSFER_KEY, resourceType, resourceId ?? 0),
    queryFn:
      !resourceType || !resourceId
        ? skipToken
        : async () => {
            const response = await ownershipTransferClient.getLatestTransfer({
              resourceType,
              resourceId,
            });
            return response;
          },
  });
};

const useGetInvalidTargets = (resourceType: TransferResourceType, resourceId: number) => {
  return useQuery({
    queryKey: getOwnershipTransferQueryKey('getInvalidTargets', resourceType, resourceId),
    enabled: !!resourceType && !!resourceId,
    queryFn: async () => {
      const resource = { resourceType, resourceId };
      const response = await ownershipTransferClient.listInvalidTargets(resource);
      return response.invalidTargets;
    },
  });
};

type TUseCreateTransferRequest = {
  currentCreator: TransferCreator;
  targetCreator: TransferCreator;
  resource: TransferResource;
};

const useCreateTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ currentCreator, targetCreator, resource }: TUseCreateTransferRequest) => {
      return ownershipTransferClient.createTransfer(currentCreator, targetCreator, resource);
    },
    onSuccess: (_, variables) => {
      const {
        resource: { resourceType, resourceId },
      } = variables;
      queryClient.invalidateQueries({
        queryKey: getOwnershipTransferQueryKey(GET_LATEST_TRANSFER_KEY, resourceType, resourceId),
      });
    },
  });
};

type TUseAcceptTransferRequest = TransferResource;

const useAcceptTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ resourceId, resourceType }: TUseAcceptTransferRequest) => {
      return ownershipTransferClient.acceptLatestTransfer({ resourceType, resourceId });
    },
    onSettled: (_, _err, variables) => {
      queryClient.refetchQueries({
        queryKey: getOwnershipTransferQueryKey(
          GET_LATEST_TRANSFER_KEY,
          variables.resourceType,
          variables.resourceId,
        ),
      });
    },
  });
};

const useRejectTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resourceId, resourceType }: TUseAcceptTransferRequest) => {
      return ownershipTransferClient.rejectLatestTransfer({ resourceType, resourceId });
    },
    onSettled: (_, _err, variables) => {
      queryClient.refetchQueries({
        queryKey: getOwnershipTransferQueryKey(
          GET_LATEST_TRANSFER_KEY,
          variables.resourceType,
          variables.resourceId,
        ),
        type: 'all',
      });
    },
  });
};

const useTransferResourceEligibility = (
  resourceType: TransferResourceType,
  resourceId: number,
  queryOptions?: TQueryOptions,
) => {
  return useQuery({
    enabled: resourceType === TransferResourceType.Group && !!resourceId,
    queryKey: getOwnershipTransferQueryKey('eligibility', resourceType, resourceId),
    queryFn: async () => {
      if (resourceType === 'Group') {
        return ownershipTransferClient.getGroupEligibility(resourceId);
      }
      return null;
    },
    refetchOnWindowFocus: queryOptions?.refetchOnWindowFocus,
  });
};

const useCancelTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resource: TUseAcceptTransferRequest) => {
      return ownershipTransferClient.cancelLatestTransfer(resource);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: getOwnershipTransferQueryKey(
          GET_LATEST_TRANSFER_KEY,
          variables.resourceType,
          variables.resourceId,
        ),
        refetchType: 'all',
      });
    },
  });
};

const useAcknowledgeExpiredTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (resource: TUseAcceptTransferRequest) => {
      return ownershipTransferClient.acknowledgeTransfer(resource);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: getOwnershipTransferQueryKey(
          GET_LATEST_TRANSFER_KEY,
          variables.resourceType,
          variables.resourceId,
        ),
        refetchType: 'all',
      });
    },
  });
};

export {
  useGetLatestTransfer,
  useGetInvalidTargets,
  useCreateTransfer,
  useAcceptTransfer,
  useRejectTransfer,
  useTransferResourceEligibility,
  useCancelTransfer,
  useAcknowledgeExpiredTransfer,
};
