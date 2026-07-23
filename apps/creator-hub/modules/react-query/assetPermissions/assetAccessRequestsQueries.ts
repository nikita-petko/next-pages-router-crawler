import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListAssetPermissionRequestsResponse } from '@modules/clients/assetPermissions';

export function getListAssetPermissionRequestsKey(assetId: number) {
  return ['assetAccessRequestsApi_listAssetPermissionRequests', assetId] as const;
}

// TODO: Replace stubs with real API calls once @rbx/client-asset-permissions-api is regenerated
//       with the access request endpoints. The UI is intentionally shipped as a skeleton until
//       the backend is available.
export function useListAssetPermissionRequests(assetId: number, enabled = true) {
  return useQuery({
    queryKey: getListAssetPermissionRequestsKey(assetId),
    queryFn: (): Promise<ListAssetPermissionRequestsResponse> => Promise.resolve({ requests: [] }),
    enabled,
  });
}

export function useApproveAssetPermissionRequest(assetId: number) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (): Promise<void> => Promise.resolve(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getListAssetPermissionRequestsKey(assetId) });
      void queryClient.invalidateQueries({ queryKey: listReceivedRequestsQueryKey() });
    },
  });
}

export function useRejectAssetPermissionRequest(assetId: number) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (): Promise<void> => Promise.resolve(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getListAssetPermissionRequestsKey(assetId) });
      void queryClient.invalidateQueries({ queryKey: listReceivedRequestsQueryKey() });
    },
  });
}

export function listReceivedRequestsQueryKey() {
  return ['assetAccessRequests_listReceived'] as const;
}

export function useListAllAssetPermissionRequests(enabled: boolean) {
  return useQuery({
    queryKey: listReceivedRequestsQueryKey(),
    queryFn: (): Promise<ListAssetPermissionRequestsResponse> => Promise.resolve({ requests: [] }),
    enabled,
  });
}
