/**
 * Hook that exposes the full history API (track, get, remove, clear).
 * Must be used inside a {@link HistoryProvider}.
 */

import { useContext } from 'react';
import { HistoryContext } from '../providers/HistoryProvider';

const useHistory = () => {
  // HistoryContext has a default value that throws on method calls, so
  // `context` is never null. This guard is a defensive check in case
  // the default is removed in the future.
  const context = useContext(HistoryContext);

  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }

  return context;
};

export default useHistory;
