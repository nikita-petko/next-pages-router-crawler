import { ReactNode } from 'react';

import PaymentSettings from '@components/billing/payment_settings/PaymentSettings';
import AdsManagerPageBaseLayout from '@components/common/AdsManagerDefaultLayout';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import { TranslationNamespace } from '@constants/localization';
import PageNotFound from '@pages/404';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';

const PaymentSettingsPage = () => {
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
      <PaymentSettings />
    </AdsManagerPageBaseLayout>
  );
};

const getPageLayout = (page: ReactNode) =>
  getCreatorHubPageLayout(page, {
    headerKey: 'Heading.PaymentSettings',
    headerNamespace: TranslationNamespace.Billing,
  });

PaymentSettingsPage.getPageLayout = getPageLayout;

export default PaymentSettingsPage;
