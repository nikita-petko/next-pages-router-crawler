import { useRouter } from 'next/router';
import { ReactNode } from 'react';

import AdBreadcrumbs from '@components/ad/AdBreadcrumbs';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import Routes from '@constants/routes';
import { createAdV2 } from '@modules/clients/ads/adsClient';
import { ClientToServer } from '@modules/clients/ads/serverClientTransformationUtilities';
import { useIdempotencyKeyStore } from '@modules/stores/idempotencyKeyStoreProvider';
import { NewCampaignWizardPageNonNextJs } from 'app/pages/new/campaign';

const AddAdPage = () => {
  const idempotencyKey = useIdempotencyKeyStore((state: any) => state.idempotencyKey);
  const router = useRouter();
  const { adSetId, campaignId } = router.query;

  const handleSubmitBodyFn = (values: any, _actions: any) => {
    const adData = ClientToServer.convertFormikDataToProtoAdV2(values);
    const dataToSubmit = {
      ad: {
        ad_set_id: values.adSetId,
        ...adData,
      },
      idempotency_key: idempotencyKey,
    };
    return createAdV2(dataToSubmit);
  };

  const navigateToAdsPage = () => {
    router.push({
      pathname: Routes.CLASSIC,
      query: {
        tableView: 'ads',
      },
    });
  };

  return (
    <NewCampaignWizardPageNonNextJs
      adSetToPopulate={(adSetId as string) || ''}
      campaignToPopulate={(campaignId as string) || ''}
      // @ts-ignore
      handleSubmitBodyFn={handleSubmitBodyFn}
      isAdFormDisabled={false}
      isAdSetFormDisabled
      isCampaignFormDisabled
      leafBreadCrumbText='Ad Creation'
      newLeafBreadCrumbText='Create Ad'
      onSuccessDialogCTAClick={navigateToAdsPage}
      showSummaryAdEditButton
      showSummaryAdSetEditButton={false}
      showSummaryCampaignEditButton={false}
      successDialogCTAText='MANAGE AD'
      successDialogText='Your ad will go live soon after moderation approval.'
      successDialogTitle='Ad Created'
      wizardHeader='Create Ad'
      wizardHeaderFinalStep='Review Ad'
    />
  );
};

const getPageLayout = (page: ReactNode) => {
  return getCreatorHubPageLayout(page, {
    header: <AdBreadcrumbs leafBreadCrumbText='Ad Creation' />,
  });
};

AddAdPage.getPageLayout = getPageLayout;

export default AddAdPage;
