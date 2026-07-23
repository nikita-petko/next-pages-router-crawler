import { useRouter } from 'next/router';

import AlertToast from '@components/billing/AlertToast';
import useFailedCardAuthToastStyles from '@components/billing/FailedCardAuthToast.styles';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import { AlertToastLevel } from '@constants/toastConstants';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const FailedCardAuthToast = () => {
  const router = useRouter();
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const redirectToAddPaymentMethod = () => {
    router.push(Routes.ADD_PAYMENT);
  };

  const {
    classes: { toastContainer },
  } = useFailedCardAuthToastStyles();

  return (
    <section className={toastContainer} data-testid='failed-auth-card-toast'>
      <AlertToast
        header={translate('Heading.FailedAuthenticateYourCard')}
        level={AlertToastLevel.Error}
        onPrimaryButtonClick={redirectToAddPaymentMethod}
        primaryButtonText={translate('Action.AddCard')}
        text={translate('Warning.FailedAuthenticateCard')}
      />
    </section>
  );
};

export default FailedCardAuthToast;
