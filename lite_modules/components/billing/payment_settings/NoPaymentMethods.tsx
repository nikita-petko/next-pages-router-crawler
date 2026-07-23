import { Button } from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import { memo } from 'react';

import GenericNoDataPage from '@components/common/GenericNoDataPage';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

// Component to show when user has no payment methods
const NoPaymentMethods = memo(() => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const router = useRouter();

  const redirectToAddPaymentMethodPage = () => {
    router.push({ pathname: Routes.ADD_PAYMENT });
  };

  return (
    <GenericNoDataPage
      iconName='icon-regular-wallet'
      outlined
      primaryButton={
        <Button
          data-testid='addPaymentMethodButton'
          onClick={redirectToAddPaymentMethodPage}
          size='Medium'
          variant='Emphasis'>
          {translate('Heading.AddPaymentMethod')}
        </Button>
      }
      subtitle={translate('Description.UnverifiedPaymentMethodWarning')}
      title={translate('Description.NoPaymentMethodsSaved')}
    />
  );
});

export default NoPaymentMethods;
