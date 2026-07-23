import { useRouter } from 'next/router';
import { ReactNode } from 'react';

import AddPaymentMethod from '@components/billing/AddPaymentMethod';
import AddPaymentMethodHeaderSection from '@components/billing/AddPaymentMethodHeaderSection';
import BillingBreadcrumbs from '@components/billing/payment_settings/BillingBreadcrumbs';
import AdsManagerPageBaseLayout from '@components/common/AdsManagerDefaultLayout';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import GenericSnackBar from '@components/common/GenericSnackBar';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import PageNotFound from '@pages/404';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useToastStore } from '@stores/toastStoreProvider';

const AddPaymentMethodPage = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const accountIsInternal = useAppStore((state: AppStoreType) =>
    state.adAccountIsInternalManaged(),
  );
  const accountIsManaged = useAppStore((state: AppStoreType) => state.adAccountIsExternalManaged());

  const isPaymentsPagesForLOCEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isPaymentsPagesForLOCEnabled,
  );
  const { setShowPurchaseAdCreditError, showPurchaseAdCreditError } = useToastStore();

  const router = useRouter();

  if ((accountIsInternal || accountIsManaged) && !isPaymentsPagesForLOCEnabled) {
    return <PageNotFound />;
  }

  const { fromSuccessfulAdAccountCreation = false } = router.query;

  return (
    <AdsManagerPageBaseLayout headerSection={<AddPaymentMethodHeaderSection />} isLoading={false}>
      {fromSuccessfulAdAccountCreation && (
        <GenericSnackBar message={translate('Message.AdAccountCreated')} severity='success' />
      )}
      {showPurchaseAdCreditError && (
        <GenericSnackBar
          message={translate('Heading.BuyAdCreditError')}
          onClose={() => setShowPurchaseAdCreditError(false)}
          severity='error'
        />
      )}
      <AddPaymentMethod />
    </AdsManagerPageBaseLayout>
  );
};

const getPageLayout = (page: ReactNode) =>
  getCreatorHubPageLayout(page, { header: <BillingBreadcrumbs /> });

AddPaymentMethodPage.getPageLayout = getPageLayout;

export default AddPaymentMethodPage;
