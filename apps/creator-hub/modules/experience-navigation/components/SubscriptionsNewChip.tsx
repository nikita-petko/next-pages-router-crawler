import { FC, useMemo } from 'react';
import { Chip } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { useAuthentication } from '@modules/authentication/providers';
// eslint-disable-next-line no-restricted-imports -- deep import required to avoid circular dependency between experience-navigation and creations barrels
import useDevSubsInRobuxGate from '@modules/creations/experienceSubscriptions/hooks/useDevSubsInRobuxGate';

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
  const isDevSubsEnabled = useDevSubsInRobuxGate();

  if (!isDevSubsEnabled || hasUserSeen) {
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
