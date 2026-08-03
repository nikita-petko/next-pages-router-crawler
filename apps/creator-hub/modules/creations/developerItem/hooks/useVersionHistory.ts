import { useContext } from 'react';
import versionHistoryContext from './VersionHistoryContext';

export default function useVersionHistory() {
  return useContext(versionHistoryContext);
}
