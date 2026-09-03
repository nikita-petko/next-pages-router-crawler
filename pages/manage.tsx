import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';

import AdsManagerPageBaseLayout from '@components/common/AdsManagerDefaultLayout';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import ManageAdsEducation from '@components/onboarding/ManageAdsEducation';
import CampaignDetailsDrawer from '@components/reporting/CampaignDetailsDrawer';
import CampaignManagementTable from '@components/reporting/CampaignManagementTable';
import ManageAdsBreadcrumbs from '@components/reporting/ManageAdsBreadcrumbs';
import PageHeader from '@components/reporting/PageHeader';
import StackedToasts from '@components/reporting/StackedToasts';
import Routes from '@constants/routes';
import useManageUniverseResolution from '@hooks/useManageUniverseResolution';
import useShouldUseWorkspaceUniverseFiltering from '@hooks/useShouldUseWorkspaceUniverseFiltering';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { usePromotionStore } from '@stores/promotionStoreProvider';

const getNewFlowLayout = (page: ReactNode) =>
  getCreatorHubPageLayout(page, { header: <ManageAdsBreadcrumbs /> });

const NewFlow = () => {
  const fetchEssentialAppInfo = useAppStore((state: AppStoreType) => state.fetchEssentialAppInfo);
  // Not a property on the store above because we would like this to go from just true -> false, not false -> true -> false
  // This avoids unnecessary unmount/remount of the page
  const [fetchingEssentialAppInfo, setFetchingEssentialAppInfo] = useState<boolean>(true);
  const userAdAccountId =
    useAppStore((state: AppStoreType) => state.appData.adAccountId) ?? undefined;
  const hasNewFlowCampaignState = useAppStore((state: AppStoreType) => state.hasNewFlowCampaign);
  const hasNewFlowCampaignLoading = hasNewFlowCampaignState.isLoading;
  const hasNewFlowCampaign = hasNewFlowCampaignState.data;
  const shouldUseWorkspaceUniverseFiltering = useShouldUseWorkspaceUniverseFiltering();
  const fetchInitialData = useNewFlowStore((state: NewFlowStoreType) => state.fetchInitialData);
  const resetFilterState = useNewFlowStore((state: NewFlowStoreType) => state.resetFilterState);
  const advertisedUniverses = useNewFlowStore(
    (state: NewFlowStoreType) => state.advertisedUniversesState.data,
  );
  const advertisedUniversesIsLoading = useNewFlowStore(
    (state: NewFlowStoreType) => state.advertisedUniversesState.isLoading,
  );
  const selectedUniverseId = useNewFlowStore(
    (state: NewFlowStoreType) => state.universePickerFilterState.universeFilter.universe_id,
  );
  const { currentWorkspace, isLoading: isWorkspaceLoading, workspaces } = useWorkspaces();
  const { getPromotions } = usePromotionStore();
  const isGroupWorkspaceView =
    shouldUseWorkspaceUniverseFiltering && currentWorkspace?.creatorType === 'Group';
  const shouldRequireNewFlowCampaign = !isGroupWorkspaceView;
  const groupAdvertiserState = useAppStore((state: AppStoreType) =>
    isGroupWorkspaceView && currentWorkspace?.creatorId
      ? state.groupScopedAccountStateByGroupId[currentWorkspace.creatorId]?.advertiserState
      : undefined,
  );
  const groupAdAccountId = groupAdvertiserState?.data?.ad_account?.id;
  const activeAdAccountId =
    (isGroupWorkspaceView ? groupAdAccountId : undefined) ?? userAdAccountId;
  const isGroupAdAccountLoading =
    isGroupWorkspaceView &&
    !groupAdvertiserState?.data &&
    !groupAdvertiserState?.isError &&
    (groupAdvertiserState?.isLoading ?? true);
  const isReportingContextLoading = fetchingEssentialAppInfo || isGroupAdAccountLoading;

  const workspace = useMemo(() => {
    if (
      !currentWorkspace?.creatorId ||
      (currentWorkspace?.creatorType !== 'Group' && currentWorkspace?.creatorType !== 'User')
    ) {
      return undefined;
    }

    return {
      creatorId: currentWorkspace.creatorId,
      creatorType: currentWorkspace.creatorType,
    };
  }, [currentWorkspace?.creatorId, currentWorkspace?.creatorType]);
  const isWorkspaceResolved = !isWorkspaceLoading && workspaces != null && workspace !== undefined;
  useEffect(() => {
    fetchEssentialAppInfo({ urlPath: Routes.MANAGE }).then(() =>
      setFetchingEssentialAppInfo(false),
    );
  }, [fetchEssentialAppInfo]);

  useManageUniverseResolution({
    adAccountId: activeAdAccountId,
    advertisedUniverses,
    advertisedUniversesIsLoading,
    fetchingEssentialAppInfo: isReportingContextLoading,
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
  });

  useEffect(() => {
    getPromotions();
  }, [getPromotions]);

  // Avoid flashing the reporting table while we do not yet know if the user
  // has an ad account or a new-flow campaign.
  if (isReportingContextLoading || (shouldRequireNewFlowCampaign && hasNewFlowCampaignLoading)) {
    return (
      <AdsManagerPageBaseLayout isLoading>
        <div>
          <StackedToasts />
        </div>
      </AdsManagerPageBaseLayout>
    );
  }

  // Show education when the active workspace has no ad account, or when the
  // personal workspace has not created a new-flow campaign yet.
  if (!activeAdAccountId || (shouldRequireNewFlowCampaign && !hasNewFlowCampaign)) {
    return (
      <AdsManagerPageBaseLayout isLoading={fetchingEssentialAppInfo}>
        <div>
          <StackedToasts />
          <ManageAdsEducation />
        </div>
      </AdsManagerPageBaseLayout>
    );
  }

  return (
    <AdsManagerPageBaseLayout headerSection={<PageHeader />} isLoading={false}>
      <div>
        <StackedToasts />
        <CampaignManagementTable showCreatorColumn={isGroupWorkspaceView} />
        <CampaignDetailsDrawer />
      </div>
    </AdsManagerPageBaseLayout>
  );
};

NewFlow.getPageLayout = getNewFlowLayout;

export default NewFlow;
