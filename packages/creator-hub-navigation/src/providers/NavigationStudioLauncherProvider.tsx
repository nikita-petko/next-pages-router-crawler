import type { FunctionComponent, PropsWithChildren } from 'react';
import React, { createContext, useContext, useMemo } from 'react';
import type { StudioDialogParams } from '@rbx/studio';

type TNavigationStudioLauncher = {
  openStudio: (params: StudioDialogParams) => void;
};

const NavigationStudioLauncherContext = createContext<TNavigationStudioLauncher | null>(null);
NavigationStudioLauncherContext.displayName = 'NavigationStudioLauncherContext';

export const NavigationStudioLauncherProvider: FunctionComponent<
  PropsWithChildren<TNavigationStudioLauncher>
> = ({ openStudio, children }) => {
  const value = useMemo(() => ({ openStudio }), [openStudio]);
  return (
    <NavigationStudioLauncherContext.Provider value={value}>
      {children}
    </NavigationStudioLauncherContext.Provider>
  );
};

export const useNavigationStudioLauncher = (): TNavigationStudioLauncher => {
  const context = useContext(NavigationStudioLauncherContext);
  if (!context) {
    throw new Error(
      'useNavigationStudioLauncher must be used within a NavigationStudioLauncherProvider',
    );
  }
  return context;
};
