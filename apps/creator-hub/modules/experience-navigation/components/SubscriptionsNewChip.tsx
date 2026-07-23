import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { Chip } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';

const hasUserSeenKey = (userId: number) => `subscriptions.monetization.${userId}.hasUserSeen`;

export const useHasUserSeenSubscriptionsNew = () => {
  const { user } = useAuthentication();
  const [hasUserSeen, setHasUserSeen] = useLocalStorage<boolean>(
    hasUserSeenKey(user?.id ?? -1),
    false,
  );

  return useMemo(
    () => ({ hasUserSeen: user?.id ? hasUserSeen : false, setHasUserSeen }),
    [hasUserSeen, setHasUserSeen, user?.id],
  );
};

const SubscriptionsNewChip: FC = () => {
  const { translate } = useTranslation();
  const { hasUserSeen } = useHasUserSeenSubscriptionsNew();

  if (hasUserSeen) {
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

export default SubscriptionsNewChip;
