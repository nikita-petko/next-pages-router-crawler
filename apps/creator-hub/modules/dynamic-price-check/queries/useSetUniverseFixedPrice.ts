import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import type {
  ErrorResponse,
  SetUniverseFixedPriceRequest,
  SetUniverseFixedPriceResponse,
  UniverseFixedPriceStatus,
} from '@rbx/clients/priceConfigurationApi/v1';
import { getUniverseFixedPriceQueryKey } from './constants';
import {
  isPriceConfigurationApiResponseError,
  parsePriceConfigurationErrorResponse,
} from '../utils/priceConfigurationErrorUtils';

// Only need to send the following target status + properties with the request body
type FixedPriceVariables =
  | { targetStatus: typeof UniverseFixedPriceStatus.Disabling }
  | ({
      targetStatus: typeof UniverseFixedPriceStatus.Enabling;
      userIds: NonNullable<SetUniverseFixedPriceRequest['userIds']>;
    } & Required<SetUniverseFixedPriceRequest>);

type Options = Omit<
  UseMutationOptions<SetUniverseFixedPriceResponse, Error, FixedPriceVariables>,
  'mutationFn'
> & {
  /** Handler for API error responses. Return true to skip the default `onError` callback. */
  onErrorResponse?: (
    error: ErrorResponse,
    variables: FixedPriceVariables,
    context: unknown,
  ) => (boolean | void) | Promise<boolean | void>;
};

export default function useSetUniverseFixedPrice(
  universeId: number,
  { onSettled, onError, onErrorResponse, ...options }: Options = {},
) {
  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: (variables) => {
      const request: SetUniverseFixedPriceRequest = {
        targetStatus: variables.targetStatus,
      };
      if (variables.targetStatus === 'Enabling') {
        request.userIds = variables.userIds;
        request.fixedPrice = variables.fixedPrice;
      }
      return priceConfigurationApi.setUniverseFixedPrice(universeId, request);
    },
    onSettled: (data, error, variables, onSettledResult, context) => {
      queryClient.invalidateQueries({
        queryKey: getUniverseFixedPriceQueryKey(universeId),
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

  return { setUniverseFixedPrice: mutateAsync } as const;
}
