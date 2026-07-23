import { useContext } from 'react';
import lookContext from './LookDetailsContext';

export default function useCurrentLook() {
  return useContext(lookContext);
}
