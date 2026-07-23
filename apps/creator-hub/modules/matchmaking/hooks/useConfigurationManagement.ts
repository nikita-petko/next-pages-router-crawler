import { useContext } from 'react';
import MatchmakingConfigurationContext from '../providers/MatchmakingConfigurationContext';

export default function useConfigurationManagement() {
  return useContext(MatchmakingConfigurationContext);
}
