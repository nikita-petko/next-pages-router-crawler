/* istanbul ignore file */
import { memo } from 'react';
import { useTranslation } from '@rbx/intl';
import { clsx } from '@rbx/foundation-ui';
import { useUniversePermissions } from '@modules/react-query/organizations';
import PageTitle from '@modules/monetization-shared/title';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import { useTabs } from '@modules/monetization-shared/tabs/useTabs';
import { useGetManagedPricingStatus } from '../queries/useGetManagedPricingStatus';
import { MANAGED_PRICING_TABS } from '../types';

function ManagedPricingPageTitle() {
  const { translate } = useTranslation();
  const { universeId } = useUniverseId();

  const { data: permissions } = useUniversePermissions(universeId);
  const { data: managedPricingStatus } = useGetManagedPricingStatus(universeId, {
    enabled: !!universeId,
  });

  const { activeTab, setActiveTab } = useTabs(MANAGED_PRICING_TABS, 'overview');

  const hasPermission = permissions?.monetizeExperience || permissions?.viewAnalytics;
  const shouldShowPageContent = managedPricingStatus?.status === 'Accepted';
  if (!hasPermission || !shouldShowPageContent) {
    // Note: this is the title component, which will not be rendered under certain conditions
    return null;
  }

  const shouldHideAddItemsAction = activeTab !== 'overview';

  return (
    <PageTitle
      titleKey='Heading.ManagedPricing'
      subtitleKey='Description.ManagedPricingSubtitle'
      actionProps={{
        // TODO(jeminpark): coming back to this after conferring with design
        className: clsx(
          shouldHideAddItemsAction ? 'invisible' : undefined, // Option 1 - maintain layout position in smaller space
          'hidden medium:inline-flex', // Option 2 - hide for smaller screens entirely
        ),
        onClick: () => setActiveTab('manage-items'),
        children: translate('Action.AddItems'),
      }}
    />
  );
}

export default memo(ManagedPricingPageTitle);
