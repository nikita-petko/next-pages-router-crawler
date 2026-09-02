import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type {
  ErrorResponse,
  SetUniversePinnedLocationRequest,
} from '@rbx/client-price-configuration-api/v1';
import priceConfigurationApi, {
  type UniversePinningTargetStatus,
  type UniversePinnedLocation,
} from '@modules/clients/priceConfigurationApi';
import {
  isPriceConfigurationApiResponseError,
  parsePriceConfigurationErrorResponse,
} from '../utils/priceConfigurationErrorUtils';
import { getUniversePinnedLocationQueryKey } from './constants';

// Only need to send the following target status + properties with the request body
type PinnedLocationVariables =
  | { targetStatus: typeof UniversePinningTargetStatus.Disabling }
  | ({
      targetStatus: typeof UniversePinningTargetStatus.Enabling;
      userIds: NonNullable<SetUniversePinnedLocationRequest['userIds']>;
    } & Required<SetUniversePinnedLocationRequest>);

type Options = Omit<
  UseMutationOptions<UniversePinnedLocation, Error, PinnedLocationVariables>,
  'mutationFn'
> & {
  /** Handler for API error responses. Return true to skip the default `onError` callback. */
  onErrorResponse?: (
    error: ErrorResponse,
    variables: PinnedLocationVariables,
    context: unknown,
  ) => (boolean | void) | Promise<boolean | void>;
};

export function useSetUniversePinnedLocation(
  universeId: number,
  { onSettled, onError, onErrorResponse, ...options }: Options = {},
) {
  const { mutateAsync } = useMutation({
    mutationFn: (variables) => {
      const request: SetUniversePinnedLocationRequest = {
        targetStatus: variables.targetStatus,
      };

      if (variables.targetStatus === 'Enabling') {
        request.userIds = variables.userIds;
        request.countryIso2Code = variables.countryIso2Code;
      }
      return priceConfigurationApi.setUniversePinnedLocation(universeId, request);
    },
    onSettled: (data, error, variables, onSettledResult, context) => {
      void context.client.invalidateQueries({
        queryKey: getUniversePinnedLocationQueryKey(universeId),
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

  return { setUniversePinnedLocation: mutateAsync } as const;
}
