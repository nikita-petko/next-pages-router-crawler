import { useContext, useMemo } from 'react';
import { GameInstanceActionsContext } from '../providers/GameInstanceContext';

import type { GameInstanceActionsContextValue } from '../providers/GameInstanceContext';

function useServerManagement<T = undefined>(
  selector?: (context: GameInstanceActionsContextValue) => T,
): T extends undefined ? GameInstanceActionsContextValue : T {
  const context = useContext(GameInstanceActionsContext);

  if (!context) {
    throw new Error('useServerManagement must be used within a GameInstanceProvider');
  }

  return useMemo(
    () => (selector ? selector(context) : context),
    [context, selector],
  ) as T extends undefined ? GameInstanceActionsContextValue : T;
}

export default useServerManagement;
