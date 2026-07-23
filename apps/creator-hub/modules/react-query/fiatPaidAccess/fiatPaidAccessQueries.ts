import type { UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  RobloxPaidAccessFiatPaidAccessServiceV1GetConfiguredPricesResponse,
  RobloxPaidAccessFiatPaidAccessServiceV1GetPurchasesByProductResponse,
  RobloxPaidAccessFiatPaidAccessServiceV1GetProductsBySellerResponse,
} from '@rbx/client-fiat-paid-access-service/v1';
import {
  getPayoutAccountStatus,
  createPayoutAccount,
  getConfiguredPrices,
  getPurchasesByProduct,
  getProductsBySeller,
  deactivateProduct,
} from './fiatPaidAccessRequests';

export function useGetPayoutAccountStatus() {
  return useMutation({
    mutationFn: async () => {
      return getPayoutAccountStatus();
    },
  });
}

export function useCreatePayoutAccount() {
  return useMutation({
    mutationFn: async (data: { userId: number; fullName: string }) => {
      return createPayoutAccount(data.userId, data.fullName);
    },
  });
}

export function useDeactivateProduct() {
  return useMutation({
    mutationFn: async (data: { rootPlaceId: number }) => {
      return deactivateProduct(data.rootPlaceId);
    },
  });
}

export function useGetConfiguredPrice() {
  return useQuery<RobloxPaidAccessFiatPaidAccessServiceV1GetConfiguredPricesResponse>({
    queryKey: ['accessSettingsConfiguredPrices'],
    queryFn: async () => {
      const res = await getConfiguredPrices();
      return res;
    },
    staleTime: Infinity,
    refetchOnMount: true,
  });
}

export function useGetPurchasesByProduct(
  rootPlaceId: number,
  limit: number,
  fetchBackwardsFromCursor: boolean,
  startTime?: Date,
  endTime?: Date,
  cursor?: string,
): UseQueryResult<RobloxPaidAccessFiatPaidAccessServiceV1GetPurchasesByProductResponse> {
  return useQuery({
    queryKey: [
      'fiatPaidAccess',
      rootPlaceId,
      limit,
      fetchBackwardsFromCursor,
      startTime,
      endTime,
      cursor,
    ],
    queryFn: async () => {
      const result = await getPurchasesByProduct(
        rootPlaceId,
        limit,
        fetchBackwardsFromCursor,
        startTime,
        endTime,
        cursor,
      );
      return result;
    },
  });
}

export function useGetProductsBySeller(
  limit: number,
  groupId?: number,
  cursor?: string,
  fetchBackwardsFromCursor?: boolean,
): UseQueryResult<RobloxPaidAccessFiatPaidAccessServiceV1GetProductsBySellerResponse> {
  return useQuery({
    queryKey: ['fiatPaidAccess', limit, groupId, cursor, fetchBackwardsFromCursor],
    queryFn: async () => {
      const result = await getProductsBySeller(limit, groupId, cursor, fetchBackwardsFromCursor);
      return result;
    },
  });
}
