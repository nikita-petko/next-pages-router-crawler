import { Breadcrumbs } from '@rbx/foundation-ui';
import { useRouter } from 'next/router';

import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const AdIntegrationBreadcrumbs = () => {
  const { translate: translateBilling } = useNamespacedTranslation(TranslationNamespace.Billing);
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const router = useRouter();
  return (
    <Breadcrumbs
      ariaLabel={translateBilling('Description.Breadcrumb')}
      data-testid='breadcrumb'
      // Only two items render, so the collapse/expansion control never appears; the
      // API still requires a non-empty value, so reuse the breadcrumb nav label.
      expansionAriaLabel={translateBilling('Description.Breadcrumb')}
      items={[
        {
          href: Routes.AD_INTEGRATIONS,
          label: translateAccount('Heading.AdIntegrations'),
          onClick: (e) => {
            e.preventDefault();
            router.push(Routes.AD_INTEGRATIONS);
          },
        },
        { label: translateMisc('Heading.Registration') },
      ]}
    />
  );
};

export default AdIntegrationBreadcrumbs;
