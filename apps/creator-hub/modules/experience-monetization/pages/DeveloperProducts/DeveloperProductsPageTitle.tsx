import { memo } from 'react';
import { docs } from '@modules/miscellaneous/common/urls/creatorHub';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import PageTitle from '@modules/monetization-shared/title';
import DeveloperProductsOptionsMenu from '@modules/developer-products/components/DeveloperProductsOptionsMenu';
// eslint-disable-next-line no-restricted-imports -- moving out of barrel imports
import { analyticsItemMonetizationDeveloperProductsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';

const developerProductsDocLink = docs.getDeveloperProductsMonetizationUrl();

function DeveloperProductsPageTitle() {
  const { universeId } = useUniverseId();
  if (!universeId) return null;

  return (
    <PageTitle
      titleKey={analyticsItemMonetizationDeveloperProductsNavigationItem.title.key}
      subtitleKey='Description.TakeActionDeveloperProducts'
      subtitleLink={developerProductsDocLink}
      actions={<DeveloperProductsOptionsMenu universeId={universeId} />}
    />
  );
}

export default memo(DeveloperProductsPageTitle);
