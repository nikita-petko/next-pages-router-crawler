import { memo } from 'react';
import NextLink from 'next/link';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { analyticsItemMonetizationDeveloperProductsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import DeveloperProductsOptionsMenu from '@modules/developer-products/components/DeveloperProductsOptionsMenu';
import { useIsManagedPricingAvailable } from '@modules/managed-pricing/hooks/useIsManagedPricingAvailable';
import { dashboard, docs } from '@modules/miscellaneous/urls/creatorHub';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import PageTitle from '@modules/monetization-shared/title';
import { useUniversePermissions } from '@modules/react-query/organizations';

const developerProductsDocLink = docs.getDeveloperProductsMonetizationUrl();
const getCreateDeveloperProductLink = dashboard.getCreateDeveloperProductUrl;

function DeveloperProductsPageTitle() {
  const { translate } = useTranslation();
  const { universeId } = useUniverseId();
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);

  // V2 flow with Managed Pricing
  const { data: isManagedPricingAvailable } = useIsManagedPricingAvailable(universeId);

  if (!universeId) {
    return null;
  }

  return (
    <PageTitle
      titleKey={analyticsItemMonetizationDeveloperProductsNavigationItem.title.key}
      subtitleKey='Description.TakeActionDeveloperProducts'
      subtitleLink={developerProductsDocLink}
      actions={
        <div className='flex items-center gap-small'>
          {isManagedPricingAvailable && (
            <Button
              asChild
              data-testid='createAssociatedItemsButton'
              variant='Emphasis'
              size='Medium'
              isLoading={isLoadingPermissions}
              isDisabled={!permissions?.monetizeExperience}>
              <NextLink href={getCreateDeveloperProductLink(universeId)}>
                {translate(
                  'Action.CreateDeveloperProduct' /* TranslationNamespace.DeveloperProducts */,
                )}
              </NextLink>
            </Button>
          )}
          <DeveloperProductsOptionsMenu
            universeId={universeId}
            variant={isManagedPricingAvailable ? 'Standard' : 'Utility'}
            showManagedPricing={isManagedPricingAvailable}
          />
        </div>
      }
      className={isManagedPricingAvailable ? 'wrap' : undefined}
    />
  );
}

export default memo(DeveloperProductsPageTitle);
