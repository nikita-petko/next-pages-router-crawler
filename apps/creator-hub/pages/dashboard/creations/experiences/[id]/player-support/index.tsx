import { useEffect } from 'react';
import type { FC, ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import { PageLoading } from '@modules/miscellaneous/components';
import { PageNotFound } from '@modules/miscellaneous/error';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import { useHasUserSeenPlayerSupportNew } from '@modules/player-support/components/PlayerSupportNewChip';
import PlayerSupportPage from '@modules/player-support/components/PlayerSupportPage';
import { useCreatorGameopsFlags } from '@modules/player-support/flags/useCreatorGameopsFlags';

const PlayerSupportTitle: FC = () => {
  const universeIdResult = useUniverseId();
  const universeId =
    !universeIdResult.isLoading && !universeIdResult.isError ? universeIdResult.universeId : 0;
  const { enablePlayerSupport, ready } = useCreatorGameopsFlags('enablePlayerSupport', {
    universeId,
  });
  const { translate } = useTranslation();

  if (universeIdResult.isLoading || !ready || !enablePlayerSupport) {
    return null;
  }

  return (
    <div className='gap-small flex flex-col'>
      <h1 className='content-emphasis text-heading-large margin-none'>
        {translate('Heading.PlayerSupport')}
      </h1>
      <Typography variant='body1'>
        {translate('Description.LearnMoreSupportSubtitleWithoutDoc')}
      </Typography>
    </div>
  );
};

const PlayerSupport: NextLayoutPage = () => {
  const { setHasUserSeen } = useHasUserSeenPlayerSupportNew();
  useEffect(() => {
    setHasUserSeen(true);
  }, [setHasUserSeen]);

  const universeIdResult = useUniverseId();
  const universeId =
    !universeIdResult.isLoading && !universeIdResult.isError ? universeIdResult.universeId : 0;

  const { enablePlayerSupport, ready } = useCreatorGameopsFlags('enablePlayerSupport', {
    universeId,
  });

  if (universeIdResult.isLoading || !ready) {
    return <PageLoading />;
  }

  if (universeIdResult.isError || !enablePlayerSupport) {
    return <PageNotFound />;
  }

  return (
    <Authenticated>
      <PlayerSupportPage />
    </Authenticated>
  );
};

PlayerSupport.getPageLayout = (page: ReactNode) =>
  getCreationsPageLayout(page, { title: <PlayerSupportTitle /> });
PlayerSupport.loggerConfig = { rosId: RosTeams.GameOperations };

export default PlayerSupport;
