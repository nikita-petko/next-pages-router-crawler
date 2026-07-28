import { useContext, useMemo } from 'react';
import { GameInstanceV2ActionsContext } from '../providers/GameInstanceContextV2';
import type { GameInstanceV2ActionsContextValue } from '../providers/GameInstanceContextV2';

function useServerManagementV2<T = undefined>(
  selector?: (context: GameInstanceV2ActionsContextValue) => T,
): T extends undefined ? GameInstanceV2ActionsContextValue : T {
  const context = useContext(GameInstanceV2ActionsContext);

  if (!context) {
    throw new Error('useServerManagementV2 must be used within a GameInstanceProviderV2');
  }

  return useMemo(
    () => (selector ? selector(context) : context),
    [context, selector],
  ) as T extends undefined ? GameInstanceV2ActionsContextValue : T;
}

export default useServerManagementV2;
