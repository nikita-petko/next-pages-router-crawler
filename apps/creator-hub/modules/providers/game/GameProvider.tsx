import type { FunctionComponent } from 'react';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import developClient from '@modules/clients/develop';
import gamesClient, { type GameDetailResponse } from '@modules/clients/games';
import gameContext from './gameContext';
import GameManager from './implementations/GameManager';

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
  const gameRequestSequence = useRef(0);

  const getGame = useCallback(async (id: number, isDataRefreshed = false) => {
    const requestSequence = (gameRequestSequence.current += 1);
    const configurationCallback = gameManager.getConfiguration(id);
    const gameDetailCallback = gameManager.getGameDetail(id, isDataRefreshed);
    const [configurationRes, gameDetailRes] = await Promise.allSettled([
      configurationCallback,
      gameDetailCallback,
    ]);
    if (requestSequence !== gameRequestSequence.current) {
      return;
    }
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
    if (typeof id === 'string') {
      return parseInt(id, 10);
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
        void getGame(gameId);
        return;
      }
      gameRequestSequence.current += 1;
      setCanConfigure(null);
      setGameDetails(null);
      setIsErrorLoadingGame(false);
      setIsLoadingGame(false);
    } catch {
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
  return <gameContext.Provider value={gameContextProviderValue}>{children}</gameContext.Provider>;
};

export function useCurrentGame() {
  const context = useContext(gameContext);
  if (context === null) {
    throw new Error('useCurrentGame must be used within a GameProvider');
  }
  return context;
}

export default GameProvider;
