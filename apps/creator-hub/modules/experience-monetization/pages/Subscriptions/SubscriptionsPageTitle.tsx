import { memo } from 'react';
import NextLink from 'next/link';
import { useTranslation } from '@rbx/intl';
import { analyticsSubscriptionsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import PageTitle from '@modules/monetization-shared/title';
import { useUniversePermissions } from '@modules/react-query/organizations';

// TODO: move to central URLs
const subscriptionsDocLink = '/docs/production/monetization/subscriptions';
const createSubscriptionLink = dashboard.getCreateExperienceSubscriptionUrl;

function SubscriptionsPageTitle() {
  const { translate } = useTranslation();
  const { universeId } = useUniverseId();
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);
  if (!universeId) {
    return null;
  }

  return (
    <PageTitle
      titleKey={analyticsSubscriptionsNavigationItem.title.key}
      subtitleKey='Description.TakeActionSubscriptions'
      subtitleLink={subscriptionsDocLink}
      actionProps={{
        asChild: true,
        variant: 'Emphasis',
        isLoading: isLoadingPermissions,
        isDisabled: !permissions?.monetizeExperience,
        children: (
          <NextLink href={createSubscriptionLink(universeId)}>
            {translate('Action.CreateSubscription')}
          </NextLink>
        ),
      }}
      className='wrap' // TODO: revisiting this once we iterate on creator hub layout
    />
  );
}

export default memo(SubscriptionsPageTitle);
