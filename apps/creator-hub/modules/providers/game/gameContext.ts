import type { Context } from 'react';
import { createContext } from 'react';
import type { UseGameReturnType } from './interfaces/CurrentGameDetails';

export interface GameContext extends Context<UseGameReturnType> {
  displayName: 'Game';
}

const gameContext = createContext<UseGameReturnType>({
  isLoadingGame: false,
  isErrorLoadingGame: false,
  canConfigure: false,
  gameDetails: null,
  refreshGameDetails: () => {
    throw new Error('Not implemented');
  },
});
gameContext.displayName = 'Game';

export default gameContext;
