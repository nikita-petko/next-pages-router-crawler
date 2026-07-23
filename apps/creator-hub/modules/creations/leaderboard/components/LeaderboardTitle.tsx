import type { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFlag } from '@rbx/flags';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { isLeaderboardConfigsEnabled as isLeaderboardConfigsEnabledFlag } from '@generated/flags/leaderboards';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { fetchLeaderboardConfig, getLeaderboardConfigQueryKey } from '../leaderboardConfigApi';
import { useLeaderboardCreateAction } from '../queries/useLeaderboardCreateAction';
import LeaderboardFormSheet from './LeaderboardFormSheet/LeaderboardFormSheet';

const LeaderboardTitleInner: FC = () => {
  const { ready: isLeaderboardConfigsReady, value: isLeaderboardConfigsEnabledValue } = useFlag(
    isLeaderboardConfigsEnabledFlag,
  );
  const isLeaderboardConfigsEnabled = isLeaderboardConfigsReady && isLeaderboardConfigsEnabledValue;
  const { translate } = useTranslationWrapper(useTranslation());
  const { gameDetails } = useCurrentGame();
  const universeId = gameDetails?.id;
  const { data: permissions } = useUniversePermissions(universeId);
  const canManageLeaderboards = permissions?.publish === true;

  // Shares the React Query cache key with LeaderboardContainer so this is a deduped subscription.
  const { data } = useQuery({
    queryKey: getLeaderboardConfigQueryKey(universeId),
    enabled: universeId != null && isLeaderboardConfigsEnabled,
    queryFn: () => fetchLeaderboardConfig(String(universeId)),
  });

  // Title and container live in separate React subtrees (set via getPageLayout), so each
  // entry point owns its own sheet instance. Submission flows through the shared React
  // Query cache, so any updates land in both views automatically.
  const { isOpen, open, close, formSheetProps } = useLeaderboardCreateAction();

  if (!isLeaderboardConfigsEnabled || !canManageLeaderboards) {
    return null;
  }

  const title = translate(translationKey('Heading.Leaderboard', TranslationNamespace.Leaderboards));
  const createLabel = translate(translationKey('Action.Create', TranslationNamespace.Leaderboards));

  const hasLeaderboards = (data?.leaderboards.length ?? 0) > 0;

  return (
    <div className='flex items-center justify-between gap-large width-full'>
      <h1 className='text-heading-large margin-none'>{title}</h1>
      {hasLeaderboards && (
        <>
          <Button variant='Emphasis' size='Medium' onClick={open}>
            {createLabel}
          </Button>
          {isOpen && (
            <LeaderboardFormSheet mode='create' onClose={close} config={data} {...formSheetProps} />
          )}
        </>
      )}
    </div>
  );
};

export default withNamespaceSwitchedTranslation(LeaderboardTitleInner, [
  TranslationNamespace.CommonUIMessages,
  TranslationNamespace.Leaderboards,
]);
