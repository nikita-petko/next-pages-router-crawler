import React, { createContext, useContext, type FunctionComponent } from 'react';
import type { TStudioResources } from './utils/studioResourceUtils';

const StudioResourcesContext = createContext<TStudioResources | null>(null);
StudioResourcesContext.displayName = 'StudioResources';

export function useStudioResources(): TStudioResources {
  const resources = useContext(StudioResourcesContext);
  if (resources === null) {
    throw new Error(
      'Cannot load required studio resources, please make sure the provider has been properly set up',
    );
  }

  return resources;
}

export type StudioResourcesProviderProps = {
  resources: TStudioResources;
};

export const StudioResourcesProvider: FunctionComponent<
  React.PropsWithChildren<StudioResourcesProviderProps>
> = ({ resources, children }) => {
  return (
    <StudioResourcesContext.Provider value={resources}>{children}</StudioResourcesContext.Provider>
  );
};
