import { useContext } from 'react';
import MatchmakingAttributesContext from '../providers/MatchmakingAttributesContext';

export default function useAttributesManagement() {
  return useContext(MatchmakingAttributesContext);
}
