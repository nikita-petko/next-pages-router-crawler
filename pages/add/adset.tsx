import { useRouter } from 'next/router';
import { ReactNode } from 'react';

import AdBreadcrumbs from '@components/ad/AdBreadcrumbs';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import Routes from '@constants/routes';
import { createAdSetV2 } from '@modules/clients/ads/adsClient';
import { ClientToServer } from '@modules/clients/ads/serverClientTransformationUtilities';
import { useIdempotencyKeyStore } from '@modules/stores/idempotencyKeyStoreProvider';
import { NewCampaignWizardPageNonNextJs } from 'app/pages/new/campaign';

const AddAdSetPage = () => {
  const idempotencyKey = useIdempotencyKeyStore((state: any) => state.idempotencyKey);
  const router = useRouter();
  const { adSetId, campaignId } = router.query;

  const handleSubmitBodyFn = (values: any, _actions: any) => {
    const adSetData = ClientToServer.convertFormikDataToProtoAdSet(values);

    const adData = ClientToServer.convertFormikDataToProtoAdV2(values);
    const dataToSubmit = {
      ad: adData,
      ad_set: {
        campaign_id: values.campaignId,
        ...adSetData,
      },
      idempotency_key: idempotencyKey,
    };

    return createAdSetV2(dataToSubmit);
  };

  const navigateToAdSetsPage = () => {
    router.push({
      pathname: Routes.CLASSIC,
      query: {
        tableView: 'adsets',
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
      isAdSetFormDisabled={false}
      isCampaignFormDisabled
      leafBreadCrumbText='Ad Set Creation'
      newLeafBreadCrumbText='Create Ad Set'
      onSuccessDialogCTAClick={navigateToAdSetsPage}
      showSummaryAdSetEditButton
      showSummaryCampaignEditButton={false}
      successDialogCTAText='MANAGE AD SETS'
      successDialogText='Your ad set will go live soon after moderation approval.'
      successDialogTitle='Ad Set Created'
      wizardHeader='Create Ad Set'
      wizardHeaderFinalStep='Review Ad Set'
    />
  );
};

const getPageLayout = (page: ReactNode) => {
  return getCreatorHubPageLayout(page, {
    header: <AdBreadcrumbs leafBreadCrumbText='Ad Set Creation' />,
  });
};

AddAdSetPage.getPageLayout = getPageLayout;

export default AddAdSetPage;
