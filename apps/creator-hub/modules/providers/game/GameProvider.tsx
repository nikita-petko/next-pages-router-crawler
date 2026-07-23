import React, {
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { gamesClient, developClient, GameDetailResponse } from '@modules/clients';
import { useRouter } from 'next/router';
import GameManager from './implementations/GameManager';
import GameContext from './gameContext';

interface GameProviderProps {
  // When specified, this will instruct the provider to ignore the id on the router's path
  // and instead attempt to manage the details for the specified game
  requestedGameId?: number;
}

const gameManager = new GameManager(gamesClient, developClient);

const GameProvider: FunctionComponent<React.PropsWithChildren<GameProviderProps>> = ({
  requestedGameId,
  children,
}) => {
  const router = useRouter();
  const [isLoadingGame, setIsLoadingGame] = useState<boolean>(true);
  const [canConfigure, setCanConfigure] = useState<boolean | null>(null);
  const [gameDetails, setGameDetails] = useState<GameDetailResponse | null>(null);
  const [isErrorLoadingGame, setIsErrorLoadingGame] = useState<boolean>(false);

  const getGame = useCallback(async (id: number, isDataRefreshed = false) => {
    const configurationCallback = gameManager.getConfiguration(id);
    const gameDetailCallback = gameManager.getGameDetail(id, isDataRefreshed);
    const [configurationRes, gameDetailRes] = await Promise.allSettled([
      configurationCallback,
      gameDetailCallback,
    ]);
    if (configurationRes.status === 'fulfilled') {
      setCanConfigure(configurationRes.value);
    } else {
      setCanConfigure(null);
    }
    if (gameDetailRes.status === 'fulfilled') {
      setIsErrorLoadingGame(false);
      setGameDetails(gameDetailRes.value);
    } else if (gameDetailRes.status === 'rejected') {
      setIsErrorLoadingGame(true);
      setGameDetails(null);
    } else {
      setIsErrorLoadingGame(false);
      setGameDetails(null);
    }
    setIsLoadingGame(false);
  }, []);

  const gameId = useMemo(() => {
    const { id } = router.query;

    // Explicitly-specified id takes precedence over the path
    if (requestedGameId) {
      return requestedGameId;
    }

    // Fallback on the id in the path
    if (id) {
      return parseInt(id as string, 10);
    }
    return undefined;
  }, [requestedGameId, router.query]);

  const refreshGameDetails = useCallback(() => {
    if (gameId) {
      return getGame(gameId, true);
    }
    return Promise.reject(new Error('Cannot refresh game details without a game ID'));
  }, [gameId, getGame]);

  useEffect(() => {
    try {
      if (typeof gameId !== 'undefined' && !Number.isNaN(gameId) && gameId > 0) {
        getGame(gameId);
      }
    } catch {
      // eslint-disable-next-line no-console -- Codeowners should handle this
      console.warn(`Could not fetch game details for universeId ${gameId}`);
    }
  }, [gameId, getGame]);

  const gameContextProviderValue = useMemo(
    () => ({
      isLoadingGame,
      canConfigure,
      gameDetails,
      isErrorLoadingGame,
      refreshGameDetails,
    }),
    [isLoadingGame, canConfigure, gameDetails, isErrorLoadingGame, refreshGameDetails],
  );
  return <GameContext.Provider value={gameContextProviderValue}>{children}</GameContext.Provider>;
};

export function useCurrentGame() {
  const context = useContext(GameContext);
  if (context === null) {
    throw new Error('useCurrentGame must be used within a GameProvider');
  }
  return context;
}

export default GameProvider;
