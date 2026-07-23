// Adapted from creator-hub: https://github.rbx.com/Roblox/creator-hub/blob/master/apps/creator-hub/modules/charts-generic/context/FilterDrawerEventEmitterContext.tsx

import { createContext, ReactNode, useContext } from 'react';

import { DialogEventEmitter } from './FilterDrawer/DialogEventEmitter';

const FilterDrawerEventEmitterContext = createContext<DialogEventEmitter | undefined>(undefined);

export const useFilterDrawerEventEmitterContext = (): DialogEventEmitter | undefined => {
  const emitter = useContext(FilterDrawerEventEmitterContext);
  return emitter;
};

export const FilterDrawerEventEmitterProvider = ({
  children,
  emitter,
}: {
  children: ReactNode;
  emitter: DialogEventEmitter;
}) => (
  <FilterDrawerEventEmitterContext.Provider value={emitter}>
    {children}
  </FilterDrawerEventEmitterContext.Provider>
);
