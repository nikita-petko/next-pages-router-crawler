import { useCallback, useMemo } from 'react';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import type {
  InternalV2DraftUniversesUniverseIdConditionPutRequest,
  ValidConditionRule,
} from '../api/validTypes';
import { useCreatorConfigsClient } from '../CreatorConfigsClientProvider';
import useConfigsMutation, { type MutateOptions } from './useConfigsMutation';

export const useUpdateConditionMutation = () => {
  const { id: universeId } = useUniverseResource();
  const client = useCreatorConfigsClient();

  const { mutate, data, error, isPending, clearError } = useConfigsMutation(
    (variables: {
      conditionName: string;
      newConditionName?: string;
      rule?: ValidConditionRule;
    }) => {
      if (!universeId) {
        throw new Error('Universe ID is required to update a condition');
      }
      return client.v2DraftUniversesUniverseIdConditionPut({
        universeId,
        updateConditionData: {
          conditionName: variables.conditionName,
          newConditionName: variables.newConditionName,
          rule: variables.rule,
        },
      });
    },
  );
  const updateCondition = useCallback(
    (
      conditionName: string,
      newConditionName?: string,
      rule?: ValidConditionRule,
      options?: MutateOptions,
    ) => mutate({ conditionName, newConditionName, rule }, options),
    [mutate],
  );

  return useMemo(
    () => ({
      updateCondition,
      data,
      updateError: error,
      isUpdating: isPending,
      clearUpdateError: clearError,
    }),
    [updateCondition, data, error, isPending, clearError],
  );
};

export const useCreateConditionMutation = () => {
  const client = useCreatorConfigsClient();

  const { mutate, data, error, isPending, clearError } = useConfigsMutation(
    (variables: InternalV2DraftUniversesUniverseIdConditionPutRequest) =>
      client.v2DraftUniversesUniverseIdConditionPut(variables),
  );

  return useMemo(
    () => ({
      createCondition: mutate,
      data,
      createError: error,
      isCreating: isPending,
      clearCreateError: clearError,
    }),
    [mutate, data, error, isPending, clearError],
  );
};

export const useDeleteConditionMutation = () => {
  const { id: universeId } = useUniverseResource();
  const client = useCreatorConfigsClient();
  const { mutate, data, error, isPending } = useConfigsMutation(
    (variables: { conditionName: string }) => {
      if (!universeId) {
        throw new Error('Universe ID is required to delete a condition');
      }
      return client.v2DraftUniversesUniverseIdConditionPut({
        universeId,
        updateConditionData: {
          conditionName: variables.conditionName,
          isDeleted: true,
        },
      });
    },
  );
  const deleteCondition = useCallback(
    (conditionName: string, options?: MutateOptions) => mutate({ conditionName }, options),
    [mutate],
  );

  return useMemo(
    () => ({
      deleteCondition,
      data,
      deleteError: error,
      isDeleting: isPending,
    }),
    [deleteCondition, data, error, isPending],
  );
};
