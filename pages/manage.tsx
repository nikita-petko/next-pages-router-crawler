import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useRef, useState } from 'react';

import AdsManagerPageBaseLayout from '@components/common/AdsManagerDefaultLayout';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import ManageAdsEducation from '@components/onboarding/ManageAdsEducation';
import CampaignDetailsDrawer from '@components/reporting/CampaignDetailsDrawer';
import CampaignManagementTable from '@components/reporting/CampaignManagementTable';
import PageHeader from '@components/reporting/PageHeader';
import StackedToasts from '@components/reporting/StackedToasts';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useShouldUseWorkspaceUniverseFiltering from '@hooks/useShouldUseWorkspaceUniverseFiltering';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { usePromotionStore } from '@stores/promotionStoreProvider';

const getNewFlowLayout = (page: ReactNode) =>
  getCreatorHubPageLayout(page, {
    headerKey: 'Heading.ManageAds',
    headerNamespace: TranslationNamespace.Campaign,
  });

const NewFlow = () => {
  const fetchEssentialAppInfo = useAppStore((state: AppStoreType) => state.fetchEssentialAppInfo);
  // Not a property on the store above because we would like this to go from just true -> false, not false -> true -> false
  // This avoids unnecessary unmount/remount of the page
  const [fetchingEssentialAppInfo, setFetchingEssentialAppInfo] = useState<boolean>(true);
  const adAccountId = useAppStore((state: AppStoreType) => state.appData.adAccountId);
  const hasNewFlowCampaignState = useAppStore((state: AppStoreType) => state.hasNewFlowCampaign);
  const hasNewFlowCampaignLoading = hasNewFlowCampaignState.isLoading;
  const hasNewFlowCampaign = hasNewFlowCampaignState.data;
  const fetchInitialData = useNewFlowStore((state: NewFlowStoreType) => state.fetchInitialData);
  const resetFilterState = useNewFlowStore((state: NewFlowStoreType) => state.resetFilterState);
  const router = useRouter();
  const shouldUseWorkspaceUniverseFiltering = useShouldUseWorkspaceUniverseFiltering();
  const { currentWorkspace } = useWorkspaces();
  const { getPromotions } = usePromotionStore();
  const showCreatorColumn =
    shouldUseWorkspaceUniverseFiltering && currentWorkspace?.creatorType === 'Group';
  useEffect(() => {
    fetchEssentialAppInfo({ urlPath: Routes.MANAGE }).then(() =>
      setFetchingEssentialAppInfo(false),
    );
  }, [fetchEssentialAppInfo]);

  // Initial load of campaigns / refetch after returning to reporting table from create/edit.
  // Uses a ref to ensure this only runs once per page mount. Without it, opening/closing
  // the campaign details drawer changes router.query.campaignId, which would re-trigger
  // fetchInitialData and cause the entire table to reload with a loading skeleton.
  const hasLoadedInitialData = useRef<boolean>(false);
  useEffect(() => {
    if (
      !fetchingEssentialAppInfo &&
      !hasNewFlowCampaignLoading &&
      adAccountId &&
      hasNewFlowCampaign &&
      !hasLoadedInitialData.current
    ) {
      hasLoadedInitialData.current = true;
      const campaignId = router.query?.campaignId;
      const firstCampaign = router.query?.firstCampaign;
      if (typeof campaignId === 'string') {
        fetchInitialData(!!firstCampaign, campaignId);
      } else {
        fetchInitialData(!!firstCampaign);
      }
      resetFilterState();
    }
  }, [
    fetchInitialData,
    adAccountId,
    fetchingEssentialAppInfo,
    hasNewFlowCampaign,
    hasNewFlowCampaignLoading,
    resetFilterState,
    router.query?.campaignId,
    router.query?.firstCampaign,
  ]);

  useEffect(() => {
    getPromotions();
  }, [getPromotions]);

  // Avoid flashing the reporting table while we do not yet know if the user
  // has an ad account or a new-flow campaign.
  if (fetchingEssentialAppInfo || hasNewFlowCampaignLoading) {
    return (
      <AdsManagerPageBaseLayout isLoading>
        <div>
          <StackedToasts />
        </div>
      </AdsManagerPageBaseLayout>
    );
  }

  // Show education page if user has not created an ad account or a campaign in the new flow yet.
  if (!adAccountId || !hasNewFlowCampaign) {
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
    <AdsManagerPageBaseLayout headerSection={<PageHeader />} isLoading={fetchingEssentialAppInfo}>
      <div>
        <StackedToasts />
        <CampaignManagementTable showCreatorColumn={showCreatorColumn} />
        <CampaignDetailsDrawer />
      </div>
    </AdsManagerPageBaseLayout>
  );
};

NewFlow.getPageLayout = getNewFlowLayout;

export default NewFlow;
