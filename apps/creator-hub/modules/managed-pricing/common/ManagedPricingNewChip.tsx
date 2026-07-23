import type { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import { Chip } from '@rbx/ui';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import { useGetManagedPricingStatus } from '../queries/useGetManagedPricingStatus';
import { useHasSeenManagedPricing } from './useHasSeenManagedPricing';

/**
 * "New" chip rendered next to the Managed Pricing entry in the creations left
 * nav. Dismisses only when the universe has fully onboarded (`status === 'Accepted'`)
 * AND the user has visited the Managed Pricing page
 */
const ManagedPricingNewChip: FC = () => {
  const { translate } = useTranslation();
  const route = useUniverseId();
  const universeId = 'universeId' in route ? route.universeId : undefined;
  const { data: status } = useGetManagedPricingStatus(universeId, {
    select: (data) => data.status,
  });
  const { hasSeen } = useHasSeenManagedPricing(universeId);

  if (status === 'Accepted' && hasSeen) {
    return null;
  }

  return (
    <Chip
      label={translate('Label.New')}
      color='primaryBrand'
      variant='filled'
      component='span'
      size='small'
    />
  );
};

export default ManagedPricingNewChip;
