/* oxlint-disable react/react-compiler -- pre-existing data-loading effects update local bundle state */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { StatusCodes } from '@rbx/core';
import { useFlag } from '@rbx/flags';
import { isTargetingConfigsEnabled as isTargetingConfigsEnabledFlag } from '@generated/flags/creatorAnalytics';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import type { PublishingMetadata } from '@modules/clients/analytics/universeConfigs';
import { overwriteDraft, publishDraft } from '@modules/clients/creatorConfigsPublicApi';
import { getResponseFromError } from '@modules/clients/utils';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import type { DeploymentStrategy } from '../api/universeConfigsClientEnums';
import { SortKey, SortOrder } from '../api/universeConfigsClientEnums';
import type {
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
import { paginateEntries } from '../utils/configDataProcessing';
import {
  detailsToOverwriteEntries,
  toPublicApiDeploymentStrategy,
} from '../utils/creatorConfigsPublicApiAdapters';
import { isConditionOrderDifferent } from '../utils/isConditionOrderDifferent';
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
import type { ConfigActionError } from './useConfigsMutation';
import { useLatestConfigurations } from './useLatestConfigurations';
import useOffsetBasedPaginationState from './useOffsetBasedPaginationState';

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
  const { ready: isTargetingConfigsReady, value: isTargetingConfigsEnabledValue } = useFlag(
    isTargetingConfigsEnabledFlag,
    {
      universeId,
    },
  );
  const isTargetingConfigsEnabled = isTargetingConfigsReady && isTargetingConfigsEnabledValue;

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
  const [draftRules, setDraftRules] = useState<Map<string, ValidConditionRule>>(new Map());
  const [draftRuleOrdering, setDraftRuleOrdering] = useState<ValidRuleOrdering | undefined>(
    undefined,
  );
  const refreshDrafts = useCallback(() => {
    if (isUniverseLoading) {
      return;
    }

    setDraftRequestState({
      isDataLoading: true,
      isResponseFailed: false,
      isUserForbidden: false,
    });
    client
      .v1DraftUniversesUniverseIdGet(readRequestParams)
      .then((response) => {
        setDraftHash(response.draftHash);
        setDrafts(response.entries ?? []);
        setDraftRules('rules' in response ? response.rules : new Map());
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
          setDraftRules(new Map());
          setDraftRuleOrdering(undefined);
          setPublishing(undefined);
          setDraftRequestState({
            isDataLoading: false,
            isResponseFailed: false,
            isUserForbidden: false,
          });
        } else {
          logAnalyticsError(error);
          setDraftRules(new Map());
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
    if (isUniverseLoading) {
      return () => {};
    }
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
    entries: unfilteredConfigEntries,
    unsortedEntries,
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
    if (unfilteredConfigEntries.length > 0 || (!isConfigsLoading && !isConfigsError)) {
      const filtered = unfilteredConfigEntries.map((entry) => ({
        ...entry,
        isStaged: drafts.some(
          (draft) => draft.overrideEntry.entry.key === entry.overrideEntry.entry.key,
        ),
      }));
      const paginated = paginateEntries(filtered, pagination.pageSize, pagination.skip);
      setConfigEntries(paginated);
      setTotal(filtered.length);
    }
  }, [
    isConfigsLoading,
    isConfigsError,
    unfilteredConfigEntries,
    unsortedEntries,
    pagination.pageSize,
    pagination.skip,
    drafts,
  ]);

  const refreshConfigs = useCallback(() => {
    void refetchConfigs();
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
    if (isUniverseLoading) {
      return;
    }
    if (isDraftHashRequiredButMissing) {
      logAnalyticsError('No draft hash to discard');
      return;
    }
    void deleteConfig(changeRequestParams, {
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
      if (isUniverseLoading) {
        return;
      }
      if (isDraftHashRequiredButMissing) {
        logAnalyticsError('No draft hash to delete draft');
        return;
      }

      void deleteConfig(
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
    if (isUniverseLoading) {
      return;
    }
    if (isDraftHashRequiredButMissing) {
      logAnalyticsError('No draft hash to cancel publish');
      return;
    }
    void givenCancelPublish(changeRequestParams, { onSuccess: refresh });
  }, [
    isUniverseLoading,
    isDraftHashRequiredButMissing,
    givenCancelPublish,
    changeRequestParams,
    refresh,
  ]);

  const { forcePublish: givenForcePublish } = useForcePublishMutation();
  const forcePublish = useCallback(() => {
    if (isUniverseLoading) {
      return;
    }
    if (isDraftHashRequiredButMissing) {
      logAnalyticsError('No draft hash to force publish');
      return;
    }
    void givenForcePublish(changeRequestParams, { onSuccess: refresh });
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

  const hasRuleDraftChanges = useMemo(() => {
    if (!isTargetingConfigsEnabled) {
      return false;
    }
    return draftRules.size > 0;
  }, [draftRules, isTargetingConfigsEnabled]);

  const hasTargetingDraftChanges = useMemo(() => {
    return hasRuleOrderingDraftChanges || hasRuleDraftChanges;
  }, [hasRuleDraftChanges, hasRuleOrderingDraftChanges]);

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
        if (!hasTargetingDraftChanges && !drafts.length) {
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
      hasTargetingDraftChanges,
      isTargetingConfigsEnabled,
      isDraftHashRequiredButMissing,
      isUniverseLoading,
      givenPublish,
      changeRequestParams,
      refresh,
    ],
  );

  const publishAs = useCallback(
    async ({
      message,
      deploymentStrategy,
      universeId: targetUniverseId,
    }: {
      message: string;
      deploymentStrategy: DeploymentStrategy;
      universeId: number;
    }) => {
      const publicApiStrategy = toPublicApiDeploymentStrategy(deploymentStrategy);
      if (!publicApiStrategy) {
        return false;
      }

      const target = {
        universeId: targetUniverseId.toString(),
        repository: 'InExperienceConfig' as const,
      };

      // 1. Overwrite the target experience's draft with the source's currently-published values.
      const { draftHash: targetDraftHash } = await overwriteDraft(target, {
        entries: detailsToOverwriteEntries(unsortedEntries),
      });

      if (!targetDraftHash) {
        return false;
      }

      // 2. Publish that draft on the target experience.
      await publishDraft(target, {
        draftHash: targetDraftHash,
        message: message ?? null,
        deploymentStrategy: publicApiStrategy,
      });

      return true;
    },
    [unsortedEntries],
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
      if (isUniverseLoading) {
        return;
      }
      if (isDraftHashRequiredButMissing) {
        logAnalyticsError('No draft hash to delete config entry');
        return;
      }

      if (isTargetingConfigsEnabled) {
        void updateConfigV2(
          {
            ...changeRequestParams,
            updateConfigurationData: { entry: { key }, isDeleted: true },
            conditionNamesToUpdate: [],
            conditionNamesToDelete: [],
            conditionalRules: [],
          },
          { onSuccess: refresh },
        );
      } else {
        void updateConfigV1(
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
      conditionNamesToDelete,
    }: {
      key: string;
      value: ValidConfigEntryValue;
      conditionRules?: Array<ValidConditionRule>;
      conditionNamesToUpdate?: Array<string>;
      conditionNamesToDelete?: Array<string>;
    }) => {
      if (isUniverseLoading) {
        return;
      }
      if (isDraftHashRequiredButMissing) {
        logAnalyticsError('No draft hash to update draft');
        return;
      }

      if (isTargetingConfigsEnabled) {
        void updateConfigV2(
          {
            ...changeRequestParams,
            updateConfigurationData: { entry: { key, entryValue: value }, isDeleted: false },
            conditionNamesToUpdate: conditionNamesToUpdate ?? [],
            conditionNamesToDelete: conditionNamesToDelete ?? [],
            conditionalRules: conditionRules ?? [],
          },
          { onSuccess: refresh },
        );
      } else {
        void updateConfigV1(
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
    unsortedEntries,
    // Raw published entries from useLatestConfigurations before we remove draft keys
    // and paginate. `configEntries` is the draft-filtered + paginated table data.
    unfilteredConfigEntries,
    rules,
    ruleOrdering,
    configRequestState,
    draftRequestState,
    drafts,
    draftRules,
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
    publishAs,
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
