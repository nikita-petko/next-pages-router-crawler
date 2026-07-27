import { Breadcrumbs } from '@rbx/foundation-ui';

import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

/**
 * CreatorHub chrome breadcrumb for Manage Ads: Campaigns / Manage ads.
 * Matches Foundation HeaderBar in Ads Manager Foundation Web.
 */
const ManageAdsBreadcrumbs = () => {
  const { translate: translateNavigation } = useNamespacedTranslation(
    TranslationNamespace.Navigation,
  );
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateBilling } = useNamespacedTranslation(TranslationNamespace.Billing);

  return (
    <Breadcrumbs
      ariaLabel={translateBilling('Description.Breadcrumb')}
      data-testid='manage-ads-breadcrumb'
      // Only two items render, so the collapse/expansion control never appears; the
      // API still requires a non-empty value, so reuse the breadcrumb nav label.
      expansionAriaLabel={translateBilling('Description.Breadcrumb')}
      items={[
        { label: translateNavigation('Label.Campaigns') },
        { label: translateCampaign('Heading.ManageAds') },
      ]}
    />
  );
};

export default ManageAdsBreadcrumbs;
