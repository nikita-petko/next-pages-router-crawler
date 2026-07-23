import { useContext } from 'react';
import LeftNavigationStateContext from './LeftNavigationStateContext';

export default function useLeftNavigationState() {
  return useContext(LeftNavigationStateContext);
}
