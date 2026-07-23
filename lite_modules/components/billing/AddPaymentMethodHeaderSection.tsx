import { useRouter } from 'next/router';

import { PaymentMethodActionEnum } from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const AddPaymentMethodHeaderSection = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const router = useRouter();

  return (
    <span className='text-heading-large' data-testid='addPaymentMethodHeader'>
      {router.query.action === PaymentMethodActionEnum.ADD || router.query.action === undefined
        ? translate('Heading.PaymentMethods')
        : translate('Heading.PaymentMethod')}
    </span>
  );
};

export default AddPaymentMethodHeaderSection;
