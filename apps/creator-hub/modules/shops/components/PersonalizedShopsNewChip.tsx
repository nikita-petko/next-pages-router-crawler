import type { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import { Chip } from '@rbx/ui';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import { useHasSeenPersonalizedShops } from '../hooks/useHasSeenPersonalizedShops';

/**
 * "New" chip rendered next to the Personalized Shops entry in the creations left
 * nav. Dismisses as soon as the user has visited the Personalized Shops page.
 */
const PersonalizedShopsNewChip: FC = () => {
  const { translate } = useTranslation();
  const route = useUniverseId();
  const universeId = 'universeId' in route ? route.universeId : undefined;
  const { hasSeen } = useHasSeenPersonalizedShops(universeId);

  if (hasSeen) {
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

export default PersonalizedShopsNewChip;
