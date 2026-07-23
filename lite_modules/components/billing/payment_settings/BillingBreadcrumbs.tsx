import { Breadcrumbs } from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useMediaQuery from '@hooks/useMediaQuery';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const BillingBreadcrumbs = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const { isMedium } = useMediaQuery();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  const paymentMethodLabel = translate('Heading.PaymentMethod');

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted || !isMedium) {
    return <span>{paymentMethodLabel}</span>;
  }

  return (
    <Breadcrumbs
      ariaLabel={translate('Description.Breadcrumb')}
      data-testid='breadcrumb'
      // Only two items render, so the collapse/expansion control never appears; the
      // API still requires a non-empty value, so reuse the breadcrumb nav label.
      expansionAriaLabel={translate('Description.Breadcrumb')}
      items={[
        {
          href: Routes.PAYMENT_SETTINGS,
          label: translate('Heading.PaymentSettings'),
          onClick: (e) => {
            e.preventDefault();
            router.push(Routes.PAYMENT_SETTINGS);
          },
        },
        { label: paymentMethodLabel },
      ]}
    />
  );
};

export default BillingBreadcrumbs;
