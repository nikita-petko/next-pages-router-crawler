import experienceStoreClient from '@modules/clients/experienceStore';
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import type {
  ExperienceStoreStateResponse,
  UniverseEdpStateType,
} from '@modules/clients/experienceStore';
import { DEFAULT_RETRIES, experienceStoreKeys } from './constants';

type MutationVariables =
  | { universeId: number; universeStorePageState: UniverseEdpStateType; testModeState?: never }
  | { universeId: number; universeStorePageState?: never; testModeState: UniverseEdpStateType };

type Options = Omit<
  UseMutationOptions<ExperienceStoreStateResponse, Error, MutationVariables>,
  'mutationFn' | 'mutationKey'
>;

export function useSetExperienceStoreState(options: Options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: MutationVariables) =>
      experienceStoreClient.setUniverseReleaseState(variables),
    retry: DEFAULT_RETRIES,
    ...options,
    onError: (error, variables, onErrorResult, context) => {
      queryClient.invalidateQueries({
        queryKey: experienceStoreKeys.experienceStoreState(variables.universeId),
      });

      options.onError?.(error, variables, onErrorResult, context);
    },
    onSuccess: (data, variables, onSuccessResult, context) => {
      queryClient.setQueryData(
        experienceStoreKeys.experienceStoreState(variables.universeId),
        data,
      );

      options.onSuccess?.(data, variables, onSuccessResult, context);
    },
  });
}

export default useSetExperienceStoreState;
