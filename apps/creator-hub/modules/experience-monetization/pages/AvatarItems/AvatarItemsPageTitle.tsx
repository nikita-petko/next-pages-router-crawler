import { memo } from 'react';
import { analyticsItemMonetizationAvatarItemsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import PageTitle from '@modules/monetization-shared/title';

// TODO: move to central URLs
const avatarItemsDocLink = '/docs/production/monetization/avatar-items';

function AvatarItemsPageTitle() {
  const { universeId } = useUniverseId();

  if (!universeId) {
    return null;
  }

  return (
    <PageTitle
      titleKey={analyticsItemMonetizationAvatarItemsNavigationItem.title.key}
      subtitleKey='Description.TakeActionAvatarItemCommissions'
      subtitleLink={avatarItemsDocLink}
    />
  );
}

export default memo(AvatarItemsPageTitle);
