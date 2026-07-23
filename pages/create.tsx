import { useRouter } from 'next/router';
import { ReactNode, useEffect, useRef, useState } from 'react';

import { EventName, logNativeImpressionEvent } from '@clients/unifiedLogger';
import CampaignBreadcrumbs from '@components/campaignBuilder/common/Breadcrumbs';
import CreationFormStackedToasts from '@components/campaignBuilder/common/CreationFormStackedToasts';
import CreateCampaignContainer from '@components/campaignBuilder/create/CreateCampaignContainer';
import AdsManagerPageBaseLayout from '@components/common/AdsManagerDefaultLayout';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import { FlowTypes } from '@constants/campaignBuilder';
import Routes from '@constants/routes';
import useRedirectOnWorkspaceChange from '@hooks/useRedirectOnWorkspaceChange';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { usePaymentStore } from '@stores/paymentStoreProvider';

const CreateCampaignPage = () => {
  const {
    clearSimplifiedCampaign,
    getSimplifiedCampaign,
    getUniversesCanAdvertise,
    setFlowType,
    setPrefilledCampaignFields,
    simplifiedCampaign,
    universesCanAdvertise,
  } = useCampaignBuilderStore();
  const { adCreditState, advertiserState, getAdCredit, getAdvertiser, getHasNewFlowCampaign } =
    useAppStore();
  const { getPaymentProfiles, paymentProfiles } = usePaymentStore();
  const { advertisingShouldBeEnabled } = useAppStore((state) => state.advertisingShouldBeEnabled());
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const hasAdAccount = !!useAppStore((state) => state.appData.adAccountId);
  const router = useRouter();
  const campaignId = router.query?.campaignId as string;
  const [finishedFirstLoad, setFinishedFirstLoad] = useState<boolean>(false);
  const hasLoggedCreatePageEvent = useRef<boolean>(false);
  const shouldRedirectToManage = isAdAccountAutoCreateEnabled && !hasAdAccount;

  useRedirectOnWorkspaceChange(isAdAccountAutoCreateEnabled && !shouldRedirectToManage);

  useEffect(() => {
    if (shouldRedirectToManage && !hasLoggedCreatePageEvent.current) {
      hasLoggedCreatePageEvent.current = true;
      logNativeImpressionEvent(EventName.NewUserFlowCreatePageLoaded);
    }
  }, [shouldRedirectToManage]);

  useEffect(() => {
    if (shouldRedirectToManage) {
      router.replace(Routes.MANAGE);
    }
  }, [router, shouldRedirectToManage]);

  useEffect(() => {
    if (shouldRedirectToManage) {
      return undefined;
    }

    setFlowType(FlowTypes.CREATE);
    getUniversesCanAdvertise();
    getAdvertiser();
    getAdCredit();
    getPaymentProfiles(true);
    getHasNewFlowCampaign();
    if (campaignId) {
      setFlowType(FlowTypes.CLONE);
      // Get cloned campaign if campaignId is provided
      getSimplifiedCampaign(router.query.campaignId as string);
    }
    if (router.query) {
      setPrefilledCampaignFields(router.query);
    }

    return () => clearSimplifiedCampaign();
  }, [shouldRedirectToManage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const isLoaded =
      !adCreditState.isLoading && !paymentProfiles.isLoading && !advertiserState.isLoading;
    if (isLoaded) {
      setFinishedFirstLoad(true);
    }
    if (isLoaded && !advertisingShouldBeEnabled) {
      router.push(Routes.MANAGE);
    }
  }, [
    adCreditState.isLoading,
    paymentProfiles.isLoading,
    advertiserState.isLoading,
    advertisingShouldBeEnabled,
    router,
  ]);

  useEffect(() => {
    // If simplified campaign is not loaded, redirect to newflow
    if (campaignId && simplifiedCampaign.isError) {
      router.push(Routes.MANAGE);
    }
  }, [simplifiedCampaign.isError, campaignId, router]);

  return (
    <AdsManagerPageBaseLayout
      isLoading={
        shouldRedirectToManage ||
        !finishedFirstLoad ||
        (!isAdAccountAutoCreateEnabled && advertiserState.isLoading) ||
        Boolean(campaignId && simplifiedCampaign.isLoading) ||
        universesCanAdvertise.isLoading
      }>
      <CreationFormStackedToasts />
      <CreateCampaignContainer />
    </AdsManagerPageBaseLayout>
  );
};

CreateCampaignPage.getPageLayout = (page: ReactNode) =>
  getCreatorHubPageLayout(page, { header: <CampaignBreadcrumbs /> });

export default CreateCampaignPage;
