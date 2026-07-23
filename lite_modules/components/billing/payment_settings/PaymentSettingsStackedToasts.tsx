import { useEffect } from 'react';

import GenericSnackBar from '@components/common/GenericSnackBar';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useToastStore } from '@stores/toastStoreProvider';

const PaymentSettingsStackedToasts = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const {
    clearPaymentSettingsStackedToasts,
    setShowDisableAllAutoReloadError,
    setShowDisableAllAutoReloadSuccessful,
    showDisableAllAutoReloadError,
    showDisableAllAutoReloadSuccessful,
  } = useToastStore();

  useEffect(() => () => clearPaymentSettingsStackedToasts(), [clearPaymentSettingsStackedToasts]);

  return (
    <>
      {showDisableAllAutoReloadSuccessful && (
        <GenericSnackBar
          message={translate('Heading.DisableAllAutoReloadSuccess')}
          onClose={() => setShowDisableAllAutoReloadSuccessful(false)}
          severity='success'
        />
      )}
      {showDisableAllAutoReloadError && (
        <GenericSnackBar
          message={translate('Heading.DisableAllAutoReloadError')}
          onClose={() => setShowDisableAllAutoReloadError(false)}
          severity='error'
        />
      )}
    </>
  );
};

export default PaymentSettingsStackedToasts;
