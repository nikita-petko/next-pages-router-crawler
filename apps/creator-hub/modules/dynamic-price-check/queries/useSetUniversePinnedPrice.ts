import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type {
  ErrorResponse,
  SetUniversePinnedPriceRequest,
  UniversePinnedPrice,
} from '@rbx/client-price-configuration-api/v1';
import priceConfigurationApi, {
  type UniversePinningTargetStatus,
} from '@modules/clients/priceConfigurationApi';
import {
  isPriceConfigurationApiResponseError,
  parsePriceConfigurationErrorResponse,
} from '../utils/priceConfigurationErrorUtils';
import { getUniversePinnedPriceQueryKey } from './constants';

// Only need to send the following target status + properties with the request body
type PinnedPriceVariables =
  | { targetStatus: typeof UniversePinningTargetStatus.Disabling }
  | ({
      targetStatus: typeof UniversePinningTargetStatus.Enabling;
      userIds: NonNullable<SetUniversePinnedPriceRequest['userIds']>;
    } & Required<SetUniversePinnedPriceRequest>);

type Options = Omit<
  UseMutationOptions<UniversePinnedPrice, Error, PinnedPriceVariables>,
  'mutationFn'
> & {
  /** Handler for API error responses. Return true to skip the default `onError` callback. */
  onErrorResponse?: (
    error: ErrorResponse,
    variables: PinnedPriceVariables,
    context: unknown,
  ) => (boolean | void) | Promise<boolean | void>;
};

export function useSetUniversePinnedPrice(
  universeId: number,
  { onSettled, onError, onErrorResponse, ...options }: Options = {},
) {
  const { mutateAsync } = useMutation({
    mutationFn: (variables) => {
      const request: SetUniversePinnedPriceRequest = {
        targetStatus: variables.targetStatus,
      };
      if (variables.targetStatus === 'Enabling') {
        request.userIds = variables.userIds;
        request.price = variables.price;
      }
      return priceConfigurationApi.setUniversePinnedPrice(universeId, request);
    },
    onSettled: (data, error, variables, onSettledResult, context) => {
      void context.client.invalidateQueries({
        queryKey: getUniversePinnedPriceQueryKey(universeId),
      });

      onSettled?.(data, error, variables, onSettledResult, context);
    },
    onError: async (error, variables, onErrorResult, context) => {
      if (onErrorResponse && isPriceConfigurationApiResponseError(error)) {
        const response = await parsePriceConfigurationErrorResponse(error);
        if (response) {
          // Call the onErrorResponse callback if provided
          const skipOnError = onErrorResponse?.(response, variables, context);
          if (skipOnError) {
            return;
          }
        }
      }

      onError?.(error, variables, onErrorResult, context);
    },
    ...options,
  });

  return { setUniversePinnedPrice: mutateAsync } as const;
}
