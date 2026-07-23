import { memo } from 'react';
import NextLink from 'next/link';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { analyticsItemMonetizationPassesNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { useIsManagedPricingAvailable } from '@modules/managed-pricing/hooks/useIsManagedPricingAvailable';
import { dashboard, docs } from '@modules/miscellaneous/urls/creatorHub';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import PageTitle from '@modules/monetization-shared/title';
import PassesOptionsMenu from '@modules/passes/components/PassesOptionsMenu';
import { useUniversePermissions } from '@modules/react-query/organizations';

const gamePassesDocLink = docs.getPassesMonetizationUrl();
const getCreatePassLink = dashboard.getCreatePassUrl;

function GamePassesPageTitle() {
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
      titleKey={analyticsItemMonetizationPassesNavigationItem.title.key}
      subtitleKey='Description.TakeActionPasses'
      subtitleLink={gamePassesDocLink}
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
              <NextLink href={getCreatePassLink(universeId)}>
                {translate('Action.CreatePass' /* TranslationNamespace.Passes */)}
              </NextLink>
            </Button>
          )}
          <PassesOptionsMenu
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

export default memo(GamePassesPageTitle);
