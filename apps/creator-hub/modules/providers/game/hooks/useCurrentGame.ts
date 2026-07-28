import { useContext } from 'react';
import GameContext from '../gameContext';

export default function useCurrentGame() {
  return useContext(GameContext);
}
