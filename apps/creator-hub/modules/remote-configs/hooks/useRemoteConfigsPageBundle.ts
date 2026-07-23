import { PublishingMetadata } from '@modules/clients/analytics/universeConfigs';
import { GenericChartState, logAnalyticsError } from '@modules/charts-generic';
import { useUniverseResource } from '@modules/experience-analytics-shared';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { getResponseFromError } from '@modules/clients/utils';
import { StatusCodes } from '@rbx/core';
import {
  ChangeRequestRequirements,
  ValidConditionRule,
  ValidConfigEntryDetail,
  ValidConfigEntryStaged,
  ValidConfigEntryValue,
  ValidRuleOrdering,
  ValidSortKey,
  ValidSortOrder,
} from '../api/validTypes';

import { useCreatorConfigsClient } from '../CreatorConfigsClientProvider';
import { useCreatorConfigsSubscriptions } from '../CreatorConfigsRealtimeClientProvider';
import { DeploymentStrategy, SortKey, SortOrder } from '../api/universeConfigsClientEnums';
import useOffsetBasedPaginationState from './useOffsetBasedPaginationState';
import { paginateEntries } from '../utils/configDataProcessing';
import { useLatestConfigurations } from './useLatestConfigurations';
import {
  useCancelPublishMutation,
  useDeleteConfigMutation,
  useDeleteConfigMutationV2,
  useForcePublishMutation,
  usePublishMutation,
  useUpdateConfigMutation,
  useUpdateConfigMutationV2,
  useUpdateRuleOrderingMutation,
} from './useConfigsActionMutations';
import { ConfigActionError } from './useConfigsMutation';
import { isConditionOrderDifferent } from '../utils/isConditionOrderDifferent';

export enum RemoteConfigTab {
  All = 'all',
  WithOverride = 'with_override',
  NoOverride = 'no_override',
}

const useRemoteConfigsPageBundle = ({
  withDraftHashValidation,
  initialPageSize = 10,
}: {
  /**
   * When true, the draft hash will be passed with all edit requests --
   * and the server should reject them if the given hash is stale
   */
  withDraftHashValidation: boolean;
  /** The initial page size for the table (currently for simulated client-side pagination) */
  initialPageSize?: number;
}) => {
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();
  const { isTargetingConfigsEnabled } = useFeatureFlagsForNamespace(
    ['isTargetingConfigsEnabled'],
    FeatureFlagNamespace.Analytics,
  );

  const [searchKey, setSearchKey] = useState<string>('');
  const handleSearchChange = useCallback((value: string) => {
    setSearchKey(value);
  }, []);

  const client = useCreatorConfigsClient();
  const readRequestParams = useMemo(() => ({ universeId }), [universeId]);
  const [configEntries, setConfigEntries] = useState<ValidConfigEntryDetail[]>([]);
  const [publishing, setPublishing] = useState<PublishingMetadata | undefined>();

  /** Staging/Draft Entries */
  const [draftHash, setDraftHash] = useState<string | undefined>(undefined);
  const isDraftHashRequiredButMissing: boolean = useMemo(
    () => !draftHash && withDraftHashValidation,
    [draftHash, withDraftHashValidation],
  );
  const changeRequestParams: ChangeRequestRequirements = useMemo(() => {
    return withDraftHashValidation ? { universeId, draftHash } : { universeId };
  }, [withDraftHashValidation, draftHash, universeId]);

  const [draftRequestState, setDraftRequestState] = useState<GenericChartState>({
    isDataLoading: true,
    isResponseFailed: false,
    isUserForbidden: false,
  });
  const [drafts, setDrafts] = useState<ValidConfigEntryStaged[]>([]);
  const [draftRuleOrdering, setDraftRuleOrdering] = useState<ValidRuleOrdering | undefined>(
    undefined,
  );
  const refreshDrafts = useCallback(() => {
    if (isUniverseLoading) return;

    setDraftRequestState({
      isDataLoading: true,
      isResponseFailed: false,
      isUserForbidden: false,
    });
    client
      .v1DraftUniversesUniverseIdGet(readRequestParams)
      .then((response) => {
        setDraftHash(response.draftHash);
        setDrafts(response.entries || []);
        setDraftRuleOrdering('ruleOrdering' in response ? response.ruleOrdering : undefined);
        setPublishing(response.publishingMetadata);
        setDraftRequestState({
          isDataLoading: false,
          isResponseFailed: false,
          isUserForbidden: false,
        });
      })
      .catch((error) => {
        const status = getResponseFromError(error)?.status;
        if (status === StatusCodes.NOT_FOUND) {
          setDrafts([]);
          setDraftRuleOrdering(undefined);
          setPublishing(undefined);
          setDraftRequestState({
            isDataLoading: false,
            isResponseFailed: false,
            isUserForbidden: false,
          });
        } else {
          logAnalyticsError(error);
          setDraftRuleOrdering(undefined);
          setDraftRequestState({
            isDataLoading: false,
            isResponseFailed: true,
            isUserForbidden: false,
          });
        }
      });
  }, [client, readRequestParams, isUniverseLoading]);
  useEffect(() => {
    refreshDrafts();
  }, [refreshDrafts]);
  const { subscribeToDraftUpdates, subscribeToConfigUpdates } = useCreatorConfigsSubscriptions();
  useEffect(() => {
    // We need to refresh the drafts whenever either drafts or configs are updated
    // since we subtract the drafts from the configs on client side for display
    if (isUniverseLoading) return () => {};
    const { unsubscribe: unsubscribeDraftUpdates } = subscribeToDraftUpdates(universeId, () => {
      refreshDrafts();
    });
    const { unsubscribe: unsubscribeConfigUpdates } = subscribeToConfigUpdates(universeId, () => {
      refreshDrafts();
    });
    return () => {
      unsubscribeDraftUpdates();
      unsubscribeConfigUpdates();
    };
  }, [
    universeId,
    subscribeToDraftUpdates,
    subscribeToConfigUpdates,
    refreshDrafts,
    isUniverseLoading,
  ]);

  /** Primary Table Entries and info from v1ConfigurationsUniversesUniverseIdLatestGet */
  const [sort, setSort] = useState<{ key: ValidSortKey; order: ValidSortOrder }>({
    key: SortKey.LastModifiedTime,
    order: SortOrder.Descending,
  });

  // Use the shared hook for fetching configurations
  const {
    entries: latestConfigEntries,
    rules,
    ruleOrdering,
    isLoading: isConfigsLoading,
    isError: isConfigsError,
    refetch: refetchConfigs,
  } = useLatestConfigurations({
    universeId,
    isUniverseLoading,
    searchKey,
    sortKey: sort.key,
    sortOrder: sort.order,
  });

  const [configRequestState, setConfigRequestState] = useState<GenericChartState>({
    isDataLoading: true,
    isResponseFailed: false,
    isUserForbidden: false,
  });
  const [total, setTotal] = useState<number>(0);
  const pagination = useOffsetBasedPaginationState({ total, initialPageSize });

  // Update local state when new data comes in
  useEffect(() => {
    setConfigRequestState({
      isDataLoading: isConfigsLoading,
      isResponseFailed: isConfigsError,
      isUserForbidden: false,
    });

    // Update entries and apply pagination
    // The shared hook already handles no-change responses by preserving existing data
    if (latestConfigEntries.length > 0 || (!isConfigsLoading && !isConfigsError)) {
      // We don't want to show drafts in the main table
      const filtered = latestConfigEntries.filter(
        (entry) =>
          !drafts.some((draft) => draft.overrideEntry.entry.key === entry.overrideEntry.entry.key),
      );
      const paginated = paginateEntries(filtered, pagination.pageSize, pagination.skip);
      setConfigEntries(paginated);
      setTotal(filtered.length);
    }
  }, [
    isConfigsLoading,
    isConfigsError,
    latestConfigEntries,
    pagination.pageSize,
    pagination.skip,
    drafts,
  ]);

  const refreshConfigs = useCallback(() => {
    refetchConfigs();
  }, [refetchConfigs]);

  const refresh = useCallback(() => {
    refreshConfigs();
    refreshDrafts();
  }, [refreshConfigs, refreshDrafts]);

  const { deleteConfig: deleteConfigV1 } = useDeleteConfigMutation();
  const { deleteConfig: deleteConfigV2 } = useDeleteConfigMutationV2();
  const deleteConfig = useMemo(() => {
    return isTargetingConfigsEnabled ? deleteConfigV2 : deleteConfigV1;
  }, [isTargetingConfigsEnabled, deleteConfigV1, deleteConfigV2]);
  const discardStagedChanges = useCallback(() => {
    if (isUniverseLoading) return;
    if (isDraftHashRequiredButMissing) {
      logAnalyticsError('No draft hash to discard');
      return;
    }
    deleteConfig(changeRequestParams, {
      onSuccess: () => {
        refresh();
      },
    });
  }, [
    isUniverseLoading,
    isDraftHashRequiredButMissing,
    deleteConfig,
    changeRequestParams,
    refresh,
  ]);
  const discardDraft = useCallback(
    (key: string) => {
      if (isUniverseLoading) return;
      if (isDraftHashRequiredButMissing) {
        logAnalyticsError('No draft hash to delete draft');
        return;
      }

      deleteConfig(
        { ...changeRequestParams, keysToDiscard: [key] },
        {
          onSuccess: () => {
            refresh();
          },
        },
      );
    },
    [isUniverseLoading, isDraftHashRequiredButMissing, deleteConfig, changeRequestParams, refresh],
  );

  const { cancelPublish: givenCancelPublish } = useCancelPublishMutation();
  const cancelPublish = useCallback(() => {
    if (isUniverseLoading) return;
    if (isDraftHashRequiredButMissing) {
      logAnalyticsError('No draft hash to cancel publish');
      return;
    }
    givenCancelPublish(changeRequestParams, { onSuccess: refresh });
  }, [
    isUniverseLoading,
    isDraftHashRequiredButMissing,
    givenCancelPublish,
    changeRequestParams,
    refresh,
  ]);

  const { forcePublish: givenForcePublish } = useForcePublishMutation();
  const forcePublish = useCallback(() => {
    if (isUniverseLoading) return;
    if (isDraftHashRequiredButMissing) {
      logAnalyticsError('No draft hash to force publish');
      return;
    }
    givenForcePublish(changeRequestParams, { onSuccess: refresh });
  }, [
    isUniverseLoading,
    isDraftHashRequiredButMissing,
    givenForcePublish,
    changeRequestParams,
    refresh,
  ]);

  const hasRuleOrderingDraftChanges = useMemo(() => {
    if (!isTargetingConfigsEnabled) {
      return false;
    }
    return isConditionOrderDifferent(
      ruleOrdering?.conditionOrder,
      draftRuleOrdering?.conditionOrder,
    );
  }, [draftRuleOrdering?.conditionOrder, isTargetingConfigsEnabled, ruleOrdering?.conditionOrder]);

  const isPublishing = !!publishing;
  const { publish: givenPublish } = usePublishMutation();
  const publish = useCallback(
    ({
      message,
      deploymentStrategy,
      // for publish, we pass through "extra" onSuccess and onError slots
      // which are needed for presenting errors and clearing the dialog in creator-hub
      onSuccess,
      onError,
    }: {
      message: string;
      deploymentStrategy: DeploymentStrategy;
      onSuccess?: (data: { draftHash?: string }) => void;
      onError?: (error: ConfigActionError) => void;
    }) => {
      let errorMessage = null;
      if (isTargetingConfigsEnabled) {
        if (!hasRuleOrderingDraftChanges && !drafts.length) {
          errorMessage = 'No drafts or rule order change to publish';
        }
      } else if (!drafts.length) {
        errorMessage = 'No drafts to publish';
      }

      if (isDraftHashRequiredButMissing) {
        errorMessage = 'No draft hash to publish';
      }
      if (isUniverseLoading) {
        errorMessage = 'Universe still loading';
      }
      if (errorMessage) {
        logAnalyticsError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }

      return givenPublish(
        {
          ...changeRequestParams,
          publishData: {
            message,
            deploymentStrategy,
          },
        },
        {
          onSuccess: (data) => {
            onSuccess?.(data);
            // We don't need to register the draft hash from the response anywhere;
            // our request for the updated draft value should use
            // the draft hash that we currently have data for -- not the one we think we want to get
            refresh();
          },
          onError: (error) => {
            onError?.(error);
            refresh();
          },
        },
      );
    },
    [
      drafts.length,
      hasRuleOrderingDraftChanges,
      isTargetingConfigsEnabled,
      isDraftHashRequiredButMissing,
      isUniverseLoading,
      givenPublish,
      changeRequestParams,
      refresh,
    ],
  );

  const { updateRuleOrdering: givenUpdateRuleOrdering } = useUpdateRuleOrderingMutation();
  const reorderRules = useCallback(
    ({
      conditionOrder,
      onSuccess,
      onError,
    }: {
      conditionOrder: Array<string>;
      onSuccess?: (data: { draftHash?: string }) => void;
      onError?: (error: ConfigActionError) => void;
    }) => {
      let errorMessage = null;
      if (isDraftHashRequiredButMissing) {
        errorMessage = 'No draft hash to update rule ordering';
      }
      if (isUniverseLoading) {
        errorMessage = 'Universe still loading';
      }
      if (errorMessage) {
        logAnalyticsError(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }

      return givenUpdateRuleOrdering(
        {
          ...changeRequestParams,
          updateRuleOrderingData: {
            conditionOrder,
          },
        },
        {
          onSuccess: (data) => {
            onSuccess?.(data);
            refreshDrafts();
          },
          onError: (error) => {
            onError?.(error);
          },
        },
      );
    },
    [
      changeRequestParams,
      givenUpdateRuleOrdering,
      isDraftHashRequiredButMissing,
      isUniverseLoading,
      refreshDrafts,
    ],
  );

  const { updateConfig: updateConfigV1 } = useUpdateConfigMutation();
  const { updateConfig: updateConfigV2 } = useUpdateConfigMutationV2();
  const deleteConfigEntry = useCallback(
    (key: string) => {
      if (isUniverseLoading) return;
      if (isDraftHashRequiredButMissing) {
        logAnalyticsError('No draft hash to delete config entry');
        return;
      }

      if (isTargetingConfigsEnabled) {
        updateConfigV2(
          {
            ...changeRequestParams,
            updateConfigurationData: { entry: { key }, isDeleted: true },
            conditionNamesToUpdate: [],
            conditionalRules: [],
          },
          { onSuccess: refresh },
        );
      } else {
        updateConfigV1(
          {
            ...changeRequestParams,
            updateConfigurationData: { entry: { key }, isDeleted: true },
          },
          { onSuccess: refresh },
        );
      }
    },
    [
      isUniverseLoading,
      isDraftHashRequiredButMissing,
      isTargetingConfigsEnabled,
      updateConfigV2,
      changeRequestParams,
      refresh,
      updateConfigV1,
    ],
  );

  const updateDraft = useCallback(
    ({
      key,
      value,
      conditionRules,
      conditionNamesToUpdate,
    }: {
      key: string;
      value: ValidConfigEntryValue;
      conditionRules?: Array<ValidConditionRule>;
      conditionNamesToUpdate?: Array<string>;
    }) => {
      if (isUniverseLoading) return;
      if (isDraftHashRequiredButMissing) {
        logAnalyticsError('No draft hash to update draft');
        return;
      }

      if (isTargetingConfigsEnabled) {
        updateConfigV2(
          {
            ...changeRequestParams,
            updateConfigurationData: { entry: { key, entryValue: value }, isDeleted: false },
            conditionNamesToUpdate: conditionNamesToUpdate || [],
            conditionalRules: conditionRules || [],
          },
          { onSuccess: refresh },
        );
      } else {
        updateConfigV1(
          {
            ...changeRequestParams,
            updateConfigurationData: { entry: { key, entryValue: value }, isDeleted: false },
          },
          { onSuccess: refresh },
        );
      }
    },
    [
      isUniverseLoading,
      isDraftHashRequiredButMissing,
      isTargetingConfigsEnabled,
      updateConfigV2,
      changeRequestParams,
      refresh,
      updateConfigV1,
    ],
  );

  const isEmptyActiveConfigs =
    !configRequestState.isDataLoading && !searchKey && configEntries.length === 0;
  const isEmptyDrafts = !draftRequestState.isDataLoading && drafts.length === 0;
  const isEmptyState = isEmptyActiveConfigs && isEmptyDrafts;
  const isFetchFailed = configRequestState.isResponseFailed || draftRequestState.isResponseFailed;

  const isFirstLoad =
    configRequestState.isDataLoading &&
    draftRequestState.isDataLoading &&
    !drafts.length &&
    !configEntries.length;

  return {
    configEntries,
    rules,
    ruleOrdering,
    configRequestState,
    draftRequestState,
    drafts,
    draftRuleOrdering,
    handleSearchChange,
    isDraftHashRequiredButMissing,
    isFirstLoad,
    isPublishing,
    isEmptyActiveConfigs,
    isEmptyDrafts,
    isEmptyState,
    isFetchFailed,
    cancelPublish,
    discardDraft,
    discardStagedChanges,
    forcePublish,
    deleteConfigEntry,
    publish,
    reorderRules,
    updateDraft,
    pagination,
    publishingMetadata: publishing,
    refresh,
    refreshDrafts,
    searchKey,
    setSort,
    sort,
    universeId,
  };
};
export default useRemoteConfigsPageBundle;
