import React, { createContext, useContext } from 'react';
import type { DialogEventEmitter } from '../components/FilterDrawer/DialogEventEmitter';

const FilterDrawerEventEmitterContext = createContext<DialogEventEmitter | undefined>(undefined);

export const useFilterDrawerEventEmitterContext = (): DialogEventEmitter | undefined => {
  const emitter = useContext(FilterDrawerEventEmitterContext);
  return emitter;
};

export const FilterDrawerEventEmitterProvider = ({
  children,
  emitter,
}: {
  children: React.ReactNode;
  emitter: DialogEventEmitter;
}) => {
  return (
    <FilterDrawerEventEmitterContext.Provider value={emitter}>
      {children}
    </FilterDrawerEventEmitterContext.Provider>
  );
};
