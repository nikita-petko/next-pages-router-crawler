import { useRouter } from 'next/router';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import { useCurrentGame } from '@modules/providers/game/GameProvider';

const useUniverseRelatedSession = () => {
  const { query } = useRouter();
  const { gameDetails, isErrorLoadingGame, isLoadingGame } = useCurrentGame();
  const hasUniverseId = gameDetails?.id != null;
  const sessionId = typeof query.sessionId === 'string' ? query.sessionId : undefined;

  return {
    universeId: gameDetails?.id ?? uninitializedUniverseId,
    sessionId,
    isErrorLoadingUniverse: isErrorLoadingGame ? true : !hasUniverseId,
    isLoadingUniverse: isLoadingGame,
  };
};

export default useUniverseRelatedSession;
