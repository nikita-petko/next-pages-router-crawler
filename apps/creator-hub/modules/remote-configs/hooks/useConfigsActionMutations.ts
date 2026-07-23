import { useMemo, useState } from 'react';
import type {
  InternalChangelogUniversesUniverseIdEntryChangelogEntryIdRestorePostRequest,
  InternalDraftUniversesUniverseIdCancelPostRequest,
  InternalDraftUniversesUniverseIdDeleteRequest,
  InternalV2DraftUniversesUniverseIdDeleteRequest,
  InternalDraftUniversesUniverseIdForcePostRequest,
  InternalDraftUniversesUniverseIdPostRequest,
  InternalV2DraftUniversesUniverseIdPostRequest,
  InternalDraftUniversesUniverseIdPublishPostRequest,
  InternalDraftUniversesUniverseIdPutRequest,
  InternalV2DraftUniversesUniverseIdPutRequest,
  InternalV2DraftUniversesUniverseIdRuleOrderingPutRequest,
} from '../api/validTypes';
import { useCreatorConfigsClient } from '../CreatorConfigsClientProvider';
import useConfigsMutation from './useConfigsMutation';

export const useUpdateConfigMutation = () => {
  const client = useCreatorConfigsClient();

  const { mutate, data, error, isPending, clearError } = useConfigsMutation(
    (variables: InternalDraftUniversesUniverseIdPutRequest) =>
      client
        .v1DraftUniversesUniverseIdPut(variables)
        .then(({ updateConfigResult }) => updateConfigResult),
  );

  return useMemo(
    () => ({
      updateConfig: mutate,
      data,
      updateError: error,
      isUpdating: isPending,
      clearUpdateError: clearError,
    }),
    [mutate, data, error, isPending, clearError],
  );
};

export const useUpdateConfigMutationV2 = () => {
  const client = useCreatorConfigsClient();

  const { mutate, data, error, isPending, clearError } = useConfigsMutation(
    (variables: InternalV2DraftUniversesUniverseIdPutRequest) =>
      client
        .v2DraftUniversesUniverseIdPut(variables)
        .then(({ updateConfigResult }) => updateConfigResult),
  );

  return useMemo(
    () => ({
      updateConfig: mutate,
      data,
      updateError: error,
      isUpdating: isPending,
      clearUpdateError: clearError,
    }),
    [mutate, data, error, isPending, clearError],
  );
};

export const useCreateConfigMutation = () => {
  const client = useCreatorConfigsClient();
  const [lastCreatedKey, setlastCreatedKey] = useState<string | null>(null);

  const { mutate, data, error, isPending, clearError } = useConfigsMutation(
    (variables: InternalDraftUniversesUniverseIdPostRequest) => {
      setlastCreatedKey(variables.createConfigurationData.entry.key);
      return client
        .v1DraftUniversesUniverseIdPost(variables)
        .then(({ createConfigResult }) => createConfigResult);
    },
  );

  return useMemo(
    () => ({
      createConfig: mutate,
      data,
      createError: error,
      isCreating: isPending,
      lastCreatedKey,
      clearCreateError: clearError,
    }),
    [mutate, data, error, lastCreatedKey, isPending, clearError],
  );
};

export const useCreateConfigMutationV2 = () => {
  const client = useCreatorConfigsClient();
  const [lastCreatedKey, setlastCreatedKey] = useState<string | null>(null);

  const { mutate, data, error, isPending, clearError } = useConfigsMutation(
    (variables: InternalV2DraftUniversesUniverseIdPostRequest) => {
      setlastCreatedKey(variables.createConfigurationData.entry.key);
      return client
        .v2DraftUniversesUniverseIdPost(variables)
        .then(({ createConfigResult }) => createConfigResult);
    },
  );

  return useMemo(
    () => ({
      createConfig: mutate,
      data,
      createError: error,
      isCreating: isPending,
      lastCreatedKey,
      clearCreateError: clearError,
    }),
    [mutate, data, error, lastCreatedKey, isPending, clearError],
  );
};

export const useDeleteConfigMutation = () => {
  const client = useCreatorConfigsClient();
  const { mutate, data, error, isPending } = useConfigsMutation(
    (variables: InternalDraftUniversesUniverseIdDeleteRequest) =>
      client
        .v1DraftUniversesUniverseIdDelete(variables)
        .then(({ discardStagedResult }) => discardStagedResult),
  );

  return useMemo(
    () => ({
      deleteConfig: mutate,
      data,
      deleteError: error,
      isDeleting: isPending,
    }),
    [mutate, data, error, isPending],
  );
};

export const useDeleteConfigMutationV2 = () => {
  const client = useCreatorConfigsClient();
  const { mutate, data, error, isPending } = useConfigsMutation(
    (variables: InternalV2DraftUniversesUniverseIdDeleteRequest) =>
      client
        .v2DraftUniversesUniverseIdDelete({
          ...variables,
          // If no discardStagedChangesV2Data is provided, we need to provide an empty object to avoid the API from throwing an error.
          discardStagedChangesV2Data: variables.discardStagedChangesV2Data ?? {
            entriesToDiscard: [],
          },
        })
        .then(({ discardStagedResult }) => discardStagedResult),
  );

  return useMemo(
    () => ({
      deleteConfig: mutate,
      data,
      deleteError: error,
      isDeleting: isPending,
    }),
    [mutate, data, error, isPending],
  );
};

export const useCancelPublishMutation = () => {
  const client = useCreatorConfigsClient();
  const { mutate, data, error, isPending } = useConfigsMutation(
    (variables: InternalDraftUniversesUniverseIdCancelPostRequest) =>
      client
        .v1DraftUniversesUniverseIdCancelPost(variables)
        .then(({ cancelPublishStagedResult }) => cancelPublishStagedResult),
  );

  return useMemo(
    () => ({
      cancelPublish: mutate,
      data,
      cancelPublishError: error,
      isCancellingPublish: isPending,
    }),
    [mutate, data, error, isPending],
  );
};

export const useForcePublishMutation = () => {
  const client = useCreatorConfigsClient();
  const { mutate, data, error, isPending } = useConfigsMutation(
    (variables: InternalDraftUniversesUniverseIdForcePostRequest) =>
      client
        .v1DraftUniversesUniverseIdForcePost(variables)
        .then(({ forcePublishStagedResult }) => forcePublishStagedResult),
  );

  return useMemo(
    () => ({
      forcePublish: mutate,
      data,
      forcePublishError: error,
      isForcePublishing: isPending,
    }),
    [mutate, data, error, isPending],
  );
};

export const usePublishMutation = () => {
  const client = useCreatorConfigsClient();
  const { mutate, data, error, isPending } = useConfigsMutation(
    (variables: InternalDraftUniversesUniverseIdPublishPostRequest) =>
      client
        .v1DraftUniversesUniverseIdPublishPost(variables)
        .then(({ publishStagedResult }) => publishStagedResult),
  );

  return useMemo(
    () => ({
      publish: mutate,
      data,
      publishError: error,
      isPublishing: isPending,
    }),
    [mutate, data, error, isPending],
  );
};

export const useUpdateRuleOrderingMutation = () => {
  const client = useCreatorConfigsClient();
  const { mutate, data, error, isPending, clearError } = useConfigsMutation(
    (variables: InternalV2DraftUniversesUniverseIdRuleOrderingPutRequest) =>
      client.v2DraftUniversesUniverseIdRuleOrderingPut(variables),
  );

  return useMemo(
    () => ({
      updateRuleOrdering: mutate,
      data,
      updateRuleOrderingError: error,
      isUpdatingRuleOrdering: isPending,
      clearUpdateRuleOrderingError: clearError,
    }),
    [mutate, data, error, isPending, clearError],
  );
};

export const useRestoreChangelogEntryMutation = () => {
  const client = useCreatorConfigsClient();
  const { mutate, data, error, isPending } = useConfigsMutation(
    (variables: InternalChangelogUniversesUniverseIdEntryChangelogEntryIdRestorePostRequest) =>
      client
        .v1ChangelogUniversesUniverseIdEntryChangelogEntryIdRestorePost(variables)
        .then(({ restoreChangelogEntryResult }) => restoreChangelogEntryResult),
  );

  return useMemo(
    () => ({
      restoreChangelogEntry: mutate,
      data,
      restoreChangelogEntryError: error,
      isRestoringChangelogEntry: isPending,
    }),
    [mutate, data, error, isPending],
  );
};
