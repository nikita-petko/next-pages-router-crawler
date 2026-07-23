import { Typography } from '@rbx/ui';
import { useRouter } from 'next/router';

import { PaymentMethodActionEnum } from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const AddPaymentMethodHeaderSection = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const router = useRouter();

  return (
    <Typography data-testid='addPaymentMethodHeader' variant='h1'>
      {router.query.action === PaymentMethodActionEnum.ADD || router.query.action === undefined
        ? translate('Heading.PaymentMethods')
        : translate('Heading.PaymentMethod')}
    </Typography>
  );
};

export default AddPaymentMethodHeaderSection;
