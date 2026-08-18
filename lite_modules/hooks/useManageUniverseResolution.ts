import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';

import { getSimplifiedCampaign } from '@services/ads/getEntitiesService';
import type { FetchInitialDataOptions } from '@stores/newFlowStoreProvider';
import type { AdvertisedUniverse } from '@type/universe';
import { CaptureException } from '@utils/error';
import {
  getRememberedWorkspaceUniverseId,
  type WorkspaceIdentity,
} from '@utils/workspaceUniverseStorage';

interface CampaignUniverseResolutionState {
  campaignId?: string;
  isLoading: boolean;
  universeId?: number;
}

interface UseManageUniverseResolutionParams {
  adAccountId?: string;
  advertisedUniverses?: AdvertisedUniverse[];
  advertisedUniversesIsLoading: boolean;
  fetchingEssentialAppInfo: boolean;
  fetchInitialData: (
    firstCampaign: boolean,
    campaignId?: string,
    options?: FetchInitialDataOptions,
  ) => void;
  hasNewFlowCampaign?: boolean;
  hasNewFlowCampaignLoading: boolean;
  isGroupWorkspaceView: boolean;
  isWorkspaceLoading: boolean;
  isWorkspaceResolved: boolean;
  resetFilterState: () => void;
  selectedUniverseId: number;
  shouldRequireNewFlowCampaign: boolean;
  shouldUseWorkspaceUniverseFiltering: boolean;
  workspace?: WorkspaceIdentity;
}

const getStringQueryParam = (queryParam: string | string[] | undefined): string | undefined =>
  typeof queryParam === 'string' ? queryParam : undefined;

const getUniverseIdQueryParam = (queryParam: string | string[] | undefined): number | undefined => {
  const universeIdQuery = getStringQueryParam(queryParam);
  if (!universeIdQuery) {
    return undefined;
  }
  const parsedUniverseId = Number.parseInt(universeIdQuery, 10);
  return Number.isNaN(parsedUniverseId) ? undefined : parsedUniverseId;
};

const useManageUniverseResolution = ({
  adAccountId,
  advertisedUniverses = [],
  advertisedUniversesIsLoading,
  fetchingEssentialAppInfo,
  fetchInitialData,
  hasNewFlowCampaign,
  hasNewFlowCampaignLoading,
  isGroupWorkspaceView,
  isWorkspaceLoading,
  isWorkspaceResolved,
  resetFilterState,
  selectedUniverseId,
  shouldRequireNewFlowCampaign,
  shouldUseWorkspaceUniverseFiltering,
  workspace,
}: UseManageUniverseResolutionParams): void => {
  const router = useRouter();
  const [campaignUniverseResolution, setCampaignUniverseResolution] =
    useState<CampaignUniverseResolutionState>({
      isLoading: false,
    });
  const lastCampaignUniverseResolutionRequestRef = useRef<string | undefined>(undefined);
  const lastFetchedWorkspaceKeyRef = useRef<string | undefined>(undefined);
  const lastWorkspaceIdentityRef = useRef<string | undefined>(undefined);

  const initialUniverseId = useMemo(
    () => getUniverseIdQueryParam(router.query.universeId),
    [router.query.universeId],
  );
  const campaignId = useMemo(
    () => getStringQueryParam(router.query.campaignId),
    [router.query.campaignId],
  );
  const shouldResolveCampaignUniverseId =
    router.isReady && campaignId !== undefined && initialUniverseId === undefined;
  const isResolvingInitialUniverseId =
    shouldResolveCampaignUniverseId &&
    (campaignUniverseResolution.campaignId !== campaignId || campaignUniverseResolution.isLoading);
  const rememberedUniverseId = useMemo(
    () =>
      shouldUseWorkspaceUniverseFiltering && workspace
        ? getRememberedWorkspaceUniverseId(workspace)
        : undefined,
    [shouldUseWorkspaceUniverseFiltering, workspace],
  );
  const resolvedInitialUniverseId =
    initialUniverseId ??
    (campaignUniverseResolution.campaignId === campaignId
      ? campaignUniverseResolution.universeId
      : undefined) ??
    rememberedUniverseId;
  const workspaceIdentity = useMemo(
    () =>
      shouldUseWorkspaceUniverseFiltering && workspace
        ? `${workspace.creatorType}:${workspace.creatorId}`
        : undefined,
    [shouldUseWorkspaceUniverseFiltering, workspace],
  );

  useEffect(() => {
    if (
      !shouldResolveCampaignUniverseId ||
      !campaignId ||
      lastCampaignUniverseResolutionRequestRef.current === campaignId
    ) {
      return undefined;
    }

    let isStale = false;
    lastCampaignUniverseResolutionRequestRef.current = campaignId;
    setCampaignUniverseResolution({
      campaignId,
      isLoading: true,
    });

    getSimplifiedCampaign(campaignId)
      .then(({ campaign }) => {
        if (isStale) {
          return;
        }

        const universeId = campaign.target_universe_id || undefined;
        setCampaignUniverseResolution({
          campaignId,
          isLoading: false,
          universeId,
        });

        if (universeId) {
          router.replace(
            {
              pathname: router.pathname,
              query: {
                ...router.query,
                universeId: String(universeId),
              },
            },
            undefined,
            { shallow: true },
          );
        }
      })
      .catch((error) => {
        if (isStale) {
          return;
        }

        setCampaignUniverseResolution({
          campaignId,
          isLoading: false,
        });
        CaptureException(error, { context: 'resolveManageCampaignUniverseId' });
      });

    return () => {
      isStale = true;
    };
  }, [campaignId, router, shouldResolveCampaignUniverseId]);

  // Load (or reload) reporting data when the page is ready or when Creator Hub workspace
  // context changes. `campaignId` is read inside the effect but omitted from deps so
  // opening/closing the campaign details drawer does not refetch the whole table.
  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (shouldUseWorkspaceUniverseFiltering) {
      if (!isWorkspaceResolved || !workspaceIdentity) {
        return;
      }

      const previousWorkspaceIdentity = lastWorkspaceIdentityRef.current;
      lastWorkspaceIdentityRef.current = workspaceIdentity;

      if (
        previousWorkspaceIdentity !== undefined &&
        previousWorkspaceIdentity !== workspaceIdentity
      ) {
        lastFetchedWorkspaceKeyRef.current = undefined;
        lastCampaignUniverseResolutionRequestRef.current = undefined;
        setCampaignUniverseResolution({ isLoading: false });

        if (router.query.universeId !== undefined) {
          const query = { ...router.query };
          delete query.universeId;
          router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
          return;
        }
      }
    } else {
      lastWorkspaceIdentityRef.current = undefined;
    }

    if (
      fetchingEssentialAppInfo ||
      (shouldRequireNewFlowCampaign && hasNewFlowCampaignLoading) ||
      !adAccountId ||
      (shouldRequireNewFlowCampaign && !hasNewFlowCampaign) ||
      isResolvingInitialUniverseId
    ) {
      return;
    }
    if (shouldUseWorkspaceUniverseFiltering && !workspace) {
      return;
    }

    const workspaceKey =
      shouldUseWorkspaceUniverseFiltering && workspace
        ? `${adAccountId}:${workspace.creatorType}:${workspace.creatorId}`
        : `${adAccountId}:workspace-universe-filtering-off`;
    if (lastFetchedWorkspaceKeyRef.current === workspaceKey) {
      return;
    }
    lastFetchedWorkspaceKeyRef.current = workspaceKey;

    const firstCampaign = router.query?.firstCampaign;
    const fetchOptions: FetchInitialDataOptions = {
      initialUniverseId: resolvedInitialUniverseId,
      workspace: shouldUseWorkspaceUniverseFiltering ? workspace : undefined,
    };
    fetchInitialData(!!firstCampaign, campaignId, fetchOptions);
    if (resolvedInitialUniverseId === undefined && !shouldUseWorkspaceUniverseFiltering) {
      resetFilterState();
    }
    // router.query.campaignId / firstCampaign intentionally omitted — see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    workspace,
    fetchInitialData,
    adAccountId,
    fetchingEssentialAppInfo,
    hasNewFlowCampaign,
    hasNewFlowCampaignLoading,
    isResolvingInitialUniverseId,
    isWorkspaceLoading,
    isWorkspaceResolved,
    resetFilterState,
    resolvedInitialUniverseId,
    router.isReady,
    router.query.universeId,
    shouldRequireNewFlowCampaign,
    shouldUseWorkspaceUniverseFiltering,
    workspaceIdentity,
  ]);

  // Mirror the selected universe into the URL so a refresh or shared link keeps it.
  useEffect(() => {
    if (
      !router.isReady ||
      !isGroupWorkspaceView ||
      // Only mirror a selection produced by this mount's own initial fetch. The reporting
      // store outlives client-side navigation, so until that fetch runs `selectedUniverseId`
      // is still the previous visit's selection. Stamping it into the URL would outrank the
      // remembered universe and mark the workspace as already fetched, stranding the page on
      // the stale selection.
      lastFetchedWorkspaceKeyRef.current === undefined ||
      initialUniverseId !== undefined ||
      advertisedUniversesIsLoading ||
      selectedUniverseId === 0 ||
      !adAccountId ||
      !workspace ||
      isWorkspaceLoading
    ) {
      return;
    }

    const hasSelectedUniverse = advertisedUniverses.some(
      (universe) => universe.universe_id === selectedUniverseId,
    );
    if (!hasSelectedUniverse) {
      return;
    }

    lastFetchedWorkspaceKeyRef.current = `${adAccountId}:${workspace.creatorType}:${workspace.creatorId}`;
    router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          universeId: String(selectedUniverseId),
        },
      },
      undefined,
      { shallow: true },
    );
  }, [
    adAccountId,
    advertisedUniverses,
    advertisedUniversesIsLoading,
    initialUniverseId,
    isGroupWorkspaceView,
    isWorkspaceLoading,
    router,
    selectedUniverseId,
    workspace,
  ]);
};

export default useManageUniverseResolution;
