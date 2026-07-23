import { ReactNode } from 'react';

import PaymentActivity from '@components/billing/payment_activity/PaymentActivity';
import AdsManagerPageBaseLayout from '@components/common/AdsManagerDefaultLayout';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import { TranslationNamespace } from '@constants/localization';
import PageNotFound from '@pages/404';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';

const PaymentActivityPage = () => {
  const accountIsInternal = useAppStore((state: AppStoreType) =>
    state.adAccountIsInternalManaged(),
  );
  const accountIsManaged = useAppStore((state: AppStoreType) => state.adAccountIsExternalManaged());

  const isPaymentsPagesForLOCEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isPaymentsPagesForLOCEnabled,
  );

  if ((accountIsInternal || accountIsManaged) && !isPaymentsPagesForLOCEnabled) {
    return <PageNotFound />;
  }

  return (
    <AdsManagerPageBaseLayout isLoading={false}>
      <PaymentActivity />
    </AdsManagerPageBaseLayout>
  );
};

const getPageLayout = (page: ReactNode) =>
  getCreatorHubPageLayout(page, {
    headerKey: 'Heading.PaymentActivity',
    headerNamespace: TranslationNamespace.Billing,
  });
PaymentActivityPage.getPageLayout = getPageLayout;

export default PaymentActivityPage;
