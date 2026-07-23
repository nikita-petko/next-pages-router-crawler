import { Breadcrumbs } from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import { FC } from 'react';

import { FlowTypes } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';

const HeaderTitleKey = {
  [FlowTypes.CLONE]: 'Heading.DuplicateCampaign',
  [FlowTypes.CREATE]: 'Heading.CreateCampaign',
  [FlowTypes.EDIT]: 'Heading.EditCampaign',
};

type CampaignBreadcrumbsProps = {
  classic?: boolean;
};

const CampaignBreadcrumbs: FC<CampaignBreadcrumbsProps> = ({ classic = false }) => {
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateBilling } = useNamespacedTranslation(TranslationNamespace.Billing);
  const router = useRouter();
  const title = useCampaignBuilderStore(({ flowType }) =>
    translateCampaign(HeaderTitleKey[flowType ?? FlowTypes.CREATE]),
  );
  const manageAdsHref = classic ? Routes.CLASSIC : Routes.MANAGE;

  return (
    <Breadcrumbs
      ariaLabel={translateBilling('Description.Breadcrumb')}
      // Only two items render, so the collapse/expansion control never appears; the
      // API still requires a non-empty value, so reuse the breadcrumb nav label.
      expansionAriaLabel={translateBilling('Description.Breadcrumb')}
      items={[
        {
          href: manageAdsHref,
          label: translateCampaign('Heading.ManageAds'),
          onClick: (e) => {
            e.preventDefault();
            router.push(manageAdsHref);
          },
        },
        { label: title },
      ]}
    />
  );
};

export default CampaignBreadcrumbs;
