import { useEffect } from 'react';

import GenericSnackBar from '@components/common/GenericSnackBar';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useToastStore } from '@stores/toastStoreProvider';

const CreationFormStackedToasts = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const {
    clearCreateStackedToasts,
    setShowPurchaseAdCreditError,
    setShowPurchaseAdCreditSuccessful,
    showPurchaseAdCreditError,
    showPurchaseAdCreditSuccessful,
  } = useToastStore();

  useEffect(() => () => clearCreateStackedToasts(), [clearCreateStackedToasts]);

  return (
    <>
      {showPurchaseAdCreditSuccessful && (
        <GenericSnackBar
          message={translate('Heading.BuyAdCreditSuccess')}
          onClose={() => setShowPurchaseAdCreditSuccessful(false)}
          severity='success'
        />
      )}
      {showPurchaseAdCreditError && (
        <GenericSnackBar
          message={translate('Heading.BuyAdCreditError')}
          onClose={() => setShowPurchaseAdCreditError(false)}
          severity='error'
        />
      )}
    </>
  );
};

export default CreationFormStackedToasts;
