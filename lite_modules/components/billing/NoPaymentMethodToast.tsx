import { useRouter } from 'next/router';

import AlertToast from '@components/billing/AlertToast';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import { AlertToastLevel } from '@constants/toastConstants';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const NoPaymentMethodToast = () => {
  const router = useRouter();
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const handleAddCardButtonClick = () => {
    router.push(Routes.ADD_PAYMENT);
  };

  return (
    <AlertToast
      header={translate('Heading.NoPaymentMethod')}
      level={AlertToastLevel.Warning}
      onPrimaryButtonClick={handleAddCardButtonClick}
      primaryButtonText={translate('Heading.AddPaymentMethod')}
      text={translate('Description.UnverifiedPaymentMethodWarning')}
    />
  );
};

export default NoPaymentMethodToast;
