import { useRouter } from 'next/router';
import { ReactNode, useEffect } from 'react';

import CampaignBreadcrumbs from '@components/campaignBuilder/common/Breadcrumbs';
import EditCampaignContainer from '@components/campaignBuilder/edit/EditCampaignContainer';
import AdsManagerPageBaseLayout from '@components/common/AdsManagerDefaultLayout';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import { ServerPaymentType } from '@constants/campaign';
import { FlowTypes } from '@constants/campaignBuilder';
import Routes from '@constants/routes';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { usePaymentStore } from '@stores/paymentStoreProvider';

const EditCampaignPage = () => {
  const { setFlowType } = useCampaignBuilderStore();
  const { adCreditState, advertiserState, getAdCredit, getAdvertiser } = useAppStore();
  const getAdsAndOpenDrawer = useNewFlowStore(
    (state: NewFlowStoreType) => state.getAdsAndOpenDrawer,
  );

  const adTogglingShouldBeEnabled = useAppStore((state) => state.adTogglingShouldBeEnabled);
  const { getPaymentProfiles, paymentProfiles } = usePaymentStore();
  const {
    clearSimplifiedCampaign,
    getSimplifiedCampaign,
    getUniversesCanAdvertise,
    simplifiedCampaign,
    universesCanAdvertise,
  } = useCampaignBuilderStore();
  const router = useRouter();

  if (!router.query.campaignId) {
    router.push(Routes.MANAGE);
  }

  useEffect(() => {
    setFlowType(FlowTypes.EDIT);
    getSimplifiedCampaign(router.query.campaignId as string); // TODO: Get universe name
    getAdsAndOpenDrawer(router.query.campaignId as string, false); // campaign details drawer is not opened, this is just used to fetch ads for the campaign.
    getUniversesCanAdvertise();
    getAdvertiser();
    getAdCredit();
    getPaymentProfiles(true);
    return () => clearSimplifiedCampaign();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const isLoaded =
      !adCreditState.isLoading &&
      !paymentProfiles.isLoading &&
      !advertiserState.isLoading &&
      !simplifiedCampaign.isLoading;
    if (
      isLoaded &&
      !adTogglingShouldBeEnabled(
        simplifiedCampaign.data?.payment_type || ServerPaymentType.PAYMENT_TYPE_CARD,
      )
    ) {
      router.push(Routes.MANAGE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    adTogglingShouldBeEnabled,
    adCreditState.isLoading,
    paymentProfiles.isLoading,
    advertiserState.isLoading,
    simplifiedCampaign.isLoading,
  ]);

  useEffect(() => {
    // If simplified campaign is not loaded, redirect to newflow
    if (simplifiedCampaign.isError) {
      router.push(Routes.MANAGE);
    }
  }, [router, simplifiedCampaign.isError]);

  return (
    <AdsManagerPageBaseLayout
      isLoading={
        adCreditState.isLoading ||
        paymentProfiles.isLoading ||
        advertiserState.isLoading ||
        simplifiedCampaign.isLoading ||
        universesCanAdvertise.isLoading
      }>
      <EditCampaignContainer />
    </AdsManagerPageBaseLayout>
  );
};

EditCampaignPage.getPageLayout = (page: ReactNode) =>
  getCreatorHubPageLayout(page, { header: <CampaignBreadcrumbs /> });

export default EditCampaignPage;
