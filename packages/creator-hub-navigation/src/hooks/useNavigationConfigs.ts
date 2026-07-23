import { useContext } from 'react';
import NavigationConfigsContext from './NavigationConfigsContext';

export default function useNavigationConfigs() {
  return useContext(NavigationConfigsContext);
}
