import { AdAccountType } from '@constants/app';
import { useAppStore } from '@stores/appStoreProvider';
import { usePaymentStore } from '@stores/paymentStoreProvider';

const useNeedsPaymentSetup = (): boolean => {
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const hasAdAccount = !!useAppStore((state) => state.appData.adAccountId);
  const hasPaymentProfile = usePaymentStore((state) => state.paymentProfiles?.data?.length > 0);
  const adCreditActivated = useAppStore((state) => state.adCreditState.data?.is_account_activated);
  const isInvoiceAccount = useAppStore((state) =>
    [AdAccountType.AD_ACCOUNT_TYPE_INTERNAL, AdAccountType.AD_ACCOUNT_TYPE_MANAGED].includes(
      state.advertiserState.data?.ad_account?.type ?? AdAccountType.AD_ACCOUNT_TYPE_SELF_SERVICE,
    ),
  );

  return (
    isAdAccountAutoCreateEnabled &&
    hasAdAccount &&
    !hasPaymentProfile &&
    !adCreditActivated &&
    !isInvoiceAccount
  );
};

export default useNeedsPaymentSetup;
